/**
 * OrangeFlix YouTube Discovery V2 — Series Component
 * Canonical series cluster browser with episode matrix and missing gap resolution.
 */

import React, { useState } from 'react';
import {
  Tv,
  ListVideo,
  Sparkles,
  Search,
  CheckCircle2,
  AlertCircle,
  Play,
  Layers,
  ArrowUpRight,
  RefreshCw,
} from 'lucide-react';
import { GeoSeries } from '@/features/youtube/discoveryV2/types';
import { SUPPORTED_COUNTRIES } from '@/features/geo/countryConfig';

interface DiscoverySeriesProps {
  seriesList: GeoSeries[];
  selectedCountry?: string;
  onSelectCountry?: (code: string) => void;
  onScanGaps: (seriesTitle: string, countryCode: string) => Promise<void>;
  onInspectSeries: (series: GeoSeries) => void;
  isLoading: boolean;
}

export const DiscoverySeries: React.FC<DiscoverySeriesProps> = ({
  seriesList,
  selectedCountry: initialCountry = 'ALL',
  onSelectCountry,
  onScanGaps,
  onInspectSeries,
  isLoading,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [localCountry, setLocalCountry] = useState(initialCountry);
  const selectedCountry = onSelectCountry ? initialCountry : localCountry;
  const setSelectedCountry = (code: string) => {
    setLocalCountry(code);
    onSelectCountry?.(code);
  };
  const [scanningGapTitle, setScanningGapTitle] = useState<string | null>(null);

  const filtered = seriesList.filter((s) => {
    if (selectedCountry !== 'ALL') {
      if (!s.countryCodes.includes(selectedCountry)) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = s.canonicalTitle?.toLowerCase().includes(q) || s.normalizedTitle?.toLowerCase().includes(q);
      const matchAliases = s.aliases?.some((a) => a.toLowerCase().includes(q));
      if (!matchTitle && !matchAliases) return false;
    }
    return true;
  });

  const handleScanGaps = async (s: GeoSeries) => {
    const title = s.canonicalTitle || s.normalizedTitle;
    const country = s.countryCodes[0] || 'RW';
    setScanningGapTitle(title);
    try {
      await onScanGaps(title, country);
    } finally {
      setScanningGapTitle(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header & Filters */}
      <div className="bg-card/60 border border-border rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search canonical series..."
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

        <div className="text-xs text-muted-foreground self-end sm:self-center">
          Total Canonical Series: <strong className="text-foreground">{seriesList.length}</strong>
        </div>
      </div>

      {/* Series Grid */}
      {filtered.length === 0 ? (
        <div className="bg-card/40 border border-border rounded-xl p-12 text-center text-sm text-muted-foreground">
          <Tv className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
          No canonical series found. Run territory discovery scans to identify and cluster episodic content.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((s) => {
            const knownEps = s.knownEpisodeNumbers || [];
            const maxEp = knownEps.length > 0 ? Math.max(...knownEps) : 0;
            const isScanning = scanningGapTitle === (s.canonicalTitle || s.normalizedTitle);

            return (
              <div
                key={s.seriesId}
                className="bg-card/60 border border-border hover:border-purple-500/40 rounded-xl p-5 space-y-4 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                        {s.countryCodes.join(', ') || 'Global'}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        Confidence: <strong className="text-foreground">{s.confidence}%</strong>
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-foreground line-clamp-1">
                      {s.canonicalTitle || s.normalizedTitle}
                    </h3>
                  </div>

                  <button
                    onClick={() => handleScanGaps(s)}
                    disabled={isScanning}
                    className="px-3 py-1.5 bg-secondary hover:bg-secondary/80 text-foreground text-xs font-medium rounded-lg border border-border transition-all flex items-center gap-1.5 shrink-0"
                    title="Search YouTube specifically for missing episodes in this series"
                  >
                    {isScanning ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-orange-400" />
                    ) : (
                      <Search className="w-3.5 h-3.5 text-purple-400" />
                    )}
                    <span>{isScanning ? 'Scanning...' : 'Find Gaps'}</span>
                  </button>
                </div>

                {/* Episode Matrix */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Resolved Episodes ({knownEps.length})</span>
                    <span>Seasons: {s.seasonCount || 1}</span>
                  </div>

                  {/* Matrix Chips */}
                  <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
                    {Array.from({ length: Math.max(maxEp, 1) }, (_, i) => i + 1).map((epNum) => {
                      const isFound = knownEps.includes(epNum);
                      return (
                        <span
                          key={epNum}
                          className={`px-2 py-0.5 rounded text-[11px] font-mono font-medium ${
                            isFound
                              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                              : 'bg-secondary/40 text-muted-foreground/60 border border-border/40 border-dashed'
                          }`}
                          title={isFound ? `Episode ${epNum} discovered` : `Episode ${epNum} missing`}
                        >
                          Ep {epNum} {isFound ? '✓' : '?'}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Aliases & Channels */}
                {s.aliases && s.aliases.length > 1 && (
                  <div className="text-[11px] text-muted-foreground line-clamp-1">
                    Aliases: {s.aliases.slice(0, 3).join(' • ')}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
