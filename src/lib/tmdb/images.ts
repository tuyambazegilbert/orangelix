const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

export const POSTER_FALLBACK =
  'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22300%22%20height%3D%22450%22%20viewBox%3D%220%200%20300%20450%22%3E%3Crect%20fill%3D%22%23111827%22%20width%3D%22300%22%20height%3D%22450%22%2F%3E%3Ctext%20fill%3D%22%23f97316%22%20font-family%3D%22sans-serif%22%20font-size%3D%2220%22%20font-weight%3D%22bold%22%20x%3D%2250%25%22%20y%3D%2245%25%22%20text-anchor%3D%22middle%22%3EOrangeFlix%3C%2Ftext%3E%3Ctext%20fill%3D%22%236b7280%22%20font-family%3D%22sans-serif%22%20font-size%3D%2214%22%20x%3D%2250%25%22%20y%3D%2255%25%22%20text-anchor%3D%22middle%22%3ENo%20Poster%20Available%3C%2Ftext%3E%3C%2Fsvg%3E';

export const BACKDROP_FALLBACK =
  'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%221280%22%20height%3D%22720%22%20viewBox%3D%220%200%201280%20720%22%3E%3Crect%20fill%3D%22%23030712%22%20width%3D%221280%22%20height%3D%22720%22%2F%3E%3Ctext%20fill%3D%22%23f97316%22%20font-family%3D%22sans-serif%22%20font-size%3D%2236%22%20font-weight%3D%22bold%22%20x%3D%2250%25%22%20y%3D%2248%25%22%20text-anchor%3D%22middle%22%3EOrangeFlix%3C%2Ftext%3E%3Ctext%20fill%3D%22%236b7280%22%20font-family%3D%22sans-serif%22%20font-size%3D%2220%22%20x%3D%2250%25%22%20y%3D%2256%25%22%20text-anchor%3D%22middle%22%3EImage%20Unavailable%3C%2Ftext%3E%3C%2Fsvg%3E';

export const PROFILE_FALLBACK =
  'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22185%22%20height%3D%22278%22%20viewBox%3D%220%200%20185%20278%22%3E%3Crect%20fill%3D%22%231f2937%22%20width%3D%22185%22%20height%3D%22278%22%2F%3E%3Ccircle%20cx%3D%2292%22%20cy%3D%22100%22%20r%3D%2240%22%20fill%3D%22%23374151%22%2F%3E%3Cpath%20d%3D%22M32%20220%20C32%20160%20152%20160%20152%20220%20Z%22%20fill%3D%22%23374151%22%2F%3E%3C%2Fsvg%3E';

export type PosterSize = 'w92' | 'w154' | 'w185' | 'w342' | 'w500' | 'w780' | 'original';
export type BackdropSize = 'w300' | 'w780' | 'w1280' | 'original';
export type ProfileSize = 'w45' | 'w185' | 'h632' | 'original';
export type StillSize = 'w92' | 'w185' | 'w300' | 'original';

export function getPosterUrl(path: string | null | undefined, size: PosterSize = 'w500'): string {
  if (!path) return POSTER_FALLBACK;
  if (path.startsWith('http')) return path;
  return `${TMDB_IMAGE_BASE_URL}/${size}${path.startsWith('/') ? path : `/${path}`}`;
}

export function getBackdropUrl(path: string | null | undefined, size: BackdropSize = 'w1280'): string {
  if (!path) return BACKDROP_FALLBACK;
  if (path.startsWith('http')) return path;
  return `${TMDB_IMAGE_BASE_URL}/${size}${path.startsWith('/') ? path : `/${path}`}`;
}

export function getProfileUrl(path: string | null | undefined, size: ProfileSize = 'w185'): string {
  if (!path) return PROFILE_FALLBACK;
  if (path.startsWith('http')) return path;
  return `${TMDB_IMAGE_BASE_URL}/${size}${path.startsWith('/') ? path : `/${path}`}`;
}

export function getStillUrl(path: string | null | undefined, size: StillSize = 'w300'): string {
  if (!path) return BACKDROP_FALLBACK;
  if (path.startsWith('http')) return path;
  return `${TMDB_IMAGE_BASE_URL}/${size}${path.startsWith('/') ? path : `/${path}`}`;
}

