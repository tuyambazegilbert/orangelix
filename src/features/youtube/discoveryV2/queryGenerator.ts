/**
 * OrangeFlix Discovery V2 — Query Generator
 * Intelligent search query generation from structured keyword families
 * Supports 40+ keywords per category with priority-based execution
 */

import {
  GeoCountryConfigV2,
  GeneratedQuery,
  DiscoveryKeywordSet,
  LanguageKeywordSet,
} from './types';
import {
  QUERY_TIERS,
  KEYWORD_MINIMUMS,
  LANGUAGE_CINEMA_TERMS,
} from './constants';
import { generateHash, normalizeString } from './utils';

/**
 * Generate movie queries for a country
 */
export function generateMovieQueries(
  config: GeoCountryConfigV2,
  limit?: number
): GeneratedQuery[] {
  const queries: GeneratedQuery[] = [];

  const keywords = config.discoveryKeywords.movie || [];
  const countryName = config.name;
  const demonym = config.demonym;
  const languages = config.languageKeywords || [];

  // TIER 1: Exact country + full movie
  queries.push({
    query: `${countryName} full movie`,
    queryHash: generateHash(`${config.countryCode}-full-movie-${countryName}`),
    countryCode: config.countryCode,
    type: 'movie',
    tier: 1,
    priorityScore: 100,
    reason: 'Exact country + full movie keyword',
  });

  queries.push({
    query: `${demonym} full movie`,
    queryHash: generateHash(`${config.countryCode}-full-movie-${demonym}`),
    countryCode: config.countryCode,
    type: 'movie',
    tier: 1,
    priorityScore: 100,
    reason: 'Demonym + full movie keyword',
  });

  // TIER 2: Country + cinema terms
  for (const term of config.discoveryKeywords.fullContent?.slice(0, 5) || []) {
    queries.push({
      query: `${countryName} ${term}`,
      queryHash: generateHash(`${config.countryCode}-movie-${countryName}-${term}`),
      countryCode: config.countryCode,
      type: 'movie',
      tier: 2,
      priorityScore: 90,
      reason: `Country + ${term}`,
    });
  }

  // TIER 3: Language-based queries
  for (const langKeywords of languages) {
    for (const term of (langKeywords as unknown as Record<string, string[]>).movie?.slice(0, 3) || []) {
      queries.push({
        query: `${term} movie`,
        queryHash: generateHash(`${config.countryCode}-movie-${langKeywords.languageCode}-${term}`),
        countryCode: config.countryCode,
        type: 'movie',
        tier: 3,
        priorityScore: 75,
        language: langKeywords.languageCode,
        reason: `Language-based: ${term} movie`,
      });
    }
  }

  // TIER 4: Genre-based queries
  for (const genre of config.discoveryKeywords.genres?.slice(0, 5) || []) {
    queries.push({
      query: `${demonym} ${genre} movie`,
      queryHash: generateHash(`${config.countryCode}-genre-${genre}`),
      countryCode: config.countryCode,
      type: 'movie',
      tier: 4,
      priorityScore: 65,
      reason: `Genre + country: ${genre}`,
    });
  }

  // Additional high-priority queries from keyword set
  const additionalKeywords = config.discoveryKeywords.movie || [];
  for (let i = 0; i < Math.min(additionalKeywords.length, 10); i++) {
    const kw = additionalKeywords[i];
    if (!queries.some(q => q.query === kw)) {
      queries.push({
        query: kw,
        queryHash: generateHash(`${config.countryCode}-${kw}`),
        countryCode: config.countryCode,
        type: 'movie',
        tier: 2,
        priorityScore: 80 - i * 2,
        reason: `Keyword: ${kw}`,
      });
    }
  }

  // Deduplicate and sort by priority
  const uniqueQueries = deduplicateByKey(queries, (q: GeneratedQuery) => q.queryHash);
  uniqueQueries.sort((a, b) => b.priorityScore - a.priorityScore);

  // Apply limit if specified
  return limit ? uniqueQueries.slice(0, limit) : uniqueQueries;
}

/**
 * Generate series queries for a country
 */
export function generateSeriesQueries(
  config: GeoCountryConfigV2,
  limit?: number
): GeneratedQuery[] {
  const queries: GeneratedQuery[] = [];

  const countryName = config.name;
  const demonym = config.demonym;

  // TIER 1: Country + TV series/drama
  queries.push({
    query: `${demonym} TV series`,
    queryHash: generateHash(`${config.countryCode}-series-${demonym}-tv`),
    countryCode: config.countryCode,
    type: 'series',
    tier: 1,
    priorityScore: 100,
    reason: 'Country + TV series',
  });

  queries.push({
    query: `${countryName} drama series`,
    queryHash: generateHash(`${config.countryCode}-series-${countryName}-drama`),
    countryCode: config.countryCode,
    type: 'series',
    tier: 1,
    priorityScore: 100,
    reason: 'Country + drama series',
  });

  // TIER 2: Country + series keywords
  for (const term of config.discoveryKeywords.series?.slice(0, 5) || []) {
    queries.push({
      query: `${countryName} ${term}`,
      queryHash: generateHash(`${config.countryCode}-series-${countryName}-${term}`),
      countryCode: config.countryCode,
      type: 'series',
      tier: 2,
      priorityScore: 85,
      reason: `Country + ${term}`,
    });
  }

  // TIER 3: Season number searches (dynamic)
  for (let season = 1; season <= 3; season++) {
    queries.push({
      query: `${demonym} season ${season}`,
      queryHash: generateHash(`${config.countryCode}-series-season-${season}`),
      countryCode: config.countryCode,
      type: 'series',
      tier: 3,
      priorityScore: 70,
      reason: `Series search: season ${season}`,
    });
  }

  // TIER 4: Language-based series queries
  for (const langKeywords of config.languageKeywords || []) {
    for (const term of (langKeywords as unknown as Record<string, string[]>).series?.slice(0, 2) || []) {
      queries.push({
        query: `${term} series`,
        queryHash: generateHash(`${config.countryCode}-series-${langKeywords.languageCode}-${term}`),
        countryCode: config.countryCode,
        type: 'series',
        tier: 4,
        priorityScore: 65,
        language: langKeywords.languageCode,
        reason: `Language series: ${term}`,
      });
    }
  }

  // Deduplicate and sort
  const uniqueQueries = deduplicateByKey(queries, (q: GeneratedQuery) => q.queryHash);
  uniqueQueries.sort((a, b) => b.priorityScore - a.priorityScore);

  return limit ? uniqueQueries.slice(0, limit) : uniqueQueries;
}

/**
 * Generate episode queries (typically for specific series)
 */
export function generateEpisodeQueries(
  seriesTitle: string,
  countryCode: string,
  config?: GeoCountryConfigV2,
  limit?: number
): GeneratedQuery[] {
  const queries: GeneratedQuery[] = [];
  const normalized = normalizeString(seriesTitle);

  // Search for full episodes
  queries.push({
    query: `${seriesTitle} full episode`,
    queryHash: generateHash(`${countryCode}-episode-${normalized}-full`),
    countryCode,
    type: 'episode',
    tier: 1,
    priorityScore: 100,
    reason: `Series: "${seriesTitle}" full episode`,
  });

  // Search for new episodes
  queries.push({
    query: `${seriesTitle} new episode`,
    queryHash: generateHash(`${countryCode}-episode-${normalized}-new`),
    countryCode,
    type: 'episode',
    tier: 1,
    priorityScore: 95,
    reason: `Series: "${seriesTitle}" new episode`,
  });

  // Search for specific seasons
  for (let season = 1; season <= 5; season++) {
    queries.push({
      query: `${seriesTitle} season ${season}`,
      queryHash: generateHash(`${countryCode}-episode-${normalized}-s${season}`),
      countryCode,
      type: 'episode',
      tier: 2,
      priorityScore: 85 - season,
      reason: `Series: "${seriesTitle}" season ${season}`,
    });
  }

  // Search with episode number patterns
  for (let ep = 1; ep <= 10; ep++) {
    queries.push({
      query: `${seriesTitle} episode ${ep}`,
      queryHash: generateHash(`${countryCode}-episode-${normalized}-e${ep}`),
      countryCode,
      type: 'episode',
      tier: 2,
      priorityScore: 80 - ep,
      reason: `Series: "${seriesTitle}" episode ${ep}`,
    });
  }

  // Deduplicate and sort
  const uniqueQueries = deduplicateByKey(queries, (q: GeneratedQuery) => q.queryHash);
  uniqueQueries.sort((a, b) => b.priorityScore - a.priorityScore);

  return limit ? uniqueQueries.slice(0, limit) : uniqueQueries;
}

/**
 * Generate channel discovery queries
 */
export function generateChannelQueries(
  channelTitle: string,
  countryCode: string,
  _config?: GeoCountryConfigV2,
  limit?: number
): GeneratedQuery[] {
  const queries: GeneratedQuery[] = [];
  const normalized = normalizeString(channelTitle);

  queries.push({
    query: `${channelTitle} movies`,
    queryHash: generateHash(`${countryCode}-channel-${normalized}-movies`),
    countryCode,
    type: 'channel',
    tier: 1,
    priorityScore: 100,
    reason: `Channel: "${channelTitle}" movies`,
  });

  queries.push({
    query: `${channelTitle} full movie`,
    queryHash: generateHash(`${countryCode}-channel-${normalized}-full`),
    countryCode,
    type: 'channel',
    tier: 1,
    priorityScore: 95,
    reason: `Channel: "${channelTitle}" full movie`,
  });

  queries.push({
    query: `${channelTitle} series`,
    queryHash: generateHash(`${countryCode}-channel-${normalized}-series`),
    countryCode,
    type: 'channel',
    tier: 2,
    priorityScore: 85,
    reason: `Channel: "${channelTitle}" series`,
  });

  queries.push({
    query: `${channelTitle} episodes`,
    queryHash: generateHash(`${countryCode}-channel-${normalized}-episodes`),
    countryCode,
    type: 'channel',
    tier: 2,
    priorityScore: 80,
    reason: `Channel: "${channelTitle}" episodes`,
  });

  const uniqueQueries = deduplicateByKey(queries, (q: GeneratedQuery) => q.queryHash);
  return limit ? uniqueQueries.slice(0, limit) : uniqueQueries;
}

/**
 * Validate country keyword configuration
 */
export function validateCountryKeywords(config: GeoCountryConfigV2): {
  valid: boolean;
  warnings: string[];
  missing: string[];
} {
  const warnings: string[] = [];
  const missing: string[] = [];

  const keywords = config.discoveryKeywords;
  const minimums = KEYWORD_MINIMUMS;

  if (!keywords.movie || keywords.movie.length < minimums.movie_terms) {
    missing.push(`movie_terms (have ${keywords.movie?.length || 0}, need ${minimums.movie_terms})`);
  }
  if (!keywords.series || keywords.series.length < minimums.series_terms) {
    missing.push(`series_terms (have ${keywords.series?.length || 0}, need ${minimums.series_terms})`);
  }
  if (!keywords.episode || keywords.episode.length < minimums.episode_terms) {
    missing.push(`episode_terms (have ${keywords.episode?.length || 0}, need ${minimums.episode_terms})`);
  }

  return {
    valid: missing.length === 0,
    warnings,
    missing,
  };
}

/**
 * Rank queries by performance
 * Returns queries sorted by historical yield
 */
export function rankQueriesByPerformance(
  queries: GeneratedQuery[],
  queryStats: Record<string, { candidateCount: number; qualifyingCount: number }> = {}
): GeneratedQuery[] {
  return [...queries].sort((a, b) => {
    const statsA = queryStats[a.queryHash] || { candidateCount: 0, qualifyingCount: 0 };
    const statsB = queryStats[b.queryHash] || { candidateCount: 0, qualifyingCount: 0 };

    // Prioritize by qualifying results
    const qualifyingDiff = statsB.qualifyingCount - statsA.qualifyingCount;
    if (qualifyingDiff !== 0) return qualifyingDiff;

    // Then by base priority score
    return b.priorityScore - a.priorityScore;
  });
}

/**
 * Deduplicate queries by content
 */
function deduplicateByKey<T>(arr: T[], keyFn: (item: T) => string): T[] {
  const seen = new Set<string>();
  const result: T[] = [];

  for (const item of arr) {
    const key = keyFn(item);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(item);
    }
  }

  return result;
}

/**
 * Generate all discovery queries for a country
 */
export function generateAllDiscoveryQueries(
  config: GeoCountryConfigV2,
  options?: {
    includeEpisodes?: boolean;
    seriesTitles?: string[];
    trustedChannels?: Array<{ id: string; title: string }>;
    limits?: {
      movie?: number;
      series?: number;
      episode?: number;
      channel?: number;
    };
  }
): GeneratedQuery[] {
  const allQueries: GeneratedQuery[] = [];

  // Generate movie queries
  const movieQueries = generateMovieQueries(config, options?.limits?.movie);
  allQueries.push(...movieQueries);

  // Generate series queries
  const seriesQueries = generateSeriesQueries(config, options?.limits?.series);
  allQueries.push(...seriesQueries);

  // Generate episode queries for known series
  if (options?.includeEpisodes && options?.seriesTitles) {
    for (const seriesTitle of options.seriesTitles) {
      const episodeQueries = generateEpisodeQueries(seriesTitle, config.countryCode, config, options?.limits?.episode);
      allQueries.push(...episodeQueries);
    }
  }

  // Generate channel queries for trusted channels
  if (options?.trustedChannels) {
    for (const channel of options.trustedChannels) {
      const channelQueries = generateChannelQueries(channel.title, config.countryCode, config, options?.limits?.channel);
      allQueries.push(...channelQueries);
    }
  }

  return allQueries;
}
