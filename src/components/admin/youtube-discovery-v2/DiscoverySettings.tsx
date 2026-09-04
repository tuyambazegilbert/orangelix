/**
 * OrangeFlix YouTube Discovery V2 — Settings & Lock Management Component
 * Scheduler controls, auto-publish preferences, and Firestore distributed lock release.
 */

import React, { useState } from 'react';
import {
  Settings,
  ShieldAlert,
  Clock,
  Unlock,
  CheckCircle2,
  Lock,
  Save,
} from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { AutoDiscoveryScheduleConfig } from '@/services/auto-discovery-scheduler';

interface DiscoverySettingsProps {
  scheduleConfig: AutoDiscoveryScheduleConfig;
  onSaveConfig: (config: AutoDiscoveryScheduleConfig) => Promise<void>;
}

export const DiscoverySettings: React.FC<DiscoverySettingsProps> = ({
  scheduleConfig,
  onSaveConfig,
}) => {
  const [config, setConfig] = useState<AutoDiscoveryScheduleConfig>(scheduleConfig);
  const [isSaving, setIsSaving] = useState(false);
  const [lockStatus, setLockStatus] = useState<string | null>(null);
  const [isReleasingLock, setIsReleasingLock] = useState(false);

  const handleCheckLock = async () => {
    if (!firestore) return;
    try {
      const snap = await getDoc(doc(firestore, 'system_meta', 'discovery_lock'));
      if (snap.exists()) {
        const data = snap.data();
        if (data.locked) {
          setLockStatus(`Locked by ${data.lockedBy || 'unknown'} (Run: ${data.runId || 'N/A'})`);
        } else {
          setLockStatus('Discovery lock is FREE (idle)');
        }
      } else {
        setLockStatus('No active lock record found (idle)');
      }
    } catch (err) {
      setLockStatus(`Error checking lock: ${String(err)}`);
    }
  };

  const handleForceReleaseLock = async () => {
    if (!firestore) return;
    setIsReleasingLock(true);
    try {
      await setDoc(doc(firestore, 'system_meta', 'discovery_lock'), {
        locked: false,
        releasedAt: new Date(),
        forcedRelease: true,
      }, { merge: true });
      setLockStatus('Lock successfully forced to released / idle.');
    } catch (err) {
      setLockStatus(`Failed to release lock: ${String(err)}`);
    } finally {
      setIsReleasingLock(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSaveConfig(config);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-card/60 border border-border rounded-xl p-5">
        <h2 className="text-base font-bold text-foreground flex items-center gap-2">
          <Settings className="w-5 h-5 text-orange-400" />
          Discovery V2 Settings & System Controls
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Configure multi-country scheduler preferences, auto-publish automation, and distributed lock state.
        </p>
      </div>

      {/* Scheduler Configuration */}
      <form onSubmit={handleSave} className="bg-card/60 border border-border rounded-xl p-5 space-y-4">
        <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
          Scheduler Automation Preferences
        </h3>

        <div className="space-y-3 text-xs">
          <label className="flex items-center gap-2 text-foreground font-medium cursor-pointer">
            <input
              type="checkbox"
              checked={config.isEnabled}
              onChange={(e) => setConfig({ ...config, isEnabled: e.target.checked })}
              className="rounded text-orange-500 focus:ring-orange-500"
            />
            <span>Enable Automated 3x-Weekly Multi-Country Scans</span>
          </label>

          <label className="flex items-center gap-2 text-foreground font-medium cursor-pointer">
            <input
              type="checkbox"
              checked={config.autoPublish}
              onChange={(e) => setConfig({ ...config, autoPublish: e.target.checked })}
              className="rounded text-orange-500 focus:ring-orange-500"
            />
            <span>Automatically Publish Candidates Above Score 76</span>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div>
              <label className="text-[11px] text-muted-foreground block mb-1">Execution Schedule</label>
              <select
                value={config.frequency}
                onChange={(e) => setConfig({ ...config, frequency: e.target.value as AutoDiscoveryScheduleConfig['frequency'] })}
                className="w-full bg-card border border-border text-xs rounded-lg px-3 py-1.5 text-foreground focus:ring-2 focus:ring-orange-500 focus:outline-none"
              >
                <option value="3x_weekly">3x Weekly (Mon, Wed, Fri at 04:00 UTC)</option>
                <option value="daily">Daily (Every day at 04:00 UTC)</option>
                <option value="weekly">Weekly (Every Monday at 04:00 UTC)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] text-muted-foreground block mb-1">Scheduled Hour (UTC)</label>
              <input
                type="number"
                min={0}
                max={23}
                value={config.scheduledHourUTC}
                onChange={(e) => setConfig({ ...config, scheduledHourUTC: Number(e.target.value) })}
                className="w-full bg-card border border-border text-xs rounded-lg px-3 py-1.5 text-foreground focus:ring-2 focus:ring-orange-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-medium text-xs rounded-xl transition-all shadow-md shadow-orange-500/20 flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </form>

      {/* Distributed Lock Recovery */}
      <div className="bg-card/60 border border-border rounded-xl p-5 space-y-4">
        <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
          <Lock className="w-3.5 h-3.5 text-amber-400" />
          Firestore Distributed Lock Management (`discovery_lock`)
        </h3>
        <p className="text-xs text-muted-foreground">
          Discovery V2 enforces concurrency locking so multiple browsers or workers do not run redundant scans simultaneously. If a scanner crashed mid-run, you can check and force release the lock.
        </p>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleCheckLock}
            className="px-3 py-1.5 bg-secondary text-foreground text-xs font-medium rounded-lg border border-border hover:bg-secondary/80 transition-all flex items-center gap-1.5"
          >
            <Clock className="w-3.5 h-3.5 text-muted-foreground" /> Check Lock Status
          </button>

          <button
            type="button"
            onClick={handleForceReleaseLock}
            disabled={isReleasingLock}
            className="px-3.5 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5"
          >
            <Unlock className="w-3.5 h-3.5" /> Force Release Lock
          </button>
        </div>

        {lockStatus && (
          <div className="bg-secondary/40 rounded-lg p-3 text-xs font-mono text-foreground">
            {lockStatus}
          </div>
        )}
      </div>
    </div>
  );
};
