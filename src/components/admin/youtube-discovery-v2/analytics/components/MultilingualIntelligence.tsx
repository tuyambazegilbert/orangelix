/**
 * OrangeFlix Discovery V2 — Multilingual & Language Analytics
 * Donut distribution chart and multilingual efficiency matrix showing discovery yield,
 * quality scores, and conversion multipliers per African dialect.
 */

import React from 'react';
import { Languages, Zap, ArrowUpRight } from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts';
import { LanguagePerformanceItem, DrillDownTarget } from '../types';

interface MultilingualIntelligenceProps {
  languages: LanguagePerformanceItem[];
  onDrillDown: (target: DrillDownTarget) => void;
}

const PIE_COLORS = [
  '#f97316', // Orange (Kinyarwanda)
  '#3b82f6', // Blue (Kiswahili)
  '#10b981', // Emerald (English)
  '#8b5cf6', // Purple (Luganda)
  '#ec4899', // Pink (Yoruba)
  '#eab308', // Yellow (Hausa)
  '#06b6d4', // Cyan (Igbo)
  '#14b8a6', // Teal (Twi)
  '#6366f1', // Indigo (Zulu)
  '#84cc16', // Lime (Xhosa)
  '#a855f7', // Violet (Afrikaans)
  '#64748b', // Slate (French/Other)
];

export const MultilingualIntelligence: React.FC<MultilingualIntelligenceProps> = ({
  languages,
  onDrillDown,
}) => {
  const chartData = languages.slice(0, 8).map((l, idx) => ({
    name: `${l.flag || '🌐'} ${l.name}`,
    value: l.candidatesCount,
    code: l.code,
    color: PIE_COLORS[idx % PIE_COLORS.length],
  }));

  return (
    <div className="bg-card/60 backdrop-blur-sm border border-border/80 rounded-xl p-5 space-y-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
        <div>
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <Languages className="w-5 h-5 text-amber-400" />
            Multilingual Intelligence & Language Performance
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Evaluate discovery recall and catalog conversion efficiency across indigenous languages, vernacular keywords, and localized subtitles.
          </p>
        </div>

        <div className="text-xs text-muted-foreground">
          Tracked Dialects: <strong className="text-foreground">{languages.length} Languages</strong>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
        {/* Donut Chart */}
        <div className="h-64 w-full flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={85}
                paddingAngle={3}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="bg-popover border border-border rounded-lg p-2.5 shadow-xl text-xs space-y-1">
                      <div className="font-bold text-foreground">{d.name}</div>
                      <div className="text-muted-foreground">Candidates: <strong className="text-foreground">{d.value.toLocaleString()}</strong></div>
                    </div>
                  );
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Top Insights Callouts */}
        <div className="lg:col-span-2 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {languages.slice(0, 4).map((l, i) => (
              <div
                key={l.code}
                onClick={() =>
                  onDrillDown({
                    type: 'language',
                    title: `${l.flag || '🌐'} ${l.name} (${l.code}) Content`,
                    subtitle: `Showing all candidates discovered with ${l.name} metadata.`,
                    filterValue: l.code,
                  })
                }
                className="bg-secondary/30 hover:bg-secondary/60 border border-border/70 rounded-xl p-3.5 space-y-2 cursor-pointer transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-foreground text-xs">
                    <span className="text-base">{l.flag}</span>
                    <span>{l.name}</span>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400">
                    {l.efficiencyScore}x Yield
                  </span>
                </div>

                <div className="flex items-baseline justify-between">
                  <div className="text-xl font-bold text-foreground font-mono">
                    {l.candidatesCount.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-muted-foreground font-mono">
                    {l.sharePercent}% share
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/40">
                  <span>Published: <strong className="text-emerald-400">{l.publishedCount}</strong></span>
                  <span>Avg Score: <strong className="text-foreground">{l.avgScore}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Multilingual Performance Table */}
      <div className="overflow-x-auto rounded-xl border border-border/70">
        <table className="w-full text-xs text-left">
          <thead className="bg-secondary/50 text-muted-foreground text-[11px] uppercase tracking-wider font-semibold border-b border-border/70">
            <tr>
              <th className="py-2.5 px-3">Language</th>
              <th className="py-2.5 px-3 text-right">Searches</th>
              <th className="py-2.5 px-3 text-right">Candidates</th>
              <th className="py-2.5 px-3 text-right">Geo-Relevant</th>
              <th className="py-2.5 px-3 text-right">Published</th>
              <th className="py-2.5 px-3 text-right">Avg Score</th>
              <th className="py-2.5 px-3 text-right">Conversion Rate</th>
              <th className="py-2.5 px-3 text-right">Efficiency Multiplier</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {languages.map((l) => (
              <tr
                key={l.code}
                onClick={() =>
                  onDrillDown({
                    type: 'language',
                    title: `${l.flag || '🌐'} ${l.name} (${l.code}) Content`,
                    subtitle: `Showing all candidates discovered with ${l.name} metadata.`,
                    filterValue: l.code,
                  })
                }
                className="hover:bg-secondary/30 transition-colors cursor-pointer group"
              >
                <td className="py-2.5 px-3 font-semibold text-foreground flex items-center gap-2">
                  <span className="text-base">{l.flag || '🌐'}</span>
                  <div>
                    <div className="group-hover:text-orange-400 transition-colors">{l.name}</div>
                    <div className="text-[10px] text-muted-foreground font-mono">{l.code}</div>
                  </div>
                </td>
                <td className="py-2.5 px-3 text-right text-muted-foreground font-mono">
                  {l.searchesCount.toLocaleString()}
                </td>
                <td className="py-2.5 px-3 text-right font-bold text-foreground font-mono">
                  {l.candidatesCount.toLocaleString()}
                </td>
                <td className="py-2.5 px-3 text-right text-blue-400 font-mono">
                  {l.relevantCount.toLocaleString()}
                </td>
                <td className="py-2.5 px-3 text-right font-bold text-emerald-400 font-mono">
                  {l.publishedCount.toLocaleString()}
                </td>
                <td className="py-2.5 px-3 text-right font-bold text-foreground font-mono">
                  {l.avgScore}
                </td>
                <td className="py-2.5 px-3 text-right font-bold text-emerald-400 font-mono">
                  {l.conversionRate}%
                </td>
                <td className="py-2.5 px-3 text-right">
                  <span className="px-2 py-0.5 rounded font-bold font-mono text-[11px] bg-emerald-500/15 text-emerald-400">
                    {l.efficiencyScore}x
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
