/**
 * OrangeFlix Automated Content Discovery Scheduler
 * Automates 3x-a-week scans (Mon, Wed, Fri) across YouTube & other cinema sources
 * to discover new movies, series, and cultural storytelling and update the platform.
 */

import { GeoContentService } from './geo-content-service';
import { getAllCountries } from '@/features/geo/countryConfig';
import { YouTubeClient } from '@/features/youtube/client';
import { DiscoveryWorkerResult } from '@/features/youtube/discoveryWorker';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { sanitizeFirestoreDoc } from './geo-content-service';

export interface AutoDiscoveryScheduleConfig {
  isEnabled: boolean;
  frequency: '3x_weekly' | 'daily' | 'weekly';
  scheduledDays: number[]; // 1 = Mon, 3 = Wed, 5 = Fri
  scheduledHourUTC: number; // 4 = 04:00 AM UTC
  autoPublish: boolean;
  notifyOnCompletion: boolean;
}

export interface AutoDiscoveryLogEntry {
  id: string;
  timestamp: string;
  status: 'success' | 'failed' | 'partial';
  countriesScanned: string[];
  totalNewMovies: number;
  totalNewSeries: number;
  totalUniqueVideos: number;
  errors: string[];
  durationMs: number;
  triggeredBy: 'scheduler_cron' | 'client_background' | 'admin_manual';
}

export interface AutoDiscoveryStatus {
  config: AutoDiscoveryScheduleConfig;
  isRunning: boolean;
  currentCountryScanned: string | null;
  lastRunTimestamp: string | null;
  nextRunTimestamp: string;
  recentLogs: AutoDiscoveryLogEntry[];
  totalLifetimeScans: number;
}

const STORAGE_KEY_SCHEDULE_CONFIG = 'orangeflix_auto_discovery_config';
const STORAGE_KEY_SCHEDULE_LOGS = 'orangeflix_auto_discovery_logs';
const STORAGE_KEY_LAST_RUN = 'orangeflix_auto_discovery_last_run';
const STORAGE_KEY_SCHEDULE_LOCK = 'orangeflix_auto_discovery_schedule_lock';

const DEFAULT_CONFIG: AutoDiscoveryScheduleConfig = {
  isEnabled: true,
  frequency: '3x_weekly',
  scheduledDays: [1, 3, 5], // Monday (1), Wednesday (3), Friday (5)
  scheduledHourUTC: 4, // 04:00 AM UTC
  autoPublish: true,
  notifyOnCompletion: true,
};

class AutoDiscoverySchedulerService {
  private config: AutoDiscoveryScheduleConfig = DEFAULT_CONFIG;
  private isRunning = false;
  private currentCountry: string | null = null;
  private logs: AutoDiscoveryLogEntry[] = [];
  private isInitialized = false;
  private scheduleTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.loadLocalConfig();
  }

  private loadLocalConfig() {
    try {
      const savedConfig = localStorage.getItem(STORAGE_KEY_SCHEDULE_CONFIG);
      if (savedConfig) {
        this.config = { ...DEFAULT_CONFIG, ...JSON.parse(savedConfig) };
      }
      const savedLogs = localStorage.getItem(STORAGE_KEY_SCHEDULE_LOGS);
      if (savedLogs) {
        this.logs = JSON.parse(savedLogs);
      }
    } catch {
      this.config = DEFAULT_CONFIG;
    }
  }

  private saveConfigToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY_SCHEDULE_CONFIG, JSON.stringify(this.config));
    } catch {
      // Storage unavailable
    }
  }

  private saveLogsToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY_SCHEDULE_LOGS, JSON.stringify(this.logs.slice(0, 20)));
    } catch {
      // Storage unavailable
    }
  }

  /**
   * Calculate next scheduled run time (next Mon, Wed, or Fri at 04:00 UTC)
   */
  public getNextScheduledRun(): Date {
    const now = new Date();
    const scheduledDays = this.config.scheduledDays; // [1, 3, 5]
    const targetHour = this.config.scheduledHourUTC;

    for (let dayOffset = 0; dayOffset <= 7; dayOffset++) {
      const candidate = new Date(now.getTime() + dayOffset * 24 * 60 * 60 * 1000);
      candidate.setUTCHours(targetHour, 0, 0, 0);

      const dayOfWeek = candidate.getUTCDay(); // 0 = Sun, 1 = Mon ... 5 = Fri, 6 = Sat

      if (scheduledDays.includes(dayOfWeek)) {
        if (candidate.getTime() > now.getTime()) {
          return candidate;
        }
      }
    }

    // Default fallback: 48 hours from now
    return new Date(now.getTime() + 48 * 60 * 60 * 1000);
  }

  /**
   * Check if an automated scan is currently due according to 3x/week schedule
   */
  public isScanDue(): boolean {
    if (!this.config.isEnabled) return false;
    if (this.isRunning) return false;

    const now = new Date();
    const lastRunRaw = localStorage.getItem(STORAGE_KEY_LAST_RUN);
    const lastRun = lastRunRaw ? new Date(lastRunRaw) : null;
    const isScheduledSlot =
      this.config.scheduledDays.includes(now.getUTCDay()) &&
      now.getUTCHours() === this.config.scheduledHourUTC;

    return isScheduledSlot && (!lastRun || lastRun.toISOString().slice(0, 13) !== now.toISOString().slice(0, 13));
  }

  private scheduleNextAutomaticScan(): void {
    if (this.scheduleTimer) {
      clearTimeout(this.scheduleTimer);
      this.scheduleTimer = null;
    }
    if (!this.config.isEnabled) return;

    const nextRun = this.getNextScheduledRun();
    const delay = Math.max(0, nextRun.getTime() - Date.now());
    this.scheduleTimer = setTimeout(() => {
      this.scheduleTimer = null;
      const scheduledSlot = new Date(nextRun).toISOString().slice(0, 13);
      const lock = localStorage.getItem(STORAGE_KEY_SCHEDULE_LOCK);
      if (lock === scheduledSlot) {
        this.scheduleNextAutomaticScan();
        return;
      }

      if (this.isScanDue() && YouTubeClient.hasApiKey()) {
        localStorage.setItem(STORAGE_KEY_SCHEDULE_LOCK, scheduledSlot);
        void this.runMultiCountryAutoDiscovery('scheduler_cron').finally(() => {
          this.scheduleNextAutomaticScan();
        });
      } else {
        this.scheduleNextAutomaticScan();
      }
    }, delay);
  }

  /**
   * Initialize and check schedule on app mount
   */
  public async init(): Promise<void> {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // Fetch cloud sync config from Firestore if available
    if (firestore) {
      try {
        const metaDoc = await getDoc(doc(firestore, 'system_meta', 'auto_discovery'));
        if (metaDoc.exists()) {
          const cloudData = metaDoc.data();
          if (cloudData?.config) {
            this.config = { ...this.config, ...cloudData.config };
          }
          if (cloudData?.lastRun) {
            localStorage.setItem(STORAGE_KEY_LAST_RUN, cloudData.lastRun);
          }
        }
      } catch {
        // Fallback to local
      }
    }

    // Register the next scheduled slot; app activity never triggers a scan.
    this.scheduleNextAutomaticScan();
  }

  /**
   * Runs complete multi-country automated content discovery
   */
  public async runMultiCountryAutoDiscovery(
    triggeredBy: 'scheduler_cron' | 'client_background' | 'admin_manual' = 'admin_manual',
    onProgress?: (countryCode: string, step: number, total: number) => void
  ): Promise<AutoDiscoveryLogEntry> {
    if (this.isRunning) {
      throw new Error('An automated discovery scan is already in progress.');
    }

    this.isRunning = true;
    const startTime = Date.now();
    const countries = getAllCountries();
    const scannedCodes: string[] = [];
    const errors: string[] = [];
    let totalNewMovies = 0;
    let totalNewSeries = 0;
    let totalUniqueVideos = 0;

    console.log(`[AutoDiscovery] Starting 3x-weekly multi-country scan for ${countries.length} territories...`);

    try {
      for (let i = 0; i < countries.length; i++) {
        const country = countries[i];
        this.currentCountry = country.countryCode;
        if (onProgress) {
          onProgress(country.countryCode, i + 1, countries.length);
        }

        try {
          // Trigger country discovery via GeoContentService
          const result: DiscoveryWorkerResult = await GeoContentService.triggerDiscoverySync(country.countryCode);
          scannedCodes.push(country.countryCode);
          totalNewMovies += result.stats.publishedMovies || 0;
          totalNewSeries += result.stats.publishedSeries || 0;
          totalUniqueVideos += result.stats.uniqueVideos || 0;

          if (result.apiError) {
            errors.push(`${country.countryCode}: ${result.apiError}`);
            if (result.apiError.includes('429') || result.apiError.includes('rateLimitExceeded')) {
              console.warn('[AutoDiscovery] YouTube quota exhausted. Stopping the remaining country scans.');
              break;
            }
          }
        } catch (err: unknown) {
          const errMsg = err instanceof Error ? err.message : String(err);
          console.warn(`[AutoDiscovery] Warning during ${country.name} discovery:`, errMsg);
          errors.push(`${country.countryCode}: ${errMsg}`);
        }

        // Polite rate-limiting pause between country scans (1.2s)
        await new Promise((resolve) => setTimeout(resolve, 1200));
      }
    } finally {
      this.isRunning = false;
      this.currentCountry = null;
    }

    const durationMs = Date.now() - startTime;
    const nowIso = new Date().toISOString();

    const logEntry: AutoDiscoveryLogEntry = {
      id: `scan_${Date.now()}`,
      timestamp: nowIso,
      status: errors.length === 0 ? 'success' : scannedCodes.length > 0 ? 'partial' : 'failed',
      countriesScanned: scannedCodes,
      totalNewMovies,
      totalNewSeries,
      totalUniqueVideos,
      errors,
      durationMs,
      triggeredBy,
    };

    this.logs.unshift(logEntry);
    this.saveLogsToStorage();
    localStorage.setItem(STORAGE_KEY_LAST_RUN, nowIso);

    // Sync status to Firestore
    if (firestore) {
      try {
        await setDoc(
          doc(firestore, 'system_meta', 'auto_discovery'),
          sanitizeFirestoreDoc({
            lastRun: nowIso,
            lastSummary: logEntry,
            config: this.config,
            updatedAt: nowIso,
          }),
          { merge: true }
        );
      } catch (err) {
        console.warn('[AutoDiscovery] Failed to sync log to Firestore:', err);
      }
    }

    console.log(
      `[AutoDiscovery] Scan completed in ${(durationMs / 1000).toFixed(1)}s: ` +
        `${scannedCodes.length} countries scanned, ${totalNewMovies} movies added, ${totalNewSeries} series added.`
    );

    return logEntry;
  }

  public getStatus(): AutoDiscoveryStatus {
    const lastRunRaw = localStorage.getItem(STORAGE_KEY_LAST_RUN);
    return {
      config: this.config,
      isRunning: this.isRunning,
      currentCountryScanned: this.currentCountry,
      lastRunTimestamp: lastRunRaw,
      nextRunTimestamp: this.getNextScheduledRun().toISOString(),
      recentLogs: this.logs,
      totalLifetimeScans: this.logs.length,
    };
  }

  public updateConfig(newConfig: Partial<AutoDiscoveryScheduleConfig>): AutoDiscoveryScheduleConfig {
    this.config = { ...this.config, ...newConfig };
    this.saveConfigToStorage();
    this.scheduleNextAutomaticScan();

    if (firestore) {
      void setDoc(
        doc(firestore, 'system_meta', 'auto_discovery'),
        sanitizeFirestoreDoc({ config: this.config, updatedAt: new Date().toISOString() }),
        { merge: true }
      );
    }

    return this.config;
  }
}

export const AutoDiscoveryScheduler = new AutoDiscoverySchedulerService();

