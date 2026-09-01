/**
 * OrangeFlix Discovery V2 — Type Definitions
 * Comprehensive type system for persistent, intelligent YouTube discovery
 * with series/episode resolution, evidence-based scoring, and incremental learning.
 */

// ============================================================================
// SCORING & EVIDENCE TYPES
// ============================================================================

/**
 * Individual scoring reason with evidence
 */
export interface ScoreReason {
  type:
    | 'title_pattern'
    | 'description_pattern'
    | 'duration'
    | 'channel_history'
    | 'language'
    | 'country_keyword'
    | 'episode_pattern'
    | 'season_pattern'
    | 'series_match'
    | 'production_company'
    | 'known_person'
    | 'category'
    | 'hard_negative'
    | 'hard_positive'
    | 'duplicate_match'
    | 'country_conflict'
    | 'metadata_quality'
    | 'freshness'
    | 'trusted_channel'
    | 'other';
  field?: string;
  value?: string;
  impact: number; // -100 to +100
  explanation: string;
  confidence: number; // 0-100
}

/**
 * Discovery evidence across multiple dimensions
 */
export interface DiscoveryEvidence {
  dimension:
    | 'country'
    | 'content_type'
    | 'movie'
    | 'series'
    | 'episode'
    | 'season'
    | 'channel'
    | 'quality'
    | 'duplicate'
    | 'rights'
    | 'metadata';
  source: string; // e.g., 'title', 'description', 'channel_country', 'series_knowledge'
  value: unknown;
  confidence: number; // 0-100
  timestamp: Date;
}

/**
 * Separate scoring dimensions, all normalized 0-100
 */
export interface ScoringDimensions {
  countryScore: number; // How well does content match the target country?
  contentTypeScore: number; // How confident is the content type classification?
  movieScore: number; // How likely is this a full movie?
  seriesScore: number; // How likely is this part of a series?
  episodeScore: number; // How likely is this an episode?
  seasonScore: number; // How confident is the season number?
  channelScore: number; // How trustworthy is the channel?
  qualityScore: number; // Overall metadata and video quality
  metadataScore: number; // Quality of available metadata
  freshnessScore: number; // Is content recent/active?
  duplicateScore: number; // Likelihood this is a duplicate/reupload
}

/**
 * Publication decision with detailed reasoning
 */
export interface PublicationDecision {
  status: 'published' | 'pending_review' | 'rejected';
  reason: string;
  overallScore: number; // 0-100, primary decision factor
  hardGateFailures: string[]; // e.g., ['not_embeddable', 'trailer_detected']
  thresholdDecision: 'auto_reject' | 'pending' | 'auto_publish';
  reasoning: string; // Human-readable explanation
  timestamp: Date;
}

// ============================================================================
// CONTENT CLASSIFICATION TYPES
// ============================================================================

export type GeoContentType =
  | 'movie'
  | 'series'
  | 'season'
  | 'episode'
  | 'trailer'
  | 'teaser'
  | 'clip'
  | 'interview'
  | 'music'
  | 'review'
  | 'reaction'
  | 'news'
  | 'short'
  | 'documentary'
  | 'unknown';

export type ChannelTrust = 'approved' | 'pending' | 'rejected';

export type GeoContentStatus = 'published' | 'pending_review' | 'rejected' | 'unavailable';
export type ModerationStatus = 'approved' | 'pending_review' | 'rejected';

/**
 * Episode pattern match result
 */
export interface EpisodePattern {
  type:
    | 'explicit_sne' // S01E01 format
    | 'season_episode' // Season 1 Episode 1
    | 'simple_number' // Episode 1
    | 'part_number' // Part 1
    | 'scattered' // Series Name Ep 5
    | 'unknown';
  seasonNumber: number | null;
  episodeNumber: number | null;
  confidence: number; // 0-100
  evidence: string[];
}

// ============================================================================
// SERIES & SEASON TYPES
// ============================================================================

/**
 * Series fingerprint for deduplication and matching
 */
export interface SeriesFingerprint {
  normalizedTitle: string;
  aliases: string[];
  channelIds: string[];
  countries: string[];
  languages: string[];
  actors: string[];
  productionCompanies: string[];
}

/**
 * Series entity in persistent storage
 */
export interface GeoSeries {
  seriesId: string; // UUID or stable hash
  canonicalTitle: string;
  normalizedTitle: string;
  aliases: string[];

  countryCodes: string[];
  languages: string[];
  channelIds: string[];

  description?: string;
  thumbnail?: string;

  status: 'active' | 'completed' | 'unknown' | 'pending_review';
  confidence: number; // 0-100

  seasonCount: number;
  episodeCount: number;
  knownSeasonNumbers: number[];

  firstDiscoveredAt: Date;
  lastSeenAt: Date;
  lastUpdatedAt: Date;

  searchAliases: string[];
  fingerprint: SeriesFingerprint;

  classificationVersion: string;
  discoveryVersion: string;

  // Metadata and relationships
  actors?: string[];
  directors?: string[];
  producers?: string[];
  productionCompanies?: string[];
  networks?: string[];
}

/**
 * Season within a series
 */
export interface GeoSeason {
  seasonId: string; // UUID or stable hash
  seriesId: string;
  seasonNumber: number | null; // null if unknown
  title?: string;

  episodeCount: number;
  knownEpisodeNumbers: number[];

  confidence: number; // 0-100

  firstDiscoveredAt: Date;
  lastSeenAt: Date;
  lastUpdatedAt: Date;

  classificationVersion: string;
}

/**
 * Episode within a season
 */
export interface GeoEpisode {
  episodeId: string; // UUID or stable hash
  seriesId: string;
  seasonId?: string;

  seasonNumber: number | null;
  episodeNumber: number | null;

  title: string;
  normalizedTitle: string;
  description?: string;

  videoIds: string[]; // Multiple uploads may represent the same episode
  canonicalVideoId?: string; // Preferred upload

  confidence: number; // 0-100
  evidenceReasons: ScoreReason[];

  firstDiscoveredAt: Date;
  lastSeenAt: Date;
  lastUpdatedAt: Date;

  classificationVersion: string;
}

// ============================================================================
// CACHE & PERSISTENCE TYPES
// ============================================================================

/**
 * Fast video index for deduplication
 */
export interface VideoIndex {
  videoId: string;

  firstSeenAt: Date;
  lastSeenAt: Date;

  countryCodes: string[];
  channelId: string;

  contentType?: GeoContentType;
  seriesId?: string;
  seasonNumber?: number | null;
  episodeNumber?: number | null;

  classifierVersion: string;
  metadataHash?: string;

  publicationStatus?: GeoContentStatus;
}

/**
 * Persistent query result cache
 */
export interface DiscoveryCache {
  queryHash: string;
  countryCode: string;
  query: string;

  queryType: 'movie' | 'series' | 'episode' | 'ecosystem' | 'channel' | 'custom';

  videoIds: string[];
  executedAt: Date;
  expiresAt: Date;

  resultCount: number;
  discoveryVersion: string;

  // Performance tracking
  cacheHitCount?: number;
  lastReuseAt?: Date;
}

/**
 * Discovery run history
 */
export interface DiscoveryRun {
  runId: string;
  mode: 'manual' | 'scheduled' | 'incremental';
  countryCodes: string[];

  startedAt: Date;
  completedAt?: Date;

  status: 'running' | 'completed' | 'partial' | 'quota_exhausted' | 'failed';

  // Execution stats
  queriesExecuted: number;
  cacheHits: number;
  cacheMisses: number;

  // Content stats
  candidatesFound: number;
  newVideos: number;
  updatedVideos: number;

  moviesFound: number;
  seriesFound: number;
  episodesFound: number;
  seasonsFound: number;

  published: number;
  pendingReview: number;
  rejected: number;

  // Error tracking
  quotaErrors: number;
  metadataErrors: number;
  firebaseErrors: number;

  summary?: string;
  errorLog?: string[];
}

/**
 * Discovery lock for preventing concurrent admin scans
 */
export interface DiscoveryLock {
  locked: boolean;
  runId?: string;
  lockedAt?: Date;
  lockedBy?: string; // admin UID
  expiresAt?: Date;
}

/**
 * Query performance statistics
 */
export interface QueryStats {
  queryHash: string;
  countryCode: string;
  query: string;
  queryType: 'movie' | 'series' | 'episode' | 'ecosystem' | 'channel' | 'custom';

  runs: number;
  lastRunAt?: Date;
  lastSuccessfulRunAt?: Date;

  candidateCount: number;
  qualifyingCount: number; // Passed hard gates
  publishedCount: number;
  pendingCount: number;
  rejectedCount: number;

  averageOverallScore: number;
  averageCountryScore: number;

  priorityScore: number; // Calculated from performance
  nextRunAt?: Date;
}

/**
 * Administrator feedback on classifications
 */
export interface DiscoveryFeedback {
  feedbackId: string;
  videoId: string;

  // Before/after corrections
  previousContentType?: GeoContentType;
  correctedContentType?: GeoContentType;

  previousCountry?: string;
  correctedCountry?: string;

  previousSeriesId?: string;
  correctedSeriesId?: string;

  previousSeasonNumber?: number | null;
  correctedSeasonNumber?: number | null;

  previousEpisodeNumber?: number | null;
  correctedEpisodeNumber?: number | null;

  reason?: string;
  createdAt: Date;
  adminUid: string;
}

// ============================================================================
// ENHANCED CONTENT ITEM (Extends existing GeoContentItem)
// ============================================================================

/**
 * Extended GeoContentItem with V2 fields
 * Maintains backward compatibility with V1
 */
export interface GeoContentItemV2 {
  // --- V1 Core Fields (Preserved for Compatibility) ---
  id: string;
  youtubeVideoId: string;
  youtubeChannelId: string;
  youtubeUrl: string;
  title: string;
  slug: string;
  description: string;
  thumbnail: string;
  channelTitle: string;
  durationSeconds: number;
  durationFormatted: string;
  views: number;
  publishedAt: string;
  country: string;
  language?: string;
  tags: string[];
  isEmbeddable: boolean;
  isFullMovieCandidate: boolean;
  rightsVerified: boolean;
  status: GeoContentStatus;
  lastCheckedAt: string;
  discoveredAt: string;
  createdAt: string;
  updatedAt: string;

  // --- V1 Scoring (Kept for Migration) ---
  score: number;
  countryScore: number;
  classificationConfidence: number;

  // --- V1 Classification ---
  classification: GeoContentType;
  channelTrust: ChannelTrust;

  // --- V2 Enhanced Scoring ---
  overallScore: number; // 0-100, PRIMARY decision factor
  scoringDimensions: ScoringDimensions;
  scoreReasons: ScoreReason[];
  evidenceReasons: DiscoveryEvidence[];

  // --- V2 Series/Episode Info ---
  seriesId?: string | null;
  seasonId?: string | null;
  seasonNumber?: number | null;
  episodeNumber?: number | null;
  episodeTitle?: string | null;
  seriesConfidence?: number; // 0-100, for episode certainty
  episodeConfidence?: number; // 0-100

  // --- V2 Versioning ---
  classifierVersion: string;
  discoveryVersion: string;
  lastAnalyzedAt?: Date;

  // --- V2 Discovery Memory ---
  discoveredByQueries?: string[];
  discoveryRuns?: string[]; // IDs of runs that discovered this
  firstDiscoveredAt?: Date;

  // --- V2 Relationship Info ---
  metadataHash?: string;
  isDuplicate?: boolean;
  duplicateOf?: string; // videoId if known duplicate
  duplicateConfidence?: number; // 0-100
  canonicalVideoId?: string; // Preferred if part of episode

  // --- V2 Geo Analysis ---
  geoConflict?: boolean;
  countryCandidates?: Array<{
    countryCode: string;
    confidence: number;
    evidence: string[];
  }>;
  detectedLanguages?: Array<{
    code: string;
    confidence: number;
    evidence: string[];
  }>;

  // --- V2 Publication ---
  publicationDecision?: PublicationDecision;

  // --- V2 Admin Tracking ---
  moderationStatus?: ModerationStatus;
}

// ============================================================================
// ENHANCED CHANNEL (Extends existing TrustedChannel)
// ============================================================================

export interface TrustedChannelV2 {
  // --- V1 Core Fields ---
  channelId: string;
  channelTitle: string;
  country: string;
  trust: ChannelTrust;
  autoPublishMovies: boolean;
  autoPublishSeries: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;

  // --- V2 Trust Analysis ---
  channelTrustScore: number; // 0-100, numeric confidence
  countryScore: number; // 0-100, how well does channel match country?
  contentQualityScore: number; // 0-100

  // --- V2 Historical Accuracy ---
  historicalAccuracy: number; // 0-100
  totalAnalyzed: number;
  acceptedCount: number;
  rejectedCount: number;

  // --- V2 Content Stats ---
  moviesFound: number;
  seriesFound: number;
  episodesFound: number;

  // --- V2 Scan Tracking ---
  discoveryPriority: 'high' | 'normal' | 'low' | 'paused';
  lastScannedAt?: Date;
  nextRecommendedScanAt?: Date;
  scanStatus: 'success' | 'failed' | 'scanning' | 'idle';
  lastScanErrorMessage?: string;

  // --- V2 Versioning ---
  classifierVersion: string;
  discoveryVersion: string;
}

// ============================================================================
// QUERY GENERATION TYPES
// ============================================================================

/**
 * Keyword set for a country
 */
export interface DiscoveryKeywordSet {
  movie: string[];
  series: string[];
  episode: string[];
  season: string[];
  fullContent: string[];
  genres: string[];
  negativeExclusions: string[];
  localCinema: string[];
}

/**
 * Language-specific keywords
 */
export interface LanguageKeywordSet {
  languageCode: string;
  movie: string[];
  series: string[];
  episode: string[];
  season: string[];
  cinema: string[];
}

/**
 * Generated query with metadata
 */
export interface GeneratedQuery {
  query: string;
  queryHash: string;
  countryCode: string;
  type: 'movie' | 'series' | 'episode' | 'ecosystem' | 'channel' | 'custom';
  tier: 1 | 2 | 3 | 4 | 5 | 6; // Priority level
  priorityScore: number; // 0-100
  language?: string;
  reason?: string;
}

/**
 * Enhanced country configuration with V2 discovery intelligence
 */
export interface GeoCountryConfigV2 {
  countryCode: string;
  name: string;
  nativeName: string;
  flagEmoji: string;

  demonym: string; // e.g., "Rwandan"
  adjective: string;

  languages: string[];
  defaultLanguage: string;
  region: string;

  // V2 Keyword Sets
  discoveryKeywords: DiscoveryKeywordSet;
  languageKeywords: LanguageKeywordSet[];

  // V1 Queries (Preserved for Migration)
  movieQueries: string[];
  seriesQueries: string[];

  // V1 Channel Whitelist
  trustedChannelIds?: string[];

  minMovieDurationMinutes: number;
  enabled: boolean;

  // V2 Cinema Intelligence
  cinemaTerms: string[];
  knownActors?: string[];
  knownDirectors?: string[];
  knownProducers?: string[];
  knownProductionCompanies?: string[];
  knownNetworks?: string[];
  knownChannels?: string[];
}

// ============================================================================
// SCORING CONFIGURATION
// ============================================================================

export interface ScoringConfig {
  // Thresholds
  AUTO_REJECT_THRESHOLD: number; // <35
  PENDING_REVIEW_LOWER: number; // 35
  PENDING_REVIEW_UPPER: number; // 75
  AUTO_PUBLISH_THRESHOLD: number; // >=76

  // Component weights (must sum to 1.0)
  weights: {
    countryScore: number;
    contentTypeScore: number;
    movieScore: number;
    seriesScore: number;
    episodeScore: number;
    seasonScore: number;
    channelScore: number;
    qualityScore: number;
    metadataScore: number;
    freshnessScore: number;
    duplicateScore: number;
  };

  // Series confidence minimums
  SERIES_CONFIDENCE_MIN_FOR_PUBLISH: number; // 80
  EPISODE_CONFIDENCE_MIN_FOR_PUBLISH: number; // 80

  // Channel trust thresholds
  CHANNEL_AUTO_REJECT_THRESHOLD: number; // <35
  CHANNEL_PENDING_THRESHOLD: number; // 35-75
  CHANNEL_AUTO_TRUST_THRESHOLD: number; // 90+

  // Episode matching
  EPISODE_TITLE_SIMILARITY_THRESHOLD: number; // 0.85
  EPISODE_SERIES_MATCH_THRESHOLD: number; // 0.75

  // Cache TTLs (in days)
  QUERY_CACHE_TTL: Record<string, number>; // queryType -> days
  METADATA_CACHE_TTL: number; // days
  CHANNEL_CACHE_TTL: number; // days

  // Scoring version
  VERSION: string;
}
