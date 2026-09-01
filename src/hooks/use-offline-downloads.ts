import { useState, useEffect, useCallback } from 'react';
import { OfflineDownloadService, DownloadedMedia } from '@/services/offline-download-service';
import { toast } from 'sonner';

export function useOfflineDownloads() {
  const [downloads, setDownloads] = useState<DownloadedMedia[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadDownloads = useCallback(async () => {
    try {
      const items = await OfflineDownloadService.getAllDownloads();
      setDownloads(items);
    } catch {
      setDownloads([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDownloads();
    const unsubscribe = OfflineDownloadService.subscribe(() => {
      void loadDownloads();
    });
    return unsubscribe;
  }, [loadDownloads]);

  const startDownload = async (params: {
    id: string;
    title: string;
    mediaType: 'movie' | 'tv' | 'geo-movie';
    posterUrl?: string;
    backdropUrl?: string;
    duration?: number;
    durationFormatted?: string;
    releaseYear?: string | number;
    rating?: number;
    genres?: string[];
    country?: string;
    countryCode?: string;
    videoUrl?: string;
    youtubeVideoId?: string;
  }) => {
    toast.info(`Downloading "${params.title}" for offline playback...`);
    await OfflineDownloadService.startDownload(params);
    toast.success(`"${params.title}" downloaded! Available anytime offline.`);
  };

  const removeDownload = async (id: string, title?: string) => {
    await OfflineDownloadService.removeDownload(id);
    toast.success(`Removed ${title ? `"${title}"` : 'download'} from offline storage`);
  };

  const isDownloaded = useCallback((id: string) => {
    return downloads.some((d) => d.id === id && d.status === 'completed');
  }, [downloads]);

  const getDownloadProgress = useCallback((id: string) => {
    const item = downloads.find((d) => d.id === id);
    if (!item) return null;
    return {
      status: item.status,
      progress: item.progress,
      fileSize: item.fileSizeFormatted,
    };
  }, [downloads]);

  const totalStorageBytes = downloads.reduce(
    (acc, item) => acc + (item.fileSizeBytes || 0),
    0
  );
  const totalStorageFormatted = OfflineDownloadService.formatBytes(totalStorageBytes);

  return {
    downloads,
    isLoading,
    startDownload,
    removeDownload,
    isDownloaded,
    getDownloadProgress,
    totalStorageFormatted,
    totalCount: downloads.filter((d) => d.status === 'completed').length,
  };
}
