/**
 * OrangeFlix Discovery V2 — Series Resolver
 * Handles series/season/episode relationship resolution and matching
 */

import {
  GeoSeries,
  GeoSeason,
  GeoEpisode,
  EpisodePattern,
} from './types';
import {
  normalizeSeriesTitle,
  jaroWinklerSimilarity,
  generateId,
  extractSeasonNumber,
  extractEpisodeNumber,
} from './utils';

/**
 * Generate series fingerprint for matching
 */
export function generateSeriesFingerprint(seriesTitle: string, metadata?: {
  channels?: string[];
  countries?: string[];
  languages?: string[];
  actors?: string[];
  productionCompanies?: string[];
}) {
  return {
    normalizedTitle: normalizeSeriesTitle(seriesTitle),
    aliases: [seriesTitle, normalizeSeriesTitle(seriesTitle)],
    channelIds: metadata?.channels || [],
    countries: metadata?.countries || [],
    languages: metadata?.languages || [],
    actors: metadata?.actors || [],
    productionCompanies: metadata?.productionCompanies || [],
  };
}

/**
 * Match a candidate to an existing series
 */
export function matchCandidateToSeries(
  candidateTitle: string,
  existingSeries: GeoSeries[],
  minSimilarity: number = 0.75
): { series: GeoSeries; confidence: number } | null {
  const normalizedCandidate = normalizeSeriesTitle(candidateTitle);

  let bestMatch: { series: GeoSeries; confidence: number } | null = null;

  for (const series of existingSeries) {
    // Check exact alias match
    if (series.aliases.some(alias => normalizeSeriesTitle(alias) === normalizedCandidate)) {
      return { series, confidence: 95 };
    }

    // Check normalized title similarity
    const similarity = jaroWinklerSimilarity(normalizedCandidate, series.normalizedTitle);

    if (similarity >= minSimilarity) {
      if (!bestMatch || similarity > bestMatch.confidence) {
        bestMatch = { series, confidence: Math.round(similarity * 100) };
      }
    }
  }

  return bestMatch;
}

/**
 * Create or update a series
 */
export function createOrUpdateSeries(
  title: string,
  countryCode: string,
  language: string,
  channelId: string,
  existingSeries?: GeoSeries
): GeoSeries {
  const now = new Date();
  const fingerprint = generateSeriesFingerprint(title);

  if (existingSeries) {
    // Update existing series
    return {
      ...existingSeries,
      lastSeenAt: now,
      lastUpdatedAt: now,
      fingerprint: {
        ...existingSeries.fingerprint,
        ...fingerprint,
      },
      countryCodes: Array.from(
        new Set([...existingSeries.countryCodes, countryCode])
      ),
      languages: Array.from(
        new Set([...existingSeries.languages, language])
      ),
      channelIds: Array.from(
        new Set([...existingSeries.channelIds, channelId])
      ),
    };
  }

  // Create new series
  return {
    seriesId: generateId(),
    canonicalTitle: title,
    normalizedTitle: fingerprint.normalizedTitle,
    aliases: [title],
    countryCodes: [countryCode],
    languages: [language],
    channelIds: [channelId],
    status: 'active',
    confidence: 75, // Initial confidence
    seasonCount: 0,
    episodeCount: 0,
    knownSeasonNumbers: [],
    firstDiscoveredAt: now,
    lastSeenAt: now,
    lastUpdatedAt: now,
    searchAliases: [],
    fingerprint,
    classificationVersion: '2.0.0',
    discoveryVersion: '2.0.0',
  };
}

/**
 * Resolve or create a season
 */
export function resolveOrCreateSeason(
  seriesId: string,
  seasonNumber: number | null
): GeoSeason {
  const now = new Date();

  return {
    seasonId: generateId(),
    seriesId,
    seasonNumber,
    episodeCount: 0,
    knownEpisodeNumbers: [],
    confidence: seasonNumber ? 85 : 40,
    firstDiscoveredAt: now,
    lastSeenAt: now,
    lastUpdatedAt: now,
    classificationVersion: '2.0.0',
  };
}

/**
 * Resolve or create an episode
 */
export function resolveOrCreateEpisode(
  seriesId: string,
  seasonId: string | undefined,
  episodeTitle: string,
  videoId: string,
  episodePattern?: EpisodePattern
): GeoEpisode {
  const now = new Date();

  return {
    episodeId: generateId(),
    seriesId,
    seasonId,
    seasonNumber: episodePattern?.seasonNumber ?? null,
    episodeNumber: episodePattern?.episodeNumber ?? null,
    title: episodeTitle,
    normalizedTitle: normalizeSeriesTitle(episodeTitle),
    videoIds: [videoId],
    canonicalVideoId: videoId,
    confidence: episodePattern?.confidence ?? 50,
    evidenceReasons: [],
    firstDiscoveredAt: now,
    lastSeenAt: now,
    lastUpdatedAt: now,
    classificationVersion: '2.0.0',
  };
}

/**
 * Check if two episodes are likely duplicates
 */
export function detectEpisodeDuplicate(
  episode1: GeoEpisode,
  episode2: GeoEpisode
): { isDuplicate: boolean; confidence: number } {
  // Same series, season, episode = definitely duplicate
  if (
    episode1.seriesId === episode2.seriesId &&
    episode1.seasonNumber === episode2.seasonNumber &&
    episode1.episodeNumber === episode2.episodeNumber
  ) {
    return { isDuplicate: true, confidence: 95 };
  }

  // Title similarity
  const titleSimilarity = jaroWinklerSimilarity(episode1.normalizedTitle, episode2.normalizedTitle);

  if (titleSimilarity > 0.9) {
    // Very similar titles + same series = likely duplicate
    if (episode1.seriesId === episode2.seriesId) {
      return { isDuplicate: true, confidence: 85 };
    }
  }

  if (titleSimilarity < 0.5) {
    // Very different titles = not duplicates
    return { isDuplicate: false, confidence: 0 };
  }

  return { isDuplicate: false, confidence: 0 };
}

/**
 * Find missing episode numbers in a season
 */
export function findMissingEpisodes(
  knownEpisodeNumbers: number[],
  maxGap: number = 3
): number[] {
  if (knownEpisodeNumbers.length < 2) return [];

  const sorted = [...knownEpisodeNumbers].sort((a, b) => a - b);
  const missing: number[] = [];

  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i];
    const next = sorted[i + 1];
    const gap = next - current;

    if (gap > 1 && gap <= maxGap) {
      for (let ep = current + 1; ep < next; ep++) {
        missing.push(ep);
      }
    }
  }

  return missing;
}

/**
 * Suggest next episode number for a series
 */
export function suggestNextEpisode(
  knownEpisodeNumbers: number[]
): number {
  if (knownEpisodeNumbers.length === 0) return 1;

  return Math.max(...knownEpisodeNumbers) + 1;
}

/**
 * Extract and normalize series information from metadata
 */
export function extractSeriesMetadata(
  title: string,
  episodePattern: EpisodePattern | null
): {
  seriesTitle: string | null;
  seasonNumber: number | null;
  episodeNumber: number | null;
} {
  let seriesTitle: string | null = null;
  let seasonNumber: number | null = null;
  let episodeNumber: number | null = null;

  if (episodePattern) {
    seasonNumber = episodePattern.seasonNumber;
    episodeNumber = episodePattern.episodeNumber;

    // Try to extract series title by removing episode markers
    seriesTitle = normalizeSeriesTitle(title);
  }

  return {
    seriesTitle,
    seasonNumber,
    episodeNumber,
  };
}

/**
 * Rate series matching confidence
 */
export function rateSeriesMatchConfidence(
  candidate: {
    title: string;
    description?: string;
    channelId?: string;
    durationSeconds?: number;
    episodePattern?: EpisodePattern | null;
  },
  series: GeoSeries
): number {
  let confidence = 0;

  // Title match
  const titleSimilarity = jaroWinklerSimilarity(
    normalizeSeriesTitle(candidate.title),
    series.normalizedTitle
  );
  confidence += titleSimilarity * 40;

  // Channel match
  if (candidate.channelId && series.channelIds.includes(candidate.channelId)) {
    confidence += 30;
  }

  // Episode pattern match
  if (
    candidate.episodePattern &&
    candidate.episodePattern.seasonNumber &&
    candidate.episodePattern.episodeNumber
  ) {
    confidence += 20;
  }

  // Duration consistency
  if (candidate.durationSeconds) {
    const mins = Math.round(candidate.durationSeconds / 60);
    if (mins > 20 && mins < 120) {
      // Typical episode duration
      confidence += 10;
    }
  }

  return Math.min(100, Math.round(confidence));
}
