/**
 * OrangeFlix YouTube Discovery V2 — Content Inspector Modal
 * Inspects all 0–100 scoring dimensions, positive/negative evidence, series resolution, and safety gates.
 */

import React from 'react';
import {
  X,
  Sparkles,
  Film,
  Tv,
  ListVideo,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ExternalLink,
  ShieldCheck,
  Globe2,
  Layers,
  Clock,
  ThumbsUp,
  ThumbsDown,
  Info,
} from 'lucide-react';
import { GeoContentItem, GeoContentStatus } from '@/types/geo-content';
import { GeoContentItemV2 } from '@/features/youtube/discoveryV2/types';

interface DiscoveryContentInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: GeoContentItem | null;
  onUpdateStatus: (id: string, newStatus: GeoContentStatus) => Promise<void>;
}

export const DiscoveryContentInspectorModal: React.FC<DiscoveryContentInspectorModalProps> = ({
  isOpen,
  onClose,
  item,
  onUpdateStatus,
}) => {
  if (!isOpen || !item) return null;

  // Cast or adapt to V2 properties if available
  const itemV2 = item as unknown as Partial<GeoContentItemV2>;
  const overallScore = Number(itemV2.overallScore ?? item.score ?? 0);
  const dimensions = itemV2.scoringDimensions;
  const scoreReasons = itemV2.scoreReasons || [];
  const positiveReasons = scoreReasons.filter((r) => r.impact > 0);
  const negativeReasons = scoreReasons.filter((r) => r.impact < 0);

  const getScoreColor = (score: number) => {
    if (score >= 76) return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
    if (score >= 35) return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
    return 'text-rose-400 border-rose-500/30 bg-rose-500/10';
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-card border border-border rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-6 p-6 relative">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className={`px-3 py-1.5 rounded-xl border font-bold text-base ${getScoreColor(overallScore)}`}>
              {overallScore}/100
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-secondary text-secondary-foreground uppercase">
                  {item.classification || item.type || 'unknown'}
                </span>
                <span className="text-xs text-muted-foreground">
                  Territory: <strong className="text-foreground">{item.country || 'RW'}</strong>
                </span>
              </div>
              <h2 className="text-lg font-bold text-foreground mt-0.5 line-clamp-1">{item.title}</h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Metadata & Preview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-secondary/30 rounded-xl p-4 border border-border/40">
          <div className="sm:col-span-1 rounded-lg overflow-hidden relative aspect-video bg-black/40">
            {item.thumbnail ? (
              <img
                src={item.thumbnail}
                alt={item.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                <Film className="w-8 h-8" />
              </div>
            )}
          </div>

          <div className="sm:col-span-2 space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Channel:</span>
              <span className="font-semibold text-foreground">{item.channelTitle || 'Unknown'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Duration:</span>
              <span className="font-semibold text-foreground">{item.durationFormatted || '0m'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Status:</span>
              <span className="font-semibold capitalize text-foreground">{item.status}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">YouTube Link:</span>
              <a
                href={item.youtubeUrl || `https://www.youtube.com/watch?v=${item.youtubeVideoId}`}
                target="_blank"
                rel="noreferrer"
                className="text-orange-400 hover:text-orange-300 flex items-center gap-1 font-medium"
              >
                Watch on YouTube <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* 0-100 Scoring Dimensions Breakdown */}
        {dimensions && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-orange-400" />
              Scoring Dimensions
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <div className="bg-secondary/40 border border-border/40 rounded-lg p-2.5">
                <div className="text-muted-foreground text-[10px]">Country Match</div>
                <div className="text-sm font-bold text-foreground mt-0.5">{dimensions.countryScore}/100</div>
              </div>
              <div className="bg-secondary/40 border border-border/40 rounded-lg p-2.5">
                <div className="text-muted-foreground text-[10px]">Content Type</div>
                <div className="text-sm font-bold text-foreground mt-0.5">{dimensions.contentTypeScore}/100</div>
              </div>
              <div className="bg-secondary/40 border border-border/40 rounded-lg p-2.5">
                <div className="text-muted-foreground text-[10px]">Channel Trust</div>
                <div className="text-sm font-bold text-foreground mt-0.5">{dimensions.channelScore}/100</div>
              </div>
              <div className="bg-secondary/40 border border-border/40 rounded-lg p-2.5">
                <div className="text-muted-foreground text-[10px]">Series / Episode</div>
                <div className="text-sm font-bold text-foreground mt-0.5">{dimensions.seriesScore || dimensions.episodeScore}/100</div>
              </div>
            </div>
          </div>
        )}

        {/* Positive & Negative Evidence Explanations */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Positive Evidence */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
              <ThumbsUp className="w-3.5 h-3.5" /> Positive Indicators
            </h4>
            {positiveReasons.length === 0 ? (
              <div className="text-xs text-muted-foreground/60 italic bg-secondary/20 rounded-lg p-3">
                No positive modifiers explicitly recorded.
              </div>
            ) : (
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {positiveReasons.map((r, i) => (
                  <div key={i} className="flex items-center justify-between text-xs bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2 text-emerald-300">
                    <span>{r.explanation}</span>
                    <span className="font-bold">+{r.impact}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Negative Evidence / Gating */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-rose-400 flex items-center gap-1.5">
              <ThumbsDown className="w-3.5 h-3.5" /> Negative Deductions / Penalties
            </h4>
            {negativeReasons.length === 0 ? (
              <div className="text-xs text-muted-foreground/60 italic bg-secondary/20 rounded-lg p-3">
                No negative deductions or safety gate violations.
              </div>
            ) : (
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {negativeReasons.map((r, i) => (
                  <div key={i} className="flex items-center justify-between text-xs bg-rose-500/10 border border-rose-500/20 rounded-lg p-2 text-rose-300">
                    <span>{r.explanation}</span>
                    <span className="font-bold">{r.impact}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Series & Episode Resolution info if present */}
        {itemV2.seriesId && (
          <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4 space-y-1.5 text-xs">
            <h4 className="font-bold text-purple-400 flex items-center gap-1.5">
              <Tv className="w-4 h-4" /> Series Cluster Association
            </h4>
            <div className="text-muted-foreground">
              Series ID: <code className="text-foreground font-mono">{itemV2.seriesId}</code>
            </div>
            {itemV2.seasonNumber && (
              <div className="text-muted-foreground">
                Season: <strong className="text-foreground">{itemV2.seasonNumber}</strong> • Episode: <strong className="text-foreground">{itemV2.episodeNumber ?? '?'}</strong>
              </div>
            )}
            {itemV2.seriesConfidence && (
              <div className="text-muted-foreground">
                Cluster Confidence: <strong className="text-purple-400">{itemV2.seriesConfidence}%</strong>
              </div>
            )}
          </div>
        )}

        {/* Moderation Actions */}
        <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
          <div className="text-xs text-muted-foreground">
            Current Decision: <strong className="text-foreground capitalize">{item.status}</strong>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onUpdateStatus(item.id, 'rejected')}
              className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5"
            >
              <XCircle className="w-3.5 h-3.5" /> Reject
            </button>
            <button
              onClick={() => onUpdateStatus(item.id, 'pending_review')}
              className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5"
            >
              <Clock className="w-3.5 h-3.5" /> Set Pending
            </button>
            <button
              onClick={() => onUpdateStatus(item.id, 'published')}
              className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold transition-all shadow-md shadow-emerald-500/20 flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Approve & Publish
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
