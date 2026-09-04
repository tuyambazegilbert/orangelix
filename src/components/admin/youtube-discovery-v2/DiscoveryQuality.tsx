/**
 * OrangeFlix YouTube Discovery V2 — Quality & Score Distribution Component
 * Histograms of 0–100 score distribution and hard safety gate filtering metrics.
 */

import React, { useMemo } from 'react';
import {
  Sparkles,
  ShieldCheck,
  Filter,
  Layers,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { GeoContentItem } from '@/types/geo-content';

interface DiscoveryQualityProps {
  items: GeoContentItem[];
}

export const DiscoveryQuality: React.FC<DiscoveryQualityProps> = ({ items }) => {
  const buckets = useMemo(() => {
    const b = {
      '90-100': 0,
      '76-89': 0,
      '50-75': 0,
      '35-49': 0,
      '20-34': 0,
      '0-19': 0,
    };

    items.forEach((item) => {
      const score = Number(item.score ?? (item as { overallScore?: number }).overallScore ?? 0);
      if (score >= 90) b['90-100']++;
      else if (score >= 76) b['76-89']++;
      else if (score >= 50) b['50-75']++;
      else if (score >= 35) b['35-49']++;
      else if (score >= 20) b['20-34']++;
      else b['0-19']++;
    });

    return b;
  }, [items]);

  const maxBucketCount = Math.max(...Object.values(buckets), 1);

  return (
    <div className="space-y-6">
      <div className="bg-card/60 border border-border rounded-xl p-5">
        <h2 className="text-base font-bold text-foreground flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-orange-400" />
          Score Distribution & Quality Health
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Histogram of candidate 0–100 overall scores across the discovered catalog.
        </p>
      </div>

      {/* Histogram */}
      <div className="bg-card/60 border border-border rounded-xl p-5 space-y-4">
        <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
          0–100 Score Frequency
        </h3>

        <div className="space-y-3">
          {Object.entries(buckets).map(([range, count]) => {
            const pct = Math.round((count / maxBucketCount) * 100);
            const isAutoPub = range === '90-100' || range === '76-89';
            const isPending = range === '50-75' || range === '35-49';

            return (
              <div key={range} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-medium text-foreground">{range}</span>
                  <span className="text-muted-foreground">
                    <strong className="text-foreground">{count}</strong> items ({items.length > 0 ? Math.round((count / items.length) * 100) : 0}%)
                  </span>
                </div>
                <div className="w-full bg-secondary rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isAutoPub
                        ? 'bg-emerald-500'
                        : isPending
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Safety Gate Rules Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card/40 border border-border rounded-xl p-4">
          <div className="text-xs font-semibold text-rose-400">Trailer Gate</div>
          <p className="text-[11px] text-muted-foreground mt-1">
            Rejects trailers, promos, teasers regardless of score.
          </p>
        </div>

        <div className="bg-card/40 border border-border rounded-xl p-4">
          <div className="text-xs font-semibold text-rose-400">Music / Clip Gate</div>
          <p className="text-[11px] text-muted-foreground mt-1">
            Blocks music videos, highlights, and scene clips from cinema rows.
          </p>
        </div>

        <div className="bg-card/40 border border-border rounded-xl p-4">
          <div className="text-xs font-semibold text-amber-400">Duration Gate</div>
          <p className="text-[11px] text-muted-foreground mt-1">
            Enforces minimum duration for movies (45m+) unless resolved as episode.
          </p>
        </div>

        <div className="bg-card/40 border border-border rounded-xl p-4">
          <div className="text-xs font-semibold text-amber-400">Territory Conflict Gate</div>
          <p className="text-[11px] text-muted-foreground mt-1">
            Flags multi-country keyword collisions for manual review.
          </p>
        </div>
      </div>
    </div>
  );
};
