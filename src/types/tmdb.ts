export interface TMDBPaginatedResponse<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

export interface TMDBGenre {
  id: number;
  name: string;
}

export interface TMDBGenreListResponse {
  genres: TMDBGenre[];
}

export interface TMDBMovie {
  id: number;
  title: string;
  original_title?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  media_type?: 'movie';
  genre_ids?: number[];
  genres?: TMDBGenre[];
  release_date?: string;
  vote_average: number;
  vote_count: number;
  popularity?: number;
  adult?: boolean;
  video?: boolean;
}

export interface TMDBTVShow {
  id: number;
  name: string;
  original_name?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  media_type?: 'tv';
  genre_ids?: number[];
  genres?: TMDBGenre[];
  first_air_date?: string;
  vote_average: number;
  vote_count: number;
  popularity?: number;
  origin_country?: string[];
  episode_run_time?: number[];
}

export type TMDBMultiSearchResult = (TMDBMovie & { media_type: 'movie' }) | (TMDBTVShow & { media_type: 'tv' }) | {
  id: number;
  name: string;
  media_type: 'person';
  profile_path?: string | null;
  known_for?: (TMDBMovie | TMDBTVShow)[];
};

export interface TMDBProductionCompany {
  id: number;
  name: string;
  logo_path: string | null;
  origin_country: string;
}

export interface TMDBMovieDetailsResponse extends TMDBMovie {
  tagline?: string | null;
  runtime?: number | null;
  status?: string;
  budget?: number;
  revenue?: number;
  genres: TMDBGenre[];
  homepage?: string | null;
  imdb_id?: string | null;
  production_companies?: TMDBProductionCompany[];
}

export interface TMDBNetwork {
  id: number;
  name: string;
  logo_path: string | null;
  origin_country: string;
}

export interface TMDBTVSeasonSummary {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  season_number: number;
  episode_count: number;
  air_date: string | null;
}

export interface TMDBTVDetailsResponse extends TMDBTVShow {
  tagline?: string | null;
  status?: string;
  genres: TMDBGenre[];
  number_of_seasons: number;
  number_of_episodes: number;
  seasons: TMDBTVSeasonSummary[];
  created_by?: {
    id: number;
    name: string;
    profile_path: string | null;
  }[];
  networks?: TMDBNetwork[];
  homepage?: string | null;
}

export interface TMDBCastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
  known_for_department?: string;
}

export interface TMDBCrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
  profile_path: string | null;
}

export interface TMDBCreditsResponse {
  id: number;
  cast: TMDBCastMember[];
  crew: TMDBCrewMember[];
}

export interface TMDBVideo {
  id: string;
  iso_639_1: string;
  iso_3166_1: string;
  name: string;
  key: string;
  site: string; // "YouTube" | "Vimeo" etc.
  size: number;
  type: string; // "Trailer" | "Teaser" | "Clip" | "Featurette"
  official: boolean;
  published_at: string;
}

export interface TMDBVideosResponse {
  id: number;
  results: TMDBVideo[];
}

export interface TMDBEpisode {
  id: number;
  name: string;
  overview: string;
  episode_number: number;
  season_number: number;
  air_date: string | null;
  still_path: string | null;
  runtime?: number | null;
  vote_average: number;
  vote_count: number;
}

export interface TMDBSeasonDetailResponse {
  id: number;
  name: string;
  overview: string;
  season_number: number;
  poster_path: string | null;
  air_date: string | null;
  episodes: TMDBEpisode[];
}

