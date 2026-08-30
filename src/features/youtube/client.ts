/**
 * OrangeFlix YouTube Data API v3 Client
 * Supports search.list, videos.list, and channels.list.
 * Includes detailed diagnostic logging exposing Google's actual response codes and reasons.
 * Ensures all returned metadata fields have safe, non-undefined default values.
 */

import { YouTubeVideoMetadata, YouTubeChannelMetadata } from '@/types/geo-content';
import { parseYouTubeDuration } from './duration';

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

function getApiKey(): string | undefined {
  return (
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_YOUTUBE_API_KEY) ||
    (typeof process !== 'undefined' && (process.env.YOUTUBE_API_KEY || process.env.VITE_YOUTUBE_API_KEY)) ||
    undefined
  );
}

export interface YouTubeSearchParams {
  query: string;
  regionCode?: string;
  relevanceLanguage?: string;
  videoDuration?: 'any' | 'long' | 'medium' | 'short';
  maxResults?: number;
  channelId?: string;
}

export const YouTubeClient = {
  hasApiKey(): boolean {
    const key = getApiKey();
    return Boolean(key && key.trim().length > 10);
  },

  /** Direct or backend search query */
  async searchVideos(params: YouTubeSearchParams): Promise<{ videoIds: string[]; error?: string }> {
    const key = getApiKey();
    const isConfigured = Boolean(key && key.trim().length > 10);
    console.log(`[YouTube] API configured: ${isConfigured}`);
    console.log(`[YouTube] Search started: "${params.query}"`);

    // 1. Direct query with API key if available
    if (key) {
      try {
        const url = new URL(`${YOUTUBE_API_BASE}/search`);
        url.searchParams.set('part', 'id,snippet');
        url.searchParams.set('type', 'video');
        url.searchParams.set('q', params.query);
        url.searchParams.set('maxResults', String(params.maxResults || 25));
        url.searchParams.set('key', key);

        if (params.videoDuration && params.videoDuration !== 'any') {
          url.searchParams.set('videoDuration', params.videoDuration);
        }
        if (params.channelId) {
          url.searchParams.set('channelId', params.channelId);
        }

        const res = await fetch(url.toString());
        console.log(`[YouTube] Search HTTP status: ${res.status} ${res.statusText}`);

        if (!res.ok) {
          const errBody = await res.json().catch(() => ({ error: { message: `HTTP ${res.status}`, errors: [] } }));
          const reason = errBody?.error?.errors?.[0]?.reason || errBody?.error?.status || 'UNKNOWN';
          const errMsg = errBody?.error?.message || `YouTube search returned HTTP ${res.status} (${reason})`;

          console.error(`[YouTube] Search API error for "${params.query}":`, {
            status: res.status,
            reason,
            message: errMsg,
          });
          return { videoIds: [], error: `[${res.status} ${reason}] ${errMsg}` };
        }

        const data = (await res.json()) as {
          pageInfo?: { totalResults?: number; resultsPerPage?: number };
          items?: Array<{
            id?: { videoId?: string; kind?: string } | string;
            snippet?: { title?: string; channelTitle?: string; channelId?: string };
          }>;
        };

        const totalResults = data.pageInfo?.totalResults ?? 0;
        const itemsCount = data.items?.length ?? 0;
        console.log(`[YouTube] Search results for "${params.query}": pageInfo.totalResults=${totalResults}, items.length=${itemsCount}`);

        if (itemsCount > 0 && data.items?.[0]) {
          const first = data.items[0];
          const firstId = typeof first.id === 'string' ? first.id : first.id?.videoId;
          console.log(`[YouTube] First item: ID="${firstId}", Title="${first.snippet?.title}", Channel="${first.snippet?.channelTitle}"`);
        }

        const ids = (data.items || [])
          .map((i) => (typeof i.id === 'string' ? i.id : i.id?.videoId))
          .filter((id): id is string => Boolean(id));

        console.log(`[YouTube] Mapped ${ids.length} video IDs for "${params.query}"`);
        return { videoIds: ids };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Network error';
        console.error(`[YouTube] Search request failed for "${params.query}":`, msg);
        return { videoIds: [], error: msg };
      }
    }

    // 2. Fallback to server gateway (/api/geo-discovery)
    try {
      const res = await fetch('/api/geo-discovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'search', ...params }),
      });
      if (res.ok) {
        const data = (await res.json()) as { videoIds?: string[]; error?: string };
        const ids = data.videoIds || [];
        console.log(`[YouTube] Search completed (via server): Found ${ids.length} videos for "${params.query}"`);
        return { videoIds: ids, error: data.error };
      }
    } catch {
      // Ignore
    }

    return {
      videoIds: [],
      error: 'YouTube Data API is not configured. Check VITE_YOUTUBE_API_KEY.',
    };
  },

  /** Fetch detailed video metadata and durations */
  async getVideoDetails(videoIds: string[]): Promise<YouTubeVideoMetadata[]> {
    if (videoIds.length === 0) return [];
    const key = getApiKey();
    const uniqueIds = Array.from(new Set(videoIds)).slice(0, 50);

    if (key) {
      try {
        const url = new URL(`${YOUTUBE_API_BASE}/videos`);
        url.searchParams.set('part', 'snippet,contentDetails,statistics,status');
        url.searchParams.set('id', uniqueIds.join(','));
        url.searchParams.set('key', key);

        const res = await fetch(url.toString());
        console.log(`[YouTube] videos.list HTTP status: ${res.status}`);

        if (!res.ok) {
          const errBody = await res.json().catch(() => ({ error: { message: `HTTP ${res.status}` } }));
          console.error(`[YouTube] Video details request failed HTTP ${res.status}:`, errBody);
          return [];
        }

        const data = (await res.json()) as {
          items?: Array<{
            id: string;
            snippet?: {
              title?: string;
              description?: string;
              channelId?: string;
              channelTitle?: string;
              publishedAt?: string;
              thumbnails?: {
                maxres?: { url: string };
                high?: { url: string };
                medium?: { url: string };
                default?: { url: string };
              };
              tags?: string[];
              categoryId?: string;
            };
            contentDetails?: {
              duration?: string;
              licensedContent?: boolean;
            };
            statistics?: {
              viewCount?: string;
              likeCount?: string;
            };
            status?: {
              embeddable?: boolean;
              privacyStatus?: string;
            };
          }>;
        };

        const list = (data.items || []).map((item) => {
          const rawDuration = item.contentDetails?.duration || '';
          const { seconds, formatted } = parseYouTubeDuration(rawDuration);
          const thumbs = item.snippet?.thumbnails;
          const thumbUrl =
            thumbs?.maxres?.url ||
            thumbs?.high?.url ||
            thumbs?.medium?.url ||
            thumbs?.default?.url ||
            `https://img.youtube.com/vi/${item.id}/hqdefault.jpg`;

          return {
            videoId: item.id,
            channelId: item.snippet?.channelId || '',
            channelTitle: item.snippet?.channelTitle || '',
            title: item.snippet?.title || '',
            description: item.snippet?.description || '',
            thumbnailUrl: thumbUrl,
            publishedAt: item.snippet?.publishedAt || new Date().toISOString(),
            durationIso: rawDuration,
            durationSeconds: seconds,
            durationFormatted: formatted,
            viewCount: Number(item.statistics?.viewCount || 0),
            likeCount: Number(item.statistics?.likeCount || 0), // Guaranteed numeric (never undefined)
            isEmbeddable: item.status?.embeddable ?? true,
            isSyndicated: true,
            license: item.contentDetails?.licensedContent ? 'youtube-licensed' : 'standard',
            tags: item.snippet?.tags || [],
            categoryId: item.snippet?.categoryId || '',
          };
        });

        console.log(`[YouTube] Fetched detailed metadata for ${list.length} videos`);
        return list;
      } catch (err) {
        console.error('[YouTube] Video details request error:', err);
      }
    }

    // Fallback to server endpoint
    try {
      const res = await fetch('/api/geo-discovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'details', videoIds: uniqueIds }),
      });
      if (res.ok) {
        const data = (await res.json()) as { details?: YouTubeVideoMetadata[] };
        return (data.details || []).map((v) => ({
          ...v,
          likeCount: Number(v.likeCount || 0),
          viewCount: Number(v.viewCount || 0),
        }));
      }
    } catch {
      // Ignore
    }

    return [];
  },

  /** Batch fetch YouTube channel metadata */
  async getChannelsMetadata(channelIds: string[]): Promise<YouTubeChannelMetadata[]> {
    if (channelIds.length === 0) return [];
    const key = getApiKey();
    const uniqueIds = Array.from(new Set(channelIds)).slice(0, 50);

    if (key) {
      try {
        const url = new URL(`${YOUTUBE_API_BASE}/channels`);
        url.searchParams.set('part', 'snippet,statistics');
        url.searchParams.set('id', uniqueIds.join(','));
        url.searchParams.set('key', key);

        const res = await fetch(url.toString());
        if (!res.ok) return [];

        const data = (await res.json()) as {
          items?: Array<{
            id: string;
            snippet?: {
              title?: string;
              description?: string;
              customUrl?: string;
              country?: string;
              publishedAt?: string;
              thumbnails?: { high?: { url: string }; default?: { url: string } };
            };
            statistics?: {
              subscriberCount?: string;
              videoCount?: string;
            };
          }>;
        };

        return (data.items || []).map((ch) => ({
          channelId: ch.id,
          channelTitle: ch.snippet?.title || '',
          description: ch.snippet?.description || '',
          customUrl: ch.snippet?.customUrl || '',
          thumbnailUrl: ch.snippet?.thumbnails?.high?.url || ch.snippet?.thumbnails?.default?.url || '',
          country: ch.snippet?.country || 'RW',
          publishedAt: ch.snippet?.publishedAt || new Date().toISOString(),
          subscriberCount: Number(ch.statistics?.subscriberCount || 0),
          videoCount: Number(ch.statistics?.videoCount || 0),
        }));
      } catch (err) {
        console.error('[YouTube] Channel metadata error:', err);
      }
    }

    return [];
  },

  /** Fetch all direct video uploads from a channel using its uploads playlist (UU...) */
  async getChannelUploads(channelId: string, maxResults: number = 50): Promise<string[]> {
    const key = getApiKey();
    if (!key) return [];

    const uploadsPlaylistId = channelId.startsWith('UC') ? 'UU' + channelId.substring(2) : channelId;

    try {
      const url = new URL(`${YOUTUBE_API_BASE}/playlistItems`);
      url.searchParams.set('part', 'contentDetails,snippet');
      url.searchParams.set('playlistId', uploadsPlaylistId);
      url.searchParams.set('maxResults', String(Math.min(50, maxResults)));
      url.searchParams.set('key', key);

      const res = await fetch(url.toString());
      if (res.ok) {
        const data = (await res.json()) as {
          items?: Array<{
            contentDetails?: { videoId?: string };
            snippet?: { resourceId?: { videoId?: string } };
          }>;
        };
        const ids = (data.items || [])
          .map((i) => i.contentDetails?.videoId || i.snippet?.resourceId?.videoId)
          .filter((id): id is string => Boolean(id));

        if (ids.length > 0) {
          console.log(`[YouTube] Fetched ${ids.length} uploads via playlistItems for channel ${channelId}`);
          return ids;
        }
      }
    } catch (err) {
      console.warn(`[YouTube] playlistItems failed for channel ${channelId}, falling back to search:`, err);
    }

    // Fallback to searchVideos
    const searchRes = await this.searchVideos({
      channelId,
      maxResults,
      query: '',
    });
    return searchRes.videoIds;
  },

  /** Resolve any channel input (URL, handle @name, custom name, or UC... ID) to canonical UC... ID */
  async resolveChannelIdentifier(input: string): Promise<{ channelId: string; channelTitle: string; description?: string } | null> {
    const key = getApiKey();
    let clean = (input || '').trim();
    if (!clean) return null;

    // Clean URL prefixes and special characters
    clean = clean.replace(/^(?:https?:\/\/)?(?:www\.)?(?:m\.)?youtube\.com\/(?:c\/|channel\/|user\/|@)?/i, '');
    clean = clean.replace(/^@/, '');
    clean = clean.split('?')[0].split('/')[0].trim();

    if (!clean) return null;

    // 1. If already a valid canonical UC channel ID
    if (/^UC[a-zA-Z0-9_-]{22}$/.test(clean)) {
      if (key) {
        const list = await this.getChannelsMetadata([clean]);
        if (list[0]) return { channelId: list[0].channelId, channelTitle: list[0].channelTitle, description: list[0].description };
      }
      return { channelId: clean, channelTitle: clean };
    }

    if (!key) return { channelId: clean, channelTitle: clean };

    // 2. Try forHandle
    try {
      const handleUrl = new URL(`${YOUTUBE_API_BASE}/channels`);
      handleUrl.searchParams.set('part', 'id,snippet');
      handleUrl.searchParams.set('forHandle', clean);
      handleUrl.searchParams.set('key', key);

      const hRes = await fetch(handleUrl.toString());
      if (hRes.ok) {
        const hData = (await hRes.json()) as { items?: Array<{ id: string; snippet?: { title?: string; description?: string } }> };
        if (hData.items && hData.items.length > 0) {
          return {
            channelId: hData.items[0].id,
            channelTitle: hData.items[0].snippet?.title || clean,
            description: hData.items[0].snippet?.description,
          };
        }
      }
    } catch {
      // Fallback
    }

    // 3. Try forUsername
    try {
      const userUrl = new URL(`${YOUTUBE_API_BASE}/channels`);
      userUrl.searchParams.set('part', 'id,snippet');
      userUrl.searchParams.set('forUsername', clean);
      userUrl.searchParams.set('key', key);

      const uRes = await fetch(userUrl.toString());
      if (uRes.ok) {
        const uData = (await uRes.json()) as { items?: Array<{ id: string; snippet?: { title?: string; description?: string } }> };
        if (uData.items && uData.items.length > 0) {
          return {
            channelId: uData.items[0].id,
            channelTitle: uData.items[0].snippet?.title || clean,
            description: uData.items[0].snippet?.description,
          };
        }
      }
    } catch {
      // Fallback
    }

    // 4. Search type=channel
    try {
      const sUrl = new URL(`${YOUTUBE_API_BASE}/search`);
      sUrl.searchParams.set('part', 'id,snippet');
      sUrl.searchParams.set('type', 'channel');
      sUrl.searchParams.set('q', clean);
      sUrl.searchParams.set('maxResults', '1');
      sUrl.searchParams.set('key', key);

      const sRes = await fetch(sUrl.toString());
      if (sRes.ok) {
        const sData = (await sRes.json()) as { items?: Array<{ id?: { channelId?: string }; snippet?: { title?: string; description?: string } }> };
        if (sData.items && sData.items.length > 0 && sData.items[0].id?.channelId) {
          return {
            channelId: sData.items[0].id.channelId,
            channelTitle: sData.items[0].snippet?.title || clean,
            description: sData.items[0].snippet?.description,
          };
        }
      }
    } catch {
      // Fallback
    }

    return null;
  },

  /** Single channel metadata */
  async getChannelMetadata(channelId: string): Promise<YouTubeChannelMetadata | null> {
    const list = await this.getChannelsMetadata([channelId]);
    return list[0] || null;
  },

  /** Check video availability */
  async checkAvailability(videoId: string): Promise<{ isAvailable: boolean; isEmbeddable: boolean }> {
    const key = getApiKey();
    if (!key) return { isAvailable: true, isEmbeddable: true };

    try {
      const url = new URL(`${YOUTUBE_API_BASE}/videos`);
      url.searchParams.set('part', 'status');
      url.searchParams.set('id', videoId);
      url.searchParams.set('key', key);

      const res = await fetch(url.toString());
      if (!res.ok) return { isAvailable: false, isEmbeddable: false };

      const data = (await res.json()) as {
        items?: Array<{ status?: { embeddable?: boolean; privacyStatus?: string } }>;
      };

      if (!data.items || data.items.length === 0) {
        return { isAvailable: false, isEmbeddable: false };
      }

      const status = data.items[0].status;
      return {
        isAvailable: status?.privacyStatus === 'public' && (status?.embeddable ?? true),
        isEmbeddable: status?.embeddable ?? false,
      };
    } catch {
      return { isAvailable: true, isEmbeddable: true };
    }
  },
};
