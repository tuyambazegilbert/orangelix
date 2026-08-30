/**
 * OrangeFlix Server-Side YouTube Data API Gateway
 * Executes securely on the server using process.env.YOUTUBE_API_KEY.
 * Never bundles or exposes the YouTube API key to the client browser.
 */

import { YouTubeVideoMetadata } from '../types/geo-content';
import { parseYouTubeDuration } from '../features/youtube/duration';

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

function getServerApiKey(): string | undefined {
  return process.env.YOUTUBE_API_KEY || process.env.VITE_YOUTUBE_API_KEY || undefined;
}

export interface ServerSearchParams {
  query: string;
  regionCode?: string;
  relevanceLanguage?: string;
  videoDuration?: 'any' | 'long' | 'medium' | 'short';
  maxResults?: number;
  channelId?: string;
}

export const ServerYouTubeGateway = {
  hasServerKey(): boolean {
    return Boolean(getServerApiKey());
  },

  async searchVideos(params: ServerSearchParams): Promise<string[]> {
    const key = getServerApiKey();
    if (!key) {
      console.warn('[ServerYouTubeGateway] YOUTUBE_API_KEY not configured in server environment.');
      return [];
    }

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
      if (!res.ok) {
        const err = await res.text();
        console.warn(`[ServerYouTubeGateway] Search failed HTTP ${res.status}:`, err);
        return [];
      }

      const data = (await res.json()) as {
        items?: Array<{ id?: { videoId?: string } | string }>;
      };

      return (data.items || [])
        .map((i) => (typeof i.id === 'string' ? i.id : i.id?.videoId))
        .filter((id): id is string => Boolean(id));
    } catch (err) {
      console.error('[ServerYouTubeGateway] searchVideos error:', err);
      return [];
    }
  },

  async getVideoDetails(videoIds: string[]): Promise<YouTubeVideoMetadata[]> {
    const key = getServerApiKey();
    if (!key || videoIds.length === 0) return [];

    try {
      const uniqueIds = Array.from(new Set(videoIds)).slice(0, 50);
      const url = new URL(`${YOUTUBE_API_BASE}/videos`);
      url.searchParams.set('part', 'snippet,contentDetails,statistics,status');
      url.searchParams.set('id', uniqueIds.join(','));
      url.searchParams.set('key', key);

      const res = await fetch(url.toString());
      if (!res.ok) {
        console.warn(`[ServerYouTubeGateway] Video details failed HTTP ${res.status}`);
        return [];
      }

      const data = (await res.json()) as {
        items?: Array<{
          id: string;
          snippet: {
            title: string;
            description: string;
            channelId: string;
            channelTitle: string;
            publishedAt: string;
            thumbnails?: {
              maxres?: { url: string };
              high?: { url: string };
              medium?: { url: string };
              default?: { url: string };
            };
            tags?: string[];
            categoryId?: string;
          };
          contentDetails: {
            duration: string;
            licensedContent?: boolean;
          };
          statistics: {
            viewCount?: string;
            likeCount?: string;
          };
          status?: {
            embeddable?: boolean;
            privacyStatus?: string;
          };
        }>;
      };

      return (data.items || []).map((item) => {
        const { seconds, formatted } = parseYouTubeDuration(item.contentDetails.duration);
        const thumbs = item.snippet.thumbnails;
        const thumbUrl =
          thumbs?.maxres?.url ||
          thumbs?.high?.url ||
          thumbs?.medium?.url ||
          thumbs?.default?.url ||
          `https://img.youtube.com/vi/${item.id}/hqdefault.jpg`;

        return {
          videoId: item.id,
          channelId: item.snippet.channelId,
          channelTitle: item.snippet.channelTitle,
          title: item.snippet.title,
          description: item.snippet.description,
          thumbnailUrl: thumbUrl,
          publishedAt: item.snippet.publishedAt,
          durationIso: item.contentDetails.duration,
          durationSeconds: seconds,
          durationFormatted: formatted,
          viewCount: Number(item.statistics.viewCount || 0),
          likeCount: item.statistics.likeCount ? Number(item.statistics.likeCount) : undefined,
          isEmbeddable: item.status?.embeddable ?? true,
          isSyndicated: true,
          license: item.contentDetails.licensedContent ? 'youtube-licensed' : 'standard',
          tags: item.snippet.tags || [],
          categoryId: item.snippet.categoryId,
        };
      });
    } catch (err) {
      console.error('[ServerYouTubeGateway] getVideoDetails error:', err);
      return [];
    }
  },

  async checkVideoAvailability(videoId: string): Promise<{ isAvailable: boolean; isEmbeddable: boolean }> {
    const key = getServerApiKey();
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
