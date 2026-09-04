/**
 * OrangeFlix YouTube Discovery V2 — Channels Component
 * Trusted channel lifecycle management, trust scoring (0–100), auto-trust progression, and upload crawl triggers.
 */

import React, { useState } from 'react';
import {
  ShieldCheck,
  Search,
  Plus,
  RefreshCw,
  CheckCircle2,
  Clock,
  XCircle,
  ExternalLink,
  Zap,
  Globe2,
  ChevronDown,
} from 'lucide-react';
import { TrustedChannel, ChannelTrust } from '@/types/geo-content';
import { SUPPORTED_COUNTRIES } from '@/features/geo/countryConfig';

interface DiscoveryChannelsProps {
  channels: TrustedChannel[];
  selectedCountry?: string;
  onSelectCountry?: (code: string) => void;
  onUpdateTrust: (channelId: string, trust: ChannelTrust) => Promise<void>;
  onScanChannel: (channelId: string, countryCode: string) => Promise<void>;
  onAddChannel: (channel: Partial<TrustedChannel>) => Promise<void>;
  isLoading: boolean;
}

export const DiscoveryChannels: React.FC<DiscoveryChannelsProps> = ({
  channels,
  selectedCountry: initialCountry = 'ALL',
  onSelectCountry,
  onUpdateTrust,
  onScanChannel,
  onAddChannel,
  isLoading,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [localCountry, setLocalCountry] = useState(initialCountry);
  const selectedCountry = onSelectCountry ? initialCountry : localCountry;
  const setSelectedCountry = (code: string) => {
    setLocalCountry(code);
    onSelectCountry?.(code);
  };
  const [isAddingChannel, setIsAddingChannel] = useState(false);
  const [newChannelId, setNewChannelId] = useState('');
  const [newChannelTitle, setNewChannelTitle] = useState('');
  const [newChannelCountry, setNewChannelCountry] = useState('RW');
  const [scanningChannelId, setScanningChannelId] = useState<string | null>(null);

  const filtered = channels.filter((ch) => {
    const chCountry = ch.country || ch.countryCode || 'RW';
    if (selectedCountry !== 'ALL' && chCountry.toUpperCase() !== selectedCountry.toUpperCase()) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = ch.channelTitle?.toLowerCase().includes(q);
      const matchId = ch.channelId?.toLowerCase().includes(q);
      if (!matchTitle && !matchId) return false;
    }
    return true;
  });

  const handleScanChannel = async (channelId: string, country: string) => {
    setScanningChannelId(channelId);
    try {
      await onScanChannel(channelId, country);
    } finally {
      setScanningChannelId(null);
    }
  };

  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannelId.trim()) return;

    await onAddChannel({
      channelId: newChannelId.trim(),
      channelTitle: newChannelTitle.trim() || newChannelId.trim(),
      country: newChannelCountry,
      countryCode: newChannelCountry,
      trust: 'approved',
      channelTrustScore: 85,
      autoPublishMovies: true,
      autoPublishSeries: true,
    });

    setNewChannelId('');
    setNewChannelTitle('');
    setIsAddingChannel(false);
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
              placeholder="Search channel title or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
          onClick={() => setIsAddingChannel(!isAddingChannel)}
          className="px-3.5 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold rounded-lg transition-all shadow-md shadow-orange-500/20 flex items-center gap-1.5 self-end sm:self-center"
        >
          <Plus className="w-3.5 h-3.5" /> Add Trusted Channel
        </button>
      </div>

      {/* Add Channel Inline Form */}
      {isAddingChannel && (
        <form onSubmit={handleCreateChannel} className="bg-secondary/40 border border-border rounded-xl p-4 space-y-3 animate-fadeIn">
          <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Register New Channel</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="YouTube Channel ID (e.g. UCxxxx)"
              value={newChannelId}
              onChange={(e) => setNewChannelId(e.target.value)}
              required
              className="bg-card border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:ring-2 focus:ring-orange-500 focus:outline-none"
            />
            <input
              type="text"
              placeholder="Channel Name / Display Title"
              value={newChannelTitle}
              onChange={(e) => setNewChannelTitle(e.target.value)}
              className="bg-card border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:ring-2 focus:ring-orange-500 focus:outline-none"
            />
            <select
              value={newChannelCountry}
              onChange={(e) => setNewChannelCountry(e.target.value)}
              className="bg-card border border-border text-xs rounded-lg px-3 py-1.5 text-foreground focus:ring-2 focus:ring-orange-500 focus:outline-none"
            >
              {Object.entries(SUPPORTED_COUNTRIES).map(([code, config]) => (
                <option key={code} value={code}>
                  {config.name} ({code})
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddingChannel(false)}
              className="px-3 py-1.5 bg-secondary text-foreground text-xs rounded-lg border border-border"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3.5 py-1.5 bg-orange-500 text-white text-xs font-semibold rounded-lg shadow-sm"
            >
              Save Channel
            </button>
          </div>
        </form>
      )}

      {/* Channels Table */}
      <div className="bg-card/60 border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-muted-foreground border-b border-border bg-secondary/20">
              <tr>
                <th className="py-3 px-4 font-medium">Channel Name</th>
                <th className="py-3 px-3 font-medium">Territory</th>
                <th className="py-3 px-3 font-medium">Trust Score</th>
                <th className="py-3 px-3 font-medium">Status</th>
                <th className="py-3 px-3 font-medium">Yield (Accepted / Total)</th>
                <th className="py-3 px-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-sm text-muted-foreground">
                    No channels found matching the filter.
                  </td>
                </tr>
              ) : (
                filtered.map((ch) => {
                  const isScanning = scanningChannelId === ch.channelId;
                  const trustScore = ch.channelTrustScore ?? (ch.trust === 'approved' ? 90 : 50);

                  return (
                    <tr key={ch.channelId} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-semibold text-foreground line-clamp-1">{ch.channelTitle}</div>
                        <div className="font-mono text-[11px] text-muted-foreground line-clamp-1">{ch.channelId}</div>
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-semibold text-foreground">{ch.country || ch.countryCode || 'RW'}</span>
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-foreground">{trustScore}/100</span>
                          <div className="w-16 bg-secondary rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                trustScore >= 75
                                  ? 'bg-emerald-500'
                                  : trustScore >= 40
                                  ? 'bg-amber-500'
                                  : 'bg-rose-500'
                              }`}
                              style={{ width: `${trustScore}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <select
                          value={ch.trust || 'pending'}
                          onChange={(e) => onUpdateTrust(ch.channelId, e.target.value as ChannelTrust)}
                          className="bg-card border border-border text-[11px] rounded-md px-2 py-1 text-foreground focus:ring-2 focus:ring-orange-500 focus:outline-none"
                        >
                          <option value="approved">Approved</option>
                          <option value="pending">Pending</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </td>

                      <td className="py-3 px-3 text-muted-foreground">
                        <span className="font-semibold text-foreground">{ch.acceptedCount ?? 0}</span> / {ch.totalAnalyzed ?? 0}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleScanChannel(ch.channelId, ch.country || 'RW')}
                            disabled={isScanning}
                            className="px-2.5 py-1 bg-secondary hover:bg-secondary/80 text-foreground text-[11px] font-medium rounded-md border border-border transition-all flex items-center gap-1"
                            title="Scan this channel's recent uploads"
                          >
                            {isScanning ? (
                              <RefreshCw className="w-3 h-3 animate-spin text-orange-400" />
                            ) : (
                              <Zap className="w-3 h-3 text-orange-400" />
                            )}
                            <span>{isScanning ? 'Scanning...' : 'Scan Uploads'}</span>
                          </button>

                          <a
                            href={`https://www.youtube.com/channel/${ch.channelId}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1 hover:bg-secondary rounded-md text-muted-foreground hover:text-foreground transition-colors"
                            title="Open on YouTube"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
