/**
 * OrangeFlix Discovery V2 — Publication Engine
 * Centralized publication decision logic with hard gates and threshold scoring
 * PRIMARY THRESHOLDS: <35=REJECT, 35–75=PENDING, ≥76=PUBLISH
 */

import {
  PublicationDecision,
  GeoContentType,
  ChannelTrust,
  GeoContentStatus,
  ScoringDimensions,
  GeoContentItemV2,
} from './types';
import {
  DISCOVERY_V2_SCORING_CONFIG,
  HARD_REJECTION_SIGNALS,
} from './constants';
import { clamp } from './utils';

/**
 * Core publication decision based on overall score and hard gates
 */
export function decidePublicationV2(
  overallScore: number,
  contentType: GeoContentType,
  channelTrust: ChannelTrust,
  isEmbeddable: boolean,
  hardGateFails: string[],
  config = DISCOVERY_V2_SCORING_CONFIG
): PublicationDecision {
  // ========================================================================
  // HARD GATES - Override score completely
  // ========================================================================
  const allHardGates = [...hardGateFails];

  if (!isEmbeddable) {
    allHardGates.push('not_embeddable');
  }

  if (channelTrust === 'rejected') {
    allHardGates.push('channel_rejected');
  }

  // Apply hard gate rejection
  if (allHardGates.length > 0) {
    return {
      status: 'rejected',
      reason: 'hard_rejection_gate',
      overallScore,
      hardGateFailures: allHardGates,
      thresholdDecision: 'auto_reject',
      reasoning: `Hard rejection rule(s): ${allHardGates.join(', ')}`,
      timestamp: new Date(),
    };
  }

  // ========================================================================
  // PRIMARY THRESHOLD-BASED DECISION (0–100 scale)
  // ========================================================================
  const autoPublishThreshold = config.AUTO_PUBLISH_THRESHOLD; // 76
  const pendingLowerThreshold = config.PENDING_REVIEW_LOWER; // 35

  if (overallScore >= autoPublishThreshold) {
    // ≥76 → AUTO PUBLISH
    return {
      status: 'published',
      reason: 'score_meets_auto_publish_threshold',
      overallScore,
      hardGateFailures: [],
      thresholdDecision: 'auto_publish',
      reasoning: `Score ${overallScore}/100 meets auto-publish threshold (≥${autoPublishThreshold})`,
      timestamp: new Date(),
    };
  } else if (overallScore >= pendingLowerThreshold) {
    // 35–75 → PENDING REVIEW
    return {
      status: 'pending_review',
      reason: 'score_in_pending_range',
      overallScore,
      hardGateFailures: [],
      thresholdDecision: 'pending',
      reasoning: `Score ${overallScore}/100 is in pending-review range (${pendingLowerThreshold}–${autoPublishThreshold - 1})`,
      timestamp: new Date(),
    };
  } else {
    // <35 → AUTO REJECT
    return {
      status: 'rejected',
      reason: 'score_below_pending_threshold',
      overallScore,
      hardGateFailures: [],
      thresholdDecision: 'auto_reject',
      reasoning: `Score ${overallScore}/100 is below pending-review threshold (<${pendingLowerThreshold})`,
      timestamp: new Date(),
    };
  }
}

/**
 * Series-aware publication decision
 * Episodes need higher confidence in series identification
 */
export function decidePublicationForEpisodeV2(
  overallScore: number,
  seriesId: string | undefined,
  seriesConfidence: number,
  episodeConfidence: number,
  channelTrust: ChannelTrust,
  isEmbeddable: boolean,
  hardGateFails: string[],
  config = DISCOVERY_V2_SCORING_CONFIG
): PublicationDecision {
  // If series/episode confidence is too low, demote to pending
  if (!seriesId || seriesConfidence < config.SERIES_CONFIDENCE_MIN_FOR_PUBLISH) {
    if (overallScore >= config.AUTO_PUBLISH_THRESHOLD) {
      // Even with high score, low series confidence → pending
      return {
        status: 'pending_review',
        reason: 'low_series_confidence',
        overallScore,
        hardGateFailures: [],
        thresholdDecision: 'pending',
        reasoning: `Episode series confidence (${seriesConfidence}/100) below minimum (${config.SERIES_CONFIDENCE_MIN_FOR_PUBLISH})`,
        timestamp: new Date(),
      };
    }
  }

  // Otherwise use standard publication logic
  return decidePublicationV2(overallScore, 'episode', channelTrust, isEmbeddable, hardGateFails, config);
}

/**
 * Validate content metadata before publication
 */
export interface ContentValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateContentBeforePublication(content: Partial<GeoContentItemV2>): ContentValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!content.id || !content.youtubeVideoId) {
    errors.push('Missing YouTube video ID');
  }

  if (!content.title) {
    errors.push('Missing title');
  }

  if (!content.youtubeChannelId) {
    errors.push('Missing channel ID');
  }

  if (content.durationSeconds === undefined || content.durationSeconds <= 0) {
    errors.push('Invalid duration');
  }

  if (!content.country) {
    warnings.push('Country code not detected');
  }

  if (content.overallScore === undefined || content.overallScore < 0 || content.overallScore > 100) {
    errors.push('Invalid overall score (must be 0–100)');
  }

  if (!content.classification) {
    warnings.push('Content classification not determined');
  }

  if (content.status === 'published' && !content.isEmbeddable) {
    errors.push('Cannot publish non-embeddable content');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Create publication explanation for UI display
 */
export function createPublicationExplanation(
  decision: PublicationDecision,
  dimensions?: ScoringDimensions,
  contentType?: GeoContentType
): string {
  const lines: string[] = [];

  lines.push('Publication Decision: ' + decision.status.toUpperCase());
  lines.push(`Score: ${decision.overallScore}/100`);
  lines.push('');

  if (decision.hardGateFailures && decision.hardGateFailures.length > 0) {
    lines.push('Hard Rejection Rules:');
    for (const fail of decision.hardGateFailures) {
      lines.push(`  • ${fail}`);
    }
    lines.push('');
  }

  lines.push('Reasoning:');
  lines.push(`  ${decision.reasoning}`);
  lines.push('');

  if (dimensions) {
    lines.push('Score Breakdown:');
    lines.push(`  Country:     ${dimensions.countryScore}/100`);
    lines.push(`  Content:     ${dimensions.contentTypeScore}/100`);
    lines.push(`  Movie:       ${dimensions.movieScore}/100`);
    lines.push(`  Series:      ${dimensions.seriesScore}/100`);
    lines.push(`  Episode:     ${dimensions.episodeScore}/100`);
    lines.push(`  Channel:     ${dimensions.channelScore}/100`);
    lines.push(`  Quality:     ${dimensions.qualityScore}/100`);
  }

  return lines.join('\n');
}

/**
 * Recommend admin action based on publication decision
 */
export function recommendAdminAction(decision: PublicationDecision): string {
  if (decision.status === 'published') {
    return 'Content will be automatically published';
  }

  if (decision.status === 'pending_review') {
    if (decision.overallScore > 70) {
      return 'Review recommended – likely meets criteria for publication';
    }
    if (decision.overallScore > 50) {
      return 'Review needed – borderline score';
    }
    return 'Review needed – consider if this series/content should be included';
  }

  if (decision.hardGateFailures && decision.hardGateFailures.length > 0) {
    return `Rejected due to: ${decision.hardGateFailures.join(', ')}`;
  }

  return 'Content will be rejected';
}

/**
 * Apply publication decision to content item
 */
export function applyPublicationDecision(
  content: Partial<GeoContentItemV2>,
  decision: PublicationDecision
): Partial<GeoContentItemV2> {
  return {
    ...content,
    status: decision.status as 'published' | 'pending_review' | 'rejected' | 'unavailable',
    publicationDecision: decision,
  };
}

/**
 * Check if content is eligible for auto-publish based on policy
 */
export function isEligibleForAutoPublish(
  content: Partial<GeoContentItemV2>,
  decision: PublicationDecision
): boolean {
  if (decision.status !== 'published') {
    return false;
  }

  // Hard gate check
  if (decision.hardGateFailures && decision.hardGateFailures.length > 0) {
    return false;
  }

  // Channel trust check
  if (content.channelTrust === 'rejected') {
    return false;
  }

  // Embeddability check
  if (!content.isEmbeddable) {
    return false;
  }

  return true;
}

/**
 * Get publication status badge for UI
 */
export function getPublicationStatusBadge(
  status: GeoContentStatus
): { label: string; color: string; icon: string } {
  switch (status) {
    case 'published':
      return { label: 'Published', color: 'green', icon: '✓' };
    case 'pending_review':
      return { label: 'Pending Review', color: 'yellow', icon: '⏳' };
    case 'rejected':
      return { label: 'Rejected', color: 'red', icon: '✗' };
    case 'unavailable':
      return { label: 'Unavailable', color: 'gray', icon: '⊘' };
    default:
      return { label: 'Unknown', color: 'gray', icon: '?' };
  }
}

/**
 * Score quality assessment for admin UI
 */
export function assessScoreQuality(score: number): {
  level: 'excellent' | 'good' | 'marginal' | 'poor';
  description: string;
} {
  if (score >= 90) {
    return { level: 'excellent', description: 'Excellent match – high confidence' };
  }
  if (score >= 76) {
    return { level: 'good', description: 'Good match – auto-publish' };
  }
  if (score >= 50) {
    return { level: 'marginal', description: 'Marginal – needs review' };
  }
  return { level: 'poor', description: 'Poor match – likely to reject' };
}

/**
 * Format threshold message for user
 */
export function formatThresholdMessage(score: number, config = DISCOVERY_V2_SCORING_CONFIG): string {
  const { AUTO_PUBLISH_THRESHOLD, PENDING_REVIEW_LOWER } = config;

  if (score >= AUTO_PUBLISH_THRESHOLD) {
    const margin = score - AUTO_PUBLISH_THRESHOLD;
    return `${margin} points above auto-publish threshold`;
  }

  if (score >= PENDING_REVIEW_LOWER) {
    const fromPublish = AUTO_PUBLISH_THRESHOLD - score;
    return `${fromPublish} points below auto-publish (${score - PENDING_REVIEW_LOWER} above pending)`;
  }

  return `${PENDING_REVIEW_LOWER - score} points below pending-review threshold`;
}

/**
 * Universal publication decision evaluator conforming to Section 26
 */
export function evaluatePublicationDecision(
  candidate: {
    overallScore?: number;
    score?: number;
    classification?: GeoContentType;
    contentType?: GeoContentType;
    isEmbeddable?: boolean;
    embeddable?: boolean;
    channelTrust?: ChannelTrust;
    hardRejectionReasons?: string[];
    hardGateFailures?: string[];
    seriesId?: string | null;
    seriesConfidence?: number;
    episodeConfidence?: number;
    countryScore?: number;
    channelTrustScore?: number;
  },
  config = DISCOVERY_V2_SCORING_CONFIG
): {
  overallScore: number;
  decision: 'published' | 'pending_review' | 'rejected' | 'unavailable';
  status: 'published' | 'pending_review' | 'rejected' | 'unavailable';
  reasons: string[];
  hardGateFailures: string[];
  classification: GeoContentType;
  countryScore: number;
  seriesConfidence: number;
  channelTrustScore: number;
} {
  const score = clamp(candidate.overallScore ?? candidate.score ?? 0, 0, 100);
  const type = candidate.contentType || candidate.classification || 'unknown';
  const embeddable = candidate.isEmbeddable ?? candidate.embeddable ?? true;
  const trust = candidate.channelTrust || 'pending';
  const hardGates = candidate.hardGateFailures || candidate.hardRejectionReasons || [];
  const seriesConfidence = candidate.seriesConfidence ?? 100;
  const episodeConfidence = candidate.episodeConfidence ?? 100;

  const decision =
    type === 'episode'
      ? decidePublicationForEpisodeV2(
          score,
          candidate.seriesId || undefined,
          seriesConfidence,
          episodeConfidence,
          trust,
          embeddable,
          hardGates,
          config
        )
      : decidePublicationV2(score, type, trust, embeddable, hardGates, config);

  return {
    overallScore: score,
    decision: decision.status,
    status: decision.status,
    reasons: decision.reasoning ? [decision.reasoning] : [],
    hardGateFailures: decision.hardGateFailures || [],
    classification: type,
    countryScore: candidate.countryScore ?? 0,
    seriesConfidence,
    channelTrustScore: candidate.channelTrustScore ?? 0,
  };
}

