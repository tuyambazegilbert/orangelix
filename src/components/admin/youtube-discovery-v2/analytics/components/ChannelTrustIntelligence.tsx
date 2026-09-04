/**
 * OrangeFlix Discovery V2 — Channel Trust & Creator Intelligence
 * Measure channel trust scores, video yield, publishing success, rejection rate,
 * duplicate rate, and average video quality.
 */

import React, { useState } from 'react';
import { Radio, ShieldCheck, AlertCircle, Search, Film, Tv, CheckCircle2, ArrowUpRight } from 'lucide-react';
import { ChannelPerformanceMetric, DrillDownTarget } from '../types';

interface ChannelTrustIntelligenceProps {
  channels: ChannelPerformanceMetric[];
  onDrillDown: (target: DrillDownTarget) => void;
}

export const ChannelTrustIntelligence: React.FC<ChannelTrustIntelligenceProps> = ({
  channels,
  onDrillDown,
}) => {
  const [searchFilter, setSearchFilter] = useState('');
  const [trustFilter, setTrustFilter] = useState<'all' | 'verified' | 'trusted' | 'pending' | 'rejected'>('all');

  const filtered = (channels || []).filter((c) => {
    if (trustFilter !== 'all' && c.trustLevel !== trustFilter) return false;
    if (searchFilter.trim() && !(c.channelTitle || '').toLowerCase().includes(searchFilter.toLowerCase())) return false;
    return true;
  });

  const getTrustBadge = (level: ChannelPerformanceMetric['trustLevel']) => {
    switch (level) {
      case 'verified':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
            <ShieldCheck className="w-2.5 h-2.5" /> Verified Studio
          </span>
        );
      case 'trusted':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30 flex items-center gap-1">
            <CheckCircle2 className="w-2.5 h-2.5" /> Trusted
          </span>
        );
      case 'rejected':
      case 'blocked':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center gap-1">
            <AlertCircle className="w-2.5 h-2.5" /> Blocked
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/15 text-amber-400 border border-amber-500/30">
            Pending Review
          </span>
        );
    }
  };

  return (
    <div className="bg-card/60 backdrop-blur-sm border border-border/80 rounded-xl p-5 space-y-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
        <div>
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <Radio className="w-5 h-5 text-cyan-400" />
            Channel Intelligence & Creator Trust Matrix
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Audit channel reliability, quality scores, and publish conversion rates without letting trust bypass content safety checks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search channel..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="bg-secondary/60 border border-border rounded-lg pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>
        </div>
      </div>

      {/* Trust Filter Tabs */}
      <div className="flex items-center gap-2 text-xs">
        {[
          { id: 'all', label: `All Channels (${channels.length})` },
          { id: 'verified', label: '🛡️ Verified Studios' },
          { id: 'trusted', label: '✅ Trusted' },
          { id: 'pending', label: '⏳ Pending' },
          { id: 'rejected', label: '🚫 Blocked' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTrustFilter(t.id as 'all' | 'verified' | 'trusted' | 'pending' | 'rejected')}
            className={`px-3 py-1 rounded-lg border text-xs font-semibold transition-colors ${
              trustFilter === t.id
                ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
                : 'bg-secondary/40 border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Channel Table */}
      <div className="overflow-x-auto rounded-xl border border-border/70">
        <table className="w-full text-xs text-left">
          <thead className="bg-secondary/50 text-muted-foreground text-[11px] uppercase tracking-wider font-semibold border-b border-border/70">
            <tr>
              <th className="py-2.5 px-3">Channel Name</th>
              <th className="py-2.5 px-3">Trust Tier</th>
              <th className="py-2.5 px-3 text-right">Trust Score</th>
              <th className="py-2.5 px-3 text-right">Discovered</th>
              <th className="py-2.5 px-3 text-right">Relevant</th>
              <th className="py-2.5 px-3 text-right">Published</th>
              <th className="py-2.5 px-3 text-right">Avg Score</th>
              <th className="py-2.5 px-3 text-right">Publish Rate</th>
              <th className="py-2.5 px-3 text-right">Rejection Rate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {filtered.map((c) => (
              <tr
                key={c.channelId}
                onClick={() =>
                  onDrillDown({
                    type: 'channel',
                    title: `Channel: ${c.channelTitle}`,
                    subtitle: `Showing all discovered videos from ${c.channelTitle} (${c.countryCode}).`,
                    filterValue: c.channelId,
                  })
                }
                className="hover:bg-secondary/30 transition-colors cursor-pointer group"
              >
                <td className="py-2.5 px-3">
                  <div>
                    <div className="font-bold text-foreground group-hover:text-orange-400 transition-colors">
                      {c.channelTitle}
                    </div>
                    <div className="text-[10px] text-muted-foreground font-mono">
                      {c.countryCode} • {c.seriesDiscoveredCount} Series • {c.episodesDiscoveredCount} Episodes
                    </div>
                  </div>
                </td>
                <td className="py-2.5 px-3">{getTrustBadge(c.trustLevel)}</td>
                <td className="py-2.5 px-3 text-right font-bold text-foreground font-mono">
                  <span
                    className={`px-2 py-0.5 rounded ${
                      c.trustScore >= 80
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : c.trustScore >= 50
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-rose-500/20 text-rose-400'
                    }`}
                  >
                    {c.trustScore}/100
                  </span>
                </td>
                <td className="py-2.5 px-3 text-right font-bold text-foreground font-mono">
                  {c.totalVideosDiscovered.toLocaleString()}
                </td>
                <td className="py-2.5 px-3 text-right text-blue-400 font-mono">
                  {c.relevantVideos.toLocaleString()}
                </td>
                <td className="py-2.5 px-3 text-right font-bold text-emerald-400 font-mono">
                  {c.publishedVideos.toLocaleString()}
                </td>
                <td className="py-2.5 px-3 text-right font-bold text-foreground font-mono">
                  {c.avgVideoScore}
                </td>
                <td className="py-2.5 px-3 text-right font-bold text-emerald-400 font-mono">
                  {c.publishRate}%
                </td>
                <td className="py-2.5 px-3 text-right font-bold text-rose-400 font-mono">
                  {c.rejectionRate}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

