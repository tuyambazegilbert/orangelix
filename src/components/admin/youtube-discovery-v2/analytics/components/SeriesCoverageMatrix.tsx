/**
 * OrangeFlix Discovery V2 — Series Intelligence & Episode Coverage Matrix
 * Episode coverage visualizer (● ● ● ○ ●), gap detection, and one-click targeted search triggers.
 */

import React, { useState } from 'react';
import {
  Tv,
  Sparkles,
  Search,
  CheckCircle2,
  AlertTriangle,
  Play,
  ArrowRight,
  Layers,
} from 'lucide-react';
import { toast } from 'sonner';
import { SeriesCoverageItem, DrillDownTarget } from '../types';

interface SeriesCoverageMatrixProps {
  seriesCoverage: SeriesCoverageItem[];
  onTriggerGapScan?: (seriesTitle: string, missingEpisodes: number[]) => void;
  onDrillDown: (target: DrillDownTarget) => void;
}

export const SeriesCoverageMatrix: React.FC<SeriesCoverageMatrixProps> = ({
  seriesCoverage,
  onTriggerGapScan,
  onDrillDown,
}) => {
  const [searchFilter, setSearchFilter] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'gaps_only' | 'complete'>('all');

  const filtered = (seriesCoverage || []).filter((s) => {
    if (filterMode === 'gaps_only' && s.isComplete) return false;
    if (filterMode === 'complete' && !s.isComplete) return false;
    if (searchFilter.trim() && !(s.seriesTitle || '').toLowerCase().includes(searchFilter.toLowerCase())) return false;
    return true;
  });

  const totalSeries = seriesCoverage.length;
  const completeSeries = seriesCoverage.filter((s) => s.isComplete).length;
  const seriesWithGaps = seriesCoverage.filter((s) => !s.isComplete).length;
  const totalMissingEpisodes = seriesCoverage.reduce((acc, s) => acc + s.missingEpisodeNumbers.length, 0);

  const handleScanGap = (s: SeriesCoverageItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onTriggerGapScan) {
      onTriggerGapScan(s.seriesTitle, s.missingEpisodeNumbers);
    } else {
      toast.info(`Launching targeted discovery for ${s.seriesTitle} (Missing Ep: ${s.missingEpisodeNumbers.join(', ')})...`);
    }
  };

  return (
    <div className="bg-card/60 backdrop-blur-sm border border-border/80 rounded-xl p-5 space-y-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
        <div>
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <Tv className="w-5 h-5 text-indigo-400" />
            Series Intelligence & Episode Coverage Matrix
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Identify broken season continuities and trigger targeted high-recall queries for missing episode gaps.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search series title..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="bg-secondary/60 border border-border rounded-lg pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>
        </div>
      </div>

      {/* Series KPI Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-secondary/40 border border-border/60 rounded-xl p-3 space-y-1">
          <div className="text-muted-foreground font-semibold">Total Series Tracked</div>
          <div className="text-xl font-bold text-foreground font-mono">{totalSeries}</div>
        </div>
        <div className="bg-secondary/40 border border-border/60 rounded-xl p-3 space-y-1">
          <div className="text-muted-foreground font-semibold">Fully Complete (100%)</div>
          <div className="text-xl font-bold text-emerald-400 font-mono">{completeSeries}</div>
        </div>
        <div className="bg-secondary/40 border border-border/60 rounded-xl p-3 space-y-1">
          <div className="text-muted-foreground font-semibold">Series with Missing Gaps</div>
          <div className="text-xl font-bold text-amber-400 font-mono">{seriesWithGaps}</div>
        </div>
        <div className="bg-secondary/40 border border-border/60 rounded-xl p-3 space-y-1">
          <div className="text-muted-foreground font-semibold">Total Missing Episodes</div>
          <div className="text-xl font-bold text-rose-400 font-mono">{totalMissingEpisodes}</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 text-xs">
        {[
          { id: 'all', label: `All Series (${seriesCoverage.length})` },
          { id: 'gaps_only', label: `⚠️ Missing Gaps (${seriesWithGaps})` },
          { id: 'complete', label: `✅ Complete (${completeSeries})` },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setFilterMode(t.id as 'all' | 'gaps_only' | 'complete')}
            className={`px-3 py-1 rounded-lg border text-xs font-semibold transition-colors ${
              filterMode === t.id
                ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-300'
                : 'bg-secondary/40 border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Series Coverage List */}
      <div className="space-y-3">
        {filtered.map((s) => (
          <div
            key={s.seriesId}
            onClick={() =>
              onDrillDown({
                type: 'series',
                title: `${s.seriesTitle} (Season ${s.seasonNumber})`,
                subtitle: `Showing all episodes and metadata discovered for ${s.seriesTitle}.`,
                filterValue: s.seriesTitle,
              })
            }
            className="bg-secondary/30 hover:bg-secondary/60 border border-border/70 rounded-xl p-4 space-y-3 transition-all cursor-pointer group"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-foreground group-hover:text-orange-400 transition-colors">
                    {s.seriesTitle}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary font-mono font-bold text-muted-foreground">
                    Season {s.seasonNumber} • {s.countryCode}
                  </span>
                </div>
                {s.channelTitle && (
                  <div className="text-[11px] text-muted-foreground">
                    Publisher: <span className="text-foreground">{s.channelTitle}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-xs font-bold font-mono">
                    <span className={s.isComplete ? 'text-emerald-400' : 'text-amber-400'}>
                      {s.detectedEpisodesCount} / {s.totalExpectedEpisodes} Episodes ({s.coveragePercent}%)
                    </span>
                  </div>
                  {s.missingEpisodeNumbers.length > 0 && (
                    <div className="text-[10px] text-rose-400 font-mono">
                      Missing: Ep {s.missingEpisodeNumbers.join(', ')}
                    </div>
                  )}
                </div>

                {s.missingEpisodeNumbers.length > 0 && (
                  <button
                    onClick={(e) => handleScanGap(s, e)}
                    className="px-2.5 py-1 text-xs font-semibold bg-orange-500/15 hover:bg-orange-500/25 text-orange-400 border border-orange-500/30 rounded-lg flex items-center gap-1 transition-colors"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Scan Gaps</span>
                  </button>
                )}
              </div>
            </div>

            {/* Interactive Visual Episode Timeline */}
            <div className="bg-card/70 border border-border/60 rounded-lg p-3 space-y-2">
              <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                <span>Episode Continuity Map</span>
                <span className="flex items-center gap-3">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Detected</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full border border-rose-400 bg-rose-500/20" /> Missing Gap</span>
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {Array.from({ length: s.totalExpectedEpisodes }, (_, idx) => {
                  const epNum = idx + 1;
                  const isPresent = s.detectedEpisodeNumbers.includes(epNum);

                  return (
                    <div
                      key={epNum}
                      title={`Episode ${epNum}: ${isPresent ? 'Discovered' : 'Missing Gap'}`}
                      className={`w-7 h-7 rounded-lg text-[11px] font-mono font-bold flex items-center justify-center transition-all ${
                        isPresent
                          ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/30'
                          : 'bg-rose-500/15 border border-rose-500/40 text-rose-400 hover:bg-rose-500/25 animate-pulse'
                      }`}
                    >
                      {epNum}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
