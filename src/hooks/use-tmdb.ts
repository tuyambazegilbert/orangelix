import { useQuery } from '@tanstack/react-query';
import { tmdbClient } from '@/lib/tmdb/client';
import { tmdbEndpoints } from '@/lib/tmdb/endpoints';
import {
  normalizeTMDBMovie,
  normalizeTMDBTVShow,
  normalizeMultiSearchResult,
  normalizeMovieDetails,
  normalizeTVDetails,
  normalizeSeasonDetails,
} from '@/lib/tmdb/normalizer';
import {
  TMDBPaginatedResponse,
  TMDBMovie,
  TMDBTVShow,
  TMDBMultiSearchResult,
  TMDBGenreListResponse,
  TMDBMovieDetailsResponse,
  TMDBTVDetailsResponse,
  TMDBCreditsResponse,
  TMDBVideosResponse,
  TMDBSeasonDetailResponse,
  TMDBReview,
  TMDBReviewsResponse,
  TMDBWatchProvidersResponse,
  TMDBCountryWatchProviders,
} from '@/types/tmdb';
import { GeolocationService } from '@/services/geolocation';
import { MediaItem, MediaDetail, MediaEpisode, MediaType } from '@/types/media';

export const tmdbQueryKeys = {
  trending: (type: string, window: string) => ['tmdb', 'trending', type, window],
  popularMovies: (page: number) => ['tmdb', 'movies', 'popular', page],
  nowPlayingMovies: (page: number) => ['tmdb', 'movies', 'nowPlaying', page],
  topRatedMovies: (page: number) => ['tmdb', 'movies', 'topRated', page],
  upcomingMovies: (page: number) => ['tmdb', 'movies', 'upcoming', page],
  popularSeries: (page: number) => ['tmdb', 'tv', 'popular', page],
  topRatedSeries: (page: number) => ['tmdb', 'tv', 'topRated', page],
  onTheAirSeries: (page: number) => ['tmdb', 'tv', 'onTheAir', page],
  discoverMovies: (params: Record<string, unknown>) => ['tmdb', 'discover', 'movie', params],
  discoverSeries: (params: Record<string, unknown>) => ['tmdb', 'discover', 'tv', params],
  searchMulti: (query: string, page: number) => ['tmdb', 'search', 'multi', query, page],
  movieGenres: () => ['tmdb', 'genres', 'movie'],
  tvGenres: () => ['tmdb', 'genres', 'tv'],
  movieDetail: (id: number) => ['tmdb', 'movie', 'detail', id],
  tvDetail: (id: number) => ['tmdb', 'tv', 'detail', id],
  seasonDetail: (seriesId: number, seasonNumber: number) => ['tmdb', 'tv', 'season', seriesId, seasonNumber],
  hydratedItem: (type: string, id: number) => ['tmdb', 'hydrated', type, id],
};

const DEFAULT_STALE_TIME = 1000 * 60 * 5; // 5 minutes

// Genres
export function useMovieGenres() {
  return useQuery({
    queryKey: tmdbQueryKeys.movieGenres(),
    queryFn: async () => {
      const res = await tmdbClient.get<TMDBGenreListResponse>(tmdbEndpoints.movieGenres);
      const map: Record<number, string> = {};
      res.genres.forEach((g) => {
        map[g.id] = g.name;
      });
      return { list: res.genres, map };
    },
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
  });
}

export function useTvGenres() {
  return useQuery({
    queryKey: tmdbQueryKeys.tvGenres(),
    queryFn: async () => {
      const res = await tmdbClient.get<TMDBGenreListResponse>(tmdbEndpoints.tvGenres);
      const map: Record<number, string> = {};
      res.genres.forEach((g) => {
        map[g.id] = g.name;
      });
      return { list: res.genres, map };
    },
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
  });
}

// Trending
export function useTrending(
  mediaType: 'all' | 'movie' | 'tv' = 'all',
  timeWindow: 'day' | 'week' = 'week'
) {
  const { data: movieGenres } = useMovieGenres();
  const { data: tvGenres } = useTvGenres();

  const combinedGenreMap = {
    ...(movieGenres?.map || {}),
    ...(tvGenres?.map || {}),
  };

  return useQuery({
    queryKey: tmdbQueryKeys.trending(mediaType, timeWindow),
    queryFn: async () => {
      const res = await tmdbClient.get<TMDBPaginatedResponse<TMDBMultiSearchResult>>(
        tmdbEndpoints.trending(mediaType, timeWindow)
      );
      return {
        page: res.page,
        totalPages: res.total_pages,
        totalResults: res.total_results,
        items: res.results
          .map((item) => normalizeMultiSearchResult(item, combinedGenreMap))
          .filter(Boolean) as MediaItem[],
      };
    },
    staleTime: DEFAULT_STALE_TIME,
  });
}

// Movies
export function usePopularMovies(page = 1) {
  const { data: genres } = useMovieGenres();

  return useQuery({
    queryKey: tmdbQueryKeys.popularMovies(page),
    queryFn: async () => {
      const res = await tmdbClient.get<TMDBPaginatedResponse<TMDBMovie>>(
        tmdbEndpoints.popularMovies,
        { page }
      );
      return {
        page: res.page,
        totalPages: res.total_pages,
        totalResults: res.total_results,
        items: res.results.map((m) => normalizeTMDBMovie(m, genres?.map)),
      };
    },
    staleTime: DEFAULT_STALE_TIME,
  });
}

export function useNowPlayingMovies(page = 1) {
  const { data: genres } = useMovieGenres();

  return useQuery({
    queryKey: tmdbQueryKeys.nowPlayingMovies(page),
    queryFn: async () => {
      const res = await tmdbClient.get<TMDBPaginatedResponse<TMDBMovie>>(
        tmdbEndpoints.nowPlayingMovies,
        { page }
      );
      return {
        page: res.page,
        totalPages: res.total_pages,
        totalResults: res.total_results,
        items: res.results.map((m) => normalizeTMDBMovie(m, genres?.map)),
      };
    },
    staleTime: DEFAULT_STALE_TIME,
  });
}

export function useTopRatedMovies(page = 1) {
  const { data: genres } = useMovieGenres();

  return useQuery({
    queryKey: tmdbQueryKeys.topRatedMovies(page),
    queryFn: async () => {
      const res = await tmdbClient.get<TMDBPaginatedResponse<TMDBMovie>>(
        tmdbEndpoints.topRatedMovies,
        { page }
      );
      return {
        page: res.page,
        totalPages: res.total_pages,
        totalResults: res.total_results,
        items: res.results.map((m) => normalizeTMDBMovie(m, genres?.map)),
      };
    },
    staleTime: DEFAULT_STALE_TIME,
  });
}

export function useUpcomingMovies(page = 1) {
  const { data: genres } = useMovieGenres();

  return useQuery({
    queryKey: tmdbQueryKeys.upcomingMovies(page),
    queryFn: async () => {
      const res = await tmdbClient.get<TMDBPaginatedResponse<TMDBMovie>>(
        tmdbEndpoints.upcomingMovies,
        { page }
      );
      return {
        page: res.page,
        totalPages: res.total_pages,
        totalResults: res.total_results,
        items: res.results.map((m) => normalizeTMDBMovie(m, genres?.map)),
      };
    },
    staleTime: DEFAULT_STALE_TIME,
  });
}

// TV Series
export function usePopularSeries(page = 1) {
  const { data: genres } = useTvGenres();

  return useQuery({
    queryKey: tmdbQueryKeys.popularSeries(page),
    queryFn: async () => {
      const res = await tmdbClient.get<TMDBPaginatedResponse<TMDBTVShow>>(
        tmdbEndpoints.popularSeries,
        { page }
      );
      return {
        page: res.page,
        totalPages: res.total_pages,
        totalResults: res.total_results,
        items: res.results.map((s) => normalizeTMDBTVShow(s, genres?.map)),
      };
    },
    staleTime: DEFAULT_STALE_TIME,
  });
}

export function useTopRatedSeries(page = 1) {
  const { data: genres } = useTvGenres();

  return useQuery({
    queryKey: tmdbQueryKeys.topRatedSeries(page),
    queryFn: async () => {
      const res = await tmdbClient.get<TMDBPaginatedResponse<TMDBTVShow>>(
        tmdbEndpoints.topRatedSeries,
        { page }
      );
      return {
        page: res.page,
        totalPages: res.total_pages,
        totalResults: res.total_results,
        items: res.results.map((s) => normalizeTMDBTVShow(s, genres?.map)),
      };
    },
    staleTime: DEFAULT_STALE_TIME,
  });
}

export function useOnTheAirSeries(page = 1) {
  const { data: genres } = useTvGenres();

  return useQuery({
    queryKey: tmdbQueryKeys.onTheAirSeries(page),
    queryFn: async () => {
      const res = await tmdbClient.get<TMDBPaginatedResponse<TMDBTVShow>>(
        tmdbEndpoints.onTheAirSeries,
        { page }
      );
      return {
        page: res.page,
        totalPages: res.total_pages,
        totalResults: res.total_results,
        items: res.results.map((s) => normalizeTMDBTVShow(s, genres?.map)),
      };
    },
    staleTime: DEFAULT_STALE_TIME,
  });
}

// Discover
export interface DiscoverMovieParams {
  with_genres?: string;
  primary_release_year?: number;
  sort_by?: string;
  page?: number;
}

export function useDiscoverMovies(params: DiscoverMovieParams = {}) {
  const { data: genres } = useMovieGenres();
  const page = params.page || 1;

  return useQuery({
    queryKey: tmdbQueryKeys.discoverMovies({ ...params, page }),
    queryFn: async () => {
      const res = await tmdbClient.get<TMDBPaginatedResponse<TMDBMovie>>(
        tmdbEndpoints.discoverMovie,
        {
          ...params,
          page,
          include_adult: false,
        }
      );
      return {
        page: res.page,
        totalPages: res.total_pages,
        totalResults: res.total_results,
        items: res.results.map((m) => normalizeTMDBMovie(m, genres?.map)),
      };
    },
    staleTime: DEFAULT_STALE_TIME,
  });
}

export interface DiscoverSeriesParams {
  with_genres?: string;
  first_air_date_year?: number;
  sort_by?: string;
  page?: number;
}

export function useDiscoverSeries(params: DiscoverSeriesParams = {}) {
  const { data: genres } = useTvGenres();
  const page = params.page || 1;

  return useQuery({
    queryKey: tmdbQueryKeys.discoverSeries({ ...params, page }),
    queryFn: async () => {
      const res = await tmdbClient.get<TMDBPaginatedResponse<TMDBTVShow>>(
        tmdbEndpoints.discoverTv,
        {
          ...params,
          page,
          include_adult: false,
        }
      );
      return {
        page: res.page,
        totalPages: res.total_pages,
        totalResults: res.total_results,
        items: res.results.map((s) => normalizeTMDBTVShow(s, genres?.map)),
      };
    },
    staleTime: DEFAULT_STALE_TIME,
  });
}

// Search
export function useSearchMulti(query: string, page = 1) {
  const { data: movieGenres } = useMovieGenres();
  const { data: tvGenres } = useTvGenres();

  const combinedGenreMap = {
    ...(movieGenres?.map || {}),
    ...(tvGenres?.map || {}),
  };

  return useQuery({
    queryKey: tmdbQueryKeys.searchMulti(query, page),
    queryFn: async () => {
      if (!query || query.trim().length === 0) {
        return { page: 1, totalPages: 0, totalResults: 0, items: [] };
      }
      const res = await tmdbClient.get<TMDBPaginatedResponse<TMDBMultiSearchResult>>(
        tmdbEndpoints.searchMulti,
        {
          query: query.trim(),
          page,
          include_adult: false,
        }
      );
      return {
        page: res.page,
        totalPages: res.total_pages,
        totalResults: res.total_results,
        items: res.results
          .map((item) => normalizeMultiSearchResult(item, combinedGenreMap))
          .filter(Boolean) as MediaItem[],
      };
    },
    enabled: query.trim().length > 0,
    staleTime: DEFAULT_STALE_TIME,
  });
}

// Movie Details
export function useMovieDetails(id: number | null | undefined) {
  return useQuery({
    queryKey: tmdbQueryKeys.movieDetail(id || 0),
    queryFn: async () => {
      if (!id) throw new Error('Movie ID is required');

      const [details, credits, videos, similar, recommendations] = await Promise.all([
        tmdbClient.get<TMDBMovieDetailsResponse>(tmdbEndpoints.movieDetails(id)),
        tmdbClient.get<TMDBCreditsResponse>(tmdbEndpoints.movieCredits(id)).catch(() => undefined),
        tmdbClient.get<TMDBVideosResponse>(tmdbEndpoints.movieVideos(id)).catch(() => undefined),
        tmdbClient
          .get<TMDBPaginatedResponse<TMDBMovie>>(tmdbEndpoints.movieSimilar(id))
          .then((r) => r.results)
          .catch(() => []),
        tmdbClient
          .get<TMDBPaginatedResponse<TMDBMovie>>(tmdbEndpoints.movieRecommendations(id))
          .then((r) => r.results)
          .catch(() => []),
      ]);

      return normalizeMovieDetails(details, credits, videos, similar, recommendations);
    },
    enabled: Boolean(id && id > 0),
    staleTime: DEFAULT_STALE_TIME,
  });
}

// TV Details
export function useSeriesDetails(id: number | null | undefined) {
  return useQuery({
    queryKey: tmdbQueryKeys.tvDetail(id || 0),
    queryFn: async () => {
      if (!id) throw new Error('Series ID is required');

      const [details, credits, videos, similar, recommendations] = await Promise.all([
        tmdbClient.get<TMDBTVDetailsResponse>(tmdbEndpoints.seriesDetails(id)),
        tmdbClient.get<TMDBCreditsResponse>(tmdbEndpoints.seriesCredits(id)).catch(() => undefined),
        tmdbClient.get<TMDBVideosResponse>(tmdbEndpoints.seriesVideos(id)).catch(() => undefined),
        tmdbClient
          .get<TMDBPaginatedResponse<TMDBTVShow>>(tmdbEndpoints.seriesSimilar(id))
          .then((r) => r.results)
          .catch(() => []),
        tmdbClient
          .get<TMDBPaginatedResponse<TMDBTVShow>>(tmdbEndpoints.seriesRecommendations(id))
          .then((r) => r.results)
          .catch(() => []),
      ]);

      return normalizeTVDetails(details, credits, videos, similar, recommendations);
    },
    enabled: Boolean(id && id > 0),
    staleTime: DEFAULT_STALE_TIME,
  });
}

// Season Details
export function useSeasonDetails(seriesId: number | null | undefined, seasonNumber: number) {
  return useQuery({
    queryKey: tmdbQueryKeys.seasonDetail(seriesId || 0, seasonNumber),
    queryFn: async () => {
      if (!seriesId) throw new Error('Series ID is required');
      const res = await tmdbClient.get<TMDBSeasonDetailResponse>(
        tmdbEndpoints.seasonDetails(seriesId, seasonNumber)
      );
      return normalizeSeasonDetails(res);
    },
    enabled: Boolean(seriesId && seriesId > 0 && seasonNumber >= 0),
    staleTime: DEFAULT_STALE_TIME,
  });
}

// Media Reviews (Movies and TV Shows)
export function useMediaReviews(mediaType: 'movie' | 'tv', id: number | null | undefined) {
  return useQuery({
    queryKey: ['tmdb', mediaType, 'reviews', id || 0],
    queryFn: async (): Promise<TMDBReview[]> => {
      if (!id || id <= 0) return [];
      try {
        const endpoint = mediaType === 'tv' ? tmdbEndpoints.seriesReviews(id) : tmdbEndpoints.movieReviews(id);
        const res = await tmdbClient.get<TMDBReviewsResponse>(endpoint);
        return res?.results || [];
      } catch {
        return [];
      }
    },
    enabled: Boolean(id && id > 0),
    staleTime: DEFAULT_STALE_TIME,
  });
}

export function useMovieReviews(movieId: number | null | undefined) {
  return useMediaReviews('movie', movieId);
}

export function useSeriesReviews(seriesId: number | null | undefined) {
  return useMediaReviews('tv', seriesId);
}

// Single Item Hydration (for Favorites / WatchLater)
export function useHydratedItem(mediaType: MediaType, tmdbId: number) {
  return useQuery({
    queryKey: tmdbQueryKeys.hydratedItem(mediaType, tmdbId),
    queryFn: async () => {
      if (!tmdbId) return null;
      if (mediaType === 'movie') {
        const details = await tmdbClient.get<TMDBMovieDetailsResponse>(
          tmdbEndpoints.movieDetails(tmdbId)
        );
        return normalizeTMDBMovie(details);
      } else {
        const details = await tmdbClient.get<TMDBTVDetailsResponse>(
          tmdbEndpoints.seriesDetails(tmdbId)
        );
        return normalizeTMDBTVShow(details);
      }
    },
    enabled: Boolean(tmdbId > 0),
    staleTime: DEFAULT_STALE_TIME,
  });
}

export interface TMDBPersonFull {
  id: number;
  name: string;
  biography: string;
  birthday?: string;
  placeOfBirth?: string;
  profilePath?: string;
  knownForDepartment: string;
  popularity: number;
  credits: {
    cast: MediaItem[];
    crew: MediaItem[];
  };
}

export function usePersonDetails(personId: number | null | undefined) {
  return useQuery({
    queryKey: ['tmdb', 'person', personId],
    queryFn: async (): Promise<TMDBPersonFull> => {
      if (!personId) throw new Error('Person ID required');
      const [person, credits] = await Promise.all([
        tmdbClient.get<Record<string, unknown>>(tmdbEndpoints.personDetails(personId)),
        tmdbClient.get<Record<string, unknown>>(tmdbEndpoints.personCredits(personId)).catch(() => ({ cast: [], crew: [] })),
      ]);

      const castList = (Array.isArray(credits.cast) ? credits.cast : []) as Array<Record<string, unknown>>;
      const crewList = (Array.isArray(credits.crew) ? credits.crew : []) as Array<Record<string, unknown>>;

      const mapCredit = (c: Record<string, unknown>): MediaItem => {
        const isTv = c.media_type === 'tv';
        const title = String(c.title || c.name || 'Untitled');
        const posterPath = c.poster_path ? String(c.poster_path) : undefined;
        return {
          id: `${isTv ? 'tv' : 'movie'}-${c.id}`,
          tmdbId: Number(c.id),
          mediaType: isTv ? 'tv' : 'movie',
          title,
          overview: String(c.overview || ''),
          posterUrl: posterPath ? `https://image.tmdb.org/t/p/w500${posterPath}` : undefined,
          backdropUrl: c.backdrop_path ? `https://image.tmdb.org/t/p/w1280${c.backdrop_path}` : undefined,
          releaseYear: c.release_date || c.first_air_date ? new Date(String(c.release_date || c.first_air_date)).getFullYear() : undefined,
          voteAverage: Number(c.vote_average || 0),
          voteCount: Number(c.vote_count || 0),
          popularity: Number(c.popularity || 0),
          genres: [],
          genreIds: Array.isArray(c.genre_ids) ? (c.genre_ids as number[]) : [],
          originalLanguage: String(c.original_language || 'en'),
        };
      };

      return {
        id: Number(person.id),
        name: String(person.name || 'Artist'),
        biography: String(person.biography || 'No biography available for this talent.'),
        birthday: person.birthday ? String(person.birthday) : undefined,
        placeOfBirth: person.place_of_birth ? String(person.place_of_birth) : undefined,
        profilePath: person.profile_path ? `https://image.tmdb.org/t/p/w500${person.profile_path}` : undefined,
        knownForDepartment: String(person.known_for_department || 'Acting'),
        popularity: Number(person.popularity || 0),
        credits: {
          cast: castList.map(mapCredit),
          crew: crewList.map(mapCredit),
        },
      };
    },
    enabled: Boolean(personId && personId > 0),
    staleTime: DEFAULT_STALE_TIME,
  });
}

export interface WatchProvidersResult {
  countryCode: string;
  allCountries: string[];
  providers: TMDBCountryWatchProviders | null;
  rawResults: Record<string, TMDBCountryWatchProviders>;
}

export function useWatchProviders(mediaType: 'movie' | 'tv', id: number | null | undefined, customCountry?: string) {
  return useQuery({
    queryKey: ['tmdb', mediaType, 'watch-providers', id || 0, customCountry || 'auto'],
    queryFn: async (): Promise<WatchProvidersResult | null> => {
      if (!id || id <= 0) return null;
      try {
        const endpoint = mediaType === 'tv' ? tmdbEndpoints.seriesWatchProviders(id) : tmdbEndpoints.movieWatchProviders(id);
        const res = await tmdbClient.get<TMDBWatchProvidersResponse>(endpoint);
        if (!res?.results) return null;

        const availableCountries = Object.keys(res.results);
        if (availableCountries.length === 0) return null;

        let targetCountry = customCountry?.toUpperCase();
        if (!targetCountry) {
          const userCountry = GeolocationService.getUserCountry();
          if (userCountry) {
            targetCountry = userCountry.toUpperCase();
          }
        }

        let countryData: TMDBCountryWatchProviders | null = null;
        let effectiveCountry = targetCountry || '';

        if (targetCountry && res.results[targetCountry]) {
          countryData = res.results[targetCountry];
          effectiveCountry = targetCountry;
        } else if (res.results['US']) {
          countryData = res.results['US'];
          effectiveCountry = 'US';
        } else {
          effectiveCountry = availableCountries[0];
          countryData = res.results[effectiveCountry];
        }

        return {
          countryCode: effectiveCountry || 'US',
          allCountries: availableCountries,
          providers: countryData,
          rawResults: res.results,
        };
      } catch {
        return null;
      }
    },
    enabled: Boolean(id && id > 0),
    staleTime: DEFAULT_STALE_TIME,
  });
}


