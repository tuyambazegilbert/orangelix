/**
 * OrangeFlix Discovery V2 — Executive KPI Cards
 * High-resolution metric cards with period-over-period comparisons, trend indicators,
 * and universal click-to-drill-down capabilities.
 */

import React from 'react';
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Clock,
  XCircle,
  Film,
  Tv,
  Layers,
  Radio,
  Languages,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { AggregatedKPIs } from '../utils/analyticsAggregator';
import { DrillDownTarget } from '../types';

interface ExecutiveKPICardsProps {
  kpis: AggregatedKPIs;
  onDrillDown: (target: DrillDownTarget) => void;
}

export const ExecutiveKPICards: React.FC<ExecutiveKPICardsProps> = ({ kpis, onDrillDown }) => {
  const cards = [
    {
      id: 'candidates',
      title: 'Candidates Discovered',
      value: kpis.totalCandidates.toLocaleString(),
      subValue: `+${kpis.newToday} today`,
      delta: kpis.candidatesDelta,
      icon: Sparkles,
      color: 'blue',
      target: {
        type: 'all_candidates' as const,
        title: 'All Discovered Candidates',
        subtitle: `Showing ${kpis.totalCandidates} total candidates discovered in selected scope.`,
      },
    },
    {
      id: 'published',
      title: 'Auto-Published',
      value: kpis.published.toLocaleString(),
      subValue: `${kpis.publishRate}% of total`,
      delta: kpis.publishedDelta,
      icon: CheckCircle2,
      color: 'emerald',
      target: {
        type: 'published' as const,
        title: 'Auto-Published Catalog Items',
        subtitle: `Showing ${kpis.published} items approved with score ≥ 76 and passed safety gates.`,
      },
    },
    {
      id: 'pending',
      title: 'Pending Review',
      value: kpis.pendingReview.toLocaleString(),
      subValue: 'Score 35–75',
      delta: kpis.pendingReviewDelta,
      icon: Clock,
      color: 'amber',
      target: {
        type: 'pending_review' as const,
        title: 'Pending Moderation Queue',
        subtitle: `Showing ${kpis.pendingReview} candidates awaiting manual editor confirmation.`,
      },
    },
    {
      id: 'rejected',
      title: 'Gated / Rejected',
      value: kpis.rejected.toLocaleString(),
      subValue: `${kpis.rejectionRate}% drop-off`,
      delta: kpis.rejectedDelta,
      icon: XCircle,
      color: 'rose',
      target: {
        type: 'rejected' as const,
        title: 'Gated & Rejected Candidates',
        subtitle: `Showing ${kpis.rejected} candidates filtered due to trailers, clips, or low relevance.`,
      },
    },
    {
      id: 'movies',
      title: 'Feature Movies',
      value: kpis.movies.toLocaleString(),
      subValue: 'Cinema & Feature Films',
      delta: kpis.moviesDelta,
      icon: Film,
      color: 'purple',
      target: {
        type: 'movies' as const,
        title: 'Discovered Feature Movies',
        subtitle: `Showing ${kpis.movies} full movies discovered across all active territories.`,
      },
    },
    {
      id: 'series',
      title: 'Active Series',
      value: kpis.series.toLocaleString(),
      subValue: `${kpis.episodes} episodes linked`,
      delta: kpis.seriesDelta,
      icon: Tv,
      color: 'indigo',
      target: {
        type: 'series' as const,
        title: 'Discovered Series & Seasons',
        subtitle: `Showing ${kpis.series} episodic shows tracked in catalog.`,
      },
    },
    {
      id: 'channels',
      title: 'Trusted Channels',
      value: kpis.activeChannels.toLocaleString(),
      subValue: 'Verified Creators',
      delta: 0,
      icon: Radio,
      color: 'cyan',
      target: {
        type: 'channel' as const,
        title: 'Channel Network',
        subtitle: `Showing ${kpis.activeChannels} verified cinema publishers and studios.`,
      },
    },
    {
      id: 'languages',
      title: 'Active Languages',
      value: kpis.activeLanguages.toLocaleString(),
      subValue: 'Multilingual Scope',
      delta: 0,
      icon: Languages,
      color: 'teal',
      target: {
        type: 'language' as const,
        title: 'Multilingual Distribution',
        subtitle: `Showing ${kpis.activeLanguages} African & international languages detected.`,
      },
    },
    {
      id: 'health',
      title: 'Health & Quality Index',
      value: `${kpis.avgScore}/100`,
      subValue: `Engine Health: ${kpis.healthScore}%`,
      delta: kpis.avgScoreDelta,
      icon: ShieldCheck,
      color: 'orange',
      target: {
        type: 'score_bucket' as const,
        title: 'Discovery Quality & Health Score',
        subtitle: 'Breakdown of quality distribution across all discovered cinema candidates.',
      },
    },
  ];

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'emerald':
        return {
          border: 'border-emerald-500/30 hover:border-emerald-500/60',
          bg: 'bg-emerald-500/10 text-emerald-400',
          text: 'text-emerald-400',
          bar: 'bg-emerald-500',
        };
      case 'amber':
        return {
          border: 'border-amber-500/30 hover:border-amber-500/60',
          bg: 'bg-amber-500/10 text-amber-400',
          text: 'text-amber-400',
          bar: 'bg-amber-500',
        };
      case 'rose':
        return {
          border: 'border-rose-500/30 hover:border-rose-500/60',
          bg: 'bg-rose-500/10 text-rose-400',
          text: 'text-rose-400',
          bar: 'bg-rose-500',
        };
      case 'purple':
        return {
          border: 'border-purple-500/30 hover:border-purple-500/60',
          bg: 'bg-purple-500/10 text-purple-400',
          text: 'text-purple-400',
          bar: 'bg-purple-500',
        };
      case 'indigo':
        return {
          border: 'border-indigo-500/30 hover:border-indigo-500/60',
          bg: 'bg-indigo-500/10 text-indigo-400',
          text: 'text-indigo-400',
          bar: 'bg-indigo-500',
        };
      case 'cyan':
        return {
          border: 'border-cyan-500/30 hover:border-cyan-500/60',
          bg: 'bg-cyan-500/10 text-cyan-400',
          text: 'text-cyan-400',
          bar: 'bg-cyan-500',
        };
      case 'teal':
        return {
          border: 'border-teal-500/30 hover:border-teal-500/60',
          bg: 'bg-teal-500/10 text-teal-400',
          text: 'text-teal-400',
          bar: 'bg-teal-500',
        };
      case 'orange':
        return {
          border: 'border-orange-500/30 hover:border-orange-500/60',
          bg: 'bg-orange-500/10 text-orange-400',
          text: 'text-orange-400',
          bar: 'bg-orange-500',
        };
      case 'blue':
      default:
        return {
          border: 'border-blue-500/30 hover:border-blue-500/60',
          bg: 'bg-blue-500/10 text-blue-400',
          text: 'text-blue-400',
          bar: 'bg-blue-500',
        };
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
      {cards.map((c) => {
        const styles = getColorClasses(c.color);
        const Icon = c.icon;

        return (
          <div
            key={c.id}
            onClick={() => onDrillDown(c.target)}
            className={`bg-card/60 backdrop-blur-sm border ${styles.border} rounded-xl p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-pointer group flex flex-col justify-between`}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  {c.title}
                </span>
                <div className={`p-1.5 rounded-lg ${styles.bg}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div className="flex items-baseline justify-between gap-1">
                <div className="text-2xl font-black text-foreground tracking-tight group-hover:text-orange-400 transition-colors">
                  {c.value}
                </div>
                {c.delta !== 0 && (
                  <div
                    className={`flex items-center gap-0.5 text-xs font-bold ${
                      c.delta > 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {c.delta > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    <span>{c.delta > 0 ? `+${c.delta}%` : `${c.delta}%`}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-border/50 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>{c.subValue}</span>
              <span className="text-[10px] text-orange-400 opacity-0 group-hover:opacity-100 transition-opacity font-semibold">
                Explore →
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
