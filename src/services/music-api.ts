/**
 * OrangeFlix Music & Soundtrack API Adapter
 * Live authentic Apple iTunes Search & Album Lookup API (100% Free, HTTPS, CORS-compliant, No API Key required)
 * Retrieves real motion picture soundtrack albums, full official tracklists, verified composers, and audio samples.
 */

export interface SoundtrackTrack {
  id: number;
  trackName: string;
  artistName: string;
  collectionName: string;
  previewUrl?: string; // 30s high-quality audio preview
  artworkUrl: string;
  trackTimeMillis?: number;
  releaseDate?: string;
  trackViewUrl?: string;
  trackNumber?: number;
}

export interface SoundtrackAlbum {
  id: number;
  collectionName: string;
  artistName: string;
  artworkUrl: string;
  releaseDate: string;
  trackCount: number;
  collectionViewUrl?: string;
  primaryGenreName?: string;
}

export interface SoundtrackItem {
  albumName: string;
  artistName: string;
  albumArtwork: string;
  releaseYear: number;
  trackCount: number;
  collectionViewUrl?: string;
  tracks: SoundtrackTrack[];
}

// In-memory cache for fast snappy lookups
const soundtrackCache = new Map<string, SoundtrackItem | null>();
const searchCache = new Map<string, { albums: SoundtrackAlbum[]; tracks: SoundtrackTrack[] }>();

/** Search iTunes API for soundtrack albums and songs */
async function queryItunesSearch(term: string): Promise<{ albums: SoundtrackAlbum[]; tracks: SoundtrackTrack[] }> {
  const cacheKey = term.trim().toLowerCase();
  if (searchCache.has(cacheKey)) {
    return searchCache.get(cacheKey)!;
  }

  try {
    const query = encodeURIComponent(term.trim());
    const response = await fetch(
      `https://itunes.apple.com/search?term=${query}&entity=album,song&limit=25`
    );

    if (!response.ok) return { albums: [], tracks: [] };

    const data = (await response.json()) as { results?: Array<Record<string, unknown>> };
    const results = data.results || [];

    const albums: SoundtrackAlbum[] = [];
    const tracks: SoundtrackTrack[] = [];
    const seenAlbums = new Set<number>();
    const seenTracks = new Set<number>();

    results.forEach((item) => {
      if (item.wrapperType === 'collection' && item.collectionId) {
        const albumId = Number(item.collectionId);
        if (!seenAlbums.has(albumId)) {
          seenAlbums.add(albumId);
          albums.push({
            id: albumId,
            collectionName: String(item.collectionName || 'Soundtrack Album'),
            artistName: String(item.artistName || 'Various Artists'),
            artworkUrl: String(item.artworkUrl100 || '').replace('100x100bb', '600x600bb'),
            releaseDate: String(item.releaseDate || new Date().toISOString()),
            trackCount: Number(item.trackCount || 1),
            collectionViewUrl: String(item.collectionViewUrl || ''),
            primaryGenreName: String(item.primaryGenreName || 'Soundtrack'),
          });
        }
      } else if (item.wrapperType === 'track' && item.trackId) {
        const trackId = Number(item.trackId);
        if (!seenTracks.has(trackId)) {
          seenTracks.add(trackId);
          tracks.push({
            id: trackId,
            trackName: String(item.trackName || 'Theme'),
            artistName: String(item.artistName || 'Various Artists'),
            collectionName: String(item.collectionName || term),
            previewUrl: item.previewUrl ? String(item.previewUrl) : undefined,
            artworkUrl: String(item.artworkUrl100 || '').replace('100x100bb', '400x400bb'),
            trackTimeMillis: Number(item.trackTimeMillis || 180000),
            releaseDate: String(item.releaseDate || ''),
            trackViewUrl: String(item.trackViewUrl || ''),
            trackNumber: Number(item.trackNumber || 1),
          });
        }
      }
    });

    const output = { albums, tracks };
    searchCache.set(cacheKey, output);
    return output;
  } catch (err) {
    console.warn('[MusicApi] iTunes fetch error:', err);
    return { albums: [], tracks: [] };
  }
}

/** Lookup complete album tracklist by iTunes Collection ID */
async function lookupAlbumTracks(collectionId: number): Promise<SoundtrackTrack[]> {
  try {
    const response = await fetch(
      `https://itunes.apple.com/lookup?id=${collectionId}&entity=song&limit=100`
    );

    if (!response.ok) return [];

    const data = (await response.json()) as { results?: Array<Record<string, unknown>> };
    const results = data.results || [];

    const tracks: SoundtrackTrack[] = [];
    results.forEach((item) => {
      if (item.wrapperType === 'track' && item.trackId) {
        tracks.push({
          id: Number(item.trackId),
          trackName: String(item.trackName || 'Track'),
          artistName: String(item.artistName || 'Various Artists'),
          collectionName: String(item.collectionName || 'Soundtrack'),
          previewUrl: item.previewUrl ? String(item.previewUrl) : undefined,
          artworkUrl: String(item.artworkUrl100 || '').replace('100x100bb', '400x400bb'),
          trackTimeMillis: Number(item.trackTimeMillis || 180000),
          releaseDate: String(item.releaseDate || ''),
          trackViewUrl: String(item.trackViewUrl || ''),
          trackNumber: Number(item.trackNumber || tracks.length + 1),
        });
      }
    });

    return tracks.sort((a, b) => (a.trackNumber || 0) - (b.trackNumber || 0));
  } catch (err) {
    console.warn('[MusicApi] Album lookup error:', err);
    return [];
  }
}

export const MusicApi = {
  /** Search for movie/show soundtrack albums and standalone tracks */
  async searchMovieSoundtrack(movieTitle: string, composer?: string): Promise<{
    albums: SoundtrackAlbum[];
    tracks: SoundtrackTrack[];
  }> {
    if (!movieTitle || !movieTitle.trim()) {
      return { albums: [], tracks: [] };
    }

    const cleanTitle = movieTitle.replace(/[:\-–]/g, ' ').replace(/\s+/g, ' ').trim();
    const baseTitle = movieTitle.split(/[:\-–(]/)[0].trim();

    // Prioritized search queries for authentic OST albums & scores
    const queries: string[] = [];

    if (composer && composer.trim()) {
      queries.push(`${cleanTitle} ${composer}`);
      queries.push(`${composer} ${cleanTitle} soundtrack`);
    }

    queries.push(`${cleanTitle} Original Motion Picture Soundtrack`);
    queries.push(`${cleanTitle} Original Score`);
    queries.push(`${cleanTitle} Soundtrack`);
    queries.push(`${cleanTitle} OST`);

    if (baseTitle && baseTitle.toLowerCase() !== cleanTitle.toLowerCase()) {
      queries.push(`${baseTitle} Original Motion Picture Soundtrack`);
      queries.push(`${baseTitle} Soundtrack`);
    }

    queries.push(cleanTitle);

    for (const q of queries) {
      const res = await queryItunesSearch(q);
      if (res.albums.length > 0 || res.tracks.length > 0) {
        return res;
      }
    }

    return { albums: [], tracks: [] };
  },

  /** Resolve full authentic soundtrack album item with complete tracklist */
  async getMovieSoundtrack(
    movieTitle: string,
    composer?: string,
    fallbackArtwork?: string
  ): Promise<SoundtrackItem | null> {
    const cacheKey = `${movieTitle}__${composer || ''}`.toLowerCase();
    if (soundtrackCache.has(cacheKey)) {
      return soundtrackCache.get(cacheKey)!;
    }

    try {
      const { albums, tracks } = await this.searchMovieSoundtrack(movieTitle, composer);

      if (albums.length > 0) {
        const primaryAlbum = albums[0];
        // Fetch full authentic tracklist for this album using lookup API
        const fullTracklist = await lookupAlbumTracks(primaryAlbum.id);
        const resolvedTracks = fullTracklist.length > 0 ? fullTracklist : tracks.filter((t) => t.collectionName === primaryAlbum.collectionName);

        const item: SoundtrackItem = {
          albumName: primaryAlbum.collectionName,
          artistName: primaryAlbum.artistName,
          albumArtwork: primaryAlbum.artworkUrl || fallbackArtwork || '',
          releaseYear: primaryAlbum.releaseDate ? new Date(primaryAlbum.releaseDate).getFullYear() : 2024,
          trackCount: primaryAlbum.trackCount || resolvedTracks.length,
          collectionViewUrl: primaryAlbum.collectionViewUrl,
          tracks: resolvedTracks.length > 0 ? resolvedTracks : tracks.slice(0, 10),
        };

        soundtrackCache.set(cacheKey, item);
        return item;
      }

      if (tracks.length > 0) {
        const primaryTrack = tracks[0];
        const item: SoundtrackItem = {
          albumName: primaryTrack.collectionName || `${movieTitle} (Original Soundtrack & Themes)`,
          artistName: primaryTrack.artistName || composer || 'Original Motion Picture Score',
          albumArtwork: primaryTrack.artworkUrl || fallbackArtwork || '',
          releaseYear: primaryTrack.releaseDate ? new Date(primaryTrack.releaseDate).getFullYear() : 2024,
          trackCount: tracks.length,
          collectionViewUrl: primaryTrack.trackViewUrl,
          tracks: tracks.slice(0, 15),
        };

        soundtrackCache.set(cacheKey, item);
        return item;
      }

      // If no authentic licensed soundtrack is found on iTunes, gracefully return null
      // (ensuring NO fake/synthetic orchestra tracks are generated)
      soundtrackCache.set(cacheKey, null);
      return null;
    } catch (err) {
      console.warn('[MusicApi] getMovieSoundtrack error:', err);
      soundtrackCache.set(cacheKey, null);
      return null;
    }
  },

  /** Curated popular real cinematic soundtrack masterpieces */
  async getFeaturedSoundtracks(): Promise<SoundtrackAlbum[]> {
    const featuredTitles = [
      'Dune Part Two Soundtrack',
      'Interstellar Original Motion Picture Soundtrack',
      'Oppenheimer Soundtrack Ludwig Goransson',
      'Spider-Man Across the Spider-Verse',
      'Inception Hans Zimmer',
      'The Batman Michael Giacchino',
      'Gladiator Hans Zimmer',
      'Stranger Things Season 4 Soundtrack',
      'Top Gun Maverick Soundtrack',
      'La La Land Original Motion Picture Soundtrack',
    ];

    try {
      const promises = featuredTitles.map((title) => queryItunesSearch(title));
      const results = await Promise.all(promises);
      const allAlbums: SoundtrackAlbum[] = [];
      const seen = new Set<number>();

      results.forEach((r) => {
        if (r.albums.length > 0) {
          const album = r.albums[0];
          if (!seen.has(album.id)) {
            seen.add(album.id);
            allAlbums.push(album);
          }
        }
      });

      return allAlbums;
    } catch {
      return [];
    }
  },
};
