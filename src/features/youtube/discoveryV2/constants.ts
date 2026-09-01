/**
 * OrangeFlix Discovery V2 — Constants & Configuration
 * Centralized configuration for scoring, thresholds, weights, and cache TTLs
 */

import { ScoringConfig } from './types';

/**
 * CRITICAL: These are the PRIMARY publication thresholds
 * Override ALL other scoring logic
 */
export const DISCOVERY_V2_SCORING_CONFIG: ScoringConfig = {
  // ========================================================================
  // PRIMARY PUBLICATION THRESHOLDS (0-100 scale)
  // ========================================================================
  AUTO_REJECT_THRESHOLD: 35, // <35 → REJECTED
  PENDING_REVIEW_LOWER: 35, // 35–75 → PENDING_REVIEW
  PENDING_REVIEW_UPPER: 75, //
  AUTO_PUBLISH_THRESHOLD: 76, // ≥76 → PUBLISHED

  // ========================================================================
  // SCORING WEIGHTS (must sum to 1.0)
  // Recommended initial allocation from spec
  // ========================================================================
  weights: {
    countryScore: 0.25, // How well does content match target country?
    contentTypeScore: 0.12, // Overall content type confidence
    movieScore: 0.15, // Probability this is a full movie
    seriesScore: 0.1, // Probability this is part of a series
    episodeScore: 0.1, // Probability this is an episode
    seasonScore: 0.05, // Season number confidence
    channelScore: 0.15, // Channel trust and quality
    qualityScore: 0.08, // Metadata quality, video quality
    metadataScore: 0.0, // (folded into quality)
    freshnessScore: 0.0, // (optional, folded into quality)
    duplicateScore: 0.0, // (not used in final score, informs decision)
  },

  // ========================================================================
  // SERIES & EPISODE CONFIDENCE MINIMUMS
  // ========================================================================
  // To auto-publish as an episode, seriesConfidence must meet this threshold
  SERIES_CONFIDENCE_MIN_FOR_PUBLISH: 80, // 0-100

  // Episode number confidence minimum for auto-publication
  EPISODE_CONFIDENCE_MIN_FOR_PUBLISH: 80, // 0-100

  // ========================================================================
  // CHANNEL TRUST THRESHOLDS
  // ========================================================================
  CHANNEL_AUTO_REJECT_THRESHOLD: 35, // channelTrustScore < 35
  CHANNEL_PENDING_THRESHOLD: 75, // 35–75: pending
  CHANNEL_AUTO_TRUST_THRESHOLD: 90, // ≥90: eligible (but requires historical evidence)

  // ========================================================================
  // EPISODE MATCHING THRESHOLDS
  // ========================================================================
  // Minimum similarity to match episodes to an existing series
  EPISODE_TITLE_SIMILARITY_THRESHOLD: 0.85, // 0–1.0, Jaro-Winkler or similar

  // Minimum confidence to link a candidate to a series
  EPISODE_SERIES_MATCH_THRESHOLD: 0.75, // 0–1.0

  // ========================================================================
  // CACHE TTLs (in days)
  // ========================================================================
  QUERY_CACHE_TTL: {
    movie: 7, // Movie queries can be older
    series: 5, // Series queries slightly fresher
    episode: 3, // Episode queries more frequent
    ecosystem: 2, // Channel/actor queries update faster
    channel: 2, // Channel uploads
    custom: 3, // Admin-created queries
  },

  METADATA_CACHE_TTL: 14, // How long to reuse video/channel metadata before refreshing

  CHANNEL_CACHE_TTL: 7, // How long to cache channel trust scores

  // ========================================================================
  // VERSIONING
  // ========================================================================
  VERSION: '2.0.0',
};

/**
 * Hard rejection signals that ALWAYS prevent auto-publication
 * These override score completely
 */
export const HARD_REJECTION_SIGNALS = [
  'not_embeddable',
  'channel_rejected',
  'detected_trailer',
  'detected_teaser',
  'detected_clip',
  'detected_interview',
  'detected_music_video',
  'detected_reaction',
  'detected_review',
  'detected_news_only',
  'obvious_spam',
  'country_conflict_strong',
  'series_episode_mismatch_strong',
] as const;

/**
 * Positive hard signals that can increase confidence
 */
export const HARD_POSITIVE_SIGNALS = [
  'trusted_channel',
  'exact_series_match',
  'embeddable',
  'official_source',
  'high_engagement_ratio',
] as const;

// ============================================================================
// SCORING CONSTANTS
// ============================================================================

/**
 * Duration thresholds for movie classification
 */
export const DURATION_THRESHOLDS = {
  VERY_SHORT: 2 * 60, // 2 min
  SHORT: 10 * 60, // 10 min
  SHORT_FILM: 30 * 60, // 30 min
  MEDIUM: 45 * 60, // 45 min
  FEATURE: 60 * 60, // 60 min
  LONG_FEATURE: 120 * 60, // 120 min
  VERY_LONG: 180 * 60, // 180 min (2–3 hours)
};

/**
 * Movie classification score impacts
 */
export const MOVIE_SCORE_IMPACTS = {
  // Duration-based
  DURATION_60_PLUS: +35,
  DURATION_45_TO_59: +20,
  DURATION_UNDER_45: -25,
  DURATION_SHORTS: -50,

  // Terminology
  FULL_MOVIE_TITLE: +25,
  FULL_FILM_TITLE: +25,
  COUNTRY_FULL_FILM_PHRASE: +25,
  COUNTRY_CINEMA_TERM: +20,
  MOVIE_CATEGORY: +10,

  // Negative
  TRAILER_DETECTED: -50,
  TEASER_DETECTED: -50,
  CLIP_DETECTED: -40,
  INTERVIEW_DETECTED: -30,
  MUSIC_VIDEO: -25,
  SHORTS_FORMAT: -50,
  NEWS_FORMAT: -20,
};

/**
 * Episode classification score impacts
 */
export const EPISODE_SCORE_IMPACTS = {
  // Pattern matches
  SEASON_EPISODE_CODE: +30, // S01E01
  SEASON_NUMBER: +20,
  EPISODE_NUMBER: +25,
  EPISODE_KEYWORD: +15,

  // Negative signals
  TRAILER_INDICATOR: -50,
  CLIP_INDICATOR: -40,
  REVIEW_INDICATOR: -25,
  REACTION_INDICATOR: -30,
  MUSIC_INDICATOR: -25,

  // Series match
  SERIES_TITLE_MATCH: +25,
  SERIES_CHANNEL_MATCH: +20,
  UPLOAD_SEQUENCE_MATCH: +15,
};

/**
 * Series classification score impacts
 */
export const SERIES_SCORE_IMPACTS = {
  SERIES_KEYWORD: +20,
  SEASON_KEYWORD: +15,
  CONSISTENT_CHANNEL: +20,
  MULTIPLE_EPISODES_KNOWN: +25,
  EPISODIC_DESCRIPTION: +20,
  TV_CATEGORY: +10,
};

/**
 * Country detection score impacts
 */
export const COUNTRY_SCORE_IMPACTS = {
  // Strong positive
  CHANNEL_COUNTRY_MATCH: +30,
  COUNTRY_DEMONYM: +25,
  COUNTRY_OFFICIAL_NAME: +20,
  LOCAL_LANGUAGE: +25,
  LOCAL_CINEMA_TERM: +20,
  PRODUCTION_COMPANY: +20,
  KNOWN_ACTOR: +15,
  KNOWN_DIRECTOR: +15,

  // Moderate positive
  COUNTRY_IN_TITLE: +10,
  COUNTRY_IN_DESCRIPTION: +10,
  CITY_NAME: +10,

  // Negative
  CONFLICTING_COUNTRY: -30,
  DIFFERENT_REGION: -20,
  OTHER_LANGUAGE: -15,
};

/**
 * Channel trust score impacts (on channelScore dimension)
 */
export const CHANNEL_SCORE_IMPACTS = {
  ADMINISTRATOR_APPROVED: +40,
  TRUSTED_CHANNEL: +20,
  CONSISTENT_QUALITY: +15,
  HIGH_ACCEPTANCE_RATE: +10,
  VERIFIED_ACCOUNT: +10,
  OFFICIAL_ACCOUNT: +15,
  CHANNEL_PENDING: 0,
  LOW_ACCEPTANCE_RATE: -20,
  CHANNEL_REJECTED: -50,
  SPAM_INDICATORS: -50,
};

/**
 * Quality score impacts
 */
export const QUALITY_SCORE_IMPACTS = {
  HD_RESOLUTION: +10,
  GOOD_DESCRIPTION: +10,
  HAS_TAGS: +5,
  GOOD_METADATA: +10,
  HIGH_ENGAGEMENT: +10,
  RECENT_UPLOAD: +10,

  POOR_METADATA: -10,
  MISLEADING_TITLE: -15,
  SUSPICIOUS_METADATA: -20,
};

/**
 * Duplicate detection thresholds
 */
export const DUPLICATE_THRESHOLDS = {
  // Exact match criteria (likely same episode)
  SAME_VIDEO_ID: 100, // Obviously same
  SAME_SERIES_SEASON_EPISODE: 95, // Same series, season, episode
  SAME_SERIES_EPISODE_WITHIN_24H: 90, // Same episode uploaded same day

  // Probable duplicate
  SERIES_EPISODE_MATCH_STRONG_METADATA: 85,
  TITLE_SIMILARITY_HIGH: 0.9, // 90% similar
  DURATION_WITHIN_5_PERCENT: 0.95,

  // Possible duplicate (review)
  TITLE_SIMILARITY_MEDIUM: 0.75, // 75% similar
  SERIES_EPISODE_MATCH_MEDIUM: 70,

  // Not a duplicate
  UNLIKELY_DUPLICATE: 0.5, // 50% similar or less
};

// ============================================================================
// KEYWORD & QUERY CONSTANTS
// ============================================================================

/**
 * Minimum keyword requirements per country
 */
export const KEYWORD_MINIMUMS = {
  movie_terms: 40,
  series_terms: 40,
  episode_terms: 40,
  season_terms: 20,
  full_content_terms: 20,
  negative_exclusions: 20,
  genre_keywords: 10,
  local_cinema_terms: 10,
};

/**
 * Query tier definitions
 */
export const QUERY_TIERS = {
  TIER_1: {
    name: 'Highest Signal',
    description: 'Exact content intent + country',
    weight: 1.0,
    frequency: 'every_scan',
  },
  TIER_2: {
    name: 'Local Cinema',
    description: 'Country + cinema terms',
    weight: 0.9,
    frequency: 'every_scan',
  },
  TIER_3: {
    name: 'Language-Based',
    description: 'Local language + content type',
    weight: 0.8,
    frequency: 'every_2nd_scan',
  },
  TIER_4: {
    name: 'Genre-Based',
    description: 'Country + genre',
    weight: 0.7,
    frequency: 'every_2nd_scan',
  },
  TIER_5: {
    name: 'Series-Focused',
    description: 'Series title + episode',
    weight: 0.8,
    frequency: 'every_scan',
  },
  TIER_6: {
    name: 'Channel-Based',
    description: 'Trusted channel + ecosystem',
    weight: 0.9,
    frequency: 'every_scan',
  },
} as const;

/**
 * Episode number pattern regex patterns
 */
export const EPISODE_PATTERNS = {
  // S01E01 format
  SEASON_EPISODE_CODE: [
    /[Ss](\d{1,2})[Ee](\d{1,2})/,
    /[Ss](\d{1,2})\s*[Ee](\d{1,2})/,
    /[Ss](\d{1,2})-[Ee](\d{1,2})/,
    /[Ss](\d{1,2})\/[Ee](\d{1,2})/,
  ],

  // Season 1 Episode 1 format
  SEASON_EPISODE_WORDS: [
    /[Ss]eason\s+([Oo]ne|[Tt]wo|[Tt]hree|[Ff]our|[Ff]ive|\d{1,2})\s+[Ee]pisode\s+([Oo]ne|[Tt]wo|[Tt]hree|[Ff]our|[Ff]ive|\d{1,2})/,
    /[Ss]eason\s+(\d{1,2})\s+[Ee]pisode\s+(\d{1,2})/,
    /[Ss]eason\s+(\d{1,2})\s+[Ee]p\s+(\d{1,2})/,
    /[Ss]eries\s+(\d{1,2})\s+[Ee]pisode\s+(\d{1,2})/,
  ],

  // Episode N format
  EPISODE_SIMPLE: [
    /[Ee]pisode\s+([Oo]ne|[Tt]wo|[Tt]hree|[Ff]our|[Ff]ive|\d{1,3})/,
    /[Ee]p(?:isode)?\s+(\d{1,3})/,
    /[Ee]p\.?\s+(\d{1,3})/,
    /[Ee](\d{1,3})/,
  ],

  // Part N format
  PART_FORMAT: [
    /[Pp]art\s+([Oo]ne|[Tt]wo|[Tt]hree|[Ff]our|[Ff]ive|\d{1,3})/,
    /[Pp]art\s+(\d{1,3})/,
  ],

  // Alternative format (1x01, 1 x 01, etc)
  ALTERNATIVE_FORMAT: [
    /(\d{1,2})x(\d{1,2})/,
    /(\d{1,2})\s+x\s+(\d{1,2})/,
    /(\d{1,2})X(\d{1,2})/,
  ],
};

/**
 * Language codes and associated cinema terminology
 */
export const LANGUAGE_CINEMA_TERMS: Record<string, { movie: string[]; series: string[]; episode: string[] }> = {
  en: {
    movie: ['movie', 'film', 'full movie', 'full film', 'cinema', 'feature'],
    series: ['series', 'TV series', 'television series', 'show', 'drama series'],
    episode: ['episode', 'ep', 'full episode', 'season', 'TV episode'],
  },
  sw: {
    movie: ['filamu', 'filamu kamili', 'sinema', 'film'],
    series: ['show', 'series', 'safu ya TV'],
    episode: ['sehemu', 'episode', 'safu'],
  },
  rw: {
    movie: ['filime', 'filime nyose', 'filime nyarwanda', 'sinema'],
    series: ['filime z\'uruhererekane', 'seriya', 'show'],
    episode: ['filime', 'sehemu'],
  },
  yo: {
    movie: ['fiimu', 'aworan', 'iyawo itusile'],
    series: ['fiimu ologbojo', 'series'],
    episode: ['akoko', 'episode'],
  },
};

// ============================================================================
// FIRESTORE COLLECTION NAMES
// ============================================================================

export const FIRESTORE_COLLECTIONS = {
  GEO_CONTENT: 'geoContent',
  GEO_SERIES: 'geoSeries',
  GEO_SEASONS: 'geoSeasons',
  GEO_EPISODES: 'geoEpisodes',
  TRUSTED_CHANNELS: 'trustedChannels',
  VIDEO_INDEX: 'videoIndex',
  DISCOVERY_CACHE: 'discoveryCache',
  DISCOVERY_RUNS: 'discoveryRuns',
  QUERY_STATS: 'queryStats',
  DISCOVERY_FEEDBACK: 'discoveryFeedback',
  CUSTOM_QUERIES: 'customQueries',
  SYSTEM_META: 'system_meta', // Contains auto_discovery, discovery_lock, etc
} as const;

// ============================================================================
// ADMIN CONFIGURATION
// ============================================================================

/**
 * Auto-trust channel requirements
 * A channel must meet ALL of these before becoming automatically trusted
 */
export const AUTO_TRUST_REQUIREMENTS = {
  MIN_TRUST_SCORE: 90, // channelTrustScore >= 90
  MIN_DISCOVERY_RUNS: 2, // Evaluated across at least 2 discovery runs
  MIN_QUALIFYING_ITEMS: 3, // At least 3 qualifying videos
  MIN_COUNTRY_CONSISTENCY: 85, // Country match >= 85
  MAX_REJECTION_RATE: 0.2, // No more than 20% rejected
  NO_HARD_REJECTIONS: true, // Zero hard rejections allowed
};

/**
 * Migration configuration
 */
export const MIGRATION_CONFIG = {
  PRESERVE_V1_FIELDS: true,
  ADD_V2_DEFAULTS: true,
  V1_CLASSIFIER_VERSION: '1.0.0',
  V2_CLASSIFIER_VERSION: '2.0.0',
};
