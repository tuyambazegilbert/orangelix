/**
 * Recommendation Service 2.0
 * Multi-signal ranking, candidate generation, diversity filtering, and transparent explanations.
 */

import { tmdbClient } from '@/lib/tmdb/client';
import { tmdbEndpoints, TMDBMovie } from '@/lib/tmdb/endpoints';
import { MovieService } from '@/lib/movies';
import { POSTER_FALLBACK, BACKDROP_FALLBACK } from '@/lib/tmdb/images';
import {
  TasteProfile,
  RecommendationContext,
  RecommendedItem,
} from './engine/types';
import { computeRecommendationScore } from './engine/scoring';
import { applyDiversityFilter } from './engine/diversity';
import { getPrimaryExplanation } from './engine/explanations';

export const GENRE_MAP: Record<number, string> = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Sci-Fi',
  10770: 'TV Movie',
  53: 'Thriller',
  10752: 'War',
  37: 'Western',
};

function buildUserTasteProfile(userId?: string): TasteProfile {
  const genres: Record<string, number> = {};
  const favoriteGenreNames: string[] = [];

  if (userId) {
    const history = MovieService.getHistory(userId);
    const favorites = MovieService.getFavorites(userId);
    const ratings = MovieService.getRatings(userId);

    // 1. History signal with completion weighting
    history.forEach((h) => {
      const isCompleted = h.progress && h.duration ? h.progress / h.duration >= 0.8 : false;
      const weight = isCompleted ? 2.5 : 1.0;
      h.genre?.forEach((g) => {
        const key = g.toLowerCase();
        genres[key] = (genres[key] || 0) + weight;
      });
    });

    // 2. Favorites signal (weight: 3.0)
    favorites.forEach((f) => {
      f.genre?.forEach((g) => {
        const key = g.toLowerCase();
        genres[key] = (genres[key] || 0) + 3.0;
      });
    });

    // 3. Ratings signal (weight: rating / 2)
    ratings.forEach((r) => {
      const rWeight = r.rating >= 4 ? 2.0 : 0.5;
      genres['rating_bonus'] = (genres['rating_bonus'] || 0) + rWeight;
    });

    // Sort top genres
    const sorted = Object.entries(genres)
      .filter(([k]) => k !== 'rating_bonus')
      .sort((a, b) => b[1] - a[1])
      .map(([k]) => k.charAt(0).toUpperCase() + k.slice(1));

    if (sorted.length > 0) favoriteGenreNames.push(...sorted.slice(0, 3));
  }

  return {
    genres,
    languages: { en: 1.0 },
    completionRate: 0.75,
    averageRating: 4.5,
    preferredRuntime: 'medium',
    preferredActors: [],
    preferredDirectors: [],
    recentTitlesWatched: [],
    favoriteGenreNames,
  };
}

function mapTmdbToRecommended(
  candidates: TMDBMovie[],
  taste: TasteProfile,
  context?: RecommendationContext,
  mediaType: 'movie' | 'tv' = 'movie'
): RecommendedItem[] {
  return candidates.map((m) => {
    const score = computeRecommendationScore(m, taste, context);
    const genres = (m.genre_ids || []).map((id) => GENRE_MAP[id] || 'General');
    const title = m.title || m.name || 'Untitled';
    const releaseYear = m.release_date ? new Date(m.release_date).getFullYear() : undefined;
    const posterUrl = m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : POSTER_FALLBACK;
    const backdropUrl = m.backdrop_path ? `https://image.tmdb.org/t/p/w1280${m.backdrop_path}` : BACKDROP_FALLBACK;

    return {
      id: m.id,
      tmdbId: m.id,
      title,
      posterUrl,
      backdropUrl,
      voteAverage: Number((m.vote_average || 5.0).toFixed(1)),
      releaseYear,
      genres,
      mediaType,
      score,
      primaryReason: getPrimaryExplanation(score, title),
    };
  });
}

function getLocalFallbackRecommended(): RecommendedItem[] {
  const local = MovieService.getMovies();
  return local.map((m) => ({
    id: m.id,
    tmdbId: typeof m.id === 'number' ? m.id : 693134,
    title: m.title,
    posterUrl: m.imageUrl || POSTER_FALLBACK,
    backdropUrl: m.backdropUrl || BACKDROP_FALLBACK,
    voteAverage: m.rating || 4.8,
    releaseYear: m.releaseYear,
    genres: m.genre || ['Sci-Fi', 'Action'],
    mediaType: m.type === 'Series' ? 'tv' : 'movie',
    score: {
      tasteMatch: 0.8,
      contentGraphMatch: 0.8,
      contextFit: 0.8,
      behaviorScore: 0.8,
      explorationScore: 0.15,
      totalScore: 0.85,
      confidence: 0.9,
      reasons: [{ type: 'trending', label: 'Prime Movie Pick', weight: 0.4 }],
    },
    primaryReason: 'Prime atmospheric pick',
  }));
}

export const RecommendationService = {
  async getPersonalized(userId?: string, limit: number = 8): Promise<RecommendedItem[]> {
    const taste = buildUserTasteProfile(userId);
    try {
      const response = await tmdbClient.get<{ results: TMDBMovie[] }>(
        tmdbEndpoints.popularMovies,
        { page: 1 }
      );
      const raw = mapTmdbToRecommended(response.results || [], taste);
      return applyDiversityFilter(raw, limit);
    } catch {
      return getLocalFallbackRecommended().slice(0, limit);
    }
  },

  async getTonight(context: RecommendationContext, userId?: string, limit: number = 6): Promise<RecommendedItem[]> {
    const taste = buildUserTasteProfile(userId);
    try {
      const response = await tmdbClient.get<{ results: TMDBMovie[] }>(
        tmdbEndpoints.trendingAllWeek,
        { page: 1 }
      );
      const raw = mapTmdbToRecommended(response.results || [], taste, context);
      return applyDiversityFilter(raw, limit);
    } catch {
      return getLocalFallbackRecommended().slice(0, limit);
    }
  },

  async getWeatherRecs(
    weatherCondition: string,
    temperature: number,
    userId?: string,
    limit: number = 4
  ): Promise<RecommendedItem[]> {
    const isNight = new Date().getHours() >= 18;
    const context: RecommendationContext = {
      weatherCondition,
      temperature,
      timeOfDay: isNight ? 'night' : 'afternoon',
    };
    const taste = buildUserTasteProfile(userId);
    try {
      // Use trending movies or discover for reliable candidate generation
      const response = await tmdbClient.get<{ results: TMDBMovie[] }>(
        tmdbEndpoints.trendingMoviesWeek,
        { page: 1 }
      );
      const raw = mapTmdbToRecommended(response.results || [], taste, context);
      return applyDiversityFilter(raw, limit, 0.1);
    } catch {
      return getLocalFallbackRecommended().slice(0, limit);
    }
  },

  async getPostWatch(
    finishedTitle: string,
    finishedGenreId?: number,
    userId?: string,
    limit: number = 4
  ): Promise<RecommendedItem[]> {
    const taste = buildUserTasteProfile(userId);
    try {
      const response = finishedGenreId
        ? await tmdbClient.get<{ results: TMDBMovie[] }>(tmdbEndpoints.discoverMovie, {
            with_genres: finishedGenreId,
            sort_by: 'vote_average.desc',
            'vote_count.gte': 300,
          })
        : await tmdbClient.get<{ results: TMDBMovie[] }>(tmdbEndpoints.trendingMoviesWeek, { page: 1 });

      const raw = mapTmdbToRecommended(response.results || [], taste);
      raw.forEach((r) => {
        r.primaryReason = `Because you finished ${finishedTitle}`;
      });
      return applyDiversityFilter(raw, limit);
    } catch {
      return getLocalFallbackRecommended().slice(0, limit);
    }
  },

  async getBecauseYouWatched(
    title: string,
    genreId?: number,
    userId?: string,
    limit: number = 6
  ): Promise<RecommendedItem[]> {
    const taste = buildUserTasteProfile(userId);
    try {
      const response = genreId
        ? await tmdbClient.get<{ results: TMDBMovie[] }>(tmdbEndpoints.discoverMovie, {
            with_genres: genreId,
            sort_by: 'popularity.desc',
          })
        : await tmdbClient.get<{ results: TMDBMovie[] }>(tmdbEndpoints.popularMovies, { page: 2 });

      const raw = mapTmdbToRecommended(response.results || [], taste);
      raw.forEach((r) => {
        r.primaryReason = `Because you watched ${title}`;
      });
      return applyDiversityFilter(raw, limit);
    } catch {
      return getLocalFallbackRecommended().slice(0, limit);
    }
  },
};
