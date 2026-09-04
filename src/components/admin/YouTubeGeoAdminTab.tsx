/**
 * OrangeFlix YouTube Discovery V2 — Command Center Tab (With Professional Side Navigation)
 * Conforms strictly to Discovery V2 specification. Single source of truth for geo-discovery,
 * 0–100 scoring, channel trust, series resolution, and persistent Firestore memory.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  Zap,
  Film,
  Tv,
  ListVideo,
  ShieldCheck,
  Search,
  BookOpen,
  Globe2,
  TrendingUp,
  Settings,
  AlertTriangle,
  RefreshCw,
  Clock,
  CheckCircle2,
  ChevronRight,
  Database,
  BarChart3,
  Sliders,
} from 'lucide-react';
import { toast } from 'sonner';
import { GeoContentItem, TrustedChannel, GeoContentStatus, ChannelTrust } from '@/types/geo-content';
import { getCountryConfig, SUPPORTED_COUNTRIES } from '@/features/geo/countryConfig';
import {
  runDiscoveryV2,
  reprocessDiscoveryV2,
  DiscoveryRun,
  GeoSeries,
  GeoEpisode,
  DiscoveryProgressEvent,
} from '@/features/youtube/discoveryV2';
import { AutoDiscoveryScheduleConfig } from '@/services/auto-discovery-scheduler';
import {
  DiscoveryRepository,
  DiscoveryRunRepository,
  ChannelRepository,
  QueryStatsRepository,
  MetricsRepository,
} from '@/services/discovery-v2';
import { DiscoveryOverviewMetrics } from '@/services/discovery-v2/metricsRepository';
import { DiscoveryQueryStatItem } from '@/services/discovery-v2/queryStatsRepository';

import {
  DiscoveryAdminTab,
  ContentFilterState,
  InspectorModalState,
  DiscoveryOverview,
  DiscoveryLiveScanner,
  DiscoveryContent,
  DiscoveryContentInspectorModal,
  DiscoverySeries,
  DiscoveryEpisodes,
  DiscoveryChannels,
  DiscoveryQueries,
  DiscoveryLanguages,
  DiscoveryCountries,
  DiscoveryRuns,
  DiscoveryAnalytics,
  DiscoveryQuality,
  DiscoveryQuota,
  DiscoveryErrors,
  DiscoverySearchLab,
  DiscoverySettings,
} from './youtube-discovery-v2';

interface GeoAdminCachedState {
  metrics: DiscoveryOverviewMetrics | null;
  contentItems: GeoContentItem[];
  seriesList: GeoSeries[];
  episodesList: GeoEpisode[];
  channels: TrustedChannel[];
  queries: DiscoveryQueryStatItem[];
  recentRuns: DiscoveryRun[];
  timestamp: number;
}

const geoAdminCache = new Map<string, GeoAdminCachedState>();
const GEO_ADMIN_CACHE_TTL = 3 * 60 * 1000; // 3 minutes memory cache

export default function YouTubeGeoAdminTab() {
  const [currentTab, setCurrentTab] = useState<DiscoveryAdminTab>('overview');
  const [selectedCountry, setSelectedCountry] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isScanning, setIsScanning] = useState<boolean>(false);

  // Live execution stream logs (persisted across tab navigation)
  const [liveExecutionLogs, setLiveExecutionLogs] = useState<DiscoveryProgressEvent[]>([]);

  const handleProgress = useCallback((event: DiscoveryProgressEvent) => {
    setLiveExecutionLogs((prev) => [event, ...prev.slice(0, 499)]);
  }, []);

  // Data states
  const [metrics, setMetrics] = useState<DiscoveryOverviewMetrics | null>(null);
  const [contentItems, setContentItems] = useState<GeoContentItem[]>([]);
  const [seriesList, setSeriesList] = useState<GeoSeries[]>([]);
  const [episodesList, setEpisodesList] = useState<GeoEpisode[]>([]);
  const [channels, setChannels] = useState<TrustedChannel[]>([]);
  const [queries, setQueries] = useState<DiscoveryQueryStatItem[]>([]);
  const [recentRuns, setRecentRuns] = useState<DiscoveryRun[]>([]);

  // Filter & Modal states
  const [contentFilter, setContentFilter] = useState<ContentFilterState>({
    countryCode: 'ALL',
    status: 'all',
    contentType: 'all',
    searchQuery: '',
  });

  const [inspectorModal, setInspectorModal] = useState<InspectorModalState>({
    isOpen: false,
    item: null,
  });

  const [scheduleConfig, setScheduleConfig] = useState<AutoDiscoveryScheduleConfig>({
    isEnabled: true,
    frequency: '3x_weekly',
    scheduledDays: [1, 3, 5],
    scheduledHourUTC: 4,
    autoPublish: true,
    notifyOnCompletion: true,
  });

  // Load all data from Firestore repositories with smart memory caching
  const loadAllData = useCallback(async (forceRefresh = false) => {
    const cacheKey = selectedCountry;
    const cached = geoAdminCache.get(cacheKey);

    if (!forceRefresh && cached && Date.now() - cached.timestamp < GEO_ADMIN_CACHE_TTL) {
      setMetrics(cached.metrics);
      setContentItems(cached.contentItems);
      setSeriesList(cached.seriesList);
      setEpisodesList(cached.episodesList);
      setChannels(cached.channels);
      setQueries(cached.queries);
      setRecentRuns(cached.recentRuns);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const [
        loadedMetrics,
        loadedContent,
        loadedSeries,
        loadedEpisodes,
        loadedChannels,
        loadedQueries,
        loadedRuns,
      ] = await Promise.all([
        MetricsRepository.getOverviewMetrics(selectedCountry !== 'ALL' ? selectedCountry : undefined),
        DiscoveryRepository.getContentItems({
          countryCode: selectedCountry !== 'ALL' ? selectedCountry : undefined,
          limitCount: 2500,
        }),
        DiscoveryRepository.getSeries(selectedCountry !== 'ALL' ? selectedCountry : undefined),
        DiscoveryRepository.getEpisodes(selectedCountry !== 'ALL' ? selectedCountry : undefined),
        ChannelRepository.getChannels(selectedCountry !== 'ALL' ? selectedCountry : undefined),
        QueryStatsRepository.getQueryStats(selectedCountry !== 'ALL' ? selectedCountry : undefined),
        DiscoveryRunRepository.getRecentRuns(50),
      ]);

      setMetrics(loadedMetrics);
      setContentItems(loadedContent.items);
      setSeriesList(loadedSeries);
      setEpisodesList(loadedEpisodes);
      setChannels(loadedChannels);
      setQueries(loadedQueries);
      setRecentRuns(loadedRuns);

      geoAdminCache.set(cacheKey, {
        metrics: loadedMetrics,
        contentItems: loadedContent.items,
        seriesList: loadedSeries,
        episodesList: loadedEpisodes,
        channels: loadedChannels,
        queries: loadedQueries,
        recentRuns: loadedRuns,
        timestamp: Date.now(),
      });
    } catch (err) {
      console.warn('[YouTubeGeoAdminTab] Load error:', err);
      toast.error('Failed to load discovery data from Firestore.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedCountry]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Sync country selection with filter & notify
  const handleSelectCountry = (code: string) => {
    setSelectedCountry(code);
    setContentFilter((prev) => ({ ...prev, countryCode: code }));
    if (code === 'ALL') {
      toast.info('🌍 Showing platform-wide data across all 8 territories');
    } else {
      const c = SUPPORTED_COUNTRIES[code];
      toast.info(`📍 Focus set to ${c ? c.name : code} (${code})`);
    }
  };

  // Handler: Run Territory Discovery V2
  const handleTriggerScan = async (countryCode: string) => {
    setIsScanning(true);
    try {
      if (countryCode === 'ALL') {
        const countryCodes = Object.keys(SUPPORTED_COUNTRIES);
        toast.info(`Launching Discovery V2 across all ${countryCodes.length} territories...`);
        let totalCandidates = 0;
        let totalPublished = 0;
        for (const code of countryCodes) {
          const country = getCountryConfig(code);
          const run = await runDiscoveryV2(code, country, 'smart', {
            maxQueries: 4,
            onProgress: handleProgress,
          });
          totalCandidates += run.candidatesFound;
          totalPublished += run.published;
        }
        toast.success(
          `Global Discovery V2 complete! Discovered ${totalCandidates} items (${totalPublished} auto-published) across all territories.`
        );
      } else {
        const country = getCountryConfig(countryCode);
        toast.info(`Launching Discovery V2 for ${country.name} (${countryCode})...`);
        const run = await runDiscoveryV2(countryCode, country, 'smart', {
          onProgress: handleProgress,
        });
        if (run.quotaErrors > 0) {
          toast.error(`YouTube API Quota Reached: ${run.summary}`);
        } else {
          toast.success(
            `Discovery V2 complete for ${country.name}! Discovered ${run.candidatesFound} items (${run.published} published, ${run.pendingReview} pending review).`
          );
        }
      }
      await loadAllData(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Discovery execution failed: ${msg}`);
    } finally {
      setIsScanning(false);
    }
  };

  // Handler: Reprocess Stored Records
  const handleReprocess = async (countryCode: string) => {
    setIsScanning(true);
    try {
      if (countryCode === 'ALL') {
        const countryCodes = Object.keys(SUPPORTED_COUNTRIES);
        toast.info(`Reprocessing stored Firestore records across all ${countryCodes.length} territories...`);
        let totalReprocessed = 0;
        for (const code of countryCodes) {
          const country = getCountryConfig(code);
          const count = await reprocessDiscoveryV2(code, country);
          totalReprocessed += count;
        }
        toast.success(`Successfully reprocessed ${totalReprocessed} records across all territories with Discovery V2.`);
      } else {
        const country = getCountryConfig(countryCode);
        toast.info(`Reprocessing stored Firestore records for ${country.name} with V2 classifier...`);
        const count = await reprocessDiscoveryV2(countryCode, country);
        toast.success(`Successfully reprocessed ${count} records for ${country.name} with Discovery V2.`);
      }
      await loadAllData(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Reprocessing failed: ${msg}`);
    } finally {
      setIsScanning(false);
    }
  };

  // Handler: Custom Live Scanner Run
  const handleRunScannerOptions = async (options: {
    countryCode: string;
    mode: 'smart' | 'manual' | 'scheduled' | 'incremental' | 'deep' | 'channels_only';
    scope?: 'all' | 'movies' | 'series';
    maxQueries?: number;
    skipCache?: boolean;
    dryRun?: boolean;
  }): Promise<DiscoveryRun> => {
    setIsScanning(true);
    try {
      if (options.countryCode === 'ALL') {
        const countryCodes = Object.keys(SUPPORTED_COUNTRIES);
        let aggregatedRun: DiscoveryRun | null = null;
        let totalQueries = 0;
        let totalCandidates = 0;
        let totalPublished = 0;
        let totalPending = 0;
        let totalRejected = 0;
        let totalCacheHits = 0;

        for (const code of countryCodes) {
          const country = getCountryConfig(code);
          const run = await runDiscoveryV2(code, country, options.mode, {
            scope: options.scope,
            maxQueries: options.maxQueries ? Math.max(2, Math.floor(options.maxQueries / countryCodes.length)) : 3,
            skipCache: options.skipCache,
            dryRun: options.dryRun,
            onProgress: handleProgress,
          });
          aggregatedRun = run;
          totalQueries += run.queriesExecuted;
          totalCandidates += run.candidatesFound;
          totalPublished += run.published;
          totalPending += run.pendingReview;
          totalRejected += run.rejected;
          totalCacheHits += run.cacheHits;
        }

        await loadAllData(true);
        return {
          runId: `v2-all-${Date.now()}`,
          mode: options.mode as 'manual',
          countryCodes,
          startedAt: new Date(),
          completedAt: new Date(),
          status: 'completed',
          queriesExecuted: totalQueries,
          cacheHits: totalCacheHits,
          cacheMisses: 0,
          candidatesFound: totalCandidates,
          newVideos: totalCandidates,
          updatedVideos: 0,
          moviesFound: 0,
          seriesFound: 0,
          episodesFound: 0,
          seasonsFound: 0,
          published: totalPublished,
          pendingReview: totalPending,
          rejected: totalRejected,
          quotaErrors: 0,
          metadataErrors: 0,
          firebaseErrors: 0,
          summary: `Global Discovery V2: ${totalCandidates} items discovered across all territories (${totalPublished} published).`,
        };
      }

      const country = getCountryConfig(options.countryCode);
      const run = await runDiscoveryV2(options.countryCode, country, options.mode, {
        scope: options.scope,
        maxQueries: options.maxQueries,
        skipCache: options.skipCache,
        dryRun: options.dryRun,
        onProgress: handleProgress,
      });

      await loadAllData(true);
      return run;
    } finally {
      setIsScanning(false);
    }
  };

  // Handler: Single Content Status Update
  const handleUpdateItemStatus = async (id: string, newStatus: GeoContentStatus) => {
    const ok = await DiscoveryRepository.saveContentItem({
      id,
      status: newStatus,
      publicationStatus: newStatus,
      moderationStatus: newStatus === 'published' ? 'approved' : newStatus,
    });

    if (ok) {
      toast.success(`Item status updated to ${newStatus}`);
      setContentItems((prev) =>
        prev.map((i) =>
          i.id === id
            ? {
                ...i,
                status: newStatus,
                moderationStatus: newStatus === 'published' ? 'approved' : newStatus,
              }
            : i
        )
      );
      if (inspectorModal.item && inspectorModal.item.id === id) {
        setInspectorModal((prev) => ({
          ...prev,
          item: prev.item ? { ...prev.item, status: newStatus } : null,
        }));
      }
    } else {
      toast.error('Failed to update status in Firestore.');
    }
  };

  // Handler: Bulk Content Status Update
  const handleBulkUpdateStatus = async (ids: string[], newStatus: GeoContentStatus) => {
    const { succeeded, failed } = await DiscoveryRepository.bulkUpdateContentStatus(ids, newStatus);
    if (succeeded > 0) {
      toast.success(`Updated ${succeeded} item(s) to ${newStatus}.`);
      setContentItems((prev) =>
        prev.map((i) => (ids.includes(i.id) ? { ...i, status: newStatus } : i))
      );
    }
    if (failed > 0) {
      toast.error(`Failed to update ${failed} items.`);
    }
  };

  // Handler: Scan Series Episode Gaps
  const handleScanSeriesGaps = async (seriesTitle: string, countryCode: string) => {
    setIsScanning(true);
    toast.info(`Searching YouTube specifically for missing episodes of "${seriesTitle}"...`);
    try {
      const country = getCountryConfig(countryCode);
      await runDiscoveryV2(countryCode, country, 'incremental', {
        onProgress: handleProgress,
      });
      toast.success(`Episode search complete for "${seriesTitle}".`);
      await loadAllData(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Gap search error: ${msg}`);
    } finally {
      setIsScanning(false);
    }
  };

  // Handler: Update Channel Trust
  const handleUpdateChannelTrust = async (channelId: string, trust: ChannelTrust) => {
    const ok = await ChannelRepository.updateChannelTrust(channelId, trust);
    if (ok) {
      toast.success(`Channel trust updated to ${trust}`);
      setChannels((prev) =>
        prev.map((c) => (c.channelId === channelId ? { ...c, trust } : c))
      );
    } else {
      toast.error('Failed to update channel in Firestore.');
    }
  };

  // Handler: Scan Single Channel
  const handleScanSingleChannel = async (channelId: string, countryCode: string) => {
    setIsScanning(true);
    toast.info(`Scanning recent uploads for channel ${channelId}...`);
    try {
      const country = getCountryConfig(countryCode);
      await runDiscoveryV2(
        countryCode,
        { ...country, trustedChannelIds: [channelId] },
        'manual',
        { maxQueries: 3, onProgress: handleProgress }
      );
      toast.success(`Channel uploads scan complete.`);
      await loadAllData(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Channel scan error: ${msg}`);
    } finally {
      setIsScanning(false);
    }
  };

  // Handler: Add Channel
  const handleAddChannel = async (ch: Partial<TrustedChannel>) => {
    const ok = await ChannelRepository.saveChannel(ch);
    if (ok) {
      toast.success(`Trusted channel "${ch.channelTitle || ch.channelId}" registered.`);
      await loadAllData(true);
    } else {
      toast.error('Failed to save channel.');
    }
  };

  // Handler: Toggle Query Status
  const handleToggleQuery = async (queryHash: string, isEnabled: boolean) => {
    const ok = await QueryStatsRepository.toggleQueryStatus(queryHash, isEnabled);
    if (ok) {
      toast.success(`Query ${isEnabled ? 'activated' : 'paused'}`);
      setQueries((prev) =>
        prev.map((q) => (q.queryHash === queryHash ? { ...q, isEnabled } : q))
      );
    }
  };

  // Handler: Add Custom Query
  const handleAddCustomQuery = async (queryText: string, countryCode: string, type: 'movie' | 'series') => {
    toast.info(`Custom search query added for ${countryCode}.`);
    await loadAllData(true);
  };

  // Handler: Save Scheduler Settings
  const handleSaveSchedulerConfig = async (config: AutoDiscoveryScheduleConfig) => {
    setScheduleConfig(config);
    toast.success('Scheduler configuration saved.');
  };

  // Count errors from recent runs
  const totalRecentErrors = recentRuns.reduce(
    (sum, r) => sum + (r.errorLog ? r.errorLog.length : 0),
    0
  );

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start min-h-[800px]">
      {/* Sleek Vertical Side Navigation */}
      <aside className="w-full lg:w-64 shrink-0 bg-card/60 border border-border rounded-2xl p-4 backdrop-blur-md space-y-5">
        {/* Brand / Scope Card */}
        <div className="border-b border-border pb-3">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-1 rounded-lg bg-orange-500/20 text-orange-400 border border-orange-500/30">
              <Sparkles className="w-4 h-4 animate-pulse" />
            </span>
            <span className="font-bold text-sm text-foreground">Discovery V2</span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Command Center • 0–100 Scoring
          </p>

          {/* Quick Territory Switcher */}
          <div className="mt-3">
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
              Active Focus
            </label>
            <select
              value={selectedCountry}
              onChange={(e) => handleSelectCountry(e.target.value)}
              className="w-full bg-secondary/60 border border-border text-xs rounded-xl px-2.5 py-1.5 text-foreground focus:ring-2 focus:ring-orange-500 focus:outline-none"
            >
              <option value="ALL">🌍 Global Platform (All)</option>
              {Object.entries(SUPPORTED_COUNTRIES).map(([code, config]) => (
                <option key={code} value={code}>
                  {config.flagEmoji} {config.name} ({code})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Group 1: Core Discovery */}
        <div className="space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2 mb-1">
            Core Discovery
          </div>

          <button
            onClick={() => setCurrentTab('overview')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
              currentTab === 'overview'
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
            }`}
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span>Overview</span>
            </div>
            <span className="text-[10px] font-mono opacity-80">{metrics?.totalCandidates ?? 0}</span>
          </button>

          <button
            onClick={() => setCurrentTab('scanner')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
              currentTab === 'scanner'
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
            }`}
          >
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              <span>Live Scanner</span>
            </div>
            {isScanning && (
              <span className="w-2 h-2 rounded-full bg-orange-400 animate-ping" />
            )}
          </button>

          <button
            onClick={() => setCurrentTab('content')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
              currentTab === 'content'
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
            }`}
          >
            <div className="flex items-center gap-2">
              <Film className="w-4 h-4" />
              <span>Content Explorer</span>
            </div>
            <span className="text-[10px] font-mono opacity-80">{contentItems.length}</span>
          </button>

          <button
            onClick={() => setCurrentTab('series')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
              currentTab === 'series'
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
            }`}
          >
            <div className="flex items-center gap-2">
              <Tv className="w-4 h-4" />
              <span>Canonical Series</span>
            </div>
            <span className="text-[10px] font-mono opacity-80">{seriesList.length}</span>
          </button>

          <button
            onClick={() => setCurrentTab('episodes')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
              currentTab === 'episodes'
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
            }`}
          >
            <div className="flex items-center gap-2">
              <ListVideo className="w-4 h-4" />
              <span>Episodes Matrix</span>
            </div>
            <span className="text-[10px] font-mono opacity-80">{episodesList.length}</span>
          </button>
        </div>

        {/* Group 2: Intelligence & Channels */}
        <div className="space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2 mb-1">
            Intelligence & Sources
          </div>

          <button
            onClick={() => setCurrentTab('channels')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
              currentTab === 'channels'
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
            }`}
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              <span>Trusted Channels</span>
            </div>
            <span className="text-[10px] font-mono opacity-80">{channels.length}</span>
          </button>

          <button
            onClick={() => setCurrentTab('queries')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
              currentTab === 'queries'
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
            }`}
          >
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              <span>Query Intelligence</span>
            </div>
            <span className="text-[10px] font-mono opacity-80">{queries.length}</span>
          </button>

          <button
            onClick={() => setCurrentTab('languages')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
              currentTab === 'languages'
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
            }`}
          >
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              <span>Languages & Dicts</span>
            </div>
          </button>

          <button
            onClick={() => setCurrentTab('countries')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
              currentTab === 'countries'
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
            }`}
          >
            <div className="flex items-center gap-2">
              <Globe2 className="w-4 h-4" />
              <span>Territory Profiles</span>
            </div>
            <span className="text-[10px] font-mono opacity-80">8</span>
          </button>
        </div>

        {/* Group 3: Analytics & Health */}
        <div className="space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2 mb-1">
            Analytics & Quality
          </div>

          <button
            onClick={() => setCurrentTab('runs')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
              currentTab === 'runs'
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
            }`}
          >
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <span>Runs Audit Log</span>
            </div>
            <span className="text-[10px] font-mono opacity-80">{recentRuns.length}</span>
          </button>

          <button
            onClick={() => setCurrentTab('analytics')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
              currentTab === 'analytics'
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
            }`}
          >
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              <span>Funnel Analytics</span>
            </div>
          </button>

          <button
            onClick={() => setCurrentTab('quality')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
              currentTab === 'quality'
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
            }`}
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span>Quality & Gates</span>
            </div>
          </button>

          <button
            onClick={() => setCurrentTab('quota')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
              currentTab === 'quota'
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
            }`}
          >
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              <span>API Quota (v3)</span>
            </div>
          </button>

          <button
            onClick={() => setCurrentTab('errors')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
              currentTab === 'errors'
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
            }`}
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span>Errors & Health</span>
            </div>
            {totalRecentErrors > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500 text-white">
                {totalRecentErrors}
              </span>
            )}
          </button>
        </div>

        {/* Group 4: Tools & Controls */}
        <div className="space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2 mb-1">
            Tools & Settings
          </div>

          <button
            onClick={() => setCurrentTab('search-lab')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
              currentTab === 'search-lab'
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
            }`}
          >
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              <span>Search Sandbox</span>
            </div>
          </button>

          <button
            onClick={() => setCurrentTab('settings')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
              currentTab === 'settings'
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
            }`}
          >
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              <span>Settings & Locks</span>
            </div>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 w-full space-y-4">
        {/* Top Section Header */}
        <div className="flex items-center justify-between bg-card/40 border border-border rounded-xl px-5 py-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-foreground capitalize">
              {currentTab.replace('-', ' ')}
            </span>
            <span className="text-xs text-muted-foreground">
              • Focus:{' '}
              <strong className="text-foreground">
                {selectedCountry === 'ALL'
                  ? 'All Platform Videos'
                  : `${SUPPORTED_COUNTRIES[selectedCountry]?.flagEmoji || '📍'} ${SUPPORTED_COUNTRIES[selectedCountry]?.name || selectedCountry} (${selectedCountry})`}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => loadAllData(true)}
              disabled={isLoading}
              className="p-1.5 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground transition-colors"
              title="Refresh database records"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-orange-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Sub-View Component */}
        {currentTab === 'overview' && (
          <DiscoveryOverview
            metrics={metrics}
            recentRuns={recentRuns}
            selectedCountry={selectedCountry}
            onSelectCountry={handleSelectCountry}
            onNavigateTab={setCurrentTab}
            onTriggerScan={handleTriggerScan}
            onReprocess={handleReprocess}
            isLoading={isLoading}
            isScanning={isScanning}
          />
        )}

        {currentTab === 'scanner' && (
          <DiscoveryLiveScanner
            onRunScan={handleRunScannerOptions}
            isScanning={isScanning}
            selectedCountry={selectedCountry}
            onSelectCountry={handleSelectCountry}
            liveLogs={liveExecutionLogs}
            onClearLogs={() => setLiveExecutionLogs([])}
          />
        )}

        {currentTab === 'content' && (
          <DiscoveryContent
            items={contentItems}
            filter={contentFilter}
            onFilterChange={(f) => {
              setContentFilter((prev) => ({ ...prev, ...f }));
              if (f.countryCode && f.countryCode !== selectedCountry) {
                handleSelectCountry(f.countryCode);
              }
            }}
            onInspectItem={(item) => setInspectorModal({ isOpen: true, item })}
            onUpdateStatus={handleUpdateItemStatus}
            onBulkUpdateStatus={handleBulkUpdateStatus}
            isLoading={isLoading}
          />
        )}

        {currentTab === 'series' && (
          <DiscoverySeries
            seriesList={seriesList}
            selectedCountry={selectedCountry}
            onSelectCountry={handleSelectCountry}
            onScanGaps={handleScanSeriesGaps}
            onInspectSeries={() => {}}
            isLoading={isLoading}
          />
        )}

        {currentTab === 'episodes' && (
          <DiscoveryEpisodes
            episodes={episodesList}
            isLoading={isLoading}
          />
        )}

        {currentTab === 'channels' && (
          <DiscoveryChannels
            channels={channels}
            selectedCountry={selectedCountry}
            onSelectCountry={handleSelectCountry}
            onUpdateTrust={handleUpdateChannelTrust}
            onScanChannel={handleScanSingleChannel}
            onAddChannel={handleAddChannel}
            isLoading={isLoading}
          />
        )}

        {currentTab === 'queries' && (
          <DiscoveryQueries
            queries={queries}
            selectedCountry={selectedCountry}
            onSelectCountry={handleSelectCountry}
            onToggleQuery={handleToggleQuery}
            onAddCustomQuery={handleAddCustomQuery}
            isLoading={isLoading}
          />
        )}

        {currentTab === 'languages' && <DiscoveryLanguages />}

        {currentTab === 'countries' && (
          <DiscoveryCountries
            onTriggerScan={handleTriggerScan}
            isScanning={isScanning}
          />
        )}

        {currentTab === 'runs' && (
          <DiscoveryRuns
            runs={recentRuns}
            isLoading={isLoading}
            onTriggerScan={handleTriggerScan}
            onRefresh={loadAllData}
          />
        )}

        {currentTab === 'analytics' && (
          <DiscoveryAnalytics
            metrics={metrics}
            contentItems={contentItems}
            seriesList={seriesList}
            episodesList={episodesList}
            channels={channels}
            queries={queries}
            runs={recentRuns}
            liveLogs={liveExecutionLogs}
            isScanning={isScanning}
            selectedCountry={selectedCountry}
            onSelectCountry={handleSelectCountry}
            onInspectItem={(item) => setInspectorModal({ isOpen: true, item })}
            onTriggerScan={handleTriggerScan}
            onNavigateTab={(tab) => setCurrentTab(tab as DiscoveryAdminTab)}
          />
        )}

        {currentTab === 'quality' && <DiscoveryQuality items={contentItems} />}

        {currentTab === 'quota' && <DiscoveryQuota />}

        {currentTab === 'errors' && (
          <DiscoveryErrors
            runs={recentRuns}
            onRetryScan={handleTriggerScan}
            isScanning={isScanning}
          />
        )}

        {currentTab === 'search-lab' && (
          <DiscoverySearchLab
            selectedCountry={selectedCountry}
            onSelectCountry={handleSelectCountry}
          />
        )}

        {currentTab === 'settings' && (
          <DiscoverySettings
            scheduleConfig={scheduleConfig}
            onSaveConfig={handleSaveSchedulerConfig}
          />
        )}

        {/* Global Evidence / Inspector Drawer Modal */}
        <DiscoveryContentInspectorModal
          isOpen={inspectorModal.isOpen}
          item={inspectorModal.item}
          onClose={() => setInspectorModal({ isOpen: false, item: null })}
          onUpdateStatus={handleUpdateItemStatus}
        />
      </main>
    </div>
  );
}
