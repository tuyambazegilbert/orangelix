/**
 * OrangeFlix YouTube Discovery V2 — Overview Component
 * Displays system-wide real metrics, territory breakdown cards, health scores, and quick discovery controls.
 */

import React, { useState } from 'react';
import {
  Sparkles,
  Film,
  Tv,
  ListVideo,
  CheckCircle2,
  Clock,
  XCircle,
  Activity,
  Zap,
  ShieldCheck,
  Globe2,
  RefreshCw,
  Search,
  Layers,
  ArrowUpRight,
  TrendingUp,
  MapPin,
} from 'lucide-react';
import { DiscoveryOverviewMetrics } from '@/services/discovery-v2/metricsRepository';
import { DiscoveryRun } from '@/features/youtube/discoveryV2/types';
import { SUPPORTED_COUNTRIES } from '@/features/geo/countryConfig';
import { DiscoveryAdminTab } from './types';

interface DiscoveryOverviewProps {
  metrics: DiscoveryOverviewMetrics | null;
  recentRuns: DiscoveryRun[];
  selectedCountry: string;
  onSelectCountry: (code: string) => void;
  onNavigateTab: (tab: DiscoveryAdminTab) => void;
  onTriggerScan: (countryCode: string) => Promise<void>;
  onReprocess: (countryCode: string) => Promise<void>;
  isLoading: boolean;
  isScanning: boolean;
}

export const DiscoveryOverview: React.FC<DiscoveryOverviewProps> = ({
  metrics,
  recentRuns,
  selectedCountry,
  onSelectCountry,
  onNavigateTab,
  onTriggerScan,
  onReprocess,
  isLoading,
  isScanning,
}) => {
  const formatPercent = (val?: number) => `${val ?? 0}%`;
  const currentCountryConfig = selectedCountry !== 'ALL' ? SUPPORTED_COUNTRIES[selectedCountry] : null;

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Trigger */}
      <div className="bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-transparent border border-orange-500/20 rounded-2xl p-6 backdrop-blur-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 animate-pulse" />
                Discovery Engine V2
              </span>
              <span className="text-xs text-muted-foreground">
                0–100 Normalized Scoring • 8 Territories • Persistent Firestore Memory
              </span>
            </div>
            <h1 className="text-2xl font-bold text-foreground">Discovery Command Center</h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
              Platform-wide cinema discovery and classification engine. Automatically filters full movies, series, and scattered episodes with zero backend dependencies.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedCountry}
              onChange={(e) => onSelectCountry(e.target.value)}
              className="bg-card border border-border text-sm rounded-xl px-3.5 py-2 text-foreground focus:ring-2 focus:ring-orange-500 focus:outline-none cursor-pointer"
              disabled={isScanning}
            >
              <option value="ALL">🌍 All Territories (Global)</option>
              {Object.entries(SUPPORTED_COUNTRIES).map(([code, config]) => (
                <option key={code} value={code}>
                  {config.flagEmoji} {config.name} ({code})
                </option>
              ))}
            </select>

            <button
              onClick={() => onTriggerScan(selectedCountry)}
              disabled={isScanning}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-medium text-sm rounded-xl transition-all shadow-lg shadow-orange-500/20 flex items-center gap-2"
            >
              {isScanning ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Scanning {currentCountryConfig?.name || 'All Territories'}...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  {selectedCountry === 'ALL' ? 'Scan All Territories' : `Scan ${currentCountryConfig?.name || selectedCountry}`}
                </>
              )}
            </button>

            <button
              onClick={() => onReprocess(selectedCountry)}
              disabled={isScanning}
              className="px-4 py-2 bg-secondary/80 hover:bg-secondary text-foreground text-sm font-medium rounded-xl border border-border transition-all flex items-center gap-2"
              title="Re-run V2 classifier and scoring logic over stored Firestore records without YouTube API consumption"
            >
              <RefreshCw className="w-4 h-4 text-muted-foreground" />
              {selectedCountry === 'ALL' ? 'Reprocess All' : `Reprocess ${currentCountryConfig?.name || selectedCountry}`}
            </button>
          </div>
        </div>
      </div>

      {/* Primary KPI Metrics Grid (Selected Territory or All Platform Videos) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-orange-400" />
            <h2 className="text-sm font-bold text-foreground">
              {selectedCountry === 'ALL'
                ? 'Global Platform Catalog Metrics (All Discovered Videos)'
                : `${currentCountryConfig?.flagEmoji || ''} ${currentCountryConfig?.name || selectedCountry} Catalog Metrics`}
            </h2>
            {selectedCountry !== 'ALL' && (
              <button
                onClick={() => onSelectCountry('ALL')}
                className="text-[11px] text-orange-400 hover:underline ml-2"
              >
                (Reset to All)
              </button>
            )}
          </div>
          <span className="text-xs text-muted-foreground">
            {selectedCountry === 'ALL'
              ? 'Aggregate across all territories in Firestore'
              : `Filtered by ${currentCountryConfig?.name || selectedCountry} in Firestore`}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Total Candidates */}
          <div className="bg-card/60 border border-border rounded-xl p-5 relative overflow-hidden group hover:border-orange-500/40 transition-all">
            <div className="flex items-center justify-between text-muted-foreground text-xs font-medium mb-2">
              <span>Total Discovered Videos</span>
              <Activity className="w-4 h-4 text-orange-400" />
            </div>
            <div className="text-2xl font-bold text-foreground tracking-tight">
              {metrics ? metrics.totalCandidates.toLocaleString() : '0'}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
              <span className="text-emerald-400 font-medium">+{metrics?.newToday ?? 0}</span>
              <span>new today</span>
            </div>
          </div>

          {/* Auto Published */}
          <div className="bg-card/60 border border-border rounded-xl p-5 relative overflow-hidden group hover:border-emerald-500/40 transition-all">
            <div className="flex items-center justify-between text-muted-foreground text-xs font-medium mb-2">
              <span>Published / Catalog</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-emerald-400 tracking-tight">
              {metrics ? metrics.published.toLocaleString() : '0'}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
              <span className="text-emerald-400 font-medium">{formatPercent(metrics?.publishRate)}</span>
              <span>publication rate</span>
            </div>
          </div>

          {/* Pending Review */}
          <div className="bg-card/60 border border-border rounded-xl p-5 relative overflow-hidden group hover:border-amber-500/40 transition-all">
            <div className="flex items-center justify-between text-muted-foreground text-xs font-medium mb-2">
              <span>Pending Moderation</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-amber-400 tracking-tight">
              {metrics ? metrics.pendingReview.toLocaleString() : '0'}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
              <span>Score range: 35–75</span>
            </div>
          </div>

          {/* Rejected */}
          <div className="bg-card/60 border border-border rounded-xl p-5 relative overflow-hidden group hover:border-red-500/40 transition-all">
            <div className="flex items-center justify-between text-muted-foreground text-xs font-medium mb-2">
              <span>Gated / Rejected</span>
              <XCircle className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-2xl font-bold text-rose-400 tracking-tight">
              {metrics ? metrics.rejected.toLocaleString() : '0'}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
              <span>Trailers, music & clips</span>
            </div>
          </div>
        </div>
      </div>

      {/* Territory Breakdown Section (Distinguish Each Country Clearly) */}
      <div className="bg-card/60 border border-border rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Globe2 className="w-4 h-4 text-blue-400" />
              Territory Distribution & Real Database Records
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Live breakdown of discovered cinema records across all 8 territories.
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('countries')}
            className="text-xs text-orange-400 hover:text-orange-300 font-medium flex items-center gap-1"
          >
            Configure Profiles <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {Object.entries(SUPPORTED_COUNTRIES).map(([code, config]) => {
            const stat = metrics?.territoryBreakdown?.[code] || {
              total: 0,
              published: 0,
              pending: 0,
              rejected: 0,
              movies: 0,
              series: 0,
              episodes: 0,
            };

            const isSelected = selectedCountry === code;

            return (
              <div
                key={code}
                className={`bg-card/50 border rounded-xl p-4 space-y-3 transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'border-orange-500 shadow-md shadow-orange-500/10 ring-1 ring-orange-500/30 bg-orange-500/5'
                    : 'border-border/80 hover:border-orange-500/30'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{config.flagEmoji}</span>
                      <div>
                        <div className="font-bold text-sm text-foreground">{config.name}</div>
                        <div className="text-[11px] text-muted-foreground">
                          {config.nativeName || config.name} • {config.defaultLanguage.toUpperCase()}
                        </div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-secondary text-secondary-foreground">
                      {code}
                    </span>
                  </div>

                  {/* Real Counts */}
                  <div className="grid grid-cols-3 gap-2 text-center pt-3 border-t border-border/40 mt-3">
                    <div className="bg-secondary/30 rounded-lg p-2">
                      <div className="text-[10px] text-muted-foreground">Discovered</div>
                      <div className="text-sm font-bold text-foreground">{stat.total}</div>
                    </div>
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2">
                      <div className="text-[10px] text-emerald-400 font-medium">Published</div>
                      <div className="text-sm font-bold text-emerald-400">{stat.published}</div>
                    </div>
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-2">
                      <div className="text-[10px] text-amber-400 font-medium">Pending</div>
                      <div className="text-sm font-bold text-amber-400">{stat.pending}</div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => {
                      onSelectCountry(code);
                      onNavigateTab('content');
                    }}
                    className="flex-1 py-1.5 bg-secondary hover:bg-secondary/80 text-foreground text-[11px] font-medium rounded-lg border border-border transition-colors text-center"
                  >
                    View Catalog
                  </button>
                  <button
                    onClick={() => onTriggerScan(code)}
                    disabled={isScanning}
                    className="p-1.5 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 rounded-lg border border-orange-500/20 transition-colors"
                    title={`Scan ${config.name}`}
                  >
                    <Zap className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Secondary Metrics: Classification & Engine Health */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Content Breakdown */}
        <div className="bg-card/60 border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground flex items-center justify-between mb-4">
            <span>Classification Breakdown</span>
            <Film className="w-4 h-4 text-muted-foreground" />
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Film className="w-4 h-4 text-blue-400" /> Full Movies
              </span>
              <span className="font-semibold text-foreground">{metrics?.movies ?? 0}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Tv className="w-4 h-4 text-purple-400" /> Canonical Series
              </span>
              <span className="font-semibold text-foreground">{metrics?.series ?? 0}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                <ListVideo className="w-4 h-4 text-amber-400" /> Resolved Episodes
              </span>
              <span className="font-semibold text-foreground">{metrics?.episodes ?? 0}</span>
            </div>
          </div>
        </div>

        {/* Health & Cache Efficiency */}
        <div className="bg-card/60 border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground flex items-center justify-between mb-4">
            <span>Engine Health & Efficiency</span>
            <Zap className="w-4 h-4 text-orange-400" />
          </h3>
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span>Discovery Health Score</span>
                <span className="font-bold text-orange-400">{metrics?.healthScore ?? 95}/100</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                <div
                  className="bg-orange-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${metrics?.healthScore ?? 95}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span>Query Cache Hit Rate</span>
                <span className="font-bold text-emerald-400">{metrics?.cacheHitRate ?? 85}%</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${metrics?.cacheHitRate ?? 85}%` }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
              <span>Avg Candidate Score:</span>
              <span className="font-semibold text-foreground">{metrics?.averageScore ?? 0}/100</span>
            </div>
          </div>
        </div>

        {/* Coverage & Reach */}
        <div className="bg-card/60 border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground flex items-center justify-between mb-4">
            <span>Coverage & Trust</span>
            <Globe2 className="w-4 h-4 text-blue-400" />
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> Trusted Channels
              </span>
              <span className="font-semibold text-foreground">{metrics?.trustedChannelsCount ?? 0}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Globe2 className="w-4 h-4 text-blue-400" /> Active Territories
              </span>
              <span className="font-semibold text-foreground">{metrics?.activeCountriesCount ?? 8}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Sparkles className="w-4 h-4 text-amber-400" /> Supported Languages
              </span>
              <span className="font-semibold text-foreground">{metrics?.activeLanguagesCount ?? 14}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Runs Log Preview */}
      <div className="bg-card/60 border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-orange-400" />
            Recent Discovery Executions
          </h3>
          <button
            onClick={() => onNavigateTab('runs')}
            className="text-xs text-orange-400 hover:text-orange-300 font-medium flex items-center gap-1"
          >
            View All Runs <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentRuns.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            No discovery runs recorded yet in Firestore. Run a territory scan above to begin.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-muted-foreground border-b border-border">
                <tr>
                  <th className="pb-2 font-medium">Run ID</th>
                  <th className="pb-2 font-medium">Territory</th>
                  <th className="pb-2 font-medium">Mode</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Candidates</th>
                  <th className="pb-2 font-medium">Published</th>
                  <th className="pb-2 font-medium">Cache Hits</th>
                  <th className="pb-2 font-medium">Started</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {recentRuns.slice(0, 5).map((run) => (
                  <tr key={run.runId} className="hover:bg-muted/30">
                    <td className="py-2.5 font-mono text-[11px] text-foreground font-medium">{run.runId}</td>
                    <td className="py-2.5 text-foreground">{run.countryCodes.join(', ') || 'Global'}</td>
                    <td className="py-2.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-secondary text-secondary-foreground uppercase">
                        {run.mode}
                      </span>
                    </td>
                    <td className="py-2.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          run.status === 'completed'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : run.status === 'running'
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20 animate-pulse'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {run.status}
                      </span>
                    </td>
                    <td className="py-2.5 text-foreground font-medium">{run.candidatesFound}</td>
                    <td className="py-2.5 text-emerald-400 font-semibold">{run.published}</td>
                    <td className="py-2.5 text-muted-foreground">{run.cacheHits}</td>
                    <td className="py-2.5 text-muted-foreground">
                      {new Date(run.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
