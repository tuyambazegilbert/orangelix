/**
 * OrangeFlix Discovery V2 — Analytics V2 Type Definitions
 */

import { GeoContentItem, TrustedChannel } from '@/types/geo-content';
import { DiscoveryProgressEvent, DiscoveryRun, GeoEpisode, GeoSeries } from '@/features/youtube/discoveryV2/types';
import { DiscoveryQueryStatItem } from '@/services/discovery-v2/queryStatsRepository';
import { DiscoveryOverviewMetrics } from '@/services/discovery-v2/metricsRepository';

export type AnalyticsTimeRange =
  | 'live'
  | '15m'
  | '1h'
  | '24h'
  | '7d'
  | '30d'
  | '90d'
  | 'all'
  | 'custom';

export type AnalyticsContentType =
  | 'all'
  | 'movie'
  | 'series'
  | 'episode'
  | 'trailer'
  | 'clip'
  | 'shorts'
  | 'documentary'
  | 'unknown';

export type AnalyticsStatus =
  | 'all'
  | 'published'
  | 'pending_review'
  | 'rejected'
  | 'failed';

export type AnalyticsChannelTrust = 'all' | 'verified' | 'trusted' | 'pending' | 'rejected' | 'blocked';

export interface AnalyticsFilterState {
  territories: string[]; // ['RW', 'UG'] or ['ALL']
  timeRange: AnalyticsTimeRange;
  customStartDate?: string;
  customEndDate?: string;
  contentTypes: AnalyticsContentType[];
  statuses: AnalyticsStatus[];
  languages: string[]; // ['rw', 'sw', 'lg'] or ['all']
  channels: string[]; // Channel IDs or ['all']
  channelTrust: AnalyticsChannelTrust;
  minScore: number;
  maxScore: number;
  searchQuery: string;
}

export type AnalyticsSubView =
  | 'overview'
  | 'live'
  | 'funnel'
  | 'territories'
  | 'languages'
  | 'queries'
  | 'scoring'
  | 'series'
  | 'channels'
  | 'quota'
  | 'errors'
  | 'saved_views';

export interface SavedAnalyticsView {
  id: string;
  name: string;
  description: string;
  filters: AnalyticsFilterState;
  createdAt: number;
  updatedAt: number;
  isDefault?: boolean;
}

export interface FunnelStageData {
  stage: string;
  name: string;
  count: number;
  conversionFromPrev: number; // 0-100%
  conversionFromStart: number; // 0-100%
  dropOffCount: number;
  dropOffPercent: number;
  color: string;
  description: string;
}

export interface TerritoryPerformanceItem {
  countryCode: string;
  countryName: string;
  flagEmoji: string;
  nativeName: string;
  totalCandidates: number;
  published: number;
  pending: number;
  rejected: number;
  avgScore: number;
  activeLanguagesCount: number;
  successRate: number; // published / total %
  moviesCount: number;
  seriesCount: number;
  episodesCount: number;
  trustedChannelsCount: number;
}

export interface LanguagePerformanceItem {
  code: string;
  name: string;
  flag?: string;
  searchesCount: number;
  candidatesCount: number;
  relevantCount: number;
  publishedCount: number;
  rejectedCount: number;
  avgScore: number;
  sharePercent: number;
  conversionRate: number; // published / candidates %
  efficiencyScore: number; // relative multiplier (e.g. 1.8x)
}

export interface QueryPerformanceMetric {
  query: string;
  countryCode: string;
  category: 'top_performer' | 'quota_waster' | 'movie_driver' | 'series_driver' | 'duplicate_heavy' | 'standard';
  runsCount: number;
  candidatesCount: number;
  relevantCount: number;
  publishedCount: number;
  rejectedCount: number;
  avgScore: number;
  efficiencyPercent: number; // published / candidates %
  lastRunAt?: string;
}

export interface ScoreBucketStat {
  range: string;
  label: string;
  count: number;
  percentage: number;
  color: string;
  status: 'rejected' | 'pending' | 'published';
}

export interface RejectionReasonStat {
  reason: string;
  label: string;
  count: number;
  percentage: number;
  color: string;
  description: string;
}

export interface SeriesCoverageItem {
  seriesId: string;
  seriesTitle: string;
  countryCode: string;
  seasonNumber: number;
  totalExpectedEpisodes: number;
  detectedEpisodesCount: number;
  detectedEpisodeNumbers: number[];
  missingEpisodeNumbers: number[];
  coveragePercent: number;
  channelTitle?: string;
  isComplete: boolean;
}

export interface ChannelPerformanceMetric {
  channelId: string;
  channelTitle: string;
  countryCode: string;
  trustScore: number;
  trustLevel: 'verified' | 'trusted' | 'pending' | 'rejected' | 'blocked';
  totalVideosDiscovered: number;
  relevantVideos: number;
  publishedVideos: number;
  rejectedVideos: number;
  duplicateVideos: number;
  avgVideoScore: number;
  publishRate: number;
  rejectionRate: number;
  seriesDiscoveredCount: number;
  episodesDiscoveredCount: number;
  lastScannedAt?: string;
}

export interface ApiQuotaObservabilityData {
  totalApiCalls: number;
  totalQuotaConsumed: number;
  dailyQuotaLimit: number; // 10,000 default
  quotaRemaining: number;
  quotaPercentUsed: number;
  searchListCalls: number;
  searchListUnits: number; // searchListCalls * 100
  videosListCalls: number;
  videosListUnits: number; // videosListCalls * 1
  channelsListCalls: number;
  channelsListUnits: number; // channelsListCalls * 1
  cacheHitsCount: number;
  cacheMissesCount: number;
  cacheHitRate: number;
  quotaUnitsSaved: number; // cacheHits * 100
  api429Errors: number;
  api5xxErrors: number;
  averageLatencyMs: number;
  costPerCandidate: number;
  costPerUsefulCandidate: number;
  costPerPublished: number;
}

export interface DrillDownTarget {
  type:
    | 'all_candidates'
    | 'published'
    | 'pending_review'
    | 'rejected'
    | 'movies'
    | 'series'
    | 'episodes'
    | 'territory'
    | 'language'
    | 'query'
    | 'channel'
    | 'score_bucket'
    | 'rejection_reason'
    | 'series_gap'
    | 'error_logs'
    | 'live_events';
  title: string;
  subtitle?: string;
  filterValue?: string | number;
  items?: GeoContentItem[];
  runs?: DiscoveryRun[];
  events?: DiscoveryProgressEvent[];
}

export interface DiscoveryAnalyticsProps {
  metrics: DiscoveryOverviewMetrics | null;
  contentItems?: GeoContentItem[];
  seriesList?: GeoSeries[];
  episodesList?: GeoEpisode[];
  channels?: TrustedChannel[];
  queries?: DiscoveryQueryStatItem[];
  runs?: DiscoveryRun[];
  liveLogs?: DiscoveryProgressEvent[];
  isScanning?: boolean;
  selectedCountry?: string;
  onSelectCountry?: (countryCode: string) => void;
  onInspectItem?: (item: GeoContentItem) => void;
  onTriggerScan?: (countryCode: string) => void;
  onNavigateTab?: (tab: string) => void;
}
