import {
  TMDBMovie,
  TMDBTVShow,
  TMDBMultiSearchResult,
  TMDBMovieDetailsResponse,
  TMDBTVDetailsResponse,
  TMDBVideosResponse,
  TMDBVideo,
  TMDBCreditsResponse,
  TMDBSeasonDetailResponse,
} from '@/types/tmdb';
import {
  MediaItem,
  MediaDetail,
  MediaCast,
  MediaCrew,
  MediaVideo,
  MediaEpisode,
  MediaSeason,
} from '@/types/media';
import { getPosterUrl, getBackdropUrl, getProfileUrl, getStillUrl } from './images';

export function normalizeRating(voteAverage: number): number {
  if (!voteAverage || isNaN(voteAverage)) return 0;
  return Math.round((voteAverage / 2) * 10) / 10;
}

export function extractReleaseYear(dateString?: string | null): number | null {
  if (!dateString || typeof dateString !== 'string') return null;
  const year = parseInt(dateString.slice(0, 4), 10);
  return isNaN(year) ? null : year;
}

export function findBestTrailer(videos?: TMDBVideo[]): string | null {
  if (!videos || videos.length === 0) return null;

  // Filter for YouTube videos
  const youtubeVideos = videos.filter((v) => v.site === 'YouTube');
  if (youtubeVideos.length === 0) return null;

  // 1. Official Trailer
  const officialTrailer = youtubeVideos.find((v) => v.type === 'Trailer' && v.official);
  if (officialTrailer) return officialTrailer.key;

  // 2. Any Trailer
  const anyTrailer = youtubeVideos.find((v) => v.type === 'Trailer');
  if (anyTrailer) return anyTrailer.key;

  // 3. Teaser
  const teaser = youtubeVideos.find((v) => v.type === 'Teaser');
  if (teaser) return teaser.key;

  // 4. Fallback to first video
  return youtubeVideos[0].key;
}

export function normalizeTMDBMovie(
  movie: TMDBMovie,
  genreMap?: Record<number, string>
): MediaItem {
  const genres = movie.genres
    ? movie.genres.map((g) => g.name)
    : (movie.genre_ids || [])
        .map((id) => (genreMap ? genreMap[id] : ''))
        .filter(Boolean);

  const poster = getPosterUrl(movie.poster_path, 'w500');
  const backdrop = getBackdropUrl(movie.backdrop_path, 'w1280');

  return {
    id: `movie-${movie.id}`,
    tmdbId: movie.id,
    mediaType: 'movie',
    title: movie.title || movie.original_title || 'Untitled',
    description: movie.overview || 'No synopsis available.',
    posterUrl: movie.poster_path ? poster : null,
    backdropUrl: movie.backdrop_path ? backdrop : null,
    imageUrl: poster,
    rating: normalizeRating(movie.vote_average),
    voteAverage: movie.vote_average || 0,
    voteCount: movie.vote_count || 0,
    releaseDate: movie.release_date || null,
    releaseYear: extractReleaseYear(movie.release_date),
    genres,
    genreIds: movie.genre_ids,
    duration: null,
    popularity: movie.popularity,
  };
}

export function normalizeTMDBTVShow(
  show: TMDBTVShow,
  genreMap?: Record<number, string>
): MediaItem {
  const genres = show.genres
    ? show.genres.map((g) => g.name)
    : (show.genre_ids || [])
        .map((id) => (genreMap ? genreMap[id] : ''))
        .filter(Boolean);

  const poster = getPosterUrl(show.poster_path, 'w500');
  const backdrop = getBackdropUrl(show.backdrop_path, 'w1280');

  return {
    id: `tv-${show.id}`,
    tmdbId: show.id,
    mediaType: 'tv',
    title: show.name || show.original_name || 'Untitled Show',
    description: show.overview || 'No synopsis available.',
    posterUrl: show.poster_path ? poster : null,
    backdropUrl: show.backdrop_path ? backdrop : null,
    imageUrl: poster,
    rating: normalizeRating(show.vote_average),
    voteAverage: show.vote_average || 0,
    voteCount: show.vote_count || 0,
    releaseDate: show.first_air_date || null,
    releaseYear: extractReleaseYear(show.first_air_date),
    genres,
    genreIds: show.genre_ids,
    duration: show.episode_run_time?.[0] || null,
    popularity: show.popularity,
  };
}

export function normalizeMultiSearchResult(
  item: TMDBMultiSearchResult,
  genreMap?: Record<number, string>
): MediaItem | null {
  if (item.media_type === 'movie') {
    return normalizeTMDBMovie(item as TMDBMovie, genreMap);
  }
  if (item.media_type === 'tv') {
    return normalizeTMDBTVShow(item as TMDBTVShow, genreMap);
  }
  return null;
}

export function normalizeCast(credits?: TMDBCreditsResponse): MediaCast[] {
  if (!credits?.cast) return [];
  return credits.cast.slice(0, 15).map((member) => ({
    id: member.id,
    name: member.name,
    character: member.character,
    profileUrl: getProfileUrl(member.profile_path, 'w185'),
    order: member.order,
  }));
}

export function normalizeCrew(credits?: TMDBCreditsResponse): MediaCrew[] {
  if (!credits?.crew) return [];
  const keyJobs = ['Director', 'Producer', 'Writer', 'Screenplay', 'Creator', 'Executive Producer'];
  return credits.crew
    .filter((member) => keyJobs.includes(member.job))
    .slice(0, 10)
    .map((member) => ({
      id: member.id,
      name: member.name,
      job: member.job,
      department: member.department,
      profileUrl: getProfileUrl(member.profile_path, 'w185'),
    }));
}

export function normalizeVideos(videosResponse?: TMDBVideosResponse): MediaVideo[] {
  if (!videosResponse?.results) return [];
  return videosResponse.results.map((video) => ({
    id: video.id,
    name: video.name,
    key: video.key,
    site: video.site,
    type: video.type,
    official: video.official,
  }));
}

export function normalizeMovieDetails(
  details: TMDBMovieDetailsResponse,
  credits?: TMDBCreditsResponse,
  videos?: TMDBVideosResponse,
  similar?: TMDBMovie[],
  recommendations?: TMDBMovie[]
): MediaDetail {
  const base = normalizeTMDBMovie(details);
  const normalizedVideos = normalizeVideos(videos);

  return {
    ...base,
    duration: details.runtime || null,
    tagline: details.tagline || null,
    status: details.status || null,
    trailerKey: findBestTrailer(videos?.results),
    cast: normalizeCast(credits),
    crew: normalizeCrew(credits),
    videos: normalizedVideos,
    similar: (similar || []).map((m) => normalizeTMDBMovie(m)),
    recommendations: (recommendations || []).map((m) => normalizeTMDBMovie(m)),
    homepage: details.homepage || null,
  };
}

export function normalizeTVDetails(
  details: TMDBTVDetailsResponse,
  credits?: TMDBCreditsResponse,
  videos?: TMDBVideosResponse,
  similar?: TMDBTVShow[],
  recommendations?: TMDBTVShow[]
): MediaDetail {
  const base = normalizeTMDBTVShow(details);
  const normalizedVideos = normalizeVideos(videos);

  const seasons: MediaSeason[] = (details.seasons || []).map((season) => ({
    id: season.id,
    name: season.name,
    overview: season.overview,
    posterUrl: getPosterUrl(season.poster_path, 'w342'),
    seasonNumber: season.season_number,
    episodeCount: season.episode_count,
    airDate: season.air_date,
  }));

  return {
    ...base,
    tagline: details.tagline || null,
    status: details.status || null,
    numberOfSeasons: details.number_of_seasons,
    numberOfEpisodes: details.number_of_episodes,
    seasons,
    createdByName: details.created_by?.map((c) => c.name).join(', ') || undefined,
    trailerKey: findBestTrailer(videos?.results),
    cast: normalizeCast(credits),
    crew: normalizeCrew(credits),
    videos: normalizedVideos,
    similar: (similar || []).map((s) => normalizeTMDBTVShow(s)),
    recommendations: (recommendations || []).map((s) => normalizeTMDBTVShow(s)),
    homepage: details.homepage || null,
  };
}

export function normalizeSeasonDetails(seasonResponse: TMDBSeasonDetailResponse): MediaEpisode[] {
  if (!seasonResponse?.episodes) return [];
  return seasonResponse.episodes.map((ep) => ({
    id: ep.id,
    name: ep.name || `Episode ${ep.episode_number}`,
    overview: ep.overview || 'No episode description available.',
    episodeNumber: ep.episode_number,
    seasonNumber: ep.season_number,
    airDate: ep.air_date,
    stillUrl: getStillUrl(ep.still_path, 'w300'),
    runtime: ep.runtime || null,
    rating: normalizeRating(ep.vote_average),
    voteCount: ep.vote_count || 0,
  }));
}

