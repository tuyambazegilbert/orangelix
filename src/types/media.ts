export type MediaType = 'movie' | 'tv';

export interface MediaItem {
  id: string; // composite key e.g. "movie-27205" or "tv-1399"
  tmdbId: number;
  mediaType: MediaType;
  title: string;
  description: string;
  posterUrl: string | null;
  backdropUrl: string | null;
  imageUrl: string; // Fallback image URL for backwards compatibility with existing UI components
  rating: number; // Normalized 0 - 5 scale for star ratings
  voteAverage: number; // Raw 0 - 10 scale
  voteCount: number;
  releaseDate: string | null;
  releaseYear: number | null;
  genres: string[];
  genreIds?: number[];
  duration: number | null; // in minutes (if available)
  trailerKey?: string | null;
  popularity?: number;
}

export interface MediaCast {
  id: number;
  name: string;
  character: string;
  profileUrl: string | null;
  order: number;
}

export interface MediaCrew {
  id: number;
  name: string;
  job: string;
  department: string;
  profileUrl: string | null;
}

export interface MediaVideo {
  id: string;
  name: string;
  key: string;
  site: string;
  type: string;
  official: boolean;
}

export interface MediaSeason {
  id: number;
  name: string;
  overview: string;
  posterUrl: string | null;
  seasonNumber: number;
  episodeCount: number;
  airDate: string | null;
}

export interface MediaEpisode {
  id: number;
  name: string;
  overview: string;
  episodeNumber: number;
  seasonNumber: number;
  airDate: string | null;
  stillUrl: string | null;
  runtime: number | null;
  rating: number;
  voteCount: number;
}

export interface MediaDetail extends MediaItem {
  tagline: string | null;
  status: string | null;
  cast: MediaCast[];
  crew: MediaCrew[];
  videos: MediaVideo[];
  similar: MediaItem[];
  recommendations: MediaItem[];
  // TV specific fields
  numberOfSeasons?: number;
  numberOfEpisodes?: number;
  seasons?: MediaSeason[];
  createdByName?: string;
  homepage?: string | null;
}

export interface StoredMediaReference {
  id: string;
  tmdbId: number;
  mediaType: MediaType;
  userId: string;
  createdAt: string;
  title?: string;
  posterUrl?: string | null;
  rating?: number;
  releaseYear?: number | null;
}

