/**
 * YouTube Discovery V2 — Command Center UI Types
 */

import { GeoContentItem, TrustedChannel } from '@/types/geo-content';
import { DiscoveryRun, GeoCountryConfigV2, GeoSeries, GeoEpisode } from '@/features/youtube/discoveryV2/types';
import { DiscoveryQueryStatItem } from '@/services/discovery-v2/queryStatsRepository';
import { DiscoveryOverviewMetrics } from '@/services/discovery-v2/metricsRepository';

export type DiscoveryAdminTab =
  | 'overview'
  | 'scanner'
  | 'content'
  | 'series'
  | 'episodes'
  | 'channels'
  | 'queries'
  | 'languages'
  | 'countries'
  | 'runs'
  | 'analytics'
  | 'quality'
  | 'quota'
  | 'errors'
  | 'search-lab'
  | 'settings';

export interface ContentFilterState {
  countryCode: string;
  status: 'all' | 'published' | 'pending_review' | 'rejected';
  contentType: 'all' | 'movie' | 'series' | 'episode' | 'trailer' | 'clip' | 'other';
  searchQuery: string;
  channelId?: string;
  minScore?: number;
  maxScore?: number;
  duplicateOnly?: boolean;
}

export interface InspectorModalState {
  isOpen: boolean;
  item: GeoContentItem | null;
}
