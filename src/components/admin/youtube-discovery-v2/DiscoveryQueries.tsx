/**
 * OrangeFlix YouTube Discovery V2 — Queries Component
 * Search query intelligence, candidate yield analytics, and custom search query management.
 */

import React, { useState } from 'react';
import {
  Search,
  Plus,
  Zap,
  CheckCircle2,
  XCircle,
  ToggleLeft,
  ToggleRight,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import { DiscoveryQueryStatItem } from '@/services/discovery-v2/queryStatsRepository';
import { SUPPORTED_COUNTRIES } from '@/features/geo/countryConfig';

interface DiscoveryQueriesProps {
  queries: DiscoveryQueryStatItem[];
  selectedCountry?: string;
  onSelectCountry?: (code: string) => void;
  onToggleQuery: (queryHash: string, isEnabled: boolean) => Promise<void>;
  onAddCustomQuery: (query: string, countryCode: string, type: 'movie' | 'series') => Promise<void>;
  isLoading: boolean;
}

export const DiscoveryQueries: React.FC<DiscoveryQueriesProps> = ({
  queries,
  selectedCountry: initialCountry = 'ALL',
  onSelectCountry,
  onToggleQuery,
  onAddCustomQuery,
  isLoading,
}) => {
  const [searchFilter, setSearchFilter] = useState('');
  const [localCountry, setLocalCountry] = useState(initialCountry);
  const selectedCountry = onSelectCountry ? initialCountry : localCountry;
  const setSelectedCountry = (code: string) => {
    setLocalCountry(code);
    onSelectCountry?.(code);
  };
  const [isAdding, setIsAdding] = useState(false);
  const [newQueryText, setNewQueryText] = useState('');
  const [newQueryCountry, setNewQueryCountry] = useState('RW');
  const [newQueryType, setNewQueryType] = useState<'movie' | 'series'>('movie');

  const filtered = queries.filter((q) => {
    if (selectedCountry !== 'ALL' && q.countryCode.toUpperCase() !== selectedCountry.toUpperCase()) {
      return false;
    }
    if (searchFilter.trim()) {
      if (!q.query.toLowerCase().includes(searchFilter.toLowerCase())) return false;
    }
    return true;
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQueryText.trim()) return;

    await onAddCustomQuery(newQueryText.trim(), newQueryCountry, newQueryType);
    setNewQueryText('');
    setIsAdding(false);
  };

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="bg-card/60 border border-border rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search active queries..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full bg-card border border-border rounded-lg pl-9 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-orange-500 focus:outline-none"
            />
          </div>

          <select
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            className="bg-card border border-border text-xs rounded-lg px-3 py-1.5 text-foreground focus:ring-2 focus:ring-orange-500 focus:outline-none"
          >
            <option value="ALL">🌍 All Territories</option>
            {Object.entries(SUPPORTED_COUNTRIES).map(([code, config]) => (
              <option key={code} value={code}>
                {config.flagEmoji} {config.name} ({code})
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="px-3.5 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold rounded-lg transition-all shadow-md shadow-orange-500/20 flex items-center gap-1.5 self-end sm:self-center"
        >
          <Plus className="w-3.5 h-3.5" /> Add Search Query
        </button>
      </div>

      {/* Add Custom Query Form */}
      {isAdding && (
        <form onSubmit={handleCreate} className="bg-secondary/40 border border-border rounded-xl p-4 space-y-3 animate-fadeIn">
          <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Configure Custom Query</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="Query (e.g. Rwandan film cinema HD)"
              value={newQueryText}
              onChange={(e) => setNewQueryText(e.target.value)}
              required
              className="bg-card border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:ring-2 focus:ring-orange-500 focus:outline-none sm:col-span-1"
            />
            <select
              value={newQueryCountry}
              onChange={(e) => setNewQueryCountry(e.target.value)}
              className="bg-card border border-border text-xs rounded-lg px-3 py-1.5 text-foreground focus:ring-2 focus:ring-orange-500 focus:outline-none"
            >
              {Object.entries(SUPPORTED_COUNTRIES).map(([code, config]) => (
                <option key={code} value={code}>
                  {config.name} ({code})
                </option>
              ))}
            </select>
            <select
              value={newQueryType}
              onChange={(e) => setNewQueryType(e.target.value as 'movie' | 'series')}
              className="bg-card border border-border text-xs rounded-lg px-3 py-1.5 text-foreground focus:ring-2 focus:ring-orange-500 focus:outline-none"
            >
              <option value="movie">Movie Search</option>
              <option value="series">Series Search</option>
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 bg-secondary text-foreground text-xs rounded-lg border border-border"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3.5 py-1.5 bg-orange-500 text-white text-xs font-semibold rounded-lg shadow-sm"
            >
              Save Query
            </button>
          </div>
        </form>
      )}

      {/* Query Stats Table */}
      <div className="bg-card/60 border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-muted-foreground border-b border-border bg-secondary/20">
              <tr>
                <th className="py-3 px-4 font-medium">Search Query</th>
                <th className="py-3 px-3 font-medium">Territory</th>
                <th className="py-3 px-3 font-medium">Type</th>
                <th className="py-3 px-3 font-medium">Yield (Candidates)</th>
                <th className="py-3 px-3 font-medium">Efficiency Score</th>
                <th className="py-3 px-3 font-medium">Avg Candidate Score</th>
                <th className="py-3 px-4 font-medium text-right">Status / Toggle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-sm text-muted-foreground">
                    No query metrics recorded yet. Queries are dynamically prioritized after territory scans.
                  </td>
                </tr>
              ) : (
                filtered.map((q) => (
                  <tr key={q.queryHash} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 max-w-xs font-semibold text-foreground line-clamp-1">
                      {q.query}
                    </td>

                    <td className="py-3 px-3">
                      <span className="font-semibold text-foreground">{q.countryCode}</span>
                    </td>

                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-secondary text-secondary-foreground uppercase">
                        {q.type}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-muted-foreground">
                      <strong className="text-foreground">{q.candidatesFound}</strong> candidates ({q.publishedCount} pub)
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-orange-400">{q.efficiencyScore}%</span>
                        <div className="w-12 bg-secondary rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-orange-500 h-full rounded-full"
                            style={{ width: `${q.efficiencyScore}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3 font-bold text-foreground">
                      {q.averageScore}/100
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onToggleQuery(q.queryHash, !q.isEnabled)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                          q.isEnabled
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                            : 'bg-secondary text-muted-foreground border border-border hover:text-foreground'
                        }`}
                      >
                        {q.isEnabled ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" /> Active
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5" /> Paused
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
