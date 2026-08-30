/**
 * OrangeFlix Geo-Content Service
 * Firestore Database integration, fast caching, rate-limited discovery, and availability checker.
 * Conforms strictly to Sections 1, 4, 5, 8, 9, 10, 14, 15, 17, 18.
 * Features strict document sanitization (zero undefined values) and resilient per-item persistence.
 */

import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  limit as firestoreLimit,
} from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import {
  GeoContentItem,
  GeoContentFilter,
  TrustedChannel,
  GeoContentStatus,
  ModerationStatus,
  DiscoverySummaryLog,
  CustomCountryQuery,
  ChannelScanStats,
} from '@/types/geo-content';
import {
  getCountryConfig,
  INITIAL_TRUSTED_CHANNELS,
  SUPPORTED_COUNTRIES,
} from '@/features/geo/countryConfig';
import { YouTubeDiscoveryWorker, DiscoveryWorkerResult } from '@/features/youtube/discoveryWorker';
import { YouTubeClient } from '@/features/youtube/client';
import { classifyYouTubeVideo } from '@/features/youtube/classifier';

const LOCAL_STORAGE_CACHE_KEY = 'orangeflix_geo_content_cache';
const LOCAL_STORAGE_LOGS_KEY = 'orangeflix_geo_logs_cache';
const LOCAL_STORAGE_CHANNELS_KEY = 'orangeflix_geo_channels_cache';
const LOCAL_STORAGE_QUERIES_KEY = 'orangeflix_geo_custom_queries';

/**
 * Universal Firestore document sanitizer
 * Recursively removes any keys with `undefined` values so Firestore setDoc never throws Unsupported field value: undefined.
 */
export function sanitizeFirestoreDoc<T extends Record<string, unknown>>(data: T): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue;
    if (value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      result[key] = sanitizeFirestoreDoc(value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }
  return result;
}

// Fast In-Memory Cache Map (Populated from Firestore, localStorage & live discovery)
const memoryCache = new Map<string, GeoContentItem>();
const summaryLogsMap = new Map<string, DiscoverySummaryLog>();
const trustedChannelsMemory: TrustedChannel[] = [...INITIAL_TRUSTED_CHANNELS];
const customQueriesMemory = new Map<string, CustomCountryQuery[]>();
let lastDiscoveryTimestamp = 0; // For rate limiting (30s interval)
let isHydratedFromLocal = false;

function hydrateLocalCache(): void {
  if (isHydratedFromLocal) return;
  isHydratedFromLocal = true;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as GeoContentItem[];
      parsed.forEach((item) => {
        if (item && item.id) {
          memoryCache.set(item.id, item);
          if (item.slug) memoryCache.set(item.slug, item);
        }
      });
    }

    const rawLogs = localStorage.getItem(LOCAL_STORAGE_LOGS_KEY);
    if (rawLogs) {
      const parsedLogs = JSON.parse(rawLogs) as Record<string, DiscoverySummaryLog>;
      Object.entries(parsedLogs).forEach(([code, log]) => {
        summaryLogsMap.set(code, log);
      });
    }

    const rawChannels = localStorage.getItem(LOCAL_STORAGE_CHANNELS_KEY);
    if (rawChannels) {
      const parsedChannels = JSON.parse(rawChannels) as TrustedChannel[];
      parsedChannels.forEach((ch) => {
        if (
          ch &&
          ch.channelId &&
          !ch.channelId.includes('/') &&
          !ch.channelId.startsWith('UC_') && // filter out old dummy placeholder IDs
          !trustedChannelsMemory.some((existing) => existing.channelId === ch.channelId)
        ) {
          trustedChannelsMemory.push(ch);
        }
      });
    }

    // Ensure all initial trusted channels are present
    INITIAL_TRUSTED_CHANNELS.forEach((initCh) => {
      if (!trustedChannelsMemory.some((existing) => existing.channelId === initCh.channelId)) {
        trustedChannelsMemory.push(initCh);
      }
    });

    const rawQueries = localStorage.getItem(LOCAL_STORAGE_QUERIES_KEY);
    if (rawQueries) {
      const parsedQueries = JSON.parse(rawQueries) as Record<string, CustomCountryQuery[]>;
      Object.entries(parsedQueries).forEach(([code, qList]) => {
        customQueriesMemory.set(code.toUpperCase(), qList);
      });
    }
  } catch {
    // Ignore parse error
  }
}

function persistLocalCache(): void {
  try {
    const uniqueItems = Array.from(new Map(Array.from(memoryCache.values()).map((i) => [i.id, i])).values());
    localStorage.setItem(LOCAL_STORAGE_CACHE_KEY, JSON.stringify(uniqueItems));

    const logsObj: Record<string, DiscoverySummaryLog> = {};
    summaryLogsMap.forEach((log, code) => {
      logsObj[code] = log;
    });
    localStorage.setItem(LOCAL_STORAGE_LOGS_KEY, JSON.stringify(logsObj));
    localStorage.setItem(LOCAL_STORAGE_CHANNELS_KEY, JSON.stringify(trustedChannelsMemory));

    const queriesObj: Record<string, CustomCountryQuery[]> = {};
    customQueriesMemory.forEach((qList, code) => {
      queriesObj[code] = qList;
    });
    localStorage.setItem(LOCAL_STORAGE_QUERIES_KEY, JSON.stringify(queriesObj));
  } catch {
    // Ignore storage quota error
  }
}

export const GeoContentService = {
  /** Fetch movie catalog for a specific country with flexible filters (Sections 9, 10, 18) */
  async getMoviesByCountry(filter: GeoContentFilter): Promise<{ items: GeoContentItem[]; total: number }> {
    hydrateLocalCache();
    const countryCode = (filter.countryCode || 'RW').toUpperCase();
    const page = filter.page || 1;
    const limitCount = filter.limit || 20;

    // 1. Read from Firestore
    try {
      if (firestore) {
        const contentRef = collection(firestore, 'geoContent');
        const q = query(
          contentRef,
          where('country', '==', countryCode),
          firestoreLimit(100)
        );

        const snap = await getDocs(q);
        if (!snap.empty) {
          snap.docs.forEach((d) => {
            const data = d.data() as GeoContentItem;
            if (data && data.id) {
              memoryCache.set(data.id, data);
              if (data.slug) memoryCache.set(data.slug, data);
            }
          });
          persistLocalCache();
        }
      }
    } catch (err: unknown) {
      const errStr = String(err);
      if (!errStr.includes('insufficient permissions')) {
        console.warn('[GeoContentService] Firestore read fallback to local cache:', err);
      }
    }

    // 2. Query Cache
    let all = Array.from(memoryCache.values()).filter((item) => {
      if (!item || !item.id) return false;
      const c = item.country || item.countryCode || 'RW';
      if (c.toUpperCase() !== countryCode) return false;
      if (item.status === 'unavailable') return false;

      // Moderation Status filtering (defaults to 'published' / 'approved' for public views)
      if (filter.status && filter.status !== 'all') {
        if (item.status !== filter.status && item.moderationStatus !== filter.status) return false;
      } else if (filter.moderationStatus && filter.moderationStatus !== 'all') {
        if (item.moderationStatus !== filter.moderationStatus && item.status !== filter.moderationStatus) return false;
      } else if (!filter.status && !filter.moderationStatus) {
        if (item.status !== 'published' && item.moderationStatus !== 'approved') return false;
      }

      // Content Type filtering
      const classification = item.classification || item.type || item.contentType;
      if (filter.contentType && filter.contentType !== 'all' && classification !== filter.contentType) {
        return false;
      }

      // Candidate filtering
      if (filter.isFullMovieCandidate !== undefined && item.isFullMovieCandidate !== filter.isFullMovieCandidate) {
        return false;
      }

      // Channel ID filter
      if (filter.channelId && (item.youtubeChannelId !== filter.channelId && item.channelId !== filter.channelId)) {
        return false;
      }

      // Channel Trust filter
      if (filter.channelTrust && item.channelTrust !== filter.channelTrust) {
        return false;
      }

      // Duration Range filtering: under_20, 20_45, 45_90, 90_plus, under_30, 30_60, 60_90
      if (filter.durationRange && filter.durationRange !== 'all') {
        const secs = item.durationSeconds || 0;
        if (filter.durationRange === 'under_20' && secs >= 1200) return false;
        if (filter.durationRange === '20_45' && (secs < 1200 || secs >= 2700)) return false;
        if (filter.durationRange === '45_90' && (secs < 2700 || secs >= 5400)) return false;
        if (filter.durationRange === '90_plus' && secs < 5400) return false;
        if (filter.durationRange === 'under_30' && secs >= 1800) return false;
        if (filter.durationRange === '30_60' && (secs < 1800 || secs >= 3600)) return false;
        if (filter.durationRange === '60_90' && (secs < 3600 || secs >= 5400)) return false;
      }

      // Text search
      if (filter.searchQuery && filter.searchQuery.trim()) {
        const sq = filter.searchQuery.toLowerCase().trim();
        const matchesTitle = (item.title || '').toLowerCase().includes(sq);
        const matchesDesc = (item.description || '').toLowerCase().includes(sq);
        const matchesChannel = (item.channelTitle || '').toLowerCase().includes(sq);
        const matchesTags = (item.tags || []).some((t) => t.toLowerCase().includes(sq));
        if (!matchesTitle && !matchesDesc && !matchesChannel && !matchesTags) return false;
      }

      return true;
    });

    // Deduplicate
    all = Array.from(new Map(all.map((item) => [item.id, item])).values());

    // Sort
    const sortBy = filter.sortBy || 'popular';
    all.sort((a, b) => {
      const viewsA = Number(a.views ?? a.viewCount ?? 0);
      const viewsB = Number(b.views ?? b.viewCount ?? 0);
      const scoreA = Number(a.score ?? a.classificationScore ?? 0);
      const scoreB = Number(b.score ?? b.classificationScore ?? 0);

      if (sortBy === 'popular') return viewsB - viewsA;
      if (sortBy === 'latest') return new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime();
      if (sortBy === 'score') return scoreB - scoreA;
      if (sortBy === 'duration') return (b.durationSeconds || 0) - (a.durationSeconds || 0);
      return 0;
    });

    const start = (page - 1) * limitCount;
    const paginated = all.slice(start, start + limitCount);

    return {
      items: paginated,
      total: all.length,
    };
  },

  /** Get a single movie/series by slug or YouTube video ID */
  async getMovieBySlug(slugOrId: string): Promise<GeoContentItem | null> {
    hydrateLocalCache();
    const cached = memoryCache.get(slugOrId);
    if (cached && cached.status !== 'unavailable') return cached;

    for (const item of memoryCache.values()) {
      if ((item.slug === slugOrId || item.youtubeVideoId === slugOrId || item.id === slugOrId) && item.status !== 'unavailable') {
        return item;
      }
    }

    try {
      if (firestore) {
        const docRef = doc(firestore, 'geoContent', slugOrId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const item = snap.data() as GeoContentItem;
          if (item && item.id) {
            memoryCache.set(item.id, item);
            if (item.slug) memoryCache.set(item.slug, item);
            persistLocalCache();
            if (item.status !== 'unavailable') return item;
          }
        }

        const contentRef = collection(firestore, 'geoContent');
        const q = query(contentRef, where('slug', '==', slugOrId), firestoreLimit(1));
        const slugSnap = await getDocs(q);
        if (!slugSnap.empty) {
          const item = slugSnap.docs[0].data() as GeoContentItem;
          if (item && item.id) {
            memoryCache.set(item.id, item);
            if (item.slug) memoryCache.set(item.slug, item);
            persistLocalCache();
            if (item.status !== 'unavailable') return item;
          }
        }
      }
    } catch {
      // Fallback
    }

    return null;
  },

  /**
   * Find all related episodes for a series, channel, or title group
   */
  async getSeriesEpisodes(currentItem: GeoContentItem): Promise<GeoContentItem[]> {
    const country = currentItem.country || currentItem.countryCode || 'RW';
    const channelId = currentItem.channelId || currentItem.youtubeChannelId;

    const res = await this.getMoviesByCountry({
      countryCode: country,
      status: 'published',
      limit: 80,
    });

    const all = res.items;
    let episodes: GeoContentItem[] = [];

    // Match by channel ID
    if (channelId) {
      episodes = all.filter(
        (item) => (item.channelId === channelId || item.youtubeChannelId === channelId)
      );
    }

    // Match by series title root
    const titleRoot = (currentItem.title || '')
      .replace(/ep(isode)?\s*\d+/i, '')
      .replace(/part\s*\d+/i, '')
      .replace(/season\s*\d+/i, '')
      .replace(/s\d+e\d+/i, '')
      .replace(/\|\s*.*$/, '')
      .replace(/-\s*.*$/, '')
      .trim();

    if (titleRoot.length >= 3) {
      const titleMatches = all.filter((item) =>
        (item.title || '').toLowerCase().includes(titleRoot.toLowerCase())
      );
      episodes = Array.from(new Map([...episodes, ...titleMatches].map((i) => [i.id, i])).values());
    }

    // Sort episodes naturally (Episode 1, 2, 3... or chronological)
    episodes.sort((a, b) => {
      const numA = (a.title.match(/(?:ep(?:isode)?|part)\s*(\d+)/i) || [])[1];
      const numB = (b.title.match(/(?:ep(?:isode)?|part)\s*(\d+)/i) || [])[1];
      if (numA && numB) return parseInt(numA, 10) - parseInt(numB, 10);
      return new Date(a.publishedAt || 0).getTime() - new Date(b.publishedAt || 0).getTime();
    });

    return episodes;
  },

  /** Check video availability on YouTube and update status if removed */
  async verifyVideoAvailability(videoId: string): Promise<boolean> {
    const { isAvailable, isEmbeddable } = await YouTubeClient.checkAvailability(videoId);
    if (!isAvailable || !isEmbeddable) {
      await this.updateContentStatus(videoId, 'unavailable');
      return false;
    }
    return true;
  },

  /** Get top recommendations for floating card or hero rail */
  async getRecommendations(countryCode: string = 'RW', count: number = 6): Promise<GeoContentItem[]> {
    hydrateLocalCache();
    const res = await this.getMoviesByCountry({
      countryCode,
      isFullMovieCandidate: true,
      status: 'published',
      sortBy: 'popular',
      limit: count,
    });

    if (res.items.length === 0) {
      const anyRes = await this.getMoviesByCountry({
        countryCode,
        status: 'published',
        sortBy: 'popular',
        limit: count,
      });
      return anyRes.items;
    }

    return res.items;
  },

  /** Search local indexed catalog (0 YouTube API requests) */
  async searchLocalCatalog(searchQuery: string, countryCode: string = 'RW'): Promise<GeoContentItem[]> {
    hydrateLocalCache();
    const res = await this.getMoviesByCountry({
      countryCode,
      searchQuery,
      status: 'published',
      limit: 20,
    });
    return res.items;
  },

  /** Retrieve trusted channels for a country with dynamically accurate indexed counts */
  async getTrustedChannels(countryCode?: string): Promise<TrustedChannel[]> {
    hydrateLocalCache();
    const code = countryCode ? countryCode.toUpperCase() : undefined;

    if (firestore) {
      try {
        const chanRef = collection(firestore, 'trustedChannels');
        const q = code
          ? query(chanRef, where('country', '==', code), firestoreLimit(50))
          : query(chanRef, firestoreLimit(100));
        const snap = await getDocs(q);
        if (!snap.empty) {
          snap.docs.forEach((d) => {
            const data = d.data() as TrustedChannel;
            if (data && data.channelId) {
              const idx = trustedChannelsMemory.findIndex((c) => c.channelId === data.channelId);
              if (idx >= 0) {
                trustedChannelsMemory[idx] = { ...trustedChannelsMemory[idx], ...data };
              } else {
                trustedChannelsMemory.push(data);
              }
            }
          });
          persistLocalCache();
        }
      } catch {
        // Memory cache fallback
      }
    }

    const list = code
      ? trustedChannelsMemory.filter((c) => (c.country || c.countryCode || 'RW').toUpperCase() === code)
      : trustedChannelsMemory;

    // Dynamically calculate accurate indexedVideosCount from qualifying cinema items in memoryCache
    list.forEach((ch) => {
      const qualifyingCount = Array.from(memoryCache.values()).filter(
        (i) =>
          (i.youtubeChannelId === ch.channelId || i.channelId === ch.channelId) &&
          (i.isFullMovieCandidate || i.classification === 'movie' || i.classification === 'series' || i.classification === 'episode') &&
          i.status !== 'unavailable' &&
          i.status !== 'rejected'
      ).length;
      if (qualifyingCount > 0) {
        ch.indexedVideosCount = qualifyingCount;
      }
    });

    return list;
  },

  /** Admin: Add new channel with automatic handle/URL resolution */
  async addChannel(channel: Omit<TrustedChannel, 'createdAt' | 'updatedAt'>): Promise<TrustedChannel> {
    hydrateLocalCache();
    let channelId = (channel.channelId || '').trim();
    let channelTitle = (channel.channelTitle || channelId).trim();
    let notes = channel.notes;

    // Resolve handles, URLs, and custom names to canonical UC... channel ID
    try {
      const resolved = await YouTubeClient.resolveChannelIdentifier(channelId);
      if (resolved) {
        channelId = resolved.channelId;
        if (channelTitle === channel.channelId || !channelTitle) {
          channelTitle = resolved.channelTitle;
        }
        if (resolved.description && !notes) {
          notes = resolved.description;
        }
      }
    } catch {
      // Fallback
    }

    // Safety sanitize: remove any slashes or invalid path characters
    channelId = channelId.replace(/[/?#]/g, '_');

    const existing = trustedChannelsMemory.find((c) => c.channelId === channelId);
    if (existing) {
      if (channel.trust) existing.trust = channel.trust;
      persistLocalCache();
      return existing;
    }

    const newChannel: TrustedChannel = {
      ...channel,
      channelId,
      channelTitle,
      notes,
      country: channel.country || 'RW',
      countryCode: channel.country || 'RW',
      approved: channel.trust === 'approved',
      trustLevel: channel.trust === 'approved' ? 'trusted' : 'review',
      autoPublishMovies: channel.autoPublishMovies ?? true,
      autoPublishSeries: channel.autoPublishSeries ?? true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    trustedChannelsMemory.push(newChannel);
    persistLocalCache();

    if (firestore && newChannel.channelId && !newChannel.channelId.includes('/')) {
      const cleanChan = sanitizeFirestoreDoc(newChannel as unknown as Record<string, unknown>);
      void setDoc(doc(firestore, 'trustedChannels', newChannel.channelId), cleanChan, { merge: true }).catch(() => {});
    }

    return newChannel;
  },

  /** Admin: Approve channel, promote existing candidate videos to published, and auto-scan */
  async approveChannel(channelId: string, approvedBy: string = 'admin'): Promise<ChannelScanStats | void> {
    hydrateLocalCache();
    const ch = trustedChannelsMemory.find((c) => c.channelId === channelId);
    if (ch) {
      ch.trust = 'approved';
      ch.approved = true;
      ch.trustLevel = 'trusted';
      ch.autoPublishMovies = true;
      ch.autoPublishSeries = true;
      ch.approvedBy = approvedBy;
      ch.approvedAt = new Date().toISOString();
      ch.updatedAt = new Date().toISOString();
      persistLocalCache();

      if (firestore && ch.channelId && !ch.channelId.includes('/')) {
        const cleanChan = sanitizeFirestoreDoc(ch as unknown as Record<string, unknown>);
        void setDoc(doc(firestore, 'trustedChannels', ch.channelId), cleanChan, { merge: true }).catch(() => {});
      }

      memoryCache.forEach((item) => {
        if ((item.youtubeChannelId === channelId || item.channelId === channelId) && item.status !== 'rejected') {
          item.channelTrust = 'approved';
          if (item.isFullMovieCandidate) {
            item.status = 'published';
            item.moderationStatus = 'approved';
          }
          item.updatedAt = new Date().toISOString();
          if (firestore) {
            const cleanItem = sanitizeFirestoreDoc(item as unknown as Record<string, unknown>);
            void setDoc(doc(firestore, 'geoContent', item.id), cleanItem, { merge: true }).catch(() => {});
          }
        }
      });
      persistLocalCache();

      // Automatically trigger upload scan and await completion
      return await this.scanChannelUploads(ch.channelId);
    }
  },

  /** Admin: Reject channel */
  async rejectChannel(channelId: string): Promise<void> {
    hydrateLocalCache();
    const ch = trustedChannelsMemory.find((c) => c.channelId === channelId);
    if (ch) {
      ch.trust = 'rejected';
      ch.approved = false;
      ch.trustLevel = 'blocked';
      ch.updatedAt = new Date().toISOString();
      persistLocalCache();

      if (firestore && ch.channelId && !ch.channelId.includes('/')) {
        const cleanChan = sanitizeFirestoreDoc(ch as unknown as Record<string, unknown>);
        void setDoc(doc(firestore, 'trustedChannels', ch.channelId), cleanChan, { merge: true }).catch(() => {});
      }

      memoryCache.forEach((item) => {
        if (item.youtubeChannelId === channelId || item.channelId === channelId) {
          item.channelTrust = 'rejected';
          item.status = 'rejected';
          item.moderationStatus = 'rejected';
          item.updatedAt = new Date().toISOString();
          if (firestore) {
            const cleanItem = sanitizeFirestoreDoc(item as unknown as Record<string, unknown>);
            void setDoc(doc(firestore, 'geoContent', item.id), cleanItem, { merge: true }).catch(() => {});
          }
        }
      });
      persistLocalCache();
    }
  },

  /** Admin: Pause channel */
  async pauseChannel(channelId: string): Promise<void> {
    hydrateLocalCache();
    const ch = trustedChannelsMemory.find((c) => c.channelId === channelId);
    if (ch) {
      ch.trust = 'pending';
      ch.approved = false;
      ch.trustLevel = 'review';
      ch.updatedAt = new Date().toISOString();
      persistLocalCache();

      if (firestore && ch.channelId && !ch.channelId.includes('/')) {
        const cleanChan = sanitizeFirestoreDoc(ch as unknown as Record<string, unknown>);
        void setDoc(doc(firestore, 'trustedChannels', ch.channelId), cleanChan, { merge: true }).catch(() => {});
      }
    }
  },

  /** Admin: Toggle auto-publish for movies on a trusted channel */
  async toggleChannelAutoPublish(channelId: string, autoPublish: boolean): Promise<void> {
    hydrateLocalCache();
    const ch = trustedChannelsMemory.find((c) => c.channelId === channelId);
    if (ch) {
      ch.autoPublishMovies = autoPublish;
      ch.autoPublishSeries = autoPublish;
      ch.updatedAt = new Date().toISOString();
      persistLocalCache();

      if (firestore && ch.channelId && !ch.channelId.includes('/')) {
        const cleanChan = sanitizeFirestoreDoc(ch as unknown as Record<string, unknown>);
        void setDoc(doc(firestore, 'trustedChannels', ch.channelId), cleanChan, { merge: true }).catch(() => {});
      }
    }
  },

  /** Admin: Scan specific channel uploads, index qualifying movies/series, and persist detailed stats */
  async scanChannelUploads(rawChannelId: string): Promise<ChannelScanStats> {
    hydrateLocalCache();
    let cleanChannelId = (rawChannelId || '').trim();

    // Resolve handle/URL if not already a canonical UC... ID
    if (!/^UC[a-zA-Z0-9_-]{22}$/.test(cleanChannelId) || cleanChannelId.includes('/') || cleanChannelId.includes('@')) {
      const resolved = await YouTubeClient.resolveChannelIdentifier(cleanChannelId);
      if (resolved) {
        cleanChannelId = resolved.channelId;
      } else {
        cleanChannelId = cleanChannelId.replace(/[/?#]/g, '_');
      }
    }

    let ch = trustedChannelsMemory.find((c) => c.channelId === cleanChannelId || c.channelId === rawChannelId);
    if (!ch) {
      const meta = await YouTubeClient.getChannelMetadata(cleanChannelId);
      ch = await this.addChannel({
        channelId: cleanChannelId,
        channelTitle: meta?.channelTitle || cleanChannelId,
        country: 'RW',
        trust: 'approved',
        autoPublishMovies: true,
        autoPublishSeries: true,
      });
    }

    ch.channelId = cleanChannelId;
    ch.lastScanStatus = 'scanning';

    const countryCode = (ch.country || ch.countryCode || 'RW').toUpperCase();
    const countryConfig = getCountryConfig(countryCode);

    console.log(`[YouTube] Scanning uploads feed for channel "${ch.channelTitle || ch.channelId}" (${countryCode})...`);

    try {
      // 1. Fetch channel uploads using dedicated uploads playlist (UU...) with automatic fallback
      const videoIds = await YouTubeClient.getChannelUploads(ch.channelId, 50);

      if (videoIds.length === 0) {
        ch.lastScanStatus = 'success';
        ch.lastScanAt = new Date().toISOString();
        ch.lastScanStats = {
          fetched: 0,
          qualifying: 0,
          indexed: 0,
          published: 0,
          skipped: 0,
          status: 'success',
          scannedAt: new Date().toISOString(),
        };
        ch.updatedAt = new Date().toISOString();
        persistLocalCache();

        if (firestore) {
          const cleanChan = sanitizeFirestoreDoc(ch as unknown as Record<string, unknown>);
          await setDoc(doc(firestore, 'trustedChannels', ch.channelId), cleanChan, { merge: true });
        }

        return ch.lastScanStats;
      }

      // 2. Fetch full metadata & durations
      const details = await YouTubeClient.getVideoDetails(videoIds);
      let qualifying = 0;
      let indexed = 0;
      let published = 0;
      let skipped = 0;

      for (const video of details) {
        if (!video.isEmbeddable) {
          skipped++;
          continue;
        }

        const existing = memoryCache.get(video.videoId);
        const wasAlreadyPublished = Boolean(
          existing && (existing.status === 'published' || existing.moderationStatus === 'approved')
        );
        const wasAlreadyRejected = Boolean(
          existing && (existing.status === 'rejected' || existing.moderationStatus === 'rejected')
        );

        const classification = classifyYouTubeVideo({
          title: video.title || '',
          description: video.description || '',
          durationSeconds: video.durationSeconds || 0,
          channelTitle: video.channelTitle || ch.channelTitle,
          channelId: video.channelId || ch.channelId,
          channelTrust: ch.trust || 'approved',
          categoryId: video.categoryId || '',
          countryCode,
          tags: video.tags || [],
          minDurationMinutes: countryConfig.minMovieDurationMinutes,
        });

        const isQualifyingCandidate =
          classification.isFullMovieCandidate ||
          classification.contentType === 'movie' ||
          classification.contentType === 'series' ||
          classification.contentType === 'episode';

        // NON-DESTRUCTIVE FILTER: If not a qualifying cinema item and was not already published, exclude from catalog
        if (!isQualifyingCandidate && !wasAlreadyPublished) {
          skipped++;
          continue;
        }

        qualifying++;

        const isAutoPublish = ch.autoPublishMovies !== false;
        let status: GeoContentStatus = 'pending_review';
        let moderationStatus: ModerationStatus = 'pending_review';

        if (wasAlreadyPublished) {
          // Preserve approved/published status on re-scans (Non-destructive idempotency)
          status = 'published';
          moderationStatus = 'approved';
          published++;
        } else if (wasAlreadyRejected) {
          // Preserve admin explicit rejection
          status = 'rejected';
          moderationStatus = 'rejected';
        } else if (ch.trust === 'approved' && isAutoPublish && classification.isFullMovieCandidate) {
          status = 'published';
          moderationStatus = 'approved';
          published++;
        } else if (ch.trust === 'approved' && isAutoPublish && (classification.contentType === 'series' || classification.contentType === 'episode')) {
          status = 'published';
          moderationStatus = 'approved';
          published++;
        } else if (classification.isFullMovieCandidate && classification.score >= 60 && classification.countryScore >= 15) {
          status = 'published';
          moderationStatus = 'approved';
          published++;
        } else {
          status = 'pending_review';
          moderationStatus = 'pending_review';
        }

        const item: GeoContentItem = {
          id: video.videoId,
          youtubeVideoId: video.videoId,
          youtubeChannelId: video.channelId || ch.channelId,
          channelId: video.channelId || ch.channelId,
          youtubeUrl: `https://www.youtube.com/watch?v=${video.videoId}`,
          channelTitle: video.channelTitle || ch.channelTitle,
          title: video.title || '',
          slug: existing?.slug || (video.title || video.videoId).toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-'),
          description: video.description || '',
          thumbnail: video.thumbnailUrl || '',
          thumbnailUrl: video.thumbnailUrl || '',
          publishedAt: video.publishedAt || new Date().toISOString(),
          durationSeconds: video.durationSeconds || 0,
          durationFormatted: video.durationFormatted || '0m',
          views: Number(video.viewCount || existing?.views || 0),
          viewCount: Number(video.viewCount || existing?.viewCount || 0),
          likes: Number(video.likeCount || existing?.likes || 0),
          likeCount: Number(video.likeCount || existing?.likeCount || 0),
          country: countryCode,
          countryCode,
          language: countryConfig.defaultLanguage || 'rw',
          classification: wasAlreadyPublished ? (existing?.classification || 'movie') : (classification.contentType || 'unknown'),
          type: wasAlreadyPublished ? (existing?.type || 'movie') : (classification.contentType || 'unknown'),
          contentType: wasAlreadyPublished ? (existing?.contentType || 'movie') : (classification.contentType || 'unknown'),
          score: Number(classification.score || existing?.score || 0),
          classificationScore: Number(classification.score || existing?.classificationScore || 0),
          countryScore: Number(classification.countryScore || existing?.countryScore || 0),
          classificationConfidence: Number(classification.confidence || existing?.classificationConfidence || 0),
          classificationReasons: classification.classificationReasons || existing?.classificationReasons || [],
          isFullMovieCandidate: wasAlreadyPublished ? true : Boolean(classification.isFullMovieCandidate),
          isEmbeddable: Boolean(video.isEmbeddable),
          embeddable: Boolean(video.isEmbeddable),
          isSyndicated: Boolean(video.isSyndicated),
          youtubeLicense: video.license || 'standard',
          source: 'youtube',
          channelTrust: ch.trust || 'approved',
          rightsVerified: false,
          status,
          moderationStatus,
          tags: video.tags || [],
          lastCheckedAt: new Date().toISOString(),
          discoveredAt: existing?.discoveredAt || new Date().toISOString(),
          createdAt: existing?.createdAt || video.publishedAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        memoryCache.set(item.id, item);
        memoryCache.set(item.slug, item);
        indexed++;

        if (firestore) {
          try {
            const cleanDoc = sanitizeFirestoreDoc(item as unknown as Record<string, unknown>);
            await setDoc(doc(firestore, 'geoContent', item.id), cleanDoc, { merge: true });
          } catch (err) {
            console.error(`[GeoContentService] Firestore write failed for video ${item.id}:`, err);
          }
        }
      }

      // Count total qualifying cinema videos for this channel in memory
      const totalForChannel = Array.from(memoryCache.values()).filter(
        (i) =>
          (i.youtubeChannelId === ch.channelId || i.channelId === ch.channelId) &&
          (i.isFullMovieCandidate || i.classification === 'movie' || i.classification === 'series' || i.classification === 'episode') &&
          i.status !== 'unavailable' &&
          i.status !== 'rejected'
      ).length;

      ch.indexedVideosCount = totalForChannel;
      ch.lastScanAt = new Date().toISOString();
      ch.lastScanStatus = 'success';
      ch.lastScanStats = {
        fetched: details.length,
        qualifying,
        indexed,
        published,
        skipped,
        status: 'success',
        scannedAt: new Date().toISOString(),
      };
      ch.updatedAt = new Date().toISOString();

      persistLocalCache();

      if (firestore) {
        try {
          const cleanChan = sanitizeFirestoreDoc(ch as unknown as Record<string, unknown>);
          await setDoc(doc(firestore, 'trustedChannels', ch.channelId), cleanChan, { merge: true });
        } catch (err) {
          console.error(`[GeoContentService] Channel record write failed for ${ch.channelId}:`, err);
        }
      }

      console.log(
        `[GeoContentService] Channel scan for "${ch.channelTitle}" complete: Fetched ${details.length}, Qualifying ${qualifying}, Indexed ${indexed}, Published ${published}, Skipped ${ch.lastScanStats.skipped}`
      );

      return ch.lastScanStats;
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Scan error';
      console.error(`[GeoContentService] Channel scan failed for "${ch.channelTitle}":`, errMsg);

      ch.lastScanStatus = 'failed';
      ch.lastScanStats = {
        fetched: 0,
        qualifying: 0,
        indexed: 0,
        published: 0,
        skipped: 0,
        status: 'failed',
        errorMessage: errMsg,
        scannedAt: new Date().toISOString(),
      };
      ch.updatedAt = new Date().toISOString();
      persistLocalCache();

      if (firestore) {
        const cleanChan = sanitizeFirestoreDoc(ch as unknown as Record<string, unknown>);
        void setDoc(doc(firestore, 'trustedChannels', ch.channelId), cleanChan, { merge: true }).catch(() => {});
      }

      return ch.lastScanStats;
    }
  },

  /** Admin: Batch scan all approved channels for a country */
  async scanAllApprovedChannels(countryCode?: string): Promise<{
    totalScanned: number;
    totalIndexed: number;
    totalPublished: number;
    channelResults: Array<{ channelId: string; channelTitle: string; indexed: number; published: number }>;
  }> {
    hydrateLocalCache();
    const channels = await this.getTrustedChannels(countryCode);
    const approvedChannels = channels.filter((c) => c.trust === 'approved');

    let totalIndexed = 0;
    let totalPublished = 0;
    const channelResults: Array<{ channelId: string; channelTitle: string; indexed: number; published: number }> = [];

    for (const ch of approvedChannels) {
      try {
        const stats = await this.scanChannelUploads(ch.channelId);
        totalIndexed += stats.indexed;
        totalPublished += stats.published;
        channelResults.push({
          channelId: ch.channelId,
          channelTitle: ch.channelTitle,
          indexed: stats.indexed,
          published: stats.published,
        });
      } catch (err) {
        console.error(`[GeoContentService] Batch scan error on ${ch.channelTitle}:`, err);
      }
    }

    console.log(`[GeoContentService] Batch scan complete: ${approvedChannels.length} channels, ${totalIndexed} indexed, ${totalPublished} published`);
    return {
      totalScanned: approvedChannels.length,
      totalIndexed,
      totalPublished,
      channelResults,
    };
  },

  /** Retrieve search queries for a country (defaults merged with custom queries) */
  async getCountryQueries(countryCode: string = 'RW'): Promise<CustomCountryQuery[]> {
    hydrateLocalCache();
    const code = countryCode.toUpperCase();
    const country = getCountryConfig(code);

    let list = customQueriesMemory.get(code);
    if (!list || list.length === 0) {
      // Seed default queries from countryConfig
      const defaultQueries: CustomCountryQuery[] = [
        ...country.movieQueries.map((q, idx) => ({
          id: `def-movie-${code}-${idx}`,
          countryCode: code,
          query: q,
          type: 'movie' as const,
          enabled: true,
          isDefault: true,
        })),
        ...country.seriesQueries.map((q, idx) => ({
          id: `def-series-${code}-${idx}`,
          countryCode: code,
          query: q,
          type: 'series' as const,
          enabled: true,
          isDefault: true,
        })),
      ];
      customQueriesMemory.set(code, defaultQueries);
      persistLocalCache();
      list = defaultQueries;
    }

    return list;
  },

  /** Get only active enabled queries for country discovery */
  async getActiveCountryQueries(countryCode: string = 'RW'): Promise<{ movieQueries: string[]; seriesQueries: string[] }> {
    const all = await this.getCountryQueries(countryCode);
    const enabled = all.filter((q) => q.enabled);
    return {
      movieQueries: enabled.filter((q) => q.type === 'movie').map((q) => q.query),
      seriesQueries: enabled.filter((q) => q.type === 'series').map((q) => q.query),
    };
  },

  /** Admin: Add custom search query */
  async addCustomQuery(countryCode: string, queryText: string, type: 'movie' | 'series' = 'movie'): Promise<CustomCountryQuery> {
    hydrateLocalCache();
    const code = countryCode.toUpperCase();
    const list = await this.getCountryQueries(code);

    const newQuery: CustomCountryQuery = {
      id: `custom-${code}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      countryCode: code,
      query: queryText.trim(),
      type,
      enabled: true,
      isDefault: false,
      createdAt: new Date().toISOString(),
    };

    list.push(newQuery);
    customQueriesMemory.set(code, list);
    persistLocalCache();

    if (firestore) {
      void setDoc(doc(firestore, 'customQueries', newQuery.id), sanitizeFirestoreDoc(newQuery as unknown as Record<string, unknown>), { merge: true }).catch(() => {});
    }

    return newQuery;
  },

  /** Admin: Toggle enabled status of search query */
  async toggleCustomQuery(id: string, enabled: boolean): Promise<void> {
    hydrateLocalCache();
    customQueriesMemory.forEach((list) => {
      const target = list.find((q) => q.id === id);
      if (target) {
        target.enabled = enabled;
      }
    });
    persistLocalCache();

    if (firestore) {
      void updateDoc(doc(firestore, 'customQueries', id), { enabled }).catch(() => {});
    }
  },

  /** Admin: Delete custom search query */
  async deleteCustomQuery(id: string): Promise<void> {
    hydrateLocalCache();
    customQueriesMemory.forEach((list, code) => {
      const filtered = list.filter((q) => q.id !== id);
      customQueriesMemory.set(code, filtered);
    });
    persistLocalCache();

    if (firestore) {
      void deleteDoc(doc(firestore, 'customQueries', id)).catch(() => {});
    }
  },

  /** Admin: Reset search queries to default */
  async resetCountryQueriesToDefault(countryCode: string): Promise<CustomCountryQuery[]> {
    hydrateLocalCache();
    const code = countryCode.toUpperCase();
    customQueriesMemory.delete(code);
    persistLocalCache();
    return await this.getCountryQueries(code);
  },

  /** Admin: Update content status (publish, reject, reclassify) */
  async updateContentStatus(
    id: string,
    status: GeoContentStatus,
    isFullMovieCandidate?: boolean,
    classification?: GeoContentItem['classification']
  ): Promise<void> {
    hydrateLocalCache();
    const item = memoryCache.get(id);
    const moderationStatus: ModerationStatus = status === 'published' ? 'approved' : (status as ModerationStatus);

    if (item) {
      item.status = status;
      item.moderationStatus = moderationStatus;
      if (isFullMovieCandidate !== undefined) {
        item.isFullMovieCandidate = isFullMovieCandidate;
      }
      if (classification) {
        item.classification = classification;
        item.type = classification;
        item.contentType = classification;
      }
      item.updatedAt = new Date().toISOString();
      persistLocalCache();
    }

    try {
      if (firestore) {
        const docRef = doc(firestore, 'geoContent', id);
        const updatePayload = sanitizeFirestoreDoc({
          status,
          moderationStatus,
          ...(isFullMovieCandidate !== undefined ? { isFullMovieCandidate } : {}),
          ...(classification ? { classification, type: classification, contentType: classification } : {}),
          updatedAt: new Date().toISOString(),
        });
        await updateDoc(docRef, updatePayload);
      }
    } catch {
      // Memory update completed
    }
  },

  /** Get discovery log summary for a country */
  getDiscoverySummary(countryCode: string = 'RW'): DiscoverySummaryLog | null {
    hydrateLocalCache();
    return summaryLogsMap.get(countryCode.toUpperCase()) || null;
  },

  /** Trigger YouTube Discovery Worker with active configured search queries & Firestore persistence */
  async triggerDiscoverySync(countryCode: string = 'RW'): Promise<DiscoveryWorkerResult> {
    hydrateLocalCache();
    const now = Date.now();
    if (now - lastDiscoveryTimestamp < 30000) {
      const remainingSeconds = Math.ceil((30000 - (now - lastDiscoveryTimestamp)) / 1000);
      throw new Error(`Rate limit active. Please wait ${remainingSeconds}s before running another discovery job.`);
    }

    lastDiscoveryTimestamp = now;
    const country = getCountryConfig(countryCode);
    const channels = await this.getTrustedChannels(countryCode);

    // Retrieve active configured search queries
    const { movieQueries, seriesQueries } = await this.getActiveCountryQueries(countryCode);
    const effectiveCountry = {
      ...country,
      movieQueries: movieQueries.length > 0 ? movieQueries : country.movieQueries,
      seriesQueries: seriesQueries.length > 0 ? seriesQueries : country.seriesQueries,
    };

    const result = await YouTubeDiscoveryWorker.runCountryDiscovery(effectiveCountry, channels);

    // 1. Resiliently save discovered channels
    for (const ch of result.discoveredChannels) {
      if (!trustedChannelsMemory.some((existing) => existing.channelId === ch.channelId)) {
        trustedChannelsMemory.push(ch);
      }
      if (firestore) {
        try {
          const cleanChan = sanitizeFirestoreDoc(ch as unknown as Record<string, unknown>);
          await setDoc(doc(firestore, 'trustedChannels', ch.channelId), cleanChan, { merge: true });
        } catch (err) {
          console.warn(`[GeoContentService] Channel write skipped for ${ch.channelId}:`, err);
        }
      }
    }

    // 2. Resiliently save discovered items into memory cache and Firestore (Per-Item Isolation)
    let writesSucceeded = 0;
    let writesFailed = 0;

    for (const item of result.items) {
      memoryCache.set(item.id, item);
      memoryCache.set(item.slug, item);

      if (firestore) {
        try {
          const cleanDoc = sanitizeFirestoreDoc(item as unknown as Record<string, unknown>);
          const docRef = doc(firestore, 'geoContent', item.id);
          await setDoc(docRef, cleanDoc, { merge: true });
          writesSucceeded++;
        } catch (err) {
          writesFailed++;
          console.error(`[GeoContentService] Firestore write failed for document geoContent/${item.id} ("${item.title}"):`, err);
          result.stats.errors.push({ stage: `Firestore write: ${item.id}`, message: String(err) });
        }
      } else {
        writesSucceeded++;
      }
    }

    result.stats.firestoreWrites = writesSucceeded;

    // 3. Save summary log
    summaryLogsMap.set(country.countryCode, result.summaryLog);
    persistLocalCache();

    console.log(
      `[GeoContentService] YouTube → classified → published → Firestore write SUCCESS: ${writesSucceeded} succeeded, ${writesFailed} failed`
    );
    console.log(
      `[YouTube] Discovery sync complete: ${result.stats.uniqueVideos} unique, ${result.stats.publishedMovies} published movies, ${result.stats.publishedSeries} published series`
    );

    return result;
  },

  /** Admin Stats summary */
  async getAdminStats(): Promise<{
    totalDiscovered: number;
    publishedMovies: number;
    pendingReview: number;
    rejectedCount: number;
    totalChannels: number;
    countriesCount: number;
  }> {
    hydrateLocalCache();
    const all = Array.from(new Map(Array.from(memoryCache.values()).map((i) => [i.id, i])).values());
    const publishedMovies = all.filter((i) => (i.status === 'published' || i.moderationStatus === 'approved') && i.isFullMovieCandidate).length;
    const pendingReview = all.filter((i) => i.status === 'pending_review' || i.moderationStatus === 'pending_review').length;
    const rejectedCount = all.filter((i) => i.status === 'rejected' || i.moderationStatus === 'rejected').length;
    const countriesCount = Object.keys(SUPPORTED_COUNTRIES).length;

    return {
      totalDiscovered: all.length,
      publishedMovies,
      pendingReview,
      rejectedCount,
      totalChannels: trustedChannelsMemory.length,
      countriesCount,
    };
  },
};
