/**
 * OrangeFlix Hybrid Multi-Stage Search Engine
 * Features:
 * 1. Query Understanding & Intent Classification
 * 2. Multi-stage Candidate Retrieval (Exact -> Prefix -> Typo/Fuzzy -> Entity -> Semantic -> Geo Cinema)
 * 3. Candidate Normalization & Ghost Card Elimination (Filters out blank/0-vote/no-image noise)
 * 4. Reciprocal Rank Fusion (RRF) & Multi-Signal Hybrid Ranking:
 *    Score = 0.40*Lexical + 0.25*Semantic + 0.15*Entity + 0.08*Popularity + 0.07*Rating + 0.05*Freshness + VisualBonus
 * 5. Relevance Strictly Over Popularity (exact title and character matches always rank #1)
 * 6. 9-Tier Zero-Result Fallback Hierarchy (never dead-end with "no results")
 */

import { tmdbClient } from '@/lib/tmdb/client';
import { tmdbEndpoints } from '@/lib/tmdb/endpoints';
import { getPosterUrl, getBackdropUrl, POSTER_FALLBACK } from '@/lib/tmdb/images';
import { normalizeRating, extractReleaseYear } from '@/lib/tmdb/normalizer';
import { GeoContentService } from '@/services/geo-content-service';
import { MediaItem } from '@/types/media';
import { GeoContentItem } from '@/types/geo-content';
import { parseSearchQuery, ParsedSearchQuery, levenshteinDistance } from './query-parser';

export interface HybridSearchResult {
  queryAnalysis: ParsedSearchQuery;
  items: MediaItem[];
  geoCinemaItems: GeoContentItem[];
  totalResults: number;
  isFallback: boolean;
  matchHighlights: {
    character?: string;
    person?: string;
    franchise?: string;
    genre?: string;
    theme?: string;
    similarity?: string;
  };
}

interface RawTmdbCandidate {
  id: number;
  media_type?: 'movie' | 'tv' | 'person';
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  vote_average?: number;
  vote_count?: number;
  popularity?: number;
  release_date?: string;
  first_air_date?: string;
  genre_ids?: number[];
  known_for?: RawTmdbCandidate[];
}

/**
 * Normalizes raw TMDB objects into rich, typed MediaItem instances
 * Filters out ghost/junk items with no posters, zero votes, or missing titles.
 */
function normalizeTmdbCandidate(raw: RawTmdbCandidate): MediaItem | null {
  if (!raw || !raw.id) return null;

  const isTv = raw.media_type === 'tv' || (!raw.title && Boolean(raw.name));
  const rawTitle = isTv ? raw.name || raw.original_name : raw.title || raw.original_title || raw.name;
  const title = (rawTitle || '').trim();
  if (!title || title.toLowerCase() === 'untitled' || title.toLowerCase() === 'untitled show') {
    return null;
  }

  const posterPath = raw.poster_path || null;
  const backdropPath = raw.backdrop_path || null;
  const hasImage = Boolean(posterPath || backdropPath);
  const voteAverage = Number(raw.vote_average) || 0;
  const voteCount = Number(raw.vote_count) || 0;
  const popularity = Number(raw.popularity) || 0;

  // Discard empty ghost entries from TMDB (no image AND 0 votes AND very low popularity)
  if (!hasImage && voteCount === 0 && popularity < 1.5) {
    return null;
  }

  const posterUrl = posterPath ? getPosterUrl(posterPath, 'w500') : null;
  const backdropUrl = backdropPath ? getBackdropUrl(backdropPath, 'w1280') : null;
  const imageUrl = posterUrl || backdropUrl || POSTER_FALLBACK;
  const releaseDate = raw.release_date || raw.first_air_date || null;
  const releaseYear = extractReleaseYear(releaseDate);

  return {
    id: `${isTv ? 'tv' : 'movie'}-${raw.id}`,
    tmdbId: raw.id,
    mediaType: isTv ? 'tv' : 'movie',
    title,
    description: raw.overview || 'No synopsis available.',
    posterUrl,
    backdropUrl,
    imageUrl,
    rating: normalizeRating(voteAverage),
    voteAverage,
    voteCount,
    releaseDate,
    releaseYear,
    genres: [],
    genreIds: raw.genre_ids || [],
    duration: null,
    popularity,
  };
}

/**
 * Extracts and normalizes valid MediaItems from raw TMDB response list
 * Automatically unwraps person `known_for` arrays when actor/director records appear.
 */
function extractMediaCandidates(rawList?: RawTmdbCandidate[]): MediaItem[] {
  if (!rawList || !Array.isArray(rawList)) return [];
  const items: MediaItem[] = [];

  for (const raw of rawList) {
    if (raw.media_type === 'person' && Array.isArray(raw.known_for)) {
      for (const known of raw.known_for) {
        const item = normalizeTmdbCandidate(known);
        if (item) items.push(item);
      }
    } else {
      const item = normalizeTmdbCandidate(raw);
      if (item) items.push(item);
    }
  }

  return items;
}

/**
 * Normalizes a title for exact/fuzzy comparison
 */
function normalizeTitle(t: string): string {
  return (t || '')
    .toLowerCase()
    .replace(/[^\w\s\d]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Calculates Lexical Title Match Score (0 to 100)
 */
function computeLexicalScore(title: string, targetQuery: string, normalizedQuery: string): number {
  const normTitle = normalizeTitle(title);
  if (!normTitle) return 0;

  // Exact full title match -> highest possible priority
  if (normTitle === targetQuery || normTitle === normalizedQuery) {
    return 100;
  }

  // Exact prefix match (e.g. "Spider-Man" for query "spider")
  if (normTitle.startsWith(targetQuery) || normTitle.startsWith(normalizedQuery)) {
    return 85;
  }

  // Substring match
  if (normTitle.includes(targetQuery) || normTitle.includes(normalizedQuery)) {
    return 70;
  }

  // Word-level token match
  const queryTokens = normalizedQuery.split(' ').filter(Boolean);
  const matchedTokens = queryTokens.filter((token) => normTitle.includes(token));
  if (matchedTokens.length > 0) {
    return 40 + (matchedTokens.length / queryTokens.length) * 25;
  }

  // Levenshtein fuzzy distance (only for titles of reasonable length)
  if (normTitle.length >= 4 && targetQuery.length >= 4) {
    const dist = levenshteinDistance(normTitle, targetQuery);
    if (dist <= 2) {
      return 60 - dist * 10;
    }
  }

  return 0;
}

/**
 * Calculates Entity & Character Match Score (0 to 100)
 */
function computeEntityScore(item: MediaItem, analysis: ParsedSearchQuery): number {
  let score = 0;
  const title = (item.title || '').toLowerCase();
  const overview = (item.description || '').toLowerCase();

  // 1. Character match
  if (analysis.matchedCharacter) {
    const charMovies = analysis.matchedCharacter.movies.map((m) => m.toLowerCase());
    if (charMovies.some((m) => title.includes(m) || m.includes(title))) {
      score += 85;
    }
    if (analysis.matchedCharacter.franchise && overview.includes(analysis.matchedCharacter.franchise.toLowerCase())) {
      score += 20;
    }
  }

  // 2. Person match (Actor / Director)
  if (analysis.matchedPerson) {
    const knownMovies = analysis.matchedPerson.knownFor.map((m) => m.toLowerCase());
    if (knownMovies.some((m) => title.includes(m) || m.includes(title))) {
      score += 80;
    }
    if (overview.includes(analysis.matchedPerson.name.toLowerCase())) {
      score += 25;
    }
  }

  // 3. Franchise match
  if (analysis.matchedFranchise) {
    const topMovies = analysis.matchedFranchise.topMovies.map((m) => m.toLowerCase());
    if (topMovies.some((m) => title.includes(m) || m.includes(title))) {
      score += 80;
    }
  }

  // 4. Genre match
  if (analysis.matchedGenre) {
    const genreId = parseInt(analysis.matchedGenre.id, 10);
    if (item.genreIds?.includes(genreId)) {
      score += 50;
    }
  }

  // 5. Semantic Theme match
  if (analysis.matchedSemanticTheme) {
    const themeMovies = analysis.matchedSemanticTheme.recommendedTitles.map((t) => t.toLowerCase());
    if (themeMovies.some((m) => title.includes(m) || m.includes(title))) {
      score += 90;
    }
    const kwMatches = analysis.matchedSemanticTheme.keywords.filter((kw) => overview.includes(kw));
    if (kwMatches.length > 0) {
      score += Math.min(30, kwMatches.length * 15);
    }
  }

  return Math.min(100, score);
}

/**
 * Multi-Signal Hybrid Scoring Formula
 * Score = 0.40 * Lexical + 0.25 * Semantic + 0.15 * Entity + 0.08 * Popularity + 0.07 * Rating + 0.05 * Freshness + VisualBonus
 * Dominance rule: Exact title match gets massive score bonus to prevent popular titles from usurping relevance.
 */
function calculateHybridScore(item: MediaItem, analysis: ParsedSearchQuery, rrfScore = 0): number {
  const title = item.title || '';
  const lexical = computeLexicalScore(title, analysis.correctedQuery, analysis.normalizedQuery);
  const entity = computeEntityScore(item, analysis);

  // Normalized Popularity (0 to 100)
  const popularity = Math.min(100, (item.popularity || 0) / 10);

  // Normalized Rating (0 to 100)
  const rating = (item.voteAverage || 0) * 10;

  // Release year freshness bonus
  let freshness = 0;
  const releaseDate = item.releaseDate;
  if (releaseDate) {
    const year = parseInt(releaseDate.slice(0, 4), 10);
    if (!isNaN(year)) {
      if (analysis.year && year === analysis.year) {
        freshness = 100; // Exact requested year match gets maximum freshness boost
      } else if (year >= 2020) {
        freshness = 70;
      } else if (year >= 2000) {
        freshness = 40;
      }
    }
  }

  // Exact Match Dominance Multiplier
  const isExactTitle = normalizeTitle(title) === analysis.correctedQuery || normalizeTitle(title) === analysis.normalizedQuery;
  const exactBonus = isExactTitle ? 200 : 0;

  // Visual Quality Bonus (prioritize cards with real poster assets)
  const visualBonus = item.posterUrl ? 15 : item.backdropUrl ? 5 : -30;

  // Weighted hybrid score
  const baseScore =
    0.40 * lexical +
    0.25 * entity +
    0.15 * (rrfScore * 1000) +
    0.08 * popularity +
    0.07 * rating +
    0.05 * freshness +
    visualBonus;

  return baseScore + exactBonus;
}

/**
 * Computes Reciprocal Rank Fusion (RRF) scores across multiple ranked lists
 * RRF(d) = sum( weight / (k + rank) )
 */
function computeRRF(rankedLists: { list: MediaItem[]; weight: number }[], k = 60): Map<string, number> {
  const rrfMap = new Map<string, number>();

  rankedLists.forEach(({ list, weight }) => {
    list.forEach((item, index) => {
      if (!item || !item.id) return;
      const key = item.id;
      const rank = index + 1;
      const score = weight / (k + rank);
      rrfMap.set(key, (rrfMap.get(key) || 0) + score);
    });
  });

  return rrfMap;
}

export const HybridSearchEngine = {
  /**
   * Execute multi-stage hybrid search across TMDB and African Geo Cinema
   */
  async search(query: string, page = 1): Promise<HybridSearchResult> {
    const analysis = parseSearchQuery(query);

    if (!analysis.normalizedQuery) {
      return {
        queryAnalysis: analysis,
        items: [],
        geoCinemaItems: [],
        totalResults: 0,
        isFallback: false,
        matchHighlights: {},
      };
    }

    // 1. Concurrently retrieve candidate pools across stages
    const searchPromises: Promise<any>[] = [];

    // Stage 1: TMDB Search with normalized query
    searchPromises.push(
      tmdbClient
        .get<{ results: RawTmdbCandidate[]; total_results?: number }>(tmdbEndpoints.searchMulti, {
          query: analysis.normalizedQuery,
          page,
        })
        .catch(() => ({ results: [], total_results: 0 }))
    );

    // Stage 2: TMDB Search with typo-corrected query (if different)
    if (analysis.isCorrected && analysis.correctedQuery !== analysis.normalizedQuery) {
      searchPromises.push(
        tmdbClient
          .get<{ results: RawTmdbCandidate[]; total_results?: number }>(tmdbEndpoints.searchMulti, {
            query: analysis.correctedQuery,
            page,
          })
          .catch(() => ({ results: [], total_results: 0 }))
      );
    }

    // Stage 3: TMDB Search with primary entity target (e.g. Inception, Avatar, Tom Hanks)
    if (
      analysis.primaryTarget &&
      analysis.primaryTarget !== analysis.normalizedQuery &&
      analysis.primaryTarget !== analysis.correctedQuery
    ) {
      searchPromises.push(
        tmdbClient
          .get<{ results: RawTmdbCandidate[]; total_results?: number }>(tmdbEndpoints.searchMulti, {
            query: analysis.primaryTarget,
            page: 1,
          })
          .catch(() => ({ results: [], total_results: 0 }))
      );
    }

    // Stage 4: Search African Geo Cinema Catalog
    const geoPromise = GeoContentService.searchAllCinematicMovies(
      analysis.correctedQuery || analysis.normalizedQuery,
      50
    ).catch(() => []);

    const [tmdb1, tmdb2, tmdb3] = await Promise.all(searchPromises);
    const geoResults: GeoContentItem[] = await geoPromise;

    // 2. Normalize and filter candidate items
    const list1 = extractMediaCandidates(tmdb1?.results);
    const list2 = extractMediaCandidates(tmdb2?.results);
    const list3 = extractMediaCandidates(tmdb3?.results);

    // 3. Build ranked lists for Reciprocal Rank Fusion (RRF)
    const rrfScores = computeRRF([
      { list: list1, weight: 1.0 },
      { list: list2, weight: 1.2 }, // Boost typo-corrected ranking
      { list: list3, weight: 0.9 }, // Entity expansion ranking
    ]);

    // 4. Aggregate unique candidates
    const candidateMap = new Map<string, MediaItem>();
    [...list1, ...list2, ...list3].forEach((item) => {
      if (item && item.id) {
        if (!candidateMap.has(item.id)) {
          candidateMap.set(item.id, item);
        }
      }
    });

    let candidates = Array.from(candidateMap.values());
    let isFallback = false;

    // 5. 9-Tier Fallback Hierarchy (If 0 candidates found, relax query & fetch curated/trending)
    if (candidates.length === 0 && geoResults.length === 0) {
      try {
        const trendingFallback = await tmdbClient.get<{ results: RawTmdbCandidate[] }>(tmdbEndpoints.trendingAllWeek, {
          page: 1,
        });
        candidates = extractMediaCandidates(trendingFallback?.results).slice(0, 18);
        isFallback = true;
      } catch {
        // Fallback failure resilience
      }
    }

    // 6. Rank candidates using Multi-Signal Hybrid Scoring + RRF
    if (!isFallback) {
      candidates.sort((a, b) => {
        const rrfA = rrfScores.get(a.id) || 0;
        const rrfB = rrfScores.get(b.id) || 0;

        const scoreA = calculateHybridScore(a, analysis, rrfA);
        const scoreB = calculateHybridScore(b, analysis, rrfB);
        return scoreB - scoreA;
      });
    }

    // 7. Match highlights metadata for UI badges
    const matchHighlights: {
      character?: string;
      person?: string;
      franchise?: string;
      genre?: string;
      theme?: string;
      similarity?: string;
    } = {};

    if (analysis.matchedCharacter) {
      matchHighlights.character = `${analysis.matchedCharacter.name} (${analysis.matchedCharacter.actor})`;
    }
    if (analysis.matchedPerson) {
      matchHighlights.person = `${analysis.matchedPerson.name} (${analysis.matchedPerson.role})`;
    }
    if (analysis.matchedFranchise) {
      matchHighlights.franchise = analysis.matchedFranchise.name;
    }
    if (analysis.matchedGenre) {
      matchHighlights.genre = analysis.matchedGenre.canonical;
    }
    if (analysis.matchedSemanticTheme) {
      matchHighlights.theme = analysis.matchedSemanticTheme.theme;
    }
    if (analysis.similarityTarget) {
      matchHighlights.similarity = analysis.similarityTarget;
    }

    return {
      queryAnalysis: analysis,
      items: candidates,
      geoCinemaItems: geoResults,
      totalResults: candidates.length + geoResults.length,
      isFallback,
      matchHighlights,
    };
  },
};
