/**
 * OrangeFlix YouTube Discovery V2 — Live Scanner Component
 * Real-time discovery execution, candidate streaming, live query preview, and progress monitoring.
 */

import React, { useState, useMemo } from 'react';
import {
  Play,
  Square,
  Sparkles,
  Zap,
  CheckCircle2,
  Clock,
  XCircle,
  Film,
  Tv,
  ListVideo,
  RefreshCw,
  Terminal,
  AlertCircle,
  Eye,
  ChevronDown,
  ChevronUp,
  Layers,
  Radio,
  Search,
  Filter,
} from 'lucide-react';
import { SUPPORTED_COUNTRIES } from '@/features/geo/countryConfig';
import { DiscoveryProgressEvent, DiscoveryRun } from '@/features/youtube/discoveryV2/types';
import { generateSmartDiscoveryQueries } from '@/features/youtube/discoveryV2/queryGenerator';
import { getDiscoveryV2Profile } from '@/features/youtube/discoveryV2/profiles';

interface DiscoveryLiveScannerProps {
  onRunScan: (options: {
    countryCode: string;
    mode: 'smart' | 'manual' | 'scheduled' | 'incremental' | 'deep' | 'channels_only';
    scope?: 'all' | 'movies' | 'series';
    maxQueries?: number;
    skipCache?: boolean;
    dryRun?: boolean;
  }) => Promise<DiscoveryRun>;
  isScanning: boolean;
  onStopScan?: () => void;
  selectedCountry?: string;
  onSelectCountry?: (code: string) => void;
  liveLogs?: DiscoveryProgressEvent[];
  onClearLogs?: () => void;
}

export const DiscoveryLiveScanner: React.FC<DiscoveryLiveScannerProps> = ({
  onRunScan,
  isScanning,
  onStopScan,
  selectedCountry: initialCountry = 'RW',
  onSelectCountry,
  liveLogs = [],
  onClearLogs,
}) => {
  const [localCountry, setLocalCountry] = useState(initialCountry);
  const selectedCountry = onSelectCountry ? initialCountry : localCountry;
  const setSelectedCountry = (code: string) => {
    setLocalCountry(code);
    onSelectCountry?.(code);
  };

  const [mode, setMode] = useState<'smart' | 'incremental' | 'deep' | 'channels_only'>('smart');
  const [scope, setScope] = useState<'all' | 'movies' | 'series'>('all');
  const [maxQueries, setMaxQueries] = useState(8);
  const [skipCache, setSkipCache] = useState(false);
  const [dryRun, setDryRun] = useState(false);
  const [showQueryPreview, setShowQueryPreview] = useState(false);
  const [logFilter, setLogFilter] = useState<'all' | 'publications' | 'issues'>('all');
  const [lastRunResult, setLastRunResult] = useState<DiscoveryRun | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filtered live stream logs
  const filteredLogs = useMemo(() => {
    if (logFilter === 'publications') {
      return liveLogs.filter((l) => l.stage === 'publication' || l.status === 'published');
    }
    if (logFilter === 'issues') {
      return liveLogs.filter((l) => l.level === 'warning' || l.level === 'error' || l.stage === 'gated');
    }
    return liveLogs;
  }, [liveLogs, logFilter]);

  // Live query preview calculation
  const previewQueries = useMemo(() => {
    try {
      if (selectedCountry === 'ALL') {
        const allCountries = Object.keys(SUPPORTED_COUNTRIES);
        return allCountries.flatMap((code) => {
          const profile = getDiscoveryV2Profile(code);
          return generateSmartDiscoveryQueries(profile, {
            mode,
            scope,
            limit: 2,
          });
        }).slice(0, maxQueries);
      }
      const profile = getDiscoveryV2Profile(selectedCountry);
      return generateSmartDiscoveryQueries(profile, {
        mode,
        scope,
        limit: maxQueries,
      });
    } catch {
      return [];
    }
  }, [selectedCountry, mode, scope, maxQueries]);

  // Estimated YouTube API Quota
  const estimatedQuotaUnits = useMemo(() => {
    // Search list costs 100 units each; Video details cost 1 unit per 50 videos; Channel uploads cost 1 unit
    const searchUnits = previewQueries.length * 100;
    const channelUnits = mode === 'channels_only' ? 5 : 15;
    return searchUnits + channelUnits;
  }, [previewQueries.length, mode]);

  const handleStartScan = async () => {
    setErrorMessage(null);
    try {
      const result = await onRunScan({
        countryCode: selectedCountry,
        mode,
        scope,
        maxQueries,
        skipCache,
        dryRun,
      });
      setLastRunResult(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg);
    }
  };

  return (
    <div className="space-y-6">
      {/* Scanner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card/60 border border-border rounded-xl p-5 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-orange-500/20 text-orange-400 border border-orange-500/30">
              <Zap className="w-5 h-5 text-orange-400" />
            </span>
            <h2 className="text-lg font-bold text-foreground">Live Discovery V2 Scanner</h2>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Execute high-yield cinema keyword discovery, verified channel scans, and 0–100 evidence classification.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isScanning ? (
            <button
              onClick={onStopScan}
              className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white font-medium text-sm rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-rose-500/20"
            >
              <Square className="w-4 h-4" /> Stop Scanner
            </button>
          ) : (
            <button
              onClick={handleStartScan}
              disabled={isScanning}
              className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-medium text-sm rounded-xl transition-all shadow-lg shadow-orange-500/20 flex items-center gap-2"
            >
              <Play className="w-4 h-4 fill-white" /> Launch Discovery V2
            </button>
          )}
        </div>
      </div>

      {/* Scanner Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Country Selector */}
        <div className="bg-card/40 border border-border rounded-xl p-4">
          <label className="text-xs font-semibold text-foreground uppercase tracking-wider block mb-2">
            Target Territory
          </label>
          <select
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            disabled={isScanning}
            className="w-full bg-card border border-border text-sm rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-orange-500 focus:outline-none"
          >
            <option value="ALL">🌍 All Territories (Global Scan)</option>
            {Object.entries(SUPPORTED_COUNTRIES).map(([code, config]) => (
              <option key={code} value={code}>
                {config.flagEmoji} {config.name} ({code})
              </option>
            ))}
          </select>
          <div className="text-[11px] text-muted-foreground mt-2">
            {selectedCountry === 'ALL'
              ? 'Scope: All 8 Territories (RW, UG, KE, NG, GH, TZ, ZA, US)'
              : `Primary: ${SUPPORTED_COUNTRIES[selectedCountry]?.languages.join(', ') || 'en'}`}
          </div>
        </div>

        {/* Scan Mode Preset */}
        <div className="bg-card/40 border border-border rounded-xl p-4">
          <label className="text-xs font-semibold text-foreground uppercase tracking-wider block mb-2">
            Discovery Mode
          </label>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as 'smart' | 'incremental' | 'deep' | 'channels_only')}
            disabled={isScanning}
            className="w-full bg-card border border-border text-sm rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-orange-500 focus:outline-none"
          >
            <option value="smart">⚡ Smart Scan (High-Yield & Fast)</option>
            <option value="incremental">🔄 Incremental (Series Gap Fill)</option>
            <option value="deep">🌐 Deep Catalog (Multi-Year & Dialects)</option>
            <option value="channels_only">📺 Verified Channels Only</option>
          </select>
          <div className="text-[11px] text-muted-foreground mt-2">
            {mode === 'smart' && 'Top cinema keywords + verified channel crawl'}
            {mode === 'incremental' && 'Discovers missing episodes for known series'}
            {mode === 'deep' && 'Broad 2022–2025 multi-genre & dialect expansion'}
            {mode === 'channels_only' && 'Directly crawls latest channel uploads'}
          </div>
        </div>

        {/* Content Scope Selector */}
        <div className="bg-card/40 border border-border rounded-xl p-4">
          <label className="text-xs font-semibold text-foreground uppercase tracking-wider block mb-2">
            Content Scope
          </label>
          <div className="grid grid-cols-3 gap-1 bg-secondary/50 p-1 rounded-lg border border-border">
            <button
              type="button"
              onClick={() => setScope('all')}
              className={`text-[11px] font-medium py-1 rounded-md transition-all ${
                scope === 'all'
                  ? 'bg-orange-500 text-white font-bold shadow'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setScope('movies')}
              className={`text-[11px] font-medium py-1 rounded-md transition-all ${
                scope === 'movies'
                  ? 'bg-orange-500 text-white font-bold shadow'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Movies
            </button>
            <button
              type="button"
              onClick={() => setScope('series')}
              className={`text-[11px] font-medium py-1 rounded-md transition-all ${
                scope === 'series'
                  ? 'bg-orange-500 text-white font-bold shadow'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Series
            </button>
          </div>
          <div className="text-[11px] text-muted-foreground mt-2">
            Estimated Quota: <span className="text-orange-400 font-semibold">~{estimatedQuotaUnits} units</span>
          </div>
        </div>

        {/* Query Limit & Toggles */}
        <div className="bg-card/40 border border-border rounded-xl p-4 space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Query Limit
              </label>
              <span className="text-xs font-bold text-orange-400">{maxQueries} queries</span>
            </div>
            <input
              type="range"
              min={3}
              max={30}
              step={1}
              value={maxQueries}
              onChange={(e) => setMaxQueries(Number(e.target.value))}
              disabled={isScanning || mode === 'channels_only'}
              className="w-full accent-orange-500 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/40">
            <label className="flex items-center gap-1.5 text-[11px] font-medium text-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={dryRun}
                onChange={(e) => setDryRun(e.target.checked)}
                disabled={isScanning}
                className="rounded text-orange-500 focus:ring-orange-500"
              />
              <span>Dry Run</span>
            </label>

            <label className="flex items-center gap-1.5 text-[11px] font-medium text-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={skipCache}
                onChange={(e) => setSkipCache(e.target.checked)}
                disabled={isScanning}
                className="rounded text-orange-500 focus:ring-orange-500"
              />
              <span>Bypass Cache</span>
            </label>
          </div>
        </div>
      </div>

      {/* Query Preview Drawer */}
      <div className="bg-card/40 border border-border rounded-xl overflow-hidden">
        <button
          onClick={() => setShowQueryPreview(!showQueryPreview)}
          className="w-full px-4 py-3 bg-secondary/20 hover:bg-secondary/40 flex items-center justify-between text-xs font-semibold text-foreground transition-colors"
        >
          <span className="flex items-center gap-2">
            <Search className="w-4 h-4 text-orange-400" />
            Search Intelligence: {previewQueries.length} Configured High-Yield Queries for {selectedCountry}
          </span>
          <span className="flex items-center gap-1 text-muted-foreground">
            {showQueryPreview ? 'Hide Query Preview' : 'Show Query Preview'}
            {showQueryPreview ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </span>
        </button>

        {showQueryPreview && (
          <div className="p-4 border-t border-border space-y-2 max-h-64 overflow-y-auto">
            {previewQueries.map((q, idx) => (
              <div
                key={q.queryHash || idx}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-lg bg-card border border-border text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-muted-foreground text-[10px] w-5">
                    #{idx + 1}
                  </span>
                  <span className="font-medium text-foreground">&quot;{q.query}&quot;</span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/20">
                    Tier {q.tier}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      q.type === 'movie'
                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        : q.type === 'series'
                        ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}
                  >
                    {q.type}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Score: <strong className="text-foreground">{q.priorityScore}</strong>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Error alert */}
      {errorMessage && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-rose-400">Discovery Engine Error</h4>
            <p className="text-xs text-muted-foreground mt-0.5">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Live / Last Run Summary Stats */}
      {lastRunResult && (
        <div className="bg-card/60 border border-border rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Last Run Results ({lastRunResult.runId})
            </h3>
            <span className="text-xs text-muted-foreground font-mono">
              Status: {lastRunResult.status}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            <div className="bg-secondary/40 rounded-lg p-3">
              <div className="text-[11px] text-muted-foreground">Queries</div>
              <div className="text-lg font-bold text-foreground">{lastRunResult.queriesExecuted}</div>
            </div>
            <div className="bg-secondary/40 rounded-lg p-3">
              <div className="text-[11px] text-muted-foreground">Candidates</div>
              <div className="text-lg font-bold text-foreground">{lastRunResult.candidatesFound}</div>
            </div>
            <div className="bg-secondary/40 rounded-lg p-3">
              <div className="text-[11px] text-muted-foreground">Published</div>
              <div className="text-lg font-bold text-emerald-400">{lastRunResult.published}</div>
            </div>
            <div className="bg-secondary/40 rounded-lg p-3">
              <div className="text-[11px] text-muted-foreground">Pending Review</div>
              <div className="text-lg font-bold text-amber-400">{lastRunResult.pendingReview}</div>
            </div>
            <div className="bg-secondary/40 rounded-lg p-3">
              <div className="text-[11px] text-muted-foreground">Rejected</div>
              <div className="text-lg font-bold text-rose-400">{lastRunResult.rejected}</div>
            </div>
            <div className="bg-secondary/40 rounded-lg p-3">
              <div className="text-[11px] text-muted-foreground">Cache Hits</div>
              <div className="text-lg font-bold text-blue-400">{lastRunResult.cacheHits}</div>
            </div>
          </div>
        </div>
      )}

      {/* Terminal Log Console (Persistent across tab navigation) */}
      <div className="bg-black/90 border border-border/80 rounded-xl p-4 font-mono text-xs text-muted-foreground overflow-hidden shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-2.5 mb-3">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-2 text-foreground font-semibold">
              <Terminal className="w-4 h-4 text-orange-400" />
              Live Execution Stream
            </span>
            {isScanning ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Streaming Live
              </span>
            ) : (
              <span className="text-[10px] text-muted-foreground">
                ({liveLogs.length} events logged)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Filter pills */}
            <div className="flex items-center bg-secondary/50 rounded-lg p-0.5 border border-border/60 text-[10px]">
              <button
                type="button"
                onClick={() => setLogFilter('all')}
                className={`px-2 py-0.5 rounded transition-all ${
                  logFilter === 'all'
                    ? 'bg-orange-500 text-white font-bold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                All ({liveLogs.length})
              </button>
              <button
                type="button"
                onClick={() => setLogFilter('publications')}
                className={`px-2 py-0.5 rounded transition-all ${
                  logFilter === 'publications'
                    ? 'bg-emerald-500 text-white font-bold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Published ({liveLogs.filter((l) => l.stage === 'publication' || l.status === 'published').length})
              </button>
              <button
                type="button"
                onClick={() => setLogFilter('issues')}
                className={`px-2 py-0.5 rounded transition-all ${
                  logFilter === 'issues'
                    ? 'bg-rose-500 text-white font-bold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Gated/Errors ({liveLogs.filter((l) => l.level === 'warning' || l.level === 'error' || l.stage === 'gated').length})
              </button>
            </div>

            {liveLogs.length > 0 && onClearLogs && (
              <button
                type="button"
                onClick={onClearLogs}
                className="text-[11px] text-muted-foreground hover:text-foreground px-2 py-1 hover:bg-secondary/40 rounded transition-colors"
                title="Clear live execution stream"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="h-64 overflow-y-auto space-y-1.5 scrollbar-thin pr-1">
          {filteredLogs.length === 0 ? (
            <div className="text-muted-foreground/60 italic py-8 text-center text-xs">
              {liveLogs.length === 0
                ? 'Scanner stream idle. Click "Launch Discovery V2" above to view real-time query dispatch, API candidates, and 0–100 scoring decisions.'
                : 'No logs match the selected filter.'}
            </div>
          ) : (
            filteredLogs.map((evt) => {
              const timeStr = evt.timestamp
                ? new Date(evt.timestamp).toLocaleTimeString()
                : new Date().toLocaleTimeString();

              let levelColor = 'text-zinc-300';
              if (evt.level === 'success') levelColor = 'text-emerald-400';
              if (evt.level === 'warning') levelColor = 'text-amber-300';
              if (evt.level === 'error') levelColor = 'text-rose-400 font-semibold';

              let badgeStyle = 'bg-zinc-800 text-zinc-400 border-zinc-700';
              if (evt.stage === 'init') badgeStyle = 'bg-blue-500/10 text-blue-400 border-blue-500/30';
              if (evt.stage === 'channel_scan') badgeStyle = 'bg-purple-500/10 text-purple-400 border-purple-500/30';
              if (evt.stage === 'series_expansion') badgeStyle = 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
              if (evt.stage === 'query_dispatch') badgeStyle = 'bg-orange-500/10 text-orange-400 border-orange-500/30';
              if (evt.stage === 'candidate_fetch') badgeStyle = 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
              if (evt.stage === 'classification') badgeStyle = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
              if (evt.stage === 'publication') badgeStyle = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-bold';
              if (evt.stage === 'gated') badgeStyle = 'bg-rose-500/10 text-rose-400 border-rose-500/30';
              if (evt.stage === 'complete') badgeStyle = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold';
              if (evt.stage === 'error') badgeStyle = 'bg-rose-500/20 text-rose-300 border-rose-500/40 font-bold';

              return (
                <div
                  key={evt.id}
                  className="flex items-start gap-2 leading-relaxed hover:bg-white/[0.02] px-1.5 py-0.5 rounded transition-colors text-[11px]"
                >
                  <span className="text-zinc-500 shrink-0 font-mono text-[10px]">
                    [{timeStr}]
                  </span>
                  <span
                    className={`px-1.5 py-0.2 rounded border text-[9px] uppercase font-bold shrink-0 ${badgeStyle}`}
                  >
                    {evt.stage.replace('_', ' ')}
                  </span>
                  {evt.countryCode && (
                    <span className="px-1 py-0.2 rounded bg-secondary text-secondary-foreground font-bold text-[9px] shrink-0">
                      {evt.countryCode}
                    </span>
                  )}
                  <span className={`min-w-0 break-words ${levelColor}`}>
                    {evt.message}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

