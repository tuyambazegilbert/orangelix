/**
 * OrangeFlix Discovery V2 — Query Intelligence & Adaptive Search Analytics
 * Performance ranking of discovery queries with automated categorization badges,
 * quota efficiency metrics, and feedback loop insights.
 */

import React, { useState } from 'react';
import {
  Search,
  Sparkles,
  AlertTriangle,
  Film,
  Tv,
  CheckCircle2,
  Filter,
  ArrowUpRight,
} from 'lucide-react';
import { QueryPerformanceMetric, DrillDownTarget } from '../types';

interface QueryPerformanceIntelligenceProps {
  queries: QueryPerformanceMetric[];
  onDrillDown: (target: DrillDownTarget) => void;
}

export const QueryPerformanceIntelligence: React.FC<QueryPerformanceIntelligenceProps> = ({
  queries,
  onDrillDown,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchFilter, setSearchFilter] = useState<string>('');

  const filtered = (queries || []).filter((q) => {
    if (selectedCategory !== 'all' && q.category !== selectedCategory) return false;
    if (searchFilter.trim() && !(q.query || '').toLowerCase().includes(searchFilter.toLowerCase())) return false;
    return true;
  });

  const getCategoryBadge = (category: QueryPerformanceMetric['category']) => {
    switch (category) {
      case 'top_performer':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5" /> Top Performer
          </span>
        );
      case 'quota_waster':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center gap-1">
            <AlertTriangle className="w-2.5 h-2.5" /> Quota Waster
          </span>
        );
      case 'movie_driver':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30 flex items-center gap-1">
            <Film className="w-2.5 h-2.5" /> Movie Driver
          </span>
        );
      case 'series_driver':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 flex items-center gap-1">
            <Tv className="w-2.5 h-2.5" /> Series Driver
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-secondary text-muted-foreground">
            Standard
          </span>
        );
    }
  };

  return (
    <div className="bg-card/60 backdrop-blur-sm border border-border/80 rounded-xl p-5 space-y-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
        <div>
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <Search className="w-5 h-5 text-blue-400" />
            Query Intelligence & Adaptive Search Analytics
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Evaluate high-yield keyword templates vs quota-wasting queries to continuously optimize the adaptive discovery engine.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Filter queries..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="bg-secondary/60 border border-border rounded-lg pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>
        </div>
      </div>

      {/* Filter Category Pills */}
      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        {[
          { id: 'all', label: `All Queries (${queries.length})` },
          { id: 'top_performer', label: '🌟 Top Performers' },
          { id: 'movie_driver', label: '🎬 Movie Drivers' },
          { id: 'series_driver', label: '📺 Series Drivers' },
          { id: 'quota_waster', label: '⚠️ Quota Wasters' },
        ].map((pill) => (
          <button
            key={pill.id}
            onClick={() => setSelectedCategory(pill.id)}
            className={`px-3 py-1 rounded-lg border text-xs font-semibold transition-colors ${
              selectedCategory === pill.id
                ? 'bg-orange-500/15 border-orange-500/40 text-orange-400'
                : 'bg-secondary/40 border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            {pill.label}
          </button>
        ))}
      </div>

      {/* Query Performance Table */}
      <div className="overflow-x-auto rounded-xl border border-border/70">
        <table className="w-full text-xs text-left">
          <thead className="bg-secondary/50 text-muted-foreground text-[11px] uppercase tracking-wider font-semibold border-b border-border/70">
            <tr>
              <th className="py-2.5 px-3">Query Template</th>
              <th className="py-2.5 px-3">Classification</th>
              <th className="py-2.5 px-3 text-right">Runs</th>
              <th className="py-2.5 px-3 text-right">Candidates</th>
              <th className="py-2.5 px-3 text-right">Relevant</th>
              <th className="py-2.5 px-3 text-right">Published</th>
              <th className="py-2.5 px-3 text-right">Avg Score</th>
              <th className="py-2.5 px-3 text-right">Efficiency %</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {filtered.map((q, idx) => (
              <tr
                key={`${q.query}-${idx}`}
                onClick={() =>
                  onDrillDown({
                    type: 'query',
                    title: `Query: "${q.query}"`,
                    subtitle: `Showing candidates yielded from query "${q.query}" in ${q.countryCode}.`,
                    filterValue: q.query,
                  })
                }
                className="hover:bg-secondary/30 transition-colors cursor-pointer group"
              >
                <td className="py-2.5 px-3 font-semibold text-foreground">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-muted-foreground text-[10px]">#{idx + 1}</span>
                    <span className="group-hover:text-orange-400 transition-colors">"{q.query}"</span>
                  </div>
                </td>
                <td className="py-2.5 px-3">{getCategoryBadge(q.category)}</td>
                <td className="py-2.5 px-3 text-right text-muted-foreground font-mono">{q.runsCount}</td>
                <td className="py-2.5 px-3 text-right font-bold text-foreground font-mono">{q.candidatesCount}</td>
                <td className="py-2.5 px-3 text-right text-blue-400 font-mono">{q.relevantCount}</td>
                <td className="py-2.5 px-3 text-right font-bold text-emerald-400 font-mono">{q.publishedCount}</td>
                <td className="py-2.5 px-3 text-right font-bold text-foreground font-mono">{q.avgScore}</td>
                <td className="py-2.5 px-3 text-right">
                  <div className="flex items-center justify-end gap-1.5 font-bold font-mono">
                    <span
                      className={
                        q.efficiencyPercent >= 30
                          ? 'text-emerald-400'
                          : q.efficiencyPercent >= 15
                          ? 'text-amber-400'
                          : 'text-rose-400'
                      }
                    >
                      {q.efficiencyPercent}%
                    </span>
                    <div className="w-12 bg-secondary rounded-full h-1.5 hidden sm:block">
                      <div
                        className={`h-full rounded-full ${
                          q.efficiencyPercent >= 30
                            ? 'bg-emerald-500'
                            : q.efficiencyPercent >= 15
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                        }`}
                        style={{ width: `${Math.min(100, q.efficiencyPercent * 2)}%` }}
                      />
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
