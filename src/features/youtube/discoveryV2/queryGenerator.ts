/**
 * OrangeFlix Discovery V2 — Query Generator
 * High-Recall Search Intelligence & Query Expansion Engine
 * Generates rich, authentic, high-converting queries combining:
 * Country + Language + Cinema Movements + Translators/Distributors + Recency + Genres + Episodic Triggers.
 */

import {
  GeoCountryConfigV2,
  GeneratedQuery,
  DiscoveryKeywordSet,
  LanguageKeywordSet,
} from './types';
import { KEYWORD_MINIMUMS } from './constants';
import { generateHash, normalizeString } from './utils';
import { LOCAL } from './profiles';

export interface SmartQueryOptions {
  mode?: 'smart' | 'manual' | 'incremental' | 'deep' | 'scheduled' | 'channels_only';
  scope?: 'all' | 'movies' | 'series';
  limit?: number;
  includeRecency?: boolean;
  trustedChannels?: Array<{ id: string; title: string }>;
  seriesTitles?: string[];
}

/**
 * Helper: Interleave two query lists 1:1 round-robin to preserve balanced representation.
 */
function interleaveQueries(listA: GeneratedQuery[], listB: GeneratedQuery[]): GeneratedQuery[] {
  const result: GeneratedQuery[] = [];
  const maxLen = Math.max(listA.length, listB.length);
  for (let i = 0; i < maxLen; i++) {
    if (i < listA.length) result.push(listA[i]);
    if (i < listB.length) result.push(listB[i]);
  }
  return result;
}

/**
 * Generate high-yield movie queries for a territory with 50/50 dual-language richness.
 * Combines authentic local language cinema terms + standard English / subtitled / demonym cinema terms.
 */
export function generateMovieQueries(
  config: GeoCountryConfigV2,
  limit?: number
): GeneratedQuery[] {
  const code = config.countryCode.toUpperCase();
  const localData = LOCAL[code];
  const demonym = config.demonym || localData?.demonym || config.name;
  const currentYear = new Date().getFullYear();
  const pastYear = currentYear - 1;

  const localQueries: GeneratedQuery[] = [];
  const englishQueries: GeneratedQuery[] = [];

  // 1. TOP TIER 1: Dedicated curated high-yield queries (split by even/odd for local vs standard English)
  if (localData?.topHighYieldMovieQueries) {
    localData.topHighYieldMovieQueries.forEach((qStr, idx) => {
      const isLocal = idx % 2 === 0;
      const targetList = isLocal ? localQueries : englishQueries;
      targetList.push({
        query: qStr,
        queryHash: generateHash(`${code}:movie:high_yield:${normalizeString(qStr)}`),
        countryCode: code,
        type: 'movie',
        tier: 1,
        priorityScore: 100 - idx,
        reason: `${isLocal ? 'Local Authentic' : 'Standard English'} Cinema Query: "${qStr}"`,
      });
    });
  }

  // 2. TIER 1: Cinema Movement + Full Movie & Recency Combinations (Local Native)
  const cinemaTerms = localData?.cinema || config.cinemaTerms || [];
  for (const cinema of cinemaTerms.slice(0, 8)) {
    localQueries.push({
      query: `${cinema} full movie`,
      queryHash: generateHash(`${code}:movie:${normalizeString(cinema)}:full_movie`),
      countryCode: code,
      type: 'movie',
      tier: 1,
      priorityScore: 98,
      reason: `Authentic Cinema Term: "${cinema} full movie"`,
    });

    localQueries.push({
      query: `${cinema} ${currentYear}`,
      queryHash: generateHash(`${code}:movie:${normalizeString(cinema)}:${currentYear}`),
      countryCode: code,
      type: 'movie',
      tier: 1,
      priorityScore: 97,
      reason: `Recency Cinema Query: "${cinema} ${currentYear}"`,
    });

    localQueries.push({
      query: `${cinema} ${pastYear} full movie`,
      queryHash: generateHash(`${code}:movie:${normalizeString(cinema)}:${pastYear}`),
      countryCode: code,
      type: 'movie',
      tier: 2,
      priorityScore: 92,
      reason: `Catalog Recency: "${cinema} ${pastYear} full movie"`,
    });
  }

  // 3. TIER 2: Native Language / Dialect Movie Combinations (Local)
  if (localData?.language) {
    for (const [langCode, terms] of Object.entries(localData.language)) {
      if (langCode === 'en') continue;
      for (const term of terms.slice(0, 4)) {
        localQueries.push({
          query: `${term} full movie`,
          queryHash: generateHash(`${code}:movie:${langCode}:${normalizeString(term)}:full`),
          countryCode: code,
          type: 'movie',
          tier: 2,
          priorityScore: 90,
          language: langCode,
          reason: `Native Language Term: "${term} full movie" (${langCode})`,
        });
      }
    }
  }

  // 4. TIER 2 & 3: Standard English & Demonym Cinema Combinations
  englishQueries.push({
    query: `${demonym} full movie english subtitles`,
    queryHash: generateHash(`${code}:movie:${demonym}:subtitles`),
    countryCode: code,
    type: 'movie',
    tier: 1,
    priorityScore: 96,
    reason: `Subtitled Search: "${demonym} full movie english subtitles"`,
  });

  englishQueries.push({
    query: `${demonym} movies ${currentYear} full movie`,
    queryHash: generateHash(`${code}:movie:${demonym}:${currentYear}:full`),
    countryCode: code,
    type: 'movie',
    tier: 1,
    priorityScore: 95,
    reason: `English Recency Search: "${demonym} movies ${currentYear} full movie"`,
  });

  englishQueries.push({
    query: `${demonym} movie full hd 1080p`,
    queryHash: generateHash(`${code}:movie:${demonym}:1080p`),
    countryCode: code,
    type: 'movie',
    tier: 2,
    priorityScore: 91,
    reason: `HD Quality Search: "${demonym} movie full hd 1080p"`,
  });

  englishQueries.push({
    query: `${config.name} cinema full movie english subtitles`,
    queryHash: generateHash(`${code}:movie:${normalizeString(config.name)}:cinema_subtitles`),
    countryCode: code,
    type: 'movie',
    tier: 2,
    priorityScore: 89,
    reason: `Territory Cinema Subtitles: "${config.name} cinema full movie english subtitles"`,
  });

  // 5. TIER 4: Genres in both Local & English
  const topGenres = ['action', 'comedy', 'romance', 'drama', 'crime'];
  const primaryCinema = cinemaTerms[0] || `${demonym} movie`;
  for (const genre of topGenres) {
    localQueries.push({
      query: `${primaryCinema} ${genre} full movie`,
      queryHash: generateHash(`${code}:movie:genre:${normalizeString(primaryCinema)}:${genre}`),
      countryCode: code,
      type: 'movie',
      tier: 3,
      priorityScore: 84,
      reason: `Local Genre Discovery: "${primaryCinema} ${genre} full movie"`,
    });

    englishQueries.push({
      query: `${demonym} ${genre} full movie`,
      queryHash: generateHash(`${code}:movie:genre:${normalizeString(demonym)}:${genre}`),
      countryCode: code,
      type: 'movie',
      tier: 3,
      priorityScore: 83,
      reason: `Standard English Genre Discovery: "${demonym} ${genre} full movie"`,
    });
  }

  // Interleave local and english queries 1:1 round-robin for equal representation
  const interleaved = interleaveQueries(localQueries, englishQueries);
  const unique = deduplicateByKey(interleaved, (q) => q.queryHash);

  return limit ? unique.slice(0, limit) : unique;
}

/**
 * Generate high-yield series queries for a territory with 50/50 dual-language richness.
 * Targets authentic episodic formats, telenovelas, web series, and local series tags.
 */
export function generateSeriesQueries(
  config: GeoCountryConfigV2,
  limit?: number
): GeneratedQuery[] {
  const code = config.countryCode.toUpperCase();
  const localData = LOCAL[code];
  const demonym = config.demonym || localData?.demonym || config.name;

  const localSeriesQueries: GeneratedQuery[] = [];
  const englishSeriesQueries: GeneratedQuery[] = [];

  // 1. TOP TIER 1: Dedicated curated high-yield series queries (split by even/odd)
  if (localData?.topHighYieldSeriesQueries) {
    localData.topHighYieldSeriesQueries.forEach((qStr, idx) => {
      const isLocal = idx % 2 === 0;
      const targetList = isLocal ? localSeriesQueries : englishSeriesQueries;
      targetList.push({
        query: qStr,
        queryHash: generateHash(`${code}:series:high_yield:${normalizeString(qStr)}`),
        countryCode: code,
        type: 'series',
        tier: 1,
        priorityScore: 100 - idx,
        reason: `${isLocal ? 'Local Series' : 'Standard English Series'} Query: "${qStr}"`,
      });
    });
  }

  // 2. TIER 1: Cinema Movement + Series / Episode 1 Triggers (Local)
  const cinemaTerms = localData?.cinema || config.cinemaTerms || [];
  for (const cinema of cinemaTerms.slice(0, 6)) {
    localSeriesQueries.push({
      query: `${cinema} episode 1`,
      queryHash: generateHash(`${code}:series:${normalizeString(cinema)}:ep1`),
      countryCode: code,
      type: 'series',
      tier: 1,
      priorityScore: 98,
      reason: `Series Pilot / Ep 1: "${cinema} episode 1"`,
    });

    localSeriesQueries.push({
      query: `${cinema} season 1 episode 1`,
      queryHash: generateHash(`${code}:series:${normalizeString(cinema)}:s1e1`),
      countryCode: code,
      type: 'series',
      tier: 1,
      priorityScore: 97,
      reason: `Season 1 Episode 1: "${cinema} season 1 episode 1"`,
    });

    localSeriesQueries.push({
      query: `${cinema} series full`,
      queryHash: generateHash(`${code}:series:${normalizeString(cinema)}:full_series`),
      countryCode: code,
      type: 'series',
      tier: 2,
      priorityScore: 90,
      reason: `Full Series Search: "${cinema} series full"`,
    });
  }

  // 3. TIER 2: Demonym + Drama / Web Series (Standard English)
  englishSeriesQueries.push({
    query: `${demonym} drama series season 1 episode 1`,
    queryHash: generateHash(`${code}:series:${demonym}:drama_s1e1`),
    countryCode: code,
    type: 'series',
    tier: 1,
    priorityScore: 96,
    reason: `Demonym Drama Season 1: "${demonym} drama series season 1 episode 1"`,
  });

  englishSeriesQueries.push({
    query: `${demonym} drama series episode 1`,
    queryHash: generateHash(`${code}:series:${demonym}:drama_ep1`),
    countryCode: code,
    type: 'series',
    tier: 1,
    priorityScore: 95,
    reason: `Demonym Drama Series: "${demonym} drama series episode 1"`,
  });

  englishSeriesQueries.push({
    query: `${demonym} web series season 1`,
    queryHash: generateHash(`${code}:series:${demonym}:web_s1`),
    countryCode: code,
    type: 'series',
    tier: 2,
    priorityScore: 88,
    reason: `Web Series: "${demonym} web series season 1"`,
  });

  englishSeriesQueries.push({
    query: `${config.name} tv series full episodes`,
    queryHash: generateHash(`${code}:series:${normalizeString(config.name)}:tv_full_episodes`),
    countryCode: code,
    type: 'series',
    tier: 2,
    priorityScore: 87,
    reason: `Full Episodes Search: "${config.name} tv series full episodes"`,
  });

  // 4. TIER 3: Native Language / Dialect Series Triggers (Local)
  if (localData?.language) {
    for (const [langCode, terms] of Object.entries(localData.language)) {
      if (langCode === 'en') continue;
      for (const term of terms.slice(0, 3)) {
        localSeriesQueries.push({
          query: `${term} episode 1`,
          queryHash: generateHash(`${code}:series:${langCode}:${normalizeString(term)}:ep1`),
          countryCode: code,
          type: 'series',
          tier: 2,
          priorityScore: 87,
          language: langCode,
          reason: `Native Series Term: "${term} episode 1" (${langCode})`,
        });
      }
    }
  }

  // Interleave local and english series queries 1:1 round-robin for equal representation
  const interleaved = interleaveQueries(localSeriesQueries, englishSeriesQueries);
  const unique = deduplicateByKey(interleaved, (q) => q.queryHash);

  return limit ? unique.slice(0, limit) : unique;
}

/**
 * Generate episode queries for a specific series title.
 */
export function generateEpisodeQueries(
  seriesTitle: string,
  countryCode: string,
  _config?: GeoCountryConfigV2,
  limit?: number
): GeneratedQuery[] {
  const queries: GeneratedQuery[] = [];
  const normalized = normalizeString(seriesTitle);
  const code = countryCode.toUpperCase();

  queries.push({
    query: `${seriesTitle} episode 1`,
    queryHash: generateHash(`${code}:episode:${normalized}:ep1`),
    countryCode: code,
    type: 'episode',
    tier: 1,
    priorityScore: 100,
    reason: `Series: "${seriesTitle}" Episode 1`,
  });

  queries.push({
    query: `${seriesTitle} full episode`,
    queryHash: generateHash(`${code}:episode:${normalized}:full`),
    countryCode: code,
    type: 'episode',
    tier: 1,
    priorityScore: 98,
    reason: `Series: "${seriesTitle}" full episode`,
  });

  queries.push({
    query: `${seriesTitle} new episode`,
    queryHash: generateHash(`${code}:episode:${normalized}:new`),
    countryCode: code,
    type: 'episode',
    tier: 1,
    priorityScore: 95,
    reason: `Series: "${seriesTitle}" new episode`,
  });

  for (let season = 1; season <= 3; season++) {
    queries.push({
      query: `${seriesTitle} season ${season}`,
      queryHash: generateHash(`${code}:episode:${normalized}:s${season}`),
      countryCode: code,
      type: 'episode',
      tier: 2,
      priorityScore: 88 - season,
      reason: `Series: "${seriesTitle}" season ${season}`,
    });
  }

  for (let ep = 2; ep <= 8; ep++) {
    queries.push({
      query: `${seriesTitle} episode ${ep}`,
      queryHash: generateHash(`${code}:episode:${normalized}:ep${ep}`),
      countryCode: code,
      type: 'episode',
      tier: 2,
      priorityScore: 85 - ep,
      reason: `Series: "${seriesTitle}" episode ${ep}`,
    });
  }

  const unique = deduplicateByKey(queries, (q) => q.queryHash);
  unique.sort((a, b) => b.priorityScore - a.priorityScore);

  return limit ? unique.slice(0, limit) : unique;
}

/**
 * Generate targeted gap-search queries for missing episode numbers in a series.
 */
export function generateEpisodeGapQueries(
  seriesTitle: string,
  countryCode: string,
  knownEpisodeNumbers: number[],
  seasonNumber: number = 1,
  limit: number = 6
): GeneratedQuery[] {
  const code = countryCode.toUpperCase();
  if (!knownEpisodeNumbers || knownEpisodeNumbers.length === 0) {
    return generateEpisodeQueries(seriesTitle, code, undefined, limit);
  }

  const sorted = Array.from(new Set(knownEpisodeNumbers)).sort((a, b) => a - b);
  const maxEp = sorted[sorted.length - 1];
  const missingNumbers: number[] = [];

  // Find intermediate gaps (e.g. 1, 2, 4, 5 -> 3)
  for (let i = 1; i < maxEp; i++) {
    if (!sorted.includes(i)) {
      missingNumbers.push(i);
    }
  }

  // Also check the next continuation episode (e.g. max + 1)
  missingNumbers.push(maxEp + 1);

  const queries: GeneratedQuery[] = [];
  const normalized = normalizeString(seriesTitle);
  const sStr = String(seasonNumber).padStart(2, '0');

  for (const epNum of missingNumbers.slice(0, limit)) {
    const eStr = String(epNum).padStart(2, '0');
    queries.push({
      query: `${seriesTitle} Episode ${epNum}`,
      queryHash: generateHash(`${code}:gap:${normalized}:ep${epNum}`),
      countryCode: code,
      type: 'episode',
      tier: 1,
      priorityScore: 100,
      reason: `Episode gap: Episode ${epNum}`,
    });

    queries.push({
      query: `${seriesTitle} S${sStr}E${eStr}`,
      queryHash: generateHash(`${code}:gap:${normalized}:s${sStr}e${eStr}`),
      countryCode: code,
      type: 'episode',
      tier: 1,
      priorityScore: 95,
      reason: `Episode gap: S${sStr}E${eStr}`,
    });

    queries.push({
      query: `${seriesTitle} Ep ${epNum}`,
      queryHash: generateHash(`${code}:gap:${normalized}:ep-short-${epNum}`),
      countryCode: code,
      type: 'episode',
      tier: 1,
      priorityScore: 90,
      reason: `Episode gap: Ep ${epNum}`,
    });
  }

  return queries.slice(0, limit * 3);
}

/**
 * Generate channel discovery queries.
 */
export function generateChannelQueries(
  channelTitle: string,
  countryCode: string,
  _config?: GeoCountryConfigV2,
  limit?: number
): GeneratedQuery[] {
  const queries: GeneratedQuery[] = [];
  const code = countryCode.toUpperCase();
  const normalized = normalizeString(channelTitle);

  queries.push({
    query: `${channelTitle} full movie`,
    queryHash: generateHash(`${code}:channel:${normalized}:full`),
    countryCode: code,
    type: 'channel',
    tier: 1,
    priorityScore: 100,
    reason: `Channel: "${channelTitle}" full movie`,
  });

  queries.push({
    query: `${channelTitle} movies`,
    queryHash: generateHash(`${code}:channel:${normalized}:movies`),
    countryCode: code,
    type: 'channel',
    tier: 1,
    priorityScore: 95,
    reason: `Channel: "${channelTitle}" movies`,
  });

  queries.push({
    query: `${channelTitle} series`,
    queryHash: generateHash(`${code}:channel:${normalized}:series`),
    countryCode: code,
    type: 'channel',
    tier: 2,
    priorityScore: 85,
    reason: `Channel: "${channelTitle}" series`,
  });

  queries.push({
    query: `${channelTitle} episode 1`,
    queryHash: generateHash(`${code}:channel:${normalized}:ep1`),
    countryCode: code,
    type: 'channel',
    tier: 2,
    priorityScore: 80,
    reason: `Channel: "${channelTitle}" episode 1`,
  });

  const unique = deduplicateByKey(queries, (q) => q.queryHash);
  return limit ? unique.slice(0, limit) : unique;
}

/**
 * Smart query generation based on mode, scope, and limit.
 * Used by Live Scanner and orchestrator to produce exact search queries.
 */
export function generateSmartDiscoveryQueries(
  config: GeoCountryConfigV2,
  options: SmartQueryOptions = {}
): GeneratedQuery[] {
  const mode = options.mode || 'smart';
  const scope = options.scope || 'all';
  const limit = options.limit || 8;

  const queries: GeneratedQuery[] = [];

  // Movie queries
  if (scope === 'all' || scope === 'movies') {
    const movieLimit = mode === 'deep' ? 20 : mode === 'incremental' ? 3 : 8;
    queries.push(...generateMovieQueries(config, movieLimit));
  }

  // Series queries
  if (scope === 'all' || scope === 'series') {
    const seriesLimit = mode === 'deep' ? 15 : mode === 'incremental' ? 8 : 6;
    queries.push(...generateSeriesQueries(config, seriesLimit));
  }

  // Episode queries for known series if provided
  if (options.seriesTitles && options.seriesTitles.length > 0) {
    for (const title of options.seriesTitles.slice(0, 3)) {
      queries.push(...generateEpisodeQueries(title, config.countryCode, config, 3));
    }
  }

  // Channel queries
  if (options.trustedChannels && options.trustedChannels.length > 0) {
    for (const ch of options.trustedChannels.slice(0, 2)) {
      queries.push(...generateChannelQueries(ch.title, config.countryCode, config, 2));
    }
  }

  // Deduplicate
  const unique = deduplicateByKey(queries, (q) => q.queryHash);

  // In incremental mode, bias towards series and episode queries
  if (mode === 'incremental') {
    unique.sort((a, b) => {
      const typeWeightA = a.type === 'episode' ? 20 : a.type === 'series' ? 10 : 0;
      const typeWeightB = b.type === 'episode' ? 20 : b.type === 'series' ? 10 : 0;
      return b.priorityScore + typeWeightB - (a.priorityScore + typeWeightA);
    });
  } else {
    unique.sort((a, b) => b.priorityScore - a.priorityScore);
  }

  return limit ? unique.slice(0, limit) : unique;
}

/**
 * Generate all discovery queries for a country.
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
      const episodeQueries = generateEpisodeQueries(
        seriesTitle,
        config.countryCode,
        config,
        options?.limits?.episode
      );
      allQueries.push(...episodeQueries);
    }
  }

  // Generate channel queries for trusted channels
  if (options?.trustedChannels) {
    for (const channel of options.trustedChannels) {
      const channelQueries = generateChannelQueries(
        channel.title,
        config.countryCode,
        config,
        options?.limits?.channel
      );
      allQueries.push(...channelQueries);
    }
  }

  return allQueries;
}

/**
 * Validate country keyword configuration.
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
 * Rank queries by performance.
 */
export function rankQueriesByPerformance(
  queries: GeneratedQuery[],
  queryStats: Record<string, { candidateCount: number; qualifyingCount: number }> = {}
): GeneratedQuery[] {
  return [...queries].sort((a, b) => {
    const statsA = queryStats[a.queryHash] || { candidateCount: 0, qualifyingCount: 0 };
    const statsB = queryStats[b.queryHash] || { candidateCount: 0, qualifyingCount: 0 };

    const qualifyingDiff = statsB.qualifyingCount - statsA.qualifyingCount;
    if (qualifyingDiff !== 0) return qualifyingDiff;

    return b.priorityScore - a.priorityScore;
  });
}

/**
 * Deduplicate queries by content.
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
