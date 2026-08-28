/**
 * OrangeFlix Music & Soundtrack API Adapter
 * Powered by Apple iTunes Search API (100% Free, HTTPS, CORS-compliant, No API Key required)
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
}

export interface SoundtrackAlbum {
  id: number;
  collectionName: string;
  artistName: string;
  artworkUrl: string;
  releaseDate: string;
  trackCount: number;
  collectionViewUrl?: string;
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

export const MusicApi = {
  async searchMovieSoundtrack(movieTitle: string): Promise<{
    albums: SoundtrackAlbum[];
    tracks: SoundtrackTrack[];
  }> {
    const cleanTitle = movieTitle.replace(/[:\-–]/g, ' ').trim();
    const query = encodeURIComponent(`${cleanTitle} soundtrack`);

    try {
      const response = await fetch(
        `https://itunes.apple.com/search?term=${query}&entity=song,album&limit=15`
      );

      if (!response.ok) {
        throw new Error(`iTunes API responded with status ${response.status}`);
      }

      const data = await response.json();
      const results = (data.results || []) as Array<Record<string, unknown>>;

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
            });
          }
        } else if (item.wrapperType === 'track' && item.trackId) {
          const trackId = Number(item.trackId);
          if (!seenTracks.has(trackId)) {
            seenTracks.add(trackId);
            tracks.push({
              id: trackId,
              trackName: String(item.trackName || 'Main Theme'),
              artistName: String(item.artistName || 'Various Artists'),
              collectionName: String(item.collectionName || movieTitle),
              previewUrl: item.previewUrl ? String(item.previewUrl) : undefined,
              artworkUrl: String(item.artworkUrl100 || '').replace('100x100bb', '400x400bb'),
              trackTimeMillis: Number(item.trackTimeMillis || 180000),
              releaseDate: String(item.releaseDate || ''),
              trackViewUrl: String(item.trackViewUrl || ''),
            });
          }
        }
      });

      return { albums, tracks };
    } catch (err) {
      console.warn('[MusicApi] Soundtrack fetch failed, returning fallback:', err);
      return { albums: [], tracks: [] };
    }
  },

  async getMovieSoundtrack(movieTitle: string): Promise<SoundtrackItem | null> {
    try {
      const { albums, tracks } = await this.searchMovieSoundtrack(movieTitle);
      if (albums.length === 0 && tracks.length === 0) {
        // Retry with simplified base title
        const baseTitle = movieTitle.split(/[:\-–]/)[0].trim();
        if (baseTitle && baseTitle !== movieTitle) {
          const retry = await this.searchMovieSoundtrack(baseTitle);
          if (retry.albums.length > 0 || retry.tracks.length > 0) {
            const album = retry.albums[0] || {
              id: 1,
              collectionName: `${movieTitle} (Original Soundtrack)`,
              artistName: retry.tracks[0]?.artistName || 'Original Score Composer',
              artworkUrl: retry.tracks[0]?.artworkUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600',
              releaseDate: '2024',
              trackCount: retry.tracks.length,
            };
            return {
              albumName: album.collectionName,
              artistName: album.artistName,
              albumArtwork: album.artworkUrl,
              releaseYear: new Date(album.releaseDate).getFullYear() || 2024,
              trackCount: album.trackCount || retry.tracks.length,
              collectionViewUrl: album.collectionViewUrl,
              tracks: retry.tracks,
            };
          }
        }
        return null;
      }

      const album = albums[0] || {
        id: 1,
        collectionName: `${movieTitle} (Original Motion Picture Soundtrack)`,
        artistName: tracks[0]?.artistName || 'Original Motion Picture Score',
        artworkUrl: tracks[0]?.artworkUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600',
        releaseDate: '2024',
        trackCount: tracks.length,
      };

      return {
        albumName: album.collectionName,
        artistName: album.artistName,
        albumArtwork: album.artworkUrl,
        releaseYear: new Date(album.releaseDate).getFullYear() || 2024,
        trackCount: album.trackCount || tracks.length,
        collectionViewUrl: album.collectionViewUrl,
        tracks,
      };
    } catch (err) {
      console.warn('[MusicApi] getMovieSoundtrack error:', err);
      return null;
    }
  },

  async getFeaturedSoundtracks(): Promise<SoundtrackAlbum[]> {
    const featuredTitles = ['Interstellar', 'Dune', 'Oppenheimer', 'Inception', 'Spider-Man'];
    try {
      const promises = featuredTitles.map((title) => this.searchMovieSoundtrack(title));
      const results = await Promise.all(promises);
      const allAlbums: SoundtrackAlbum[] = [];
      results.forEach((r) => {
        if (r.albums.length > 0) allAlbums.push(r.albums[0]);
      });
      return allAlbums;
    } catch {
      return [];
    }
  },
};
