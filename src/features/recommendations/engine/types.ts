import { TMDBMovie } from '@/lib/tmdb/endpoints';
import { Movie } from '@/types';

export interface TasteProfile {
  genres: Record<string, number>;
  languages: Record<string, number>;
  completionRate: number;
  averageRating: number;
  preferredRuntime: 'short' | 'medium' | 'long' | 'any';
  preferredActors: string[];
  preferredDirectors: string[];
  recentTitlesWatched: string[];
  favoriteGenreNames: string[];
}

export interface RecommendationReason {
  type: 'genre_affinity' | 'actor_match' | 'director_match' | 'weather_fit' | 'runtime_fit' | 'watched_similarity' | 'trending' | 'high_rating';
  label: string;
  weight: number;
}

export interface RecommendationScore {
  tasteMatch: number;
  contentGraphMatch: number;
  contextFit: number;
  behaviorScore: number;
  explorationScore: number;
  totalScore: number;
  confidence: number;
  reasons: RecommendationReason[];
}

export interface RecommendedItem {
  id: number | string;
  tmdbId: number;
  title: string;
  posterUrl: string;
  backdropUrl?: string;
  voteAverage: number;
  releaseYear?: number | string;
  genres: string[];
  mediaType: 'movie' | 'tv';
  score: RecommendationScore;
  primaryReason: string;
}

export interface RecommendationContext {
  weatherCondition?: string;
  temperature?: number;
  isWeekend?: boolean;
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
  selectedMood?: string;
  maxRuntimeMinutes?: number;
  currentSearchQuery?: string;
}
