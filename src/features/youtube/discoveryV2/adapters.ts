/**
 * OrangeFlix Discovery V2 — Adapters & Compatibility Layer
 * Bridges existing V1 code with new V2 system
 * Allows gradual migration without breaking existing functionality
 */

import { GeoContentItem, TrustedChannel, ClassificationResult as V1ClassificationResult } from '@/types/geo-content';
import {
  GeoContentItemV2,
  TrustedChannelV2,
  ClassificationResult as V2ClassificationResult,
  ScoringDimensions,
} from './types';
import {
  normalizeScore,
  clamp,
  daysSince,
} from './utils';

/**
 * Convert V1 GeoContentItem to V2 GeoContentItemV2
 * Preserves all V1 data and initializes V2 fields with safe defaults
 */
export function adaptV1ContentToV2(v1: GeoContentItem): GeoContentItemV2 {
  const now = new Date();

  // Map V1 classification to dimensions
  const dimensions: ScoringDimensions = {
    countryScore: v1.countryScore || 0,
    contentTypeScore: v1.classificationConfidence * 100,
    movieScore: v1.isFullMovieCandidate ? 75 : 25,
    seriesScore: v1.classification === 'series' ? 70 : 20,
    episodeScore: v1.classification === 'episode' ? 70 : 20,
    seasonScore: 0,
    channelScore: v1.channelTrust === 'approved' ? 80 : v1.channelTrust === 'pending' ? 50 : 20,
    qualityScore: 50,
    metadataScore: 0,
    freshnessScore: daysSince(new Date(v1.publishedAt)) < 30 ? 75 : 25,
    duplicateScore: 0,
  };

  return {
    // V1 Core Fields (Preserved)
    id: v1.id,
    youtubeVideoId: v1.youtubeVideoId,
    youtubeChannelId: v1.youtubeChannelId,
    youtubeUrl: v1.youtubeUrl,
    title: v1.title,
    slug: v1.slug,
    description: v1.description,
    thumbnail: v1.thumbnail,
    channelTitle: v1.channelTitle,
    durationSeconds: v1.durationSeconds,
    durationFormatted: v1.durationFormatted,
    views: v1.views,
    publishedAt: v1.publishedAt,
    country: v1.country,
    language: v1.language,
    tags: v1.tags,
    isEmbeddable: v1.isEmbeddable,
    isFullMovieCandidate: v1.isFullMovieCandidate,
    rightsVerified: v1.rightsVerified,
    status: v1.status,
    lastCheckedAt: v1.lastCheckedAt,
    discoveredAt: v1.discoveredAt,
    createdAt: v1.createdAt,
    updatedAt: v1.updatedAt,

    // V1 Scoring (Preserved)
    score: v1.score,
    countryScore: v1.countryScore,
    classificationConfidence: v1.classificationConfidence,

    // V1 Classification
    classification: v1.classification,
    channelTrust: v1.channelTrust,

    // V2 Enhanced Scoring
    overallScore: clamp(Math.round(v1.score), 0, 100),
    scoringDimensions: dimensions,
    scoreReasons: (v1.classificationReasons || []).map((reason, idx) => ({
      type: 'other' as const,
      field: 'classification',
      value: v1.classification,
      impact: 0,
      explanation: reason,
      confidence: 60,
    })),
    evidenceReasons: [],

    // V2 Series/Episode Info (Unknown from V1)
    seriesId: undefined,
    seasonId: undefined,
    seasonNumber: undefined,
    episodeNumber: undefined,
    episodeTitle: undefined,
    seriesConfidence: undefined,
    episodeConfidence: undefined,

    // V2 Versioning
    classifierVersion: '1.0.0',
    discoveryVersion: '1.0.0',
    lastAnalyzedAt: new Date(v1.lastCheckedAt),

    // V2 Discovery Memory
    discoveredByQueries: [],
    discoveryRuns: [],
    firstDiscoveredAt: new Date(v1.discoveredAt),

    // V2 Relationship Info
    metadataHash: undefined,
    isDuplicate: false,
    duplicateOf: undefined,
    duplicateConfidence: undefined,
    canonicalVideoId: v1.youtubeVideoId,

    // V2 Geo Analysis
    geoConflict: false,
    countryCandidates: v1.country
      ? [
          {
            countryCode: v1.country,
            confidence: v1.countryScore,
            evidence: v1.classificationReasons || [],
          },
        ]
      : [],
    detectedLanguages: v1.language
      ? [
          {
            code: v1.language,
            confidence: 60,
            evidence: ['detected from metadata'],
          },
        ]
      : [],

    // V2 Publication
    publicationDecision: undefined,

    // V2 Admin
    moderationStatus: 'pending_review' as const,
  };
}

/**
 * Convert V2 GeoContentItemV2 back to V1 GeoContentItem
 * Lossy conversion - only V1 fields are preserved
 * Used when old code needs to consume V2 data
 */
export function adaptV2ContentToV1(v2: GeoContentItemV2): GeoContentItem {
  return {
    id: v2.id,
    youtubeVideoId: v2.youtubeVideoId,
    youtubeChannelId: v2.youtubeChannelId || '',
    youtubeUrl: v2.youtubeUrl,
    title: v2.title,
    slug: v2.slug,
    description: v2.description,
    thumbnail: v2.thumbnail,
    channelTitle: v2.channelTitle,
    durationSeconds: v2.durationSeconds,
    durationFormatted: v2.durationFormatted,
    views: v2.views,
    publishedAt: v2.publishedAt,
    country: v2.country,
    language: v2.language,
    tags: v2.tags,
    classification: v2.classification,
    score: v2.score || v2.overallScore,
    countryScore: v2.countryScore,
    classificationConfidence: v2.classificationConfidence,
    classificationReasons: v2.scoreReasons.map(r => r.explanation),
    channelTrust: v2.channelTrust,
    rightsVerified: v2.rightsVerified,
    isFullMovieCandidate: v2.isFullMovieCandidate,
    isEmbeddable: v2.isEmbeddable,
    status: v2.status,
    lastCheckedAt: v2.lastAnalyzedAt?.toISOString() || new Date().toISOString(),
    discoveredAt: v2.firstDiscoveredAt?.toISOString() || v2.discoveredAt,
    createdAt: v2.createdAt,
    updatedAt: v2.updatedAt,
  };
}

/**
 * Convert V1 TrustedChannel to V2 TrustedChannelV2
 */
export function adaptV1ChannelToV2(v1: TrustedChannel): TrustedChannelV2 {
  return {
    // V1 Core Fields
    channelId: v1.channelId,
    channelTitle: v1.channelTitle,
    country: v1.country,
    trust: v1.trust,
    autoPublishMovies: v1.autoPublishMovies,
    autoPublishSeries: v1.autoPublishSeries,
    notes: v1.notes,
    createdAt: v1.createdAt,
    updatedAt: v1.updatedAt,

    // V2 Trust Analysis
    channelTrustScore: v1.trust === 'approved' ? 85 : v1.trust === 'pending' ? 50 : 20,
    countryScore: 70,
    contentQualityScore: 50,

    // V2 Historical Accuracy
    historicalAccuracy: 60,
    totalAnalyzed: 0,
    acceptedCount: 0,
    rejectedCount: 0,

    // V2 Content Stats
    moviesFound: 0,
    seriesFound: 0,
    episodesFound: 0,

    // V2 Scan Tracking
    discoveryPriority: v1.trust === 'approved' ? 'high' : 'normal',
    lastScannedAt: v1.lastScanAt ? new Date(v1.lastScanAt) : undefined,
    nextRecommendedScanAt: undefined,
    scanStatus: 'idle' as const,
    lastScanErrorMessage: undefined,

    // V2 Versioning
    classifierVersion: '1.0.0',
    discoveryVersion: '1.0.0',
  };
}

/**
 * Convert V2 TrustedChannelV2 back to V1 TrustedChannel
 */
export function adaptV2ChannelToV1(v2: TrustedChannelV2): TrustedChannel {
  return {
    channelId: v2.channelId,
    channelTitle: v2.channelTitle,
    country: v2.country,
    trust: v2.trust,
    approved: v2.trust === 'approved',
    autoPublishMovies: v2.autoPublishMovies,
    autoPublishSeries: v2.autoPublishSeries,
    notes: v2.notes,
    createdAt: v2.createdAt,
    updatedAt: v2.updatedAt,
  };
}

/**
 * Convert V2 ClassificationResult to V1 ClassificationResult
 */
export function adaptV2ClassificationToV1(v2: V2ClassificationResult): V1ClassificationResult {
  return {
    contentType: v2.contentType,
    isFullMovieCandidate: v2.isFullMovieCandidate,
    confidence: v2.confidence,
    score: v2.overallScore,
    countryScore: v2.scoringDimensions.countryScore,
    positiveMatches: v2.scoreReasons
      .filter(r => r.impact > 0)
      .map(r => r.explanation),
    negativeMatches: v2.scoreReasons
      .filter(r => r.impact < 0)
      .map(r => r.explanation),
  };
}

/**
 * Convert V1 ClassificationResult to V2 ClassificationResult
 */
export function adaptV1ClassificationToV2(v1: V1ClassificationResult): Partial<V2ClassificationResult> {
  const dimensions: ScoringDimensions = {
    countryScore: v1.countryScore,
    contentTypeScore: v1.confidence,
    movieScore: v1.isFullMovieCandidate ? 75 : 25,
    seriesScore: v1.contentType === 'series' ? 70 : 20,
    episodeScore: v1.contentType === 'episode' ? 70 : 20,
    seasonScore: 0,
    channelScore: 50,
    qualityScore: 50,
    metadataScore: 0,
    freshnessScore: 0,
    duplicateScore: 0,
  };

  return {
    contentType: v1.contentType,
    confidence: v1.confidence,
    overallScore: v1.score,
    scoringDimensions: dimensions,
    scoreReasons: [
      ...(v1.positiveMatches || []).map(m => ({
        type: 'other' as const,
        impact: 10,
        explanation: m,
        confidence: 70,
      })),
      ...(v1.negativeMatches || []).map(m => ({
        type: 'other' as const,
        impact: -10,
        explanation: m,
        confidence: 70,
      })),
    ],
    evidenceReasons: [],
    isFullMovieCandidate: v1.isFullMovieCandidate,
  };
}

/**
 * Merge V1 and V2 scoring for comparison
 * Useful for A/B testing during transition
 */
export interface ScoringComparison {
  v1Score: number;
  v2Score: number;
  v1ContentType: string;
  v2ContentType: string;
  agreement: boolean;
  scoreDifference: number;
  typesMatch: boolean;
  recommendation: 'trust_v1' | 'trust_v2' | 'review_manually';
}

export function compareScoring(v1Content: GeoContentItem, v2Content: GeoContentItemV2): ScoringComparison {
  const scoreDiff = Math.abs(v1Content.score - v2Content.overallScore);
  const typesMatch = v1Content.classification === v2Content.classification;

  let recommendation: 'trust_v1' | 'trust_v2' | 'review_manually' = 'review_manually';

  // If scores and types agree, trust the result
  if (scoreDiff < 10 && typesMatch) {
    recommendation = 'trust_v2'; // V2 is more detailed
  }

  // If types disagree significantly, needs review
  if (!typesMatch && v2Content.episodeConfidence && v2Content.episodeConfidence < 70) {
    recommendation = 'review_manually';
  }

  return {
    v1Score: v1Content.score,
    v2Score: v2Content.overallScore,
    v1ContentType: v1Content.classification,
    v2ContentType: v2Content.classification,
    agreement: scoreDiff < 10 && typesMatch,
    scoreDifference: scoreDiff,
    typesMatch,
    recommendation,
  };
}

/**
 * Safety check: verify Firestore document is valid before writing
 */
export function validateFirestoreDocument(doc: Record<string, unknown>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check for undefined values (Firestore rejects these)
  for (const [key, value] of Object.entries(doc)) {
    if (value === undefined) {
      errors.push(`Field "${key}" is undefined`);
    }

    // Check nested objects
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      for (const [nestedKey, nestedValue] of Object.entries(value as Record<string, unknown>)) {
        if (nestedValue === undefined) {
          errors.push(`Field "${key}.${nestedKey}" is undefined`);
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Sanitize object for Firestore by removing undefined values
 */
export function sanitizeForFirestore<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) continue;

    if (typeof value === 'object' && value !== null && !Array.isArray(value) && !(value instanceof Date)) {
      result[key] = sanitizeForFirestore(value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }

  return result;
}
