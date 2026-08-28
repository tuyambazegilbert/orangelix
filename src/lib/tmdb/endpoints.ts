export const tmdbEndpoints = {
  // Trending
  trending: (mediaType: 'all' | 'movie' | 'tv' = 'all', timeWindow: 'day' | 'week' = 'week') =>
    `/trending/${mediaType}/${timeWindow}`,
  trendingAllWeek: '/trending/all/week',
  trendingMoviesWeek: '/trending/movie/week',
  trendingSeriesWeek: '/trending/tv/week',

  // Movies
  popularMovies: '/movie/popular',
  nowPlayingMovies: '/movie/now_playing',
  topRatedMovies: '/movie/top_rated',
  upcomingMovies: '/movie/upcoming',
  movieDetails: (id: number) => `/movie/${id}`,
  movieCredits: (id: number) => `/movie/${id}/credits`,
  movieVideos: (id: number) => `/movie/${id}/videos`,
  movieSimilar: (id: number) => `/movie/${id}/similar`,
  movieRecommendations: (id: number) => `/movie/${id}/recommendations`,

  // TV Shows / Series
  popularSeries: '/tv/popular',
  topRatedSeries: '/tv/top_rated',
  onTheAirSeries: '/tv/on_the_air',
  airingTodaySeries: '/tv/airing_today',
  seriesDetails: (id: number) => `/tv/${id}`,
  seriesCredits: (id: number) => `/tv/${id}/credits`,
  seriesVideos: (id: number) => `/tv/${id}/videos`,
  seriesSimilar: (id: number) => `/tv/${id}/similar`,
  seriesRecommendations: (id: number) => `/tv/${id}/recommendations`,
  seasonDetails: (seriesId: number, seasonNumber: number) => `/tv/${seriesId}/season/${seasonNumber}`,

  // Search
  searchMulti: '/search/multi',
  searchMovie: '/search/movie',
  searchTv: '/search/tv',

  // Discovery
  discoverMovie: '/discover/movie',
  discoverTv: '/discover/tv',

  // Genres
  movieGenres: '/genre/movie/list',
  tvGenres: '/genre/tv/list',

  // People & Cast
  personDetails: (id: number) => `/person/${id}`,
  personCredits: (id: number) => `/person/${id}/combined_credits`,

  // Collections
  collectionDetails: (id: number) => `/collection/${id}`,
};

