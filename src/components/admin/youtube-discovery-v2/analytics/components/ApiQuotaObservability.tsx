/**
 * OrangeFlix Discovery V2 — API & Quota Observability Dashboard
 * Engineering-grade telemetry tracking YouTube Data API quota units (out of 10,000 daily limit),
 * endpoint unit breakdown, cache hits & savings, rate-limit 429s, and unit cost economics.
 */

import React from 'react';
import {
  Zap,
  Database,
  Activity,
  AlertTriangle,
  Server,
  Clock,
  TrendingDown,
  CheckCircle2,
  DollarSign,
} from 'lucide-react';
import { ApiQuotaObservabilityData } from '../types';

interface ApiQuotaObservabilityProps {
  quotaData: ApiQuotaObservabilityData;
}

export const ApiQuotaObservability: React.FC<ApiQuotaObservabilityProps> = ({ quotaData }) => {
  return (
    <div className="space-y-6">
      {/* 1. Daily Quota Gauge & Health Strip */}
      <div className="bg-card/60 backdrop-blur-sm border border-border/80 rounded-xl p-5 space-y-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
          <div>
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <Zap className="w-5 h-5 text-orange-400" />
              YouTube API Quota Telemetry & Rate-Limit Observability
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Tracks live quota consumption against the default YouTube Data API daily allotment (10,000 units/day).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold border ${
                quotaData.quotaPercentUsed < 70
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                  : quotaData.quotaPercentUsed < 90
                  ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                  : 'bg-rose-500/15 text-rose-400 border-rose-500/30 animate-pulse'
              }`}
            >
              {quotaData.quotaPercentUsed}% Consumed Today
            </span>
          </div>
        </div>

        {/* Big Quota Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground font-semibold">
              Consumed: <strong className="text-foreground font-mono">{quotaData.totalQuotaConsumed.toLocaleString()} units</strong>
            </span>
            <span className="text-muted-foreground font-semibold">
              Remaining: <strong className="text-emerald-400 font-mono">{quotaData.quotaRemaining.toLocaleString()} units</strong> / {quotaData.dailyQuotaLimit.toLocaleString()}
            </span>
          </div>

          <div className="w-full bg-secondary rounded-full h-3.5 overflow-hidden p-0.5 border border-border/50">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                quotaData.quotaPercentUsed < 70
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                  : quotaData.quotaPercentUsed < 90
                  ? 'bg-gradient-to-r from-amber-500 to-orange-400'
                  : 'bg-gradient-to-r from-rose-500 to-red-600'
              }`}
              style={{ width: `${Math.min(100, quotaData.quotaPercentUsed)}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. Endpoint Breakdown & Cache Economics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Endpoint Breakdown */}
        <div className="bg-card/60 backdrop-blur-sm border border-border/80 rounded-xl p-5 space-y-4 shadow-sm">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Server className="w-4 h-4 text-blue-400" />
            API Call Unit Distribution
          </h3>

          <div className="space-y-3 text-xs">
            <div className="bg-secondary/40 border border-border/60 rounded-lg p-3 flex items-center justify-between">
              <div>
                <div className="font-bold text-foreground">search.list</div>
                <div className="text-[10px] text-muted-foreground">{quotaData.searchListCalls} calls × 100 units</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-orange-400 font-mono">{quotaData.searchListUnits.toLocaleString()}</div>
                <div className="text-[10px] text-muted-foreground">units</div>
              </div>
            </div>

            <div className="bg-secondary/40 border border-border/60 rounded-lg p-3 flex items-center justify-between">
              <div>
                <div className="font-bold text-foreground">videos.list (Batched)</div>
                <div className="text-[10px] text-muted-foreground">{quotaData.videosListCalls} calls × 1 unit</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-blue-400 font-mono">{quotaData.videosListUnits.toLocaleString()}</div>
                <div className="text-[10px] text-muted-foreground">units</div>
              </div>
            </div>

            <div className="bg-secondary/40 border border-border/60 rounded-lg p-3 flex items-center justify-between">
              <div>
                <div className="font-bold text-foreground">channels.list</div>
                <div className="text-[10px] text-muted-foreground">{quotaData.channelsListCalls} calls × 1 unit</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-emerald-400 font-mono">{quotaData.channelsListUnits.toLocaleString()}</div>
                <div className="text-[10px] text-muted-foreground">units</div>
              </div>
            </div>
          </div>
        </div>

        {/* Cache Savings & Preservation */}
        <div className="bg-card/60 backdrop-blur-sm border border-border/80 rounded-xl p-5 space-y-4 shadow-sm">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-400" />
            Cache Preservation & Hits
          </h3>

          <div className="space-y-3">
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-center space-y-1">
              <div className="text-2xl font-black text-emerald-400 font-mono">
                {quotaData.cacheHitRate}%
              </div>
              <div className="text-xs font-semibold text-emerald-300">
                Persistent Cache Hit Rate
              </div>
              <div className="text-[11px] text-muted-foreground">
                {quotaData.cacheHitsCount} hits vs {quotaData.cacheMissesCount} misses
              </div>
            </div>

            <div className="bg-secondary/40 border border-border/60 rounded-lg p-3 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Estimated Quota Units Saved:</span>
              <span className="font-bold text-emerald-400 font-mono">
                +{quotaData.quotaUnitsSaved.toLocaleString()} units
              </span>
            </div>
          </div>
        </div>

        {/* Cost Efficiency & Economics */}
        <div className="bg-card/60 backdrop-blur-sm border border-border/80 rounded-xl p-5 space-y-4 shadow-sm">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Activity className="w-4 h-4 text-purple-400" />
            Discovery Cost Efficiency
          </h3>

          <div className="space-y-2.5 text-xs">
            <div className="bg-secondary/40 border border-border/60 rounded-lg p-2.5 flex items-center justify-between">
              <span className="text-muted-foreground">Cost / Candidate:</span>
              <span className="font-bold text-foreground font-mono">{quotaData.costPerCandidate} units</span>
            </div>
            <div className="bg-secondary/40 border border-border/60 rounded-lg p-2.5 flex items-center justify-between">
              <span className="text-muted-foreground">Cost / Geo-Relevant:</span>
              <span className="font-bold text-blue-400 font-mono">{quotaData.costPerUsefulCandidate} units</span>
            </div>
            <div className="bg-secondary/40 border border-border/60 rounded-lg p-2.5 flex items-center justify-between">
              <span className="text-muted-foreground">Cost / Auto-Published:</span>
              <span className="font-bold text-emerald-400 font-mono">{quotaData.costPerPublished} units</span>
            </div>
            <div className="bg-secondary/40 border border-border/60 rounded-lg p-2.5 flex items-center justify-between">
              <span className="text-muted-foreground">Avg API Latency:</span>
              <span className="font-bold text-foreground font-mono">{quotaData.averageLatencyMs} ms</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

