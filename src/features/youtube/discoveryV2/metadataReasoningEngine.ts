/**
 * OrangeFlix Discovery V2 — AI / LLM Metadata Reasoning Engine
 * Conforms strictly to Sections 70, 71, and 72 of the implementation specification.
 *
 * Provides structured, schema-validated reasoning for ambiguous candidates
 * (where deterministic classification yields 40–75 pending confidence).
 */

import { clamp } from './utils';

export interface AIMetadataInput {
  videoId: string;
  title: string;
  description?: string;
  durationSeconds: number;
  channelId: string;
  channelTitle?: string;
  channelCountry?: string;
  tags?: string[];
  targetCountryCode: string;
  knownSeriesTitles?: string[];
}

export interface AIMetadataOutput {
  countryCandidates: Array<{
    countryCode: string;
    confidence: number; // 0–100
  }>;
  languages: Array<{
    code: string;
    confidence: number; // 0–100
  }>;
  contentType:
    | 'movie'
    | 'series'
    | 'episode'
    | 'trailer'
    | 'clip'
    | 'interview'
    | 'music'
    | 'review'
    | 'unknown';
  contentConfidence: number; // 0–100
  series: {
    isSeriesRelated: boolean;
    title: string | null;
    confidence: number; // 0–100
  };
  season: {
    number: number | null;
    confidence: number; // 0–100
  };
  episode: {
    number: number | null;
    confidence: number; // 0–100
  };
  contradictions: string[];
  evidence: string[];
}

/**
 * Standard System Prompt conforming to Section 71
 */
export const AI_REASONING_SYSTEM_PROMPT = `You are OrangeFlix's metadata reasoning engine.
Analyze the supplied YouTube metadata.
You must not invent facts.
Separate observed evidence from inference.

Determine:
1. likely country/countries
2. language/languages
3. content type (movie, series, episode, trailer, clip, interview, music, review, unknown)
4. whether it is likely a movie
5. whether it is likely a series
6. whether it is likely an episode
7. likely series title
8. likely season number
9. likely episode number
10. contradictions
11. evidence
12. confidence from 0–100

Rules:
- A long duration does not prove that something is a movie.
- An episode can be longer than 60 minutes.
- Do not infer a season or episode number without evidence.
- "Part 1" does not automatically mean Episode 1.
- Country and language are separate concepts.
- YouTube metadata does not prove copyright ownership.
- Do not treat rights as verified.
- If information is unknown, return null.
- Never fabricate missing metadata.
- Prefer existing OrangeFlix series knowledge when provided.
- If the candidate probably belongs to an existing series, explain why.
- If evidence conflicts, explicitly report the conflict.
- Return JSON only.`;

/**
 * Validates and clamps raw JSON output conforming to Section 72
 */
export function validateAIMetadataOutput(raw: unknown): AIMetadataOutput | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;

  const validTypes = [
    'movie',
    'series',
    'episode',
    'trailer',
    'clip',
    'interview',
    'music',
    'review',
    'unknown',
  ];

  const contentType =
    typeof obj.contentType === 'string' && validTypes.includes(obj.contentType)
      ? (obj.contentType as AIMetadataOutput['contentType'])
      : 'unknown';

  const contentConfidence = clamp(
    typeof obj.contentConfidence === 'number' ? obj.contentConfidence : 50,
    0,
    100
  );

  const countryCandidates = Array.isArray(obj.countryCandidates)
    ? obj.countryCandidates
        .filter(
          (c) => c && typeof c === 'object' && typeof (c as Record<string, unknown>).countryCode === 'string'
        )
        .map((c) => ({
          countryCode: String((c as Record<string, unknown>).countryCode).toUpperCase().slice(0, 4),
          confidence: clamp(
            typeof (c as Record<string, unknown>).confidence === 'number'
              ? Number((c as Record<string, unknown>).confidence)
              : 50,
            0,
            100
          ),
        }))
    : [];

  const languages = Array.isArray(obj.languages)
    ? obj.languages
        .filter(
          (l) => l && typeof l === 'object' && typeof (l as Record<string, unknown>).code === 'string'
        )
        .map((l) => ({
          code: String((l as Record<string, unknown>).code).toLowerCase().slice(0, 10),
          confidence: clamp(
            typeof (l as Record<string, unknown>).confidence === 'number'
              ? Number((l as Record<string, unknown>).confidence)
              : 50,
            0,
            100
          ),
        }))
    : [];

  const seriesObj =
    obj.series && typeof obj.series === 'object' ? (obj.series as Record<string, unknown>) : {};
  const series = {
    isSeriesRelated: Boolean(seriesObj.isSeriesRelated),
    title: typeof seriesObj.title === 'string' && seriesObj.title ? String(seriesObj.title).trim() : null,
    confidence: clamp(typeof seriesObj.confidence === 'number' ? Number(seriesObj.confidence) : 0, 0, 100),
  };

  const seasonObj =
    obj.season && typeof obj.season === 'object' ? (obj.season as Record<string, unknown>) : {};
  const season = {
    number: typeof seasonObj.number === 'number' ? Number(seasonObj.number) : null,
    confidence: clamp(typeof seasonObj.confidence === 'number' ? Number(seasonObj.confidence) : 0, 0, 100),
  };

  const episodeObj =
    obj.episode && typeof obj.episode === 'object' ? (obj.episode as Record<string, unknown>) : {};
  const episode = {
    number: typeof episodeObj.number === 'number' ? Number(episodeObj.number) : null,
    confidence: clamp(typeof episodeObj.confidence === 'number' ? Number(episodeObj.confidence) : 0, 0, 100),
  };

  const contradictions = Array.isArray(obj.contradictions)
    ? obj.contradictions.map((c) => String(c)).filter(Boolean)
    : [];

  const evidence = Array.isArray(obj.evidence)
    ? obj.evidence.map((e) => String(e)).filter(Boolean)
    : [];

  return {
    countryCandidates,
    languages,
    contentType,
    contentConfidence,
    series,
    season,
    episode,
    contradictions,
    evidence,
  };
}

/**
 * Fallback deterministic reasoning engine when LLM is unavailable in client.
 * Evaluates complex signals deterministically following the same schema.
 */
export function reasonMetadataDeterministically(input: AIMetadataInput): AIMetadataOutput {
  const text = `${input.title} ${input.description || ''}`.toLowerCase();
  const contradictions: string[] = [];
  const evidence: string[] = [];

  // 1. Trailer / clip check
  if (/\btrailer\b|\bteaser\b|\bclip\b|\bscene\b/.test(text)) {
    evidence.push('Contains promotional or clip keyword');
    return {
      countryCandidates: [{ countryCode: input.targetCountryCode, confidence: 50 }],
      languages: [{ code: 'en', confidence: 60 }],
      contentType: 'trailer',
      contentConfidence: 90,
      series: { isSeriesRelated: false, title: null, confidence: 0 },
      season: { number: null, confidence: 0 },
      episode: { number: null, confidence: 0 },
      contradictions,
      evidence,
    };
  }

  // 2. Series / Episode check
  const epMatch = input.title.match(/(?:s(\d+)\s*)?(?:e|ep|episode|part)\s*(\d+)/i);
  if (epMatch) {
    const sNum = epMatch[1] ? parseInt(epMatch[1], 10) : null;
    const eNum = epMatch[2] ? parseInt(epMatch[2], 10) : null;
    evidence.push(`Detected episode marker in title: S${sNum || '?'}E${eNum || '?'}`);

    let matchedTitle: string | null = null;
    if (input.knownSeriesTitles && input.knownSeriesTitles.length > 0) {
      const lower = input.title.toLowerCase();
      const found = input.knownSeriesTitles.find((t) => lower.includes(t.toLowerCase()));
      if (found) {
        matchedTitle = found;
        evidence.push(`Matched known series database: "${found}"`);
      }
    }

    return {
      countryCandidates: [{ countryCode: input.targetCountryCode, confidence: 70 }],
      languages: [{ code: 'en', confidence: 60 }],
      contentType: 'episode',
      contentConfidence: 85,
      series: {
        isSeriesRelated: true,
        title: matchedTitle || input.title.replace(/(?:s\d+\s*)?(?:e|ep|episode|part)\s*\d+.*$/i, '').trim(),
        confidence: matchedTitle ? 90 : 75,
      },
      season: { number: sNum, confidence: sNum ? 85 : 0 },
      episode: { number: eNum, confidence: eNum ? 90 : 0 },
      contradictions,
      evidence,
    };
  }

  // 3. Movie check
  const isLong = input.durationSeconds >= 45 * 60;
  const hasFull = /full\s*(?:movie|film|length)/i.test(text);

  if (hasFull || isLong) {
    if (hasFull) evidence.push('Title/description contains full movie terminology');
    if (isLong) evidence.push(`Duration (${Math.round(input.durationSeconds / 60)}m) matches feature film length`);

    return {
      countryCandidates: [{ countryCode: input.targetCountryCode, confidence: 80 }],
      languages: [{ code: 'en', confidence: 60 }],
      contentType: 'movie',
      contentConfidence: hasFull ? 90 : 75,
      series: { isSeriesRelated: false, title: null, confidence: 0 },
      season: { number: null, confidence: 0 },
      episode: { number: null, confidence: 0 },
      contradictions,
      evidence,
    };
  }

  return {
    countryCandidates: [{ countryCode: input.targetCountryCode, confidence: 40 }],
    languages: [{ code: 'en', confidence: 50 }],
    contentType: 'unknown',
    contentConfidence: 40,
    series: { isSeriesRelated: false, title: null, confidence: 0 },
    season: { number: null, confidence: 0 },
    episode: { number: null, confidence: 0 },
    contradictions: ['Short duration and ambiguous terminology'],
    evidence: ['Insufficient conclusive signals'],
  };
}

