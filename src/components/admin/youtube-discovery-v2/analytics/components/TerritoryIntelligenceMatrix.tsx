/**
 * OrangeFlix Discovery V2 — Territory Intelligence Matrix
 * Multidimensional performance view across all 8 territories with stacked volume graphs,
 * conversion rates, average quality scores, and one-click territory isolation.
 */

import React, { useState } from 'react';
import {
  Globe,
  ArrowUpRight,
  Sparkles,
  CheckCircle2,
  XCircle,
  Clock,
  Film,
  Tv,
  Radio,
  Search,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import { TerritoryPerformanceItem, DrillDownTarget } from '../types';

interface TerritoryIntelligenceMatrixProps {
  territories: TerritoryPerformanceItem[];
  onFocusTerritory: (countryCode: string) => void;
  onDrillDown: (target: DrillDownTarget) => void;
}

export const TerritoryIntelligenceMatrix: React.FC<TerritoryIntelligenceMatrixProps> = ({
  territories,
  onFocusTerritory,
  onDrillDown,
}) => {
  const [searchFilter, setSearchFilter] = useState('');
  const [sortField, setSortField] = useState<keyof TerritoryPerformanceItem>('totalCandidates');
  const [sortAsc, setSortAsc] = useState(false);

  const chartData = territories.map((t) => ({
    name: `${t.flagEmoji} ${t.countryCode}`,
    candidates: t.totalCandidates,
    published: t.published,
    rejected: t.rejected,
    pending: t.pending,
    avgScore: t.avgScore,
  }));

  const filteredTerritories = territories
    .filter((t) => {
      if (!searchFilter.trim()) return true;
      const q = searchFilter.toLowerCase();
      return (
        t.countryName.toLowerCase().includes(q) ||
        t.countryCode.toLowerCase().includes(q) ||
        t.nativeName.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortAsc ? valA - valB : valB - valA;
      }
      return 0;
    });

  const handleSort = (field: keyof TerritoryPerformanceItem) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  return (
    <div className="bg-card/60 backdrop-blur-sm border border-border/80 rounded-xl p-5 space-y-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
        <div>
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <Globe className="w-5 h-5 text-orange-400" />
            Territory Intelligence & Geo Distribution
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Compare yield volume, publishing success rates, quality scores, and language diversity across all African & diaspora territories.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search territory..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="bg-secondary/60 border border-border rounded-lg pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>
        </div>
      </div>

      {/* Stacked Bar Graph */}
      <div className="h-56 w-full pt-2">
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
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload || !payload.length) return null;
                return (
                  <div className="bg-popover border border-border rounded-lg p-3 shadow-xl text-xs space-y-1.5">
                    <div className="font-bold text-foreground">{label}</div>
                    {payload.map((p, i) => (
                      <div key={i} className="flex items-center justify-between gap-3 text-muted-foreground">
                        <span className="capitalize" style={{ color: p.color }}>{p.name}:</span>
                        <strong className="text-foreground font-mono">{Number(p.value).toLocaleString()}</strong>
                      </div>
                    ))}
                  </div>
                );
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
              iconType="circle"
            />
            <Bar dataKey="published" name="Published" fill="#10b981" stackId="a" radius={[0, 0, 0, 0]} />
            <Bar dataKey="pending" name="Pending Review" fill="#f59e0b" stackId="a" />
            <Bar dataKey="rejected" name="Gated / Rejected" fill="#f43f5e" stackId="a" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Territory Intelligence Table */}
      <div className="overflow-x-auto rounded-xl border border-border/70">
        <table className="w-full text-xs text-left">
          <thead className="bg-secondary/50 text-muted-foreground text-[11px] uppercase tracking-wider font-semibold border-b border-border/70">
            <tr>
              <th className="py-2.5 px-3 cursor-pointer hover:text-foreground" onClick={() => handleSort('countryName')}>
                Territory
              </th>
              <th className="py-2.5 px-3 text-right cursor-pointer hover:text-foreground" onClick={() => handleSort('totalCandidates')}>
                Candidates
              </th>
              <th className="py-2.5 px-3 text-right cursor-pointer hover:text-foreground" onClick={() => handleSort('published')}>
                Published
              </th>
              <th className="py-2.5 px-3 text-right cursor-pointer hover:text-foreground" onClick={() => handleSort('pending')}>
                Pending
              </th>
              <th className="py-2.5 px-3 text-right cursor-pointer hover:text-foreground" onClick={() => handleSort('rejected')}>
                Gated
              </th>
              <th className="py-2.5 px-3 text-right cursor-pointer hover:text-foreground" onClick={() => handleSort('avgScore')}>
                Avg Score
              </th>
              <th className="py-2.5 px-3 text-right cursor-pointer hover:text-foreground" onClick={() => handleSort('successRate')}>
                Success Rate
              </th>
              <th className="py-2.5 px-3 text-center">Breakdown</th>
              <th className="py-2.5 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {filteredTerritories.map((t) => (
              <tr
                key={t.countryCode}
                className="hover:bg-secondary/30 transition-colors cursor-pointer group"
                onClick={() =>
                  onDrillDown({
                    type: 'territory',
                    title: `${t.flagEmoji} ${t.countryName} (${t.countryCode})`,
                    subtitle: `Showing all candidates discovered for ${t.countryName}.`,
                    filterValue: t.countryCode,
                  })
                }
              >
                <td className="py-2.5 px-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{t.flagEmoji}</span>
                    <div>
                      <div className="font-bold text-foreground group-hover:text-orange-400 transition-colors">
                        {t.countryName}
                      </div>
                      <div className="text-[10px] text-muted-foreground font-mono">
                        {t.countryCode} • {t.activeLanguagesCount} Langs • {t.trustedChannelsCount} Channels
                      </div>
                    </div>
                  </div>
                </td>
                <td className="py-2.5 px-3 text-right font-bold text-foreground font-mono">
                  {t.totalCandidates.toLocaleString()}
                </td>
                <td className="py-2.5 px-3 text-right font-bold text-emerald-400 font-mono">
                  {t.published.toLocaleString()}
                </td>
                <td className="py-2.5 px-3 text-right font-bold text-amber-400 font-mono">
                  {t.pending.toLocaleString()}
                </td>
                <td className="py-2.5 px-3 text-right font-bold text-rose-400 font-mono">
                  {t.rejected.toLocaleString()}
                </td>
                <td className="py-2.5 px-3 text-right font-bold text-foreground font-mono">
                  <span
                    className={`px-2 py-0.5 rounded ${
                      t.avgScore >= 76
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : t.avgScore >= 50
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-rose-500/20 text-rose-400'
                    }`}
                  >
                    {t.avgScore}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-right">
                  <div className="flex items-center justify-end gap-1.5 font-bold font-mono">
                    <span className="text-emerald-400">{t.successRate}%</span>
                    <div className="w-12 bg-secondary rounded-full h-1.5 hidden sm:block">
                      <div
                        className="bg-emerald-500 h-full rounded-full"
                        style={{ width: `${Math.min(100, t.successRate)}%` }}
                      />
                    </div>
                  </div>
                </td>
                <td className="py-2.5 px-3 text-center">
                  <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground">
                    <span title="Movies" className="flex items-center gap-0.5">
                      <Film className="w-3 h-3 text-purple-400" /> {t.moviesCount}
                    </span>
                    <span title="Series" className="flex items-center gap-0.5">
                      <Tv className="w-3 h-3 text-indigo-400" /> {t.seriesCount}
                    </span>
                    <span title="Episodes" className="flex items-center gap-0.5">
                      <Radio className="w-3 h-3 text-blue-400" /> {t.episodesCount}
                    </span>
                  </div>
                </td>
                <td className="py-2.5 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => onFocusTerritory(t.countryCode)}
                    className="px-2.5 py-1 text-[11px] font-semibold text-orange-400 hover:text-orange-300 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 rounded-lg transition-colors"
                  >
                    Focus {t.countryCode} →
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
