/**
 * OrangeFlix Discovery V2 — Scoring Engine
 * Centralized 0–100 scoring system with separate dimensions and evidence tracking
 * PRIMARY PUBLICATION THRESHOLD: 76 (≥76 = AUTO PUBLISH, <35 = AUTO REJECT, 35–75 = PENDING REVIEW)
 */

import {
  ScoringDimensions,
  ScoreReason,
  DiscoveryEvidence,
  PublicationDecision,
  GeoContentType,
  ChannelTrust,
  GeoContentStatus,
} from './types';
import {
  DISCOVERY_V2_SCORING_CONFIG,
  MOVIE_SCORE_IMPACTS,
  EPISODE_SCORE_IMPACTS,
  SERIES_SCORE_IMPACTS,
  COUNTRY_SCORE_IMPACTS,
  CHANNEL_SCORE_IMPACTS,
  QUALITY_SCORE_IMPACTS,
  HARD_REJECTION_SIGNALS,
  HARD_POSITIVE_SIGNALS,
  DURATION_THRESHOLDS,
} from './constants';
import { clamp, normalizeScore, weightedAverage } from './utils';

/**
 * Central scoring interface for all classification inputs
 */
export interface ClassifierInput {
  // Content
  title: string;
  description?: string;
  durationSeconds: number;
  category?: string;
  tags?: string[];

  // Channel
  channelId?: string;
  channelTitle?: string;
  channelCountry?: string;
  channelTrust?: ChannelTrust;

  // Discovery context
  countryCode?: string;
  language?: string;

  // Existing series/episode info
  existingSeriesId?: string;
  existingSeasonNumber?: number | null;
  existingEpisodeNumber?: number | null;

  // URL / metadata
  youtubeUrl?: string;
  publishedAt?: Date;
  views?: number;
  likes?: number;

  // Embeddability
  isEmbeddable?: boolean;

  // Min duration requirement
  minMovieDurationMinutes?: number;
}

/**
 * Complete classification result
 */
export interface ClassificationResult {
  contentType: GeoContentType;
  confidence: number; // 0–100
  overallScore: number; // 0–100, PRIMARY DECISION FACTOR
  scoringDimensions: ScoringDimensions;
  scoreReasons: ScoreReason[];
  evidenceList: DiscoveryEvidence[];
  isFullMovieCandidate: boolean;
  publicationDecision: PublicationDecision;
}

/**
 * Primary scoring calculator
 * Produces normalized 0–100 overall score from multiple dimensions
 */
export function calculateOverallScore(
  dimensions: ScoringDimensions,
  config = DISCOVERY_V2_SCORING_CONFIG
): number {
  // Extract weights
  const {
    countryScore,
    contentTypeScore,
    movieScore,
    seriesScore,
    episodeScore,
    seasonScore,
    channelScore,
    qualityScore,
  } = dimensions;

  const scores = {
    countryScore,
    contentTypeScore,
    movieScore,
    seriesScore,
    episodeScore,
    seasonScore,
    channelScore,
    qualityScore,
  };

  // Weighted average using config weights
  const overall = weightedAverage(scores, config.weights as Record<string, number>);

  // Ensure 0–100
  return clamp(Math.round(overall), 0, 100);
}

/**
 * Decide publication status based on overall score and hard gates
 */
export function decidePublication(
  overallScore: number,
  contentType: GeoContentType,
  isEmbeddable: boolean,
  channelTrust: ChannelTrust,
  hardRejectionReasons: string[],
  config = DISCOVERY_V2_SCORING_CONFIG
): PublicationDecision {
  // Hard gates override score
  if (hardRejectionReasons.length > 0) {
    return {
      status: 'rejected',
      reason: 'hard_rejection_rule',
      overallScore,
      hardGateFailures: hardRejectionReasons,
      thresholdDecision: 'auto_reject',
      reasoning: `Hard rejection: ${hardRejectionReasons.join(', ')}`,
      timestamp: new Date(),
    };
  }

  // Check embeddability as a hard gate
  if (!isEmbeddable) {
    return {
      status: 'rejected',
      reason: 'not_embeddable',
      overallScore,
      hardGateFailures: ['not_embeddable'],
      thresholdDecision: 'auto_reject',
      reasoning: 'Video is not embeddable on OrangeFlix',
      timestamp: new Date(),
    };
  }

  // Check channel rejection as a hard gate
  if (channelTrust === 'rejected') {
    return {
      status: 'rejected',
      reason: 'channel_rejected',
      overallScore,
      hardGateFailures: ['channel_rejected'],
      thresholdDecision: 'auto_reject',
      reasoning: 'Channel is explicitly rejected',
      timestamp: new Date(),
    };
  }

  // Primary threshold-based decision
  const threshold = config.AUTO_PUBLISH_THRESHOLD;
  const pendingLower = config.PENDING_REVIEW_LOWER;

  if (overallScore >= threshold) {
    return {
      status: 'published',
      reason: 'score_threshold',
      overallScore,
      hardGateFailures: [],
      thresholdDecision: 'auto_publish',
      reasoning: `Score ${overallScore} meets auto-publish threshold (${threshold})`,
      timestamp: new Date(),
    };
  } else if (overallScore >= pendingLower) {
    return {
      status: 'pending_review',
      reason: 'below_auto_publish_threshold',
      overallScore,
      hardGateFailures: [],
      thresholdDecision: 'pending',
      reasoning: `Score ${overallScore} is between pending (${pendingLower}–${threshold - 1})`,
      timestamp: new Date(),
    };
  } else {
    return {
      status: 'rejected',
      reason: 'score_below_rejection_threshold',
      overallScore,
      hardGateFailures: [],
      thresholdDecision: 'auto_reject',
      reasoning: `Score ${overallScore} is below pending-review threshold (${pendingLower})`,
      timestamp: new Date(),
    };
  }
}

/**
 * Calculate country relevance score (0–100)
 */
export function calculateCountryScore(
  input: ClassifierInput,
  countryRelevanceMatches: Array<{ keyword: string; weight: number }> = []
): number {
  let score = 0;

  // Base country match
  if (input.countryCode && input.channelCountry === input.countryCode) {
    score += COUNTRY_SCORE_IMPACTS.CHANNEL_COUNTRY_MATCH;
  }

  // Keyword matches from domain-specific analysis
  for (const match of countryRelevanceMatches) {
    score += Math.min(match.weight, 30);
  }

  // Language evidence
  if (input.language) {
    score += COUNTRY_SCORE_IMPACTS.LOCAL_LANGUAGE;
  }

  return clamp(score, 0, 100);
}

/**
 * Calculate movie classification score (0–100)
 */
export function calculateMovieScore(input: ClassifierInput): number {
  let score = 50; // Neutral baseline

  const durationMins = Math.round(input.durationSeconds / 60);

  // Duration analysis
  if (input.durationSeconds >= DURATION_THRESHOLDS.FEATURE) {
    score += MOVIE_SCORE_IMPACTS.DURATION_60_PLUS;
  } else if (input.durationSeconds >= DURATION_THRESHOLDS.MEDIUM) {
    score += MOVIE_SCORE_IMPACTS.DURATION_45_TO_59;
  } else if (input.durationSeconds < 3 * 60) {
    score += MOVIE_SCORE_IMPACTS.DURATION_SHORTS;
  }

  // Title/description analysis
  const titleLower = (input.title || '').toLowerCase();
  const descLower = (input.description || '').toLowerCase();

  if (titleLower.includes('full movie')) {
    score += MOVIE_SCORE_IMPACTS.FULL_MOVIE_TITLE;
  }
  if (titleLower.includes('full film')) {
    score += MOVIE_SCORE_IMPACTS.FULL_FILM_TITLE;
  }

  // Negative signals
  if (titleLower.includes('trailer')) {
    score += MOVIE_SCORE_IMPACTS.TRAILER_DETECTED;
  }
  if (titleLower.includes('teaser')) {
    score += MOVIE_SCORE_IMPACTS.TEASER_DETECTED;
  }
  if (titleLower.includes('clip') || titleLower.includes('scene')) {
    score += MOVIE_SCORE_IMPACTS.CLIP_DETECTED;
  }
  if (titleLower.includes('interview')) {
    score += MOVIE_SCORE_IMPACTS.INTERVIEW_DETECTED;
  }
  if (titleLower.includes('music video')) {
    score += MOVIE_SCORE_IMPACTS.MUSIC_VIDEO;
  }

  return clamp(score, 0, 100);
}

/**
 * Calculate episode classification score (0–100)
 */
export function calculateEpisodeScore(
  input: ClassifierInput,
  episodePattern?: { episodeNumber: number | null; seasonNumber: number | null; confidence: number }
): number {
  let score = 30; // Lower baseline than movie

  const titleLower = (input.title || '').toLowerCase();

  // Episode pattern matches
  if (episodePattern) {
    if (episodePattern.episodeNumber !== null && episodePattern.seasonNumber !== null) {
      score += EPISODE_SCORE_IMPACTS.SEASON_EPISODE_CODE;
    } else if (episodePattern.episodeNumber !== null) {
      score += EPISODE_SCORE_IMPACTS.EPISODE_NUMBER;
    } else if (episodePattern.seasonNumber !== null) {
      score += EPISODE_SCORE_IMPACTS.SEASON_NUMBER;
    }
  }

  // Keyword matches
  if (titleLower.includes('episode') || titleLower.includes('ep')) {
    score += EPISODE_SCORE_IMPACTS.EPISODE_KEYWORD;
  }
  if (titleLower.includes('season')) {
    score += EPISODE_SCORE_IMPACTS.SEASON_NUMBER;
  }

  // Negative signals
  if (titleLower.includes('trailer')) {
    score += EPISODE_SCORE_IMPACTS.TRAILER_INDICATOR;
  }
  if (titleLower.includes('clip')) {
    score += EPISODE_SCORE_IMPACTS.CLIP_INDICATOR;
  }
  if (titleLower.includes('review')) {
    score += EPISODE_SCORE_IMPACTS.REVIEW_INDICATOR;
  }

  return clamp(score, 0, 100);
}

/**
 * Calculate series classification score (0–100)
 */
export function calculateSeriesScore(input: ClassifierInput): number {
  let score = 30; // Lower baseline

  const titleLower = (input.title || '').toLowerCase();
  const descLower = (input.description || '').toLowerCase();

  // Series keywords
  if (titleLower.includes('series') || titleLower.includes('tv show') || titleLower.includes('season')) {
    score += SERIES_SCORE_IMPACTS.SERIES_KEYWORD;
  }

  // Category
  if (input.category === 'Film & Animation' || input.category?.includes('Drama')) {
    score += SERIES_SCORE_IMPACTS.TV_CATEGORY;
  }

  // Description hints
  if (descLower.includes('episode') || descLower.includes('season')) {
    score += SERIES_SCORE_IMPACTS.EPISODIC_DESCRIPTION;
  }

  return clamp(score, 0, 100);
}

/**
 * Calculate channel trust score (0–100)
 */
export function calculateChannelScore(input: ClassifierInput): number {
  let score = 50; // Neutral baseline

  if (input.channelTrust === 'approved') {
    score += CHANNEL_SCORE_IMPACTS.ADMINISTRATOR_APPROVED;
  } else if (input.channelTrust === 'pending') {
    score += CHANNEL_SCORE_IMPACTS.CHANNEL_PENDING;
  } else if (input.channelTrust === 'rejected') {
    score += CHANNEL_SCORE_IMPACTS.CHANNEL_REJECTED;
  }

  return clamp(score, 0, 100);
}

/**
 * Calculate quality score (0–100) based on metadata and engagement
 */
export function calculateQualityScore(input: ClassifierInput): number {
  let score = 50; // Neutral baseline

  // Metadata quality
  if ((input.title || '').length > 10) {
    score += 10;
  }
  if ((input.description || '').length > 100) {
    score += QUALITY_SCORE_IMPACTS.GOOD_DESCRIPTION;
  }
  if ((input.tags || []).length > 0) {
    score += QUALITY_SCORE_IMPACTS.HAS_TAGS;
  }

  // Engagement
  if ((input.views || 0) > 1000) {
    score += QUALITY_SCORE_IMPACTS.HIGH_ENGAGEMENT;
  }

  // Recent upload (published in last 6 months)
  if (input.publishedAt) {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    if (input.publishedAt > sixMonthsAgo) {
      score += QUALITY_SCORE_IMPACTS.RECENT_UPLOAD;
    }
  }

  return clamp(score, 0, 100);
}

/**
 * Create score explanation
 */
export function createScoreExplanation(
  dimensions: ScoringDimensions,
  reasons: ScoreReason[],
  overallScore: number,
  contentType: GeoContentType
): string {
  const lines = [
    `Overall Score: ${overallScore}/100`,
    `Content Type: ${contentType}`,
    '',
    'Scoring Breakdown:',
    `  Country Score:       ${dimensions.countryScore}/100`,
    `  Content Type Score:  ${dimensions.contentTypeScore}/100`,
    `  Movie Score:         ${dimensions.movieScore}/100`,
    `  Series Score:        ${dimensions.seriesScore}/100`,
    `  Episode Score:       ${dimensions.episodeScore}/100`,
    `  Channel Score:       ${dimensions.channelScore}/100`,
    `  Quality Score:       ${dimensions.qualityScore}/100`,
    '',
    'Evidence:',
  ];

  const positiveReasons = reasons.filter(r => r.impact > 0).sort((a, b) => b.impact - a.impact);
  const negativeReasons = reasons.filter(r => r.impact < 0).sort((a, b) => a.impact - b.impact);

  for (const reason of positiveReasons) {
    lines.push(`  + ${reason.impact} — ${reason.explanation}`);
  }

  for (const reason of negativeReasons) {
    lines.push(`  ${reason.impact} — ${reason.explanation}`);
  }

  return lines.join('\n');
}

/**
 * Classify a YouTube video end-to-end
 */
export async function classifyYouTubeVideoV2(
  input: ClassifierInput,
  config = DISCOVERY_V2_SCORING_CONFIG,
  countryRelevanceMatches: Array<{ keyword: string; weight: number }> = [],
  episodePattern?: { episodeNumber: number | null; seasonNumber: number | null; confidence: number },
  hardRejectionReasons: string[] = []
): Promise<ClassificationResult> {
  // Calculate individual dimension scores
  const countryScore = calculateCountryScore(input, countryRelevanceMatches);
  const movieScore = calculateMovieScore(input);
  const episodeScore = calculateEpisodeScore(input, episodePattern);
  const seriesScore = calculateSeriesScore(input);
  const channelScore = calculateChannelScore(input);
  const qualityScore = calculateQualityScore(input);

  // Derived scores
  const contentTypeScore = Math.max(movieScore, episodeScore, seriesScore);
  const seasonScore = episodePattern?.seasonNumber ? 80 : 20;

  const dimensions: ScoringDimensions = {
    countryScore,
    contentTypeScore,
    movieScore,
    episodeScore,
    seriesScore,
    seasonScore,
    channelScore,
    qualityScore,
    metadataScore: 0, // Folded into qualityScore
    freshnessScore: 0, // Optional
    duplicateScore: 0, // Not used in final score
  };

  // Calculate overall score
  const overallScore = calculateOverallScore(dimensions, config);

  // Determine content type
  let contentType: GeoContentType = 'unknown';
  // `undefined !== null` is true: require an actually resolved number.
  if (episodePattern?.episodeNumber != null) {
    contentType = 'episode';
  } else if (episodePattern?.seasonNumber != null && (input.durationSeconds / 60) < 45) {
    contentType = 'episode';
  } else if (seriesScore > movieScore) {
    contentType = 'series';
  } else if (movieScore > 60) {
    contentType = 'movie';
  }

  // Create score reasons
  const scoreReasons: ScoreReason[] = [];

  if (movieScore > 50) {
    scoreReasons.push({
      type: 'title_pattern',
      field: 'title',
      impact: movieScore - 50,
      explanation: `Movie pattern detected (score ${movieScore})`,
      confidence: 75,
    });
  }

  if (episodeScore > 40) {
    scoreReasons.push({
      type: 'episode_pattern',
      field: 'title',
      impact: episodeScore - 40,
      explanation: `Episode pattern detected (score ${episodeScore})`,
      confidence: episodePattern?.confidence || 75,
    });
  }

  // Publication decision
  const publicationDecision = decidePublication(
    overallScore,
    contentType,
    input.isEmbeddable ?? true,
    input.channelTrust || 'pending',
    hardRejectionReasons,
    config
  );

  const isFullMovieCandidate =
    contentType === 'movie' &&
    overallScore >= 60 &&
    (input.durationSeconds / 60) >= (input.minMovieDurationMinutes || 45);

  return {
    contentType,
    confidence: overallScore,
    overallScore,
    scoringDimensions: dimensions,
    scoreReasons,
    evidenceList: [],
    isFullMovieCandidate,
    publicationDecision,
  };
}
