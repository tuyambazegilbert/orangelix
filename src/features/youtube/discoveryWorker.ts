/**
 * OrangeFlix YouTube Discovery Worker
 * Coordinates multi-query search, deduplication, classification, channel trust lifecycle, and diagnostics.
 * Conforms strictly to Sections 1, 3, 4, 5, 6, 9, 12.
 * Ensures all constructed GeoContentItem and TrustedChannel objects have safe non-undefined defaults.
 */

import {
  GeoContentItem,
  GeoCountryConfig,
  TrustedChannel,
  DiscoveryStats,
  DiscoverySummaryLog,
  ChannelTrust,
  GeoContentStatus,
  ModerationStatus,
} from '@/types/geo-content';
import { YouTubeClient } from './client';
import { classifyYouTubeVideo } from './classifier';

function createSlug(text: string): string {
  return (text || 'untitled')
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export interface DiscoveryWorkerResult {
  countryCode: string;
  items: GeoContentItem[];
  discoveredChannels: TrustedChannel[];
  stats: DiscoveryStats;
  summaryLog: DiscoverySummaryLog;
  executedAt: string;
  apiError?: string;
}

export const YouTubeDiscoveryWorker = {
  async runCountryDiscovery(
    country: GeoCountryConfig,
    existingTrustedChannels: TrustedChannel[] = []
  ): Promise<DiscoveryWorkerResult> {
    const stats: DiscoveryStats = {
      queriesRun: 0,
      youtubeResults: 0,
      uniqueVideos: 0,
      metadataFetched: 0,
      channelsFetched: 0,
      movies: 0,
      series: 0,
      episodes: 0,
      trailers: 0,
      clips: 0,
      rejected: 0,
      pendingChannels: 0,
      approvedChannelVideos: 0,
      publishedMovies: 0,
      publishedSeries: 0,
      firestoreWrites: 0,
      errors: [],
    };

    const channelTrustMap = new Map<string, ChannelTrust>();
    const channelsMap = new Map<string, TrustedChannel>();

    existingTrustedChannels.forEach((c) => {
      channelTrustMap.set(c.channelId, c.trust);
      channelsMap.set(c.channelId, c);
    });

    (country.trustedChannelIds || []).forEach((id) => {
      if (!channelTrustMap.has(id)) {
        channelTrustMap.set(id, 'approved');
      }
    });

    const allQueries = [...country.movieQueries, ...country.seriesQueries];
    const rawFetchedIds: string[] = [];
    const discoveredVideoIds = new Set<string>();
    let lastApiError: string | undefined;

    console.log(`[YouTube] Search started for ${country.name} with ${allQueries.length} queries...`);

    // 1. Search Queries
    for (const query of allQueries) {
      stats.queriesRun++;
      const res = await YouTubeClient.searchVideos({
        query,
        videoDuration: 'any',
        maxResults: 25,
      });

      if (res.error) {
        lastApiError = res.error;
        stats.errors.push({ stage: `Search: "${query}"`, message: res.error });
        if (res.error.includes('429') || res.error.includes('rateLimitExceeded')) {
          console.warn('[YouTube] Search quota exhausted. Stopping this country scan.');
          break;
        }
      }

      stats.youtubeResults += res.videoIds.length;
      res.videoIds.forEach((id) => {
        rawFetchedIds.push(id);
        discoveredVideoIds.add(id);
      });
    }

    const uniqueIds = Array.from(discoveredVideoIds);
    stats.uniqueVideos = uniqueIds.length;

    console.log(`[YouTube Diagnostics] API results: ${stats.youtubeResults}`);
    console.log(`[YouTube Diagnostics] mapped results: ${rawFetchedIds.length}`);
    console.log(`[YouTube Diagnostics] deduplicated results: ${uniqueIds.length}`);

    if (uniqueIds.length === 0) {
      console.warn(`[YouTube Diagnostics] 0 unique video IDs found. Last error: ${lastApiError || 'None'}`);
      const summaryLog: DiscoverySummaryLog = {
        id: `log-${country.countryCode}-${Date.now()}`,
        countryCode: country.countryCode,
        lastDiscoveryAt: new Date().toISOString(),
        queriesRun: allQueries,
        stats,
        apiStatus: lastApiError ? 'error' : 'healthy',
        errorMessage: lastApiError,
      };

      return {
        countryCode: country.countryCode,
        items: [],
        discoveredChannels: Array.from(channelsMap.values()),
        stats,
        summaryLog,
        executedAt: new Date().toISOString(),
        apiError: lastApiError,
      };
    }

    // 2. Fetch full metadata & durations in batches of 50
    const details = await YouTubeClient.getVideoDetails(uniqueIds);
    stats.metadataFetched = details.length;
    console.log(`[YouTube Diagnostics] metadata fetched: ${details.length}`);

    // 3. Batch Fetch Channel Metadata
    const uniqueChannelIds = Array.from(new Set(details.map((d) => d.channelId).filter(Boolean)));
    const channelsMeta = await YouTubeClient.getChannelsMetadata(uniqueChannelIds);
    stats.channelsFetched = channelsMeta.length;

    channelsMeta.forEach((chMeta) => {
      if (!channelsMap.has(chMeta.channelId)) {
        const isPreApproved = (country.trustedChannelIds || []).includes(chMeta.channelId);
        const trust: ChannelTrust = isPreApproved ? 'approved' : 'pending';

        const newChan: TrustedChannel = {
          channelId: chMeta.channelId,
          channelTitle: chMeta.channelTitle || '',
          country: country.countryCode || 'RW',
          countryCode: country.countryCode || 'RW',
          trust,
          approved: isPreApproved,
          trustLevel: isPreApproved ? 'trusted' : 'review',
          autoPublishMovies: isPreApproved,
          autoPublishSeries: isPreApproved,
          customUrl: chMeta.customUrl || '',
          thumbnailUrl: chMeta.thumbnailUrl || '',
          notes: chMeta.description || '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        channelsMap.set(chMeta.channelId, newChan);
        channelTrustMap.set(chMeta.channelId, trust);

        if (!isPreApproved) {
          stats.pendingChannels++;
        }
      }
    });

    // 4. Classify each video and apply trust rules
    const items: GeoContentItem[] = [];
    const seenSlugs = new Set<string>();

    details.forEach((video) => {
      const channelTrust: ChannelTrust = channelTrustMap.get(video.channelId) || 'pending';

      const classification = classifyYouTubeVideo({
        title: video.title || '',
        description: video.description || '',
        durationSeconds: video.durationSeconds || 0,
        channelTitle: video.channelTitle || '',
        channelId: video.channelId || '',
        channelTrust,
        categoryId: video.categoryId || '',
        countryCode: country.countryCode || 'RW',
        tags: video.tags || [],
        minDurationMinutes: country.minMovieDurationMinutes,
      });

      // Track statistics by type
      if (classification.contentType === 'movie') stats.movies++;
      else if (classification.contentType === 'series') stats.series++;
      else if (classification.contentType === 'episode') stats.episodes++;
      else if (classification.contentType === 'trailer') stats.trailers++;
      else if (classification.contentType === 'clip') stats.clips++;

      if (channelTrust === 'approved') {
        stats.approvedChannelVideos++;
      }

      // Rejections
      if (!video.isEmbeddable || channelTrust === 'rejected') {
        stats.rejected++;
        return;
      }

      if (classification.score < 10 && !classification.isFullMovieCandidate && classification.contentType === 'unknown') {
        stats.rejected++;
        return;
      }

      // Status resolution based on channel trust and score
      let status: GeoContentStatus = 'pending_review';
      let moderationStatus: ModerationStatus = 'pending_review';

      if (channelTrust === 'approved') {
        if (classification.isFullMovieCandidate) {
          status = 'published';
          moderationStatus = 'approved';
          stats.publishedMovies++;
        } else if (classification.contentType === 'series' || classification.contentType === 'episode') {
          status = 'published';
          moderationStatus = 'approved';
          stats.publishedSeries++;
        }
      } else if (classification.isFullMovieCandidate && classification.score >= 60 && classification.countryScore >= 15) {
        status = 'published';
        moderationStatus = 'approved';
        stats.publishedMovies++;
      } else {
        status = 'pending_review';
        moderationStatus = 'pending_review';
      }

      let baseSlug = createSlug(video.title || video.videoId);
      if (seenSlugs.has(baseSlug)) {
        baseSlug = `${baseSlug}-${video.videoId.substring(0, 5)}`;
      }
      seenSlugs.add(baseSlug);

      const item: GeoContentItem = {
        id: video.videoId,
        youtubeVideoId: video.videoId,
        youtubeChannelId: video.channelId || '',
        channelId: video.channelId || '',
        youtubeUrl: `https://www.youtube.com/watch?v=${video.videoId}`,
        channelTitle: video.channelTitle || '',
        title: video.title || '',
        slug: baseSlug,
        description: video.description || '',
        thumbnail: video.thumbnailUrl || '',
        thumbnailUrl: video.thumbnailUrl || '',
        publishedAt: video.publishedAt || new Date().toISOString(),
        durationSeconds: video.durationSeconds || 0,
        durationFormatted: video.durationFormatted || '0m',
        views: Number(video.viewCount || 0),
        viewCount: Number(video.viewCount || 0),
        likes: Number(video.likeCount || 0), // Guaranteed numeric (0 if undefined)
        likeCount: Number(video.likeCount || 0), // Guaranteed numeric (0 if undefined)
        country: country.countryCode || 'RW',
        countryCode: country.countryCode || 'RW',
        language: country.defaultLanguage || 'rw',
        classification: classification.contentType || 'unknown',
        type: classification.contentType || 'unknown',
        contentType: classification.contentType || 'unknown',
        score: Number(classification.score || 0),
        classificationScore: Number(classification.score || 0),
        countryScore: Number(classification.countryScore || 0),
        classificationConfidence: Number(classification.confidence || 0),
        classificationReasons: classification.classificationReasons || [],
        isFullMovieCandidate: Boolean(classification.isFullMovieCandidate),
        isEmbeddable: Boolean(video.isEmbeddable),
        embeddable: Boolean(video.isEmbeddable),
        isSyndicated: Boolean(video.isSyndicated),
        youtubeLicense: video.license || 'standard',
        source: 'youtube',
        channelTrust,
        rightsVerified: false,
        status,
        moderationStatus,
        tags: video.tags || [],
        lastCheckedAt: new Date().toISOString(),
        discoveredAt: new Date().toISOString(),
        createdAt: video.publishedAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      items.push(item);
    });

    console.log(`[YouTube Diagnostics] filtered results: ${items.length} (rejected: ${stats.rejected})`);
    console.log(`[YouTube Diagnostics] classified movies: ${stats.movies}`);
    console.log(`[YouTube Diagnostics] classified series: ${stats.series}`);
    console.log(`[YouTube Diagnostics] published movies: ${stats.publishedMovies}`);
    console.log(`[YouTube Diagnostics] published series: ${stats.publishedSeries}`);

    // Sort by candidate priority & popularity
    items.sort((a, b) => {
      if (a.isFullMovieCandidate && !b.isFullMovieCandidate) return -1;
      if (!a.isFullMovieCandidate && b.isFullMovieCandidate) return 1;
      return (b.score || 0) * 1000 + (b.views || 0) / 1000 - ((a.score || 0) * 1000 + (a.views || 0) / 1000);
    });

    const summaryLog: DiscoverySummaryLog = {
      id: `log-${country.countryCode}-${Date.now()}`,
      countryCode: country.countryCode,
      lastDiscoveryAt: new Date().toISOString(),
      queriesRun: allQueries,
      stats,
      apiStatus: lastApiError ? 'error' : 'healthy',
      errorMessage: lastApiError,
    };

    return {
      countryCode: country.countryCode,
      items,
      discoveredChannels: Array.from(channelsMap.values()),
      stats,
      summaryLog,
      executedAt: new Date().toISOString(),
      apiError: lastApiError,
    };
  },
};
