/**
 * OrangeFlix YouTube Discovery V2 — Content Explorer Component
 * Searchable, filterable candidate catalog with bulk moderation and detail inspection.
 */

import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  CheckSquare,
  Square,
  Eye,
  CheckCircle2,
  Clock,
  XCircle,
  Film,
  Tv,
  ListVideo,
  Layers,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ExternalLink,
  Trash2,
} from 'lucide-react';
import { GeoContentItem, GeoContentStatus } from '@/types/geo-content';
import { SUPPORTED_COUNTRIES } from '@/features/geo/countryConfig';
import { ContentFilterState } from './types';

interface DiscoveryContentProps {
  items: GeoContentItem[];
  filter: ContentFilterState;
  onFilterChange: (newFilter: Partial<ContentFilterState>) => void;
  onInspectItem: (item: GeoContentItem) => void;
  onUpdateStatus: (id: string, newStatus: GeoContentStatus) => Promise<void>;
  onBulkUpdateStatus: (ids: string[], newStatus: GeoContentStatus) => Promise<void>;
  onDeleteItem?: (id: string) => Promise<void>;
  isLoading: boolean;
}

export const DiscoveryContent: React.FC<DiscoveryContentProps> = ({
  items,
  filter,
  onFilterChange,
  onInspectItem,
  onUpdateStatus,
  onBulkUpdateStatus,
  onDeleteItem,
  isLoading,
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Filter items in memory
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Country
      if (filter.countryCode && filter.countryCode !== 'ALL') {
        const itemCountry = item.country || (item as { countryCode?: string }).countryCode || 'RW';
        if (itemCountry.toUpperCase() !== filter.countryCode.toUpperCase()) return false;
      }

      // Status
      if (filter.status !== 'all') {
        const status = item.status || 'pending_review';
        if (status !== filter.status) return false;
      }

      // Content Type
      if (filter.contentType !== 'all') {
        const type = item.classification || item.type || 'unknown';
        if (type !== filter.contentType) return false;
      }

      // Search Query
      if (filter.searchQuery.trim()) {
        const q = filter.searchQuery.toLowerCase();
        const matchTitle = item.title?.toLowerCase().includes(q);
        const matchChannel = item.channelTitle?.toLowerCase().includes(q);
        const matchId = item.id?.toLowerCase().includes(q) || item.youtubeVideoId?.toLowerCase().includes(q);
        if (!matchTitle && !matchChannel && !matchId) return false;
      }

      return true;
    });
  }, [items, filter]);

  // Paginate
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, currentPage]);

  const handleSelectAll = () => {
    if (selectedIds.size === paginatedItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedItems.map((i) => i.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleBulkAction = async (newStatus: GeoContentStatus) => {
    if (selectedIds.size === 0) return;
    await onBulkUpdateStatus(Array.from(selectedIds), newStatus);
    setSelectedIds(new Set());
  };

  const getScoreBadge = (score?: number) => {
    const s = Math.round(score ?? 0);
    if (s >= 76) {
      return (
        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          {s}
        </span>
      );
    }
    if (s >= 35) {
      return (
        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
          {s}
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
        {s}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Filter Controls Bar */}
      <div className="bg-card/60 border border-border rounded-xl p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Search text */}
          <div className="relative">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search title, channel, video ID..."
              value={filter.searchQuery}
              onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
              className="w-full bg-card border border-border rounded-lg pl-9 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-orange-500 focus:outline-none"
            />
          </div>

          {/* Territory */}
          <select
            value={filter.countryCode}
            onChange={(e) => onFilterChange({ countryCode: e.target.value })}
            className="bg-card border border-border text-xs rounded-lg px-3 py-1.5 text-foreground focus:ring-2 focus:ring-orange-500 focus:outline-none"
          >
            <option value="ALL">🌍 All Territories</option>
            {Object.entries(SUPPORTED_COUNTRIES).map(([code, config]) => (
              <option key={code} value={code}>
                {config.flagEmoji} {config.name} ({code})
              </option>
            ))}
          </select>

          {/* Status */}
          <select
            value={filter.status}
            onChange={(e) => onFilterChange({ status: e.target.value as ContentFilterState['status'] })}
            className="bg-card border border-border text-xs rounded-lg px-3 py-1.5 text-foreground focus:ring-2 focus:ring-orange-500 focus:outline-none"
          >
            <option value="all">All Moderation Statuses</option>
            <option value="published">Published / Approved</option>
            <option value="pending_review">Pending Review (35–75)</option>
            <option value="rejected">Rejected (&lt;35 / Gated)</option>
          </select>

          {/* Content Type */}
          <select
            value={filter.contentType}
            onChange={(e) => onFilterChange({ contentType: e.target.value as ContentFilterState['contentType'] })}
            className="bg-card border border-border text-xs rounded-lg px-3 py-1.5 text-foreground focus:ring-2 focus:ring-orange-500 focus:outline-none"
          >
            <option value="all">All Content Types</option>
            <option value="movie">Movies</option>
            <option value="series">Series</option>
            <option value="episode">Episodes</option>
            <option value="trailer">Trailers</option>
            <option value="clip">Clips</option>
          </select>
        </div>

        {/* Active Bulk Actions Bar */}
        {selectedIds.size > 0 && (
          <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-2.5 flex items-center justify-between text-xs animate-fadeIn">
            <span className="font-semibold text-orange-400">
              {selectedIds.size} item{selectedIds.size > 1 ? 's' : ''} selected
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleBulkAction('published')}
                className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-md transition-all flex items-center gap-1"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Approve & Publish
              </button>
              <button
                onClick={() => handleBulkAction('pending_review')}
                className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-md transition-all flex items-center gap-1"
              >
                <Clock className="w-3.5 h-3.5" /> Set Pending
              </button>
              <button
                onClick={() => handleBulkAction('rejected')}
                className="px-2.5 py-1 bg-rose-500 hover:bg-rose-600 text-white font-medium rounded-md transition-all flex items-center gap-1"
              >
                <XCircle className="w-3.5 h-3.5" /> Reject
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Items Table */}
      <div className="bg-card/60 border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-muted-foreground border-b border-border bg-secondary/20">
              <tr>
                <th className="py-3 px-4 w-10">
                  <button onClick={handleSelectAll} className="flex items-center text-muted-foreground hover:text-foreground">
                    {selectedIds.size === paginatedItems.length && paginatedItems.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-orange-400" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="py-3 px-3 font-medium">Video / Candidate</th>
                <th className="py-3 px-3 font-medium">Territory</th>
                <th className="py-3 px-3 font-medium">Classification</th>
                <th className="py-3 px-3 font-medium">Score</th>
                <th className="py-3 px-3 font-medium">Duration</th>
                <th className="py-3 px-3 font-medium">Status</th>
                <th className="py-3 px-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-sm text-muted-foreground">
                    No candidates found matching your active filters.
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item) => {
                  const isSelected = selectedIds.has(item.id);
                  return (
                    <tr key={item.id} className={`hover:bg-muted/30 transition-colors ${isSelected ? 'bg-orange-500/5' : ''}`}>
                      <td className="py-3 px-4">
                        <button onClick={() => toggleSelectOne(item.id)} className="flex items-center text-muted-foreground hover:text-foreground">
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-orange-400" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      <td className="py-3 px-3 max-w-xs">
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-9 rounded overflow-hidden shrink-0 bg-black/40 relative">
                            {item.thumbnail ? (
                              <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                <Film className="w-4 h-4" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-foreground line-clamp-1">{item.title}</div>
                            <div className="text-[11px] text-muted-foreground line-clamp-1">{item.channelTitle || 'Unknown Channel'}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-semibold text-foreground">{item.country || 'RW'}</span>
                      </td>

                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-secondary text-secondary-foreground uppercase">
                          {item.classification || item.type || 'unknown'}
                        </span>
                      </td>

                      <td className="py-3 px-3">{getScoreBadge(item.score || (item as { overallScore?: number }).overallScore)}</td>

                      <td className="py-3 px-3 font-mono text-[11px] text-muted-foreground">
                        {item.durationFormatted || '0m'}
                      </td>

                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            item.status === 'published'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : item.status === 'rejected'
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}
                        >
                          {item.status || 'pending'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onInspectItem(item)}
                            className="p-1.5 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                            title="Inspect 0-100 scoring & evidence"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {item.status !== 'published' && (
                            <button
                              onClick={() => onUpdateStatus(item.id, 'published')}
                              className="p-1.5 hover:bg-emerald-500/20 text-muted-foreground hover:text-emerald-400 rounded-lg transition-colors"
                              title="Approve & Publish"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          )}

                          {item.status !== 'rejected' && (
                            <button
                              onClick={() => onUpdateStatus(item.id, 'rejected')}
                              className="p-1.5 hover:bg-rose-500/20 text-muted-foreground hover:text-rose-400 rounded-lg transition-colors"
                              title="Reject"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-secondary/10 text-xs text-muted-foreground">
          <div>
            Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredItems.length)} of {filteredItems.length} entries
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 hover:bg-secondary rounded-md disabled:opacity-30 disabled:pointer-events-none text-foreground"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold text-foreground">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 hover:bg-secondary rounded-md disabled:opacity-30 disabled:pointer-events-none text-foreground"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
