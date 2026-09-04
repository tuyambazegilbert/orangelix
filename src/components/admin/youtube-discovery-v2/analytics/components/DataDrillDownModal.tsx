/**
 * OrangeFlix Discovery V2 — Data Drill-Down Inspector Modal
 * Universal modal allowing administrators to inspect, search, and moderate the underlying
 * records behind any KPI card, chart slice, table row, language, or rejection reason.
 */

import React, { useState } from 'react';
import {
  X,
  Search,
  ExternalLink,
  Film,
  Tv,
  CheckCircle2,
  XCircle,
  Clock,
  Layers,
  Sparkles,
  LayoutGrid,
  List,
} from 'lucide-react';
import { GeoContentItem } from '@/types/geo-content';
import { SUPPORTED_COUNTRIES } from '@/features/geo/countryConfig';
import { DrillDownTarget } from '../types';

interface DataDrillDownModalProps {
  target: DrillDownTarget | null;
  onClose: () => void;
  onInspectItem?: (item: GeoContentItem) => void;
}

export const DataDrillDownModal: React.FC<DataDrillDownModalProps> = ({
  target,
  onClose,
  onInspectItem,
}) => {
  const [searchFilter, setSearchFilter] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  if (!target) return null;

  const items = target.items || [];
  const filteredItems = items.filter((item) => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      (item.channelTitle && item.channelTitle.toLowerCase().includes(q)) ||
      (item.country && item.country.toLowerCase().includes(q)) ||
      (item.language && item.language.toLowerCase().includes(q))
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-background/85 backdrop-blur-md">
      <div className="bg-card border border-border rounded-2xl w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-border flex flex-wrap items-center justify-between gap-3 bg-secondary/30">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-orange-500/10 text-orange-400">
                <Layers className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-foreground">{target.title}</h2>
              <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-secondary text-muted-foreground">
                {filteredItems.length} records
              </span>
            </div>
            {target.subtitle && (
              <p className="text-xs text-muted-foreground mt-0.5 ml-8">{target.subtitle}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search inside records..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="bg-secondary/70 border border-border rounded-lg pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-orange-500 w-48 sm:w-64"
              />
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-secondary border border-border rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-md ${viewMode === 'table' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}
                title="Table View"
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md ${viewMode === 'grid' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}
                title="Grid View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {filteredItems.length === 0 ? (
            <div className="py-16 text-center text-xs text-muted-foreground bg-secondary/20 rounded-xl border border-dashed border-border">
              No matching records found in this drill-down scope.
            </div>
          ) : viewMode === 'table' ? (
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-xs text-left">
                <thead className="bg-secondary/60 text-muted-foreground text-[11px] uppercase tracking-wider font-semibold border-b border-border">
                  <tr>
                    <th className="py-2.5 px-3">Video Item</th>
                    <th className="py-2.5 px-3">Territory</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Language</th>
                    <th className="py-2.5 px-3 text-right">Score</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {filteredItems.map((item) => {
                    const country = SUPPORTED_COUNTRIES[item.country?.toUpperCase() || 'RW'];
                    const flag = country ? country.flagEmoji : '🌍';
                    const score = Number(item.score ?? (item as { overallScore?: number }).overallScore ?? 50);

                    return (
                      <tr
                        key={item.id || item.youtubeVideoId}
                        className="hover:bg-secondary/30 transition-colors cursor-pointer group"
                        onClick={() => onInspectItem && onInspectItem(item)}
                      >
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-3">
                            <div className="w-16 h-10 bg-secondary rounded-lg overflow-hidden flex-shrink-0 relative border border-border/50">
                              {item.thumbnailUrl ? (
                                <img
                                  src={item.thumbnailUrl}
                                  alt=""
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                  <Film className="w-4 h-4" />
                                </div>
                              )}
                              {item.duration && (
                                <span className="absolute bottom-0.5 right-0.5 bg-black/80 text-[8px] font-mono text-white px-1 rounded">
                                  {item.duration}
                                </span>
                              )}
                            </div>
                            <div className="min-w-0 max-w-sm">
                              <div className="font-bold text-foreground truncate group-hover:text-orange-400 transition-colors">
                                {item.title}
                              </div>
                              <div className="text-[10px] text-muted-foreground truncate">
                                {item.channelTitle || 'Unknown Channel'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="flex items-center gap-1 font-bold text-foreground">
                            <span>{flag}</span>
                            <span>{item.country || 'RW'}</span>
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="capitalize font-semibold text-muted-foreground text-[11px]">
                            {item.classification || item.type || 'Movie'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="uppercase font-mono text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                            {item.language || 'EN'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <span
                            className={`px-2 py-0.5 rounded font-mono font-bold text-xs ${
                              score >= 76
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : score >= 50
                                ? 'bg-amber-500/20 text-amber-400'
                                : 'bg-rose-500/20 text-rose-400'
                            }`}
                          >
                            {score}/100
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              item.status === 'published' || item.moderationStatus === 'approved'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : item.status === 'rejected' || item.moderationStatus === 'rejected'
                                ? 'bg-rose-500/20 text-rose-400'
                                : 'bg-amber-500/20 text-amber-400'
                            }`}
                          >
                            {item.status || 'Pending'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            {item.youtubeVideoId && (
                              <a
                                href={`https://www.youtube.com/watch?v=${item.youtubeVideoId}`}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1 text-muted-foreground hover:text-foreground rounded-md hover:bg-secondary transition-colors"
                                title="Watch on YouTube"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                            {onInspectItem && (
                              <button
                                onClick={() => onInspectItem(item)}
                                className="px-2 py-1 bg-orange-500/15 hover:bg-orange-500/25 text-orange-400 border border-orange-500/30 rounded-md text-[11px] font-semibold transition-colors"
                              >
                                Inspect
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredItems.map((item) => {
                const country = SUPPORTED_COUNTRIES[item.country?.toUpperCase() || 'RW'];
                const flag = country ? country.flagEmoji : '🌍';
                const score = Number(item.score ?? (item as { overallScore?: number }).overallScore ?? 50);

                return (
                  <div
                    key={item.id || item.youtubeVideoId}
                    onClick={() => onInspectItem && onInspectItem(item)}
                    className="bg-secondary/30 hover:bg-secondary/60 border border-border rounded-xl overflow-hidden cursor-pointer transition-all group flex flex-col justify-between"
                  >
                    <div className="relative aspect-video bg-black">
                      {item.thumbnailUrl && (
                        <img
                          src={item.thumbnailUrl}
                          alt=""
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      )}
                      <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-sm text-[10px] font-bold text-white flex items-center gap-1">
                        <span>{flag}</span>
                        <span>{item.country || 'RW'}</span>
                      </div>
                      <div className="absolute top-2 right-2">
                        <span
                          className={`px-1.5 py-0.5 rounded font-mono font-bold text-[10px] ${
                            score >= 76
                              ? 'bg-emerald-500/90 text-white'
                              : score >= 50
                              ? 'bg-amber-500/90 text-white'
                              : 'bg-rose-500/90 text-white'
                          }`}
                        >
                          {score}
                        </span>
                      </div>
                      {item.duration && (
                        <div className="absolute bottom-2 right-2 bg-black/80 text-[9px] font-mono text-white px-1.5 py-0.5 rounded">
                          {item.duration}
                        </div>
                      )}
                    </div>

                    <div className="p-3 space-y-2 flex-1 flex flex-col justify-between">
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-foreground line-clamp-2 group-hover:text-orange-400 transition-colors">
                          {item.title}
                        </h4>
                        <div className="text-[11px] text-muted-foreground truncate">
                          {item.channelTitle || 'Unknown Channel'}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-border/50 flex items-center justify-between text-[10px] text-muted-foreground">
                        <span className="capitalize">{item.classification || item.type || 'Movie'}</span>
                        <span className="text-orange-400 font-semibold group-hover:underline">Inspect Details →</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

