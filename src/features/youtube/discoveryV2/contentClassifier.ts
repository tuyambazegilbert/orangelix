/**
 * OrangeFlix Discovery V2 — Content Classifier
 * Advanced movie/series/episode classification with episode pattern detection
 */

import { GeoContentType, EpisodePattern } from './types';
import { EPISODE_PATTERNS, DURATION_THRESHOLDS } from './constants';
import { extractEpisodeNumber, extractSeasonNumber, normalizeString } from './utils';

/**
 * Detect episode patterns in text
 */
export function detectEpisodePattern(text: string): EpisodePattern | null {
  if (!text) {
    return null;
  }

  const textLower = text.toLowerCase();

  // Try each pattern family
  for (const pattern of EPISODE_PATTERNS.SEASON_EPISODE_CODE) {
    const match = text.match(pattern);
    if (match) {
      const seasonNum = parseInt(match[1], 10);
      const episodeNum = parseInt(match[2], 10);
      return {
        type: 'explicit_sne',
        seasonNumber: seasonNum,
        episodeNumber: episodeNum,
        confidence: 95,
        evidence: [`Matched pattern: S${seasonNum}E${episodeNum}`],
      };
    }
  }

  for (const pattern of EPISODE_PATTERNS.SEASON_EPISODE_WORDS) {
    const match = text.match(pattern);
    if (match) {
      const seasonStr = match[1];
      const episodeStr = match[2];
      const seasonNum = parseNumber(seasonStr);
      const episodeNum = parseNumber(episodeStr);
      return {
        type: 'season_episode',
        seasonNumber: seasonNum,
        episodeNumber: episodeNum,
        confidence: 85,
        evidence: [`Matched pattern: Season ${seasonStr} Episode ${episodeStr}`],
      };
    }
  }

  for (const pattern of EPISODE_PATTERNS.EPISODE_SIMPLE) {
    const match = text.match(pattern);
    if (match) {
      const episodeNum = parseNumber(match[1]);
      return {
        type: 'simple_number',
        seasonNumber: null,
        episodeNumber: episodeNum,
        confidence: 70,
        evidence: [`Episode number detected: ${episodeNum}`],
      };
    }
  }

  for (const pattern of EPISODE_PATTERNS.PART_FORMAT) {
    const match = text.match(pattern);
    if (match) {
      const partNum = parseNumber(match[1]);
      return {
        type: 'part_number',
        seasonNumber: null,
        episodeNumber: partNum,
        confidence: 60, // Lower confidence for "Part"
        evidence: [`Part number detected: ${partNum}`],
      };
    }
  }

  for (const pattern of EPISODE_PATTERNS.ALTERNATIVE_FORMAT) {
    const match = text.match(pattern);
    if (match) {
      const seasonNum = parseInt(match[1], 10);
      const episodeNum = parseInt(match[2], 10);
      return {
        type: 'explicit_sne',
        seasonNumber: seasonNum,
        episodeNumber: episodeNum,
        confidence: 80,
        evidence: [`Matched alternative format: ${seasonNum}x${episodeNum}`],
      };
    }
  }

  // Weak but useful scattered naming: "Series Name - 10".  It is deliberately
  // lower-confidence than explicit markers and must be confirmed by series data.
  const trailing = text.trim().match(/(?:[-|:]\s*|\s)(\d{1,3})\s*$/);
  const wordsBeforeNumber = text.trim().replace(/(?:[-|:]\s*|\s)\d{1,3}\s*$/, '').trim().split(/\s+/).length;
  if (trailing && wordsBeforeNumber >= 2) {
    return { type: 'scattered', seasonNumber: null, episodeNumber: Number(trailing[1]), confidence: 45, evidence: [`Terminal number "${trailing[1]}" is a possible episode marker`] };
  }

  return null;
}

/**
 * Helper to parse season/episode numbers written as words
 */
function parseNumber(str: string): number | null {
  const numberWords: Record<string, number> = {
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    nine: 9,
    ten: 10,
  };

  const lower = str.toLowerCase();
  if (numberWords[lower]) {
    return numberWords[lower];
  }

  const num = parseInt(str, 10);
  return isNaN(num) ? null : num;
}

/**
 * Classify content type based on evidence
 */
export function classifyContentType(
  title: string,
  description: string,
  durationSeconds: number,
  episodePattern: EpisodePattern | null,
  channelHistory?: { movieCount: number; seriesCount: number; episodeCount: number }
): GeoContentType {
  const titleLower = (title || '').toLowerCase();
  const descLower = (description || '').toLowerCase();
  const durationMins = Math.round(durationSeconds / 60);

  // Hard-rejection patterns (highest priority)
  if (
    titleLower.includes('trailer') ||
    titleLower.includes('teaser') ||
    (titleLower.includes('behind') && titleLower.includes('scenes'))
  ) {
    if (titleLower.includes('trailer')) return 'trailer';
    if (titleLower.includes('teaser')) return 'teaser';
    return 'clip';
  }

  if (titleLower.includes('interview')) return 'interview';
  if (titleLower.includes('music video') || titleLower.includes('official music')) return 'music';
  if (titleLower.includes('reaction') || titleLower.includes('review')) return 'review';
  if (titleLower.includes('news') && !titleLower.includes('new release')) return 'news';

  // Episode detection
  if (episodePattern) {
    // Strong episode indicator
    if (episodePattern.type === 'explicit_sne' || episodePattern.type === 'season_episode') {
      // But very long videos might be series compilations
      if (durationMins < 45) {
        return 'episode';
      }
      // Ambiguous: could be long episode or series
      return episodePattern.seasonNumber !== null ? 'episode' : 'series';
    }

    // Moderate episode indicators
    if ((episodePattern.type === 'simple_number' || episodePattern.type === 'part_number') && durationMins < 60) {
      return 'episode';
    }
  }

  // Series detection
  if (titleLower.includes('series') || titleLower.includes('season') || descLower.includes('episode')) {
    return 'series';
  }

  // Movie detection
  if (titleLower.includes('full movie') || titleLower.includes('full film')) {
    return 'movie';
  }

  // Duration-based classification (only when no other signals)
  if (durationMins >= DURATION_THRESHOLDS.FEATURE / 60) {
    // Long videos are likely movies or series, not standalone
    if (episodePattern || titleLower.includes('series')) {
      return 'series';
    }
    if (!episodePattern && titleLower.includes('episode')) {
      return 'episode';
    }
    return 'movie';
  }

  if (durationMins < DURATION_THRESHOLDS.SHORT_FILM / 60) {
    return 'clip';
  }

  // Default to unknown if nothing matched
  return 'unknown';
}

/**
 * Determine if a video is a full movie candidate
 */
export function isFullMovieCandidateV2(
  contentType: GeoContentType,
  durationSeconds: number,
  episodePattern: EpisodePattern | null,
  movieScore: number,
  countryScore: number,
  channelTrust: 'approved' | 'pending' | 'rejected'
): boolean {
  // Must be classified as movie
  if (contentType !== 'movie') {
    return false;
  }

  // Must not have episode indicators
  if (episodePattern && episodePattern.confidence > 70) {
    return false;
  }

  const durationMins = Math.round(durationSeconds / 60);
  const minMovieDuration = 45;

  // Minimum duration
  if (durationMins < minMovieDuration) {
    return false;
  }

  // Scoring thresholds
  if (channelTrust === 'approved') {
    // Approved channels have lower bar
    return movieScore >= 60 && countryScore >= 40;
  } else {
    // Pending/unknown channels need higher confidence
    return movieScore >= 75 && countryScore >= 60;
  }
}

/**
 * Get evidence for content type classification
 */
export function getContentTypeEvidence(
  title: string,
  description: string,
  durationSeconds: number,
  episodePattern: EpisodePattern | null
): string[] {
  const evidence: string[] = [];
  const titleLower = (title || '').toLowerCase();
  const descLower = (description || '').toLowerCase();
  const durationMins = Math.round(durationSeconds / 60);

  // Duration evidence
  if (durationMins > 120) {
    evidence.push('Very long duration (120+ minutes)');
  } else if (durationMins > 60) {
    evidence.push('Long duration (60–120 minutes)');
  } else if (durationMins > 45) {
    evidence.push('Medium duration (45–60 minutes)');
  } else if (durationMins > 20) {
    evidence.push('Short duration (20–45 minutes)');
  } else {
    evidence.push('Very short duration (<20 minutes)');
  }

  // Title/description patterns
  if (titleLower.includes('full')) evidence.push('Title contains "full"');
  if (titleLower.includes('movie')) evidence.push('Title contains "movie"');
  if (titleLower.includes('film')) evidence.push('Title contains "film"');
  if (titleLower.includes('series')) evidence.push('Title contains "series"');
  if (titleLower.includes('episode')) evidence.push('Title contains "episode"');
  if (titleLower.includes('season')) evidence.push('Title contains "season"');
  if (titleLower.includes('trailer')) evidence.push('Title contains "trailer"');
  if (titleLower.includes('teaser')) evidence.push('Title contains "teaser"');
  if (titleLower.includes('clip')) evidence.push('Title contains "clip"');

  // Episode pattern evidence
  if (episodePattern) {
    evidence.push(`Episode pattern detected: ${episodePattern.type}`);
    if (episodePattern.seasonNumber) evidence.push(`Season: ${episodePattern.seasonNumber}`);
    if (episodePattern.episodeNumber) evidence.push(`Episode: ${episodePattern.episodeNumber}`);
  }

  return evidence;
}

/**
 * Score content type confidence
 */
export function scoreContentTypeConfidence(
  contentType: GeoContentType,
  evidence: string[],
  episodePattern: EpisodePattern | null
): number {
  let score = 50; // Neutral baseline

  const evidenceStr = evidence.join(' ').toLowerCase();

  // Pattern-based adjustments
  switch (contentType) {
    case 'movie':
      if (evidenceStr.includes('full movie')) score += 30;
      if (evidenceStr.includes('120') || evidenceStr.includes('120+')) score += 15;
      if (!evidenceStr.includes('episode') && !evidenceStr.includes('series')) score += 10;
      break;

    case 'episode':
      if (episodePattern?.type === 'explicit_sne') score += 40;
      if (episodePattern?.type === 'season_episode') score += 30;
      if (episodePattern?.type === 'simple_number') score += 20;
      break;

    case 'series':
      if (evidenceStr.includes('series')) score += 25;
      if (evidenceStr.includes('season')) score += 20;
      break;

    case 'trailer':
      if (evidenceStr.includes('trailer')) score += 40;
      break;

    case 'clip':
      if (evidenceStr.includes('clip')) score += 30;
      break;

    case 'interview':
      if (evidenceStr.includes('interview')) score += 40;
      break;

    default:
      break;
  }

  return Math.max(0, Math.min(100, score));
}
