/**
 * OrangeFlix Discovery V2 — Scoring & Safety Breakdown
 * 0–100 score distribution histogram and rejection root cause Pareto breakdown.
 */

import React from 'react';
import { ShieldCheck, AlertOctagon, ArrowUpRight } from 'lucide-react';
import { ScoreBucketStat, RejectionReasonStat, DrillDownTarget } from '../types';

interface ScoringAndSafetyBreakdownProps {
  scoreBuckets: ScoreBucketStat[];
  rejectionReasons: RejectionReasonStat[];
  onDrillDown: (target: DrillDownTarget) => void;
}

export const ScoringAndSafetyBreakdown: React.FC<ScoringAndSafetyBreakdownProps> = ({
  scoreBuckets,
  rejectionReasons,
  onDrillDown,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 1. Score Distribution Histogram */}
      <div className="bg-card/60 backdrop-blur-sm border border-border/80 rounded-xl p-5 space-y-5 shadow-sm">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div>
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              0–100 Relevance Score Distribution
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Candidate distribution across the 3 decision gates: Reject (&lt;35), Review (35–75), Auto-Publish (≥76).
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {scoreBuckets.map((bucket) => (
            <div
              key={bucket.range}
              onClick={() =>
                onDrillDown({
                  type: 'score_bucket',
                  title: `Score Bucket: ${bucket.label}`,
                  subtitle: `Showing candidates with discovery score in range ${bucket.range}.`,
                  filterValue: bucket.range,
                })
              }
              className="bg-secondary/30 hover:bg-secondary/60 border border-border/60 rounded-xl p-3 space-y-1.5 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground group-hover:text-orange-400 transition-colors">
                  {bucket.label}
                </span>
                <div className="flex items-center gap-2 font-mono">
                  <span className="font-bold text-foreground">{bucket.count.toLocaleString()}</span>
                  <span className="text-muted-foreground text-[11px]">({bucket.percentage}%)</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${bucket.percentage}%`, backgroundColor: bucket.color }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Rejection Root Cause Pareto Breakdown */}
      <div className="bg-card/60 backdrop-blur-sm border border-border/80 rounded-xl p-5 space-y-5 shadow-sm">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div>
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-rose-400" />
              Rejection Root Cause Pareto Breakdown
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Identifies the primary safety gate or classification rule that disqualified rejected candidates.
            </p>
          </div>
        </div>

        <div className="space-y-2.5">
          {rejectionReasons.map((reason) => (
            <div
              key={reason.reason}
              onClick={() =>
                onDrillDown({
                  type: 'rejection_reason',
                  title: `Gated Reason: ${reason.label}`,
                  subtitle: `Showing rejected items filtered by rule: ${reason.description}`,
                  filterValue: reason.reason,
                })
              }
              className="bg-secondary/30 hover:bg-secondary/60 border border-border/60 rounded-xl p-2.5 space-y-1 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: reason.color }} />
                  <span className="font-semibold text-foreground group-hover:text-rose-400 transition-colors">
                    {reason.label}
                  </span>
                </div>
                <div className="flex items-center gap-2 font-mono">
                  <span className="font-bold text-foreground">{reason.count.toLocaleString()}</span>
                  <span className="text-rose-400 font-semibold text-[11px]">({reason.percentage}%)</span>
                </div>
              </div>

              <div className="w-full bg-secondary rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${reason.percentage}%`, backgroundColor: reason.color }}
                />
              </div>

              <p className="text-[10px] text-muted-foreground truncate">{reason.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
