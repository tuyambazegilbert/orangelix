/**
 * OrangeFlix Discovery V2 — Analytics URL State Serialization & Deserialization
 */

import { AnalyticsFilterState, AnalyticsTimeRange, AnalyticsContentType, AnalyticsStatus, AnalyticsChannelTrust } from '../types';

export const DEFAULT_ANALYTICS_FILTERS: AnalyticsFilterState = {
  territories: ['ALL'],
  timeRange: 'all',
  contentTypes: ['all'],
  statuses: ['all'],
  languages: ['all'],
  channels: ['all'],
  channelTrust: 'all',
  minScore: 0,
  maxScore: 100,
  searchQuery: '',
};

export function encodeFiltersToSearchParams(filters: AnalyticsFilterState): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.territories.length > 0 && !filters.territories.includes('ALL')) {
    params.set('territories', filters.territories.join(','));
  }
  if (filters.timeRange !== 'all') {
    params.set('timeRange', filters.timeRange);
  }
  if (filters.customStartDate) {
    params.set('start', filters.customStartDate);
  }
  if (filters.customEndDate) {
    params.set('end', filters.customEndDate);
  }
  if (filters.contentTypes.length > 0 && !filters.contentTypes.includes('all')) {
    params.set('types', filters.contentTypes.join(','));
  }
  if (filters.statuses.length > 0 && !filters.statuses.includes('all')) {
    params.set('statuses', filters.statuses.join(','));
  }
  if (filters.languages.length > 0 && !filters.languages.includes('all')) {
    params.set('langs', filters.languages.join(','));
  }
  if (filters.channels.length > 0 && !filters.channels.includes('all')) {
    params.set('channels', filters.channels.join(','));
  }
  if (filters.channelTrust !== 'all') {
    params.set('trust', filters.channelTrust);
  }
  if (filters.minScore > 0) {
    params.set('minScore', filters.minScore.toString());
  }
  if (filters.maxScore < 100) {
    params.set('maxScore', filters.maxScore.toString());
  }
  if (filters.searchQuery.trim()) {
    params.set('q', filters.searchQuery.trim());
  }

  return params;
}

export function decodeFiltersFromSearchParams(params: URLSearchParams): AnalyticsFilterState {
  const filters: AnalyticsFilterState = { ...DEFAULT_ANALYTICS_FILTERS };

  const territories = params.get('territories');
  if (territories) {
    filters.territories = territories.split(',').filter(Boolean);
  }

  const timeRange = params.get('timeRange') as AnalyticsTimeRange | null;
  if (timeRange && ['live', '15m', '1h', '24h', '7d', '30d', '90d', 'all', 'custom'].includes(timeRange)) {
    filters.timeRange = timeRange;
  }

  const start = params.get('start');
  if (start) filters.customStartDate = start;

  const end = params.get('end');
  if (end) filters.customEndDate = end;

  const types = params.get('types');
  if (types) {
    filters.contentTypes = types.split(',') as AnalyticsContentType[];
  }

  const statuses = params.get('statuses');
  if (statuses) {
    filters.statuses = statuses.split(',') as AnalyticsStatus[];
  }

  const langs = params.get('langs');
  if (langs) {
    filters.languages = langs.split(',');
  }

  const channels = params.get('channels');
  if (channels) {
    filters.channels = channels.split(',');
  }

  const trust = params.get('trust') as AnalyticsChannelTrust | null;
  if (trust && ['all', 'verified', 'trusted', 'pending', 'rejected', 'blocked'].includes(trust)) {
    filters.channelTrust = trust;
  }

  const minScore = params.get('minScore');
  if (minScore && !isNaN(Number(minScore))) {
    filters.minScore = Math.max(0, Math.min(100, Number(minScore)));
  }

  const maxScore = params.get('maxScore');
  if (maxScore && !isNaN(Number(maxScore))) {
    filters.maxScore = Math.max(0, Math.min(100, Number(maxScore)));
  }

  const q = params.get('q');
  if (q) {
    filters.searchQuery = q;
  }

  return filters;
}
