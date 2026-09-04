/**
 * OrangeFlix Discovery V2 — Discovery Conversion Funnel
 * Supabase/Mixpanel-grade 7-stage conversion funnel with step conversion rates,
 * drop-off analysis, and pipeline bottleneck diagnostics.
 */

import React from 'react';
import {
  TrendingDown,
  Layers,
  ArrowRight,
  Filter,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts';
import { FunnelStageData, DrillDownTarget } from '../types';

interface DiscoveryConversionFunnelProps {
  funnelStages: FunnelStageData[];
  onDrillDown: (target: DrillDownTarget) => void;
}

export const DiscoveryConversionFunnel: React.FC<DiscoveryConversionFunnelProps> = ({
  funnelStages,
  onDrillDown,
}) => {
  const chartData = funnelStages.map((s) => ({
    name: s.name.split('. ')[1] || s.name,
    count: s.count,
    conversion: s.conversionFromPrev,
    color: s.color,
    stage: s.stage,
  }));

  return (
    <div className="bg-card/60 backdrop-blur-sm border border-border/80 rounded-xl p-5 space-y-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
        <div>
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <Layers className="w-5 h-5 text-orange-400" />
            End-to-End Discovery Conversion Funnel
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Observes candidates through raw YouTube query dispatch, deduplication, AI metadata parsing, geo-filtering, scoring gates, and catalog publication.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-2.5 py-1 rounded-md bg-secondary text-muted-foreground font-mono">
            Overall Pipeline Efficiency:{' '}
            <strong className="text-emerald-400">
              {funnelStages.length > 0 ? funnelStages[funnelStages.length - 1].conversionFromStart : 0}%
            </strong>
          </span>
        </div>
      </div>

      {/* Visual Recharts Bar Graph */}
      <div className="h-44 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <XAxis
              dataKey="name"
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: 'hsl(var(--border))' }}
            />
            <YAxis
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v)}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const data = payload[0].payload;
                return (
                  <div className="bg-popover border border-border rounded-lg p-2.5 shadow-xl text-xs space-y-1">
                    <div className="font-bold text-foreground">{data.name}</div>
                    <div className="text-muted-foreground">Volume: <strong className="text-foreground">{data.count.toLocaleString()}</strong></div>
                    <div className="text-emerald-400">Step Conversion: <strong>{data.conversion}%</strong></div>
                  </div>
                );
              }}
            />
            <Bar dataKey="count" radius={[6, 6, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Step Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
        {funnelStages.map((stage, idx) => (
          <div
            key={stage.stage}
            onClick={() =>
              onDrillDown({
                type: stage.stage === 'auto_published' ? 'published' : 'all_candidates',
                title: stage.name,
                subtitle: stage.description,
              })
            }
            className="bg-secondary/30 hover:bg-secondary/60 border border-border/70 hover:border-orange-500/40 rounded-xl p-3.5 space-y-2 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-foreground truncate">{stage.name}</span>
              <span className="font-mono font-bold text-muted-foreground">#{idx + 1}</span>
            </div>

            <div className="text-xl font-black text-foreground group-hover:text-orange-400 transition-colors">
              {stage.count.toLocaleString()}
            </div>

            {/* Progress / Step Conversion Bar */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span>Pass Rate:</span>
                <span className="font-bold text-emerald-400">{stage.conversionFromPrev}%</span>
              </div>
              <div className="w-full bg-secondary/80 rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${stage.conversionFromPrev}%`, backgroundColor: stage.color }}
                />
              </div>
            </div>

            {/* Drop-off statistic */}
            {stage.dropOffCount > 0 && (
              <div className="flex items-center justify-between text-[10px] text-rose-400/90 pt-1 border-t border-border/40">
                <span className="flex items-center gap-0.5">
                  <TrendingDown className="w-2.5 h-2.5" /> Drop-off:
                </span>
                <span className="font-mono">
                  -{stage.dropOffCount.toLocaleString()} ({stage.dropOffPercent}%)
                </span>
              </div>
            )}

            <p className="text-[10px] text-muted-foreground line-clamp-2 leading-tight">
              {stage.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
