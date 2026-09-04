/**
 * OrangeFlix YouTube Discovery V2 — Episodes Component
 * Resolved canonical episodes list with duplicate tracking and series mapping.
 */

import React, { useState } from 'react';
import {
  ListVideo,
  Search,
  ExternalLink,
  Tv,
  Sparkles,
  Copy,
  Layers,
} from 'lucide-react';
import { GeoEpisode } from '@/features/youtube/discoveryV2/types';

interface DiscoveryEpisodesProps {
  episodes: GeoEpisode[];
  isLoading: boolean;
}

export const DiscoveryEpisodes: React.FC<DiscoveryEpisodesProps> = ({
  episodes,
  isLoading,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = episodes.filter((ep) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = ep.title?.toLowerCase().includes(q) || ep.normalizedTitle?.toLowerCase().includes(q);
      const matchSeries = ep.seriesId?.toLowerCase().includes(q);
      const matchVid = ep.canonicalVideoId?.toLowerCase().includes(q);
      if (!matchTitle && !matchSeries && !matchVid) return false;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="bg-card/60 border border-border rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search episode or series..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-card border border-border rounded-lg pl-9 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-orange-500 focus:outline-none"
          />
        </div>

        <div className="text-xs text-muted-foreground">
          Total Canonical Episodes: <strong className="text-foreground">{episodes.length}</strong>
        </div>
      </div>

      {/* Episodes Table */}
      <div className="bg-card/60 border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-muted-foreground border-b border-border bg-secondary/20">
              <tr>
                <th className="py-3 px-4 font-medium">Episode Title</th>
                <th className="py-3 px-3 font-medium">Series / Season</th>
                <th className="py-3 px-3 font-medium">Episode #</th>
                <th className="py-3 px-3 font-medium">Canonical Video ID</th>
                <th className="py-3 px-3 font-medium">Duplicates Tracked</th>
                <th className="py-3 px-3 font-medium">Confidence</th>
                <th className="py-3 px-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-sm text-muted-foreground">
                    No resolved episodes found.
                  </td>
                </tr>
              ) : (
                filtered.map((ep) => (
                  <tr key={ep.episodeId} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 max-w-xs font-semibold text-foreground line-clamp-1">
                      {ep.title}
                    </td>

                    <td className="py-3 px-3 text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Tv className="w-3.5 h-3.5 text-purple-400" />
                        <span>S{ep.seasonNumber ?? 1}</span>
                      </div>
                    </td>

                    <td className="py-3 px-3 font-mono font-bold text-foreground">
                      Ep {ep.episodeNumber}
                    </td>

                    <td className="py-3 px-3 font-mono text-[11px] text-muted-foreground">
                      {ep.canonicalVideoId}
                    </td>

                    <td className="py-3 px-3 text-muted-foreground">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-secondary text-secondary-foreground">
                        {ep.videoIds ? ep.videoIds.length : 1} copy
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <span className="font-bold text-purple-400">{ep.confidence}%</span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <a
                        href={`https://www.youtube.com/watch?v=${ep.canonicalVideoId}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-orange-400 hover:text-orange-300 font-medium"
                      >
                        Watch <ExternalLink className="w-3 h-3" />
                      </a>
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
