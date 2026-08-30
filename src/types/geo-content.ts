/**
 * OrangeFlix Geo-Located YouTube Cinema Discovery Data Model
 * Conforms strictly to specifications in Sections 1, 4, 6, 9, 14.
 */

export type GeoContentType =
  | 'movie'
  | 'series'
  | 'episode'
  | 'trailer'
  | 'clip'
  | 'interview'
  | 'music'
  | 'unknown';

export type ChannelTrust = 'approved' | 'pending' | 'rejected';

export type GeoContentStatus = 'published' | 'pending_review' | 'rejected' | 'unavailable';
export type ModerationStatus = 'approved' | 'pending_review' | 'rejected';

export interface ChannelScanStats {
  fetched: number;
  qualifying: number;
  indexed: number;
  published: number;
  skipped: number;
  status: 'success' | 'failed' | 'scanning' | 'idle';
  errorMessage?: string;
  scannedAt: string;
}

export interface CustomCountryQuery {
  id: string;
  countryCode: string;
  query: string;
  type: 'movie' | 'series';
  enabled: boolean;
  isDefault?: boolean;
  createdAt?: string;
}

export interface TrustedChannel {
  channelId: string;
  channelTitle: string;
  country: string; // e.g. "RW"
  countryCode?: string; // alias
  trust: ChannelTrust;
  approved?: boolean;
  trustLevel?: 'trusted' | 'review' | 'blocked';
  autoPublishMovies: boolean;
  autoPublishSeries: boolean;
  approvedBy?: string;
  approvedAt?: string;
  notes?: string;
  customUrl?: string;
  thumbnailUrl?: string;
  indexedVideosCount?: number;
  lastScanAt?: string;
  lastScanStatus?: 'success' | 'failed' | 'scanning' | 'idle';
  lastScanStats?: ChannelScanStats;
  createdAt: string;
  updatedAt: string;
}

export interface GeoContentItem {
  id: string; // Unique YouTube Video ID

  youtubeVideoId: string;
  youtubeChannelId: string;
  channelId?: string; // alias
  youtubeUrl: string;

  title: string;
  slug: string;
  description: string;

  thumbnail: string;
  thumbnailUrl?: string; // alias
  channelTitle: string;

  durationSeconds: number;
  durationFormatted: string;

  views: number;
  viewCount?: number; // alias
  likes?: number;
  likeCount?: number; // alias

  publishedAt: string;

  country: string; // "RW"
  countryCode?: string; // alias
  language?: string; // "rw"

  classification: GeoContentType;
  type?: GeoContentType; // alias
  contentType?: GeoContentType; // alias

  score: number;
  classificationScore?: number; // alias
  countryScore: number;
  classificationConfidence: number; // 0.0 - 1.0
  classificationReasons?: string[]; // explainability (Section 6)

  channelTrust: ChannelTrust;
  rightsVerified: boolean; // default false (Section 13)

  status: GeoContentStatus;
  moderationStatus?: ModerationStatus; // alias (Section 9)

  isFullMovieCandidate: boolean;
  isEmbeddable: boolean;
  embeddable?: boolean; // alias (Section 8)
  isSyndicated?: boolean;
  youtubeLicense?: string;
  source?: 'youtube';

  genre?: string;
  tags: string[];
  lastCheckedAt: string;
  discoveredAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface GeoCountryConfig {
  countryCode: string;
  name: string;
  nativeName: string;
  flagEmoji: string;
  languages: string[];
  defaultLanguage: string;
  region: string;
  movieQueries: string[];
  seriesQueries: string[];
  trustedChannelIds?: string[];
  popularCategories?: string[];
  popularSearchSuggestions?: string[];
  minMovieDurationMinutes: number;
  enabled: boolean;
}

export interface ClassificationResult {
  contentType: GeoContentType;
  isFullMovieCandidate: boolean;
  confidence: number;
  score: number;
  countryScore: number;
  positiveMatches: string[];
  negativeMatches: string[];
  classificationReasons: string[];
}

export interface YouTubeVideoMetadata {
  videoId: string;
  channelId: string;
  channelTitle: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  publishedAt: string;
  durationIso: string;
  durationSeconds: number;
  durationFormatted: string;
  viewCount: number;
  likeCount?: number;
  isEmbeddable: boolean;
  isSyndicated?: boolean;
  license?: string;
  tags: string[];
  categoryId?: string;
}

export interface YouTubeChannelMetadata {
  channelId: string;
  channelTitle: string;
  description: string;
  customUrl?: string;
  thumbnailUrl: string;
  country?: string;
  publishedAt: string;
  subscriberCount?: number;
  videoCount?: number;
}

export interface DiscoveryStats {
  queriesRun: number;
  youtubeResults: number;
  uniqueVideos: number;
  metadataFetched: number;
  channelsFetched: number;

  movies: number;
  series: number;
  episodes: number;
  trailers: number;
  clips: number;
  rejected: number;

  pendingChannels: number;
  approvedChannelVideos: number;
  publishedMovies: number;
  publishedSeries: number;

  firestoreWrites: number;

  errors: Array<{
    stage: string;
    message: string;
  }>;
}

export interface DiscoverySummaryLog {
  id: string;
  countryCode: string;
  lastDiscoveryAt: string;
  queriesRun: string[];
  stats: DiscoveryStats;
  apiStatus: 'healthy' | 'quota_exhausted' | 'no_key' | 'error';
  errorMessage?: string;
}

export interface GeoContentFilter {
  countryCode: string;
  contentType?: GeoContentType | 'all';
  isFullMovieCandidate?: boolean;
  searchQuery?: string;
  channelId?: string;
  status?: GeoContentStatus | 'all';
  moderationStatus?: ModerationStatus | 'all';
  channelTrust?: ChannelTrust;
  durationRange?: 'all' | 'under_20' | '20_45' | '45_90' | '90_plus' | 'under_30' | '30_60' | '60_90';
  sortBy?: 'popular' | 'latest' | 'score' | 'duration';
  page?: number;
  limit?: number;
}
