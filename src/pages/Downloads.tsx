/**
 * OrangeFlix Offline Downloads Hub
 * Route: /downloads
 * Manage, search, delete, and stream all saved offline movies with 0 internet connection
 * and export .MP4 video files directly to device storage memory.
 */

import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Download,
  Trash2,
  Play,
  HardDrive,
  WifiOff,
  Search,
  Film,
  Tv,
  HardDriveDownload,
  ArrowRight,
  Info,
} from 'lucide-react';
import { useOfflineDownloads } from '@/hooks/use-offline-downloads';
import { useNetworkStatus } from '@/hooks/use-network-status';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import SEOHead from '@/components/seo/SEOHead';
import { OfflineDownloadService } from '@/services/offline-download-service';
import { toast } from 'sonner';

export default function Downloads() {
  const navigate = useNavigate();
  const { downloads, isLoading, removeDownload, saveToDeviceMemory, totalStorageFormatted } = useOfflineDownloads();
  const { isOffline } = useNetworkStatus();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'movie' | 'tv'>('all');

  const filteredDownloads = useMemo(() => {
    return downloads.filter((item) => {
      const matchesType =
        filterType === 'all'
          ? true
          : filterType === 'movie'
          ? item.mediaType === 'movie' || item.mediaType === 'geo-movie'
          : item.mediaType === 'tv';

      const matchesQuery =
        searchQuery.trim() === ''
          ? true
          : item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.genres && item.genres.some((g) => g.toLowerCase().includes(searchQuery.toLowerCase())));

      return matchesType && matchesQuery;
    });
  }, [downloads, filterType, searchQuery]);

  const handleClearAll = async () => {
    if (window.confirm('Are you sure you want to delete all offline downloaded titles and free device storage?')) {
      await OfflineDownloadService.clearAll();
      toast.success('All offline downloads removed.');
    }
  };

  const handleExportAll = async () => {
    const completed = downloads.filter((d) => d.status === 'completed');
    if (completed.length === 0) {
      toast.error('No completed downloads to export.');
      return;
    }
    toast.info(`Saving ${completed.length} title(s) to device storage memory...`);
    for (let i = 0; i < completed.length; i++) {
      await saveToDeviceMemory(completed[i].id, completed[i].title);
      await new Promise((r) => setTimeout(r, 600));
    }
    toast.success('All downloads exported to device memory!');
  };

  const handlePlayDownload = (item: typeof downloads[0]) => {
    if (item.mediaType === 'geo-movie') {
      navigate(`/${item.countryCode?.toLowerCase() || 'rw'}/movies/${item.id.replace(/^geo-/, '')}`);
    } else {
      navigate(`/watch/${item.id}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#06090e] text-white pt-20 pb-24 px-4 sm:px-6 lg:px-8">
      <SEOHead
        title="Offline Downloads | OrangeFlix"
        description="Stream and manage your offline downloaded movies and series with zero internet connection."
        keywords={['orangeflix offline', 'download movies', 'watch offline movies']}
      />

      <div className="max-w-[1720px] mx-auto space-y-8">
        {/* Offline Global Alert Header */}
        {isOffline && (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 sm:p-5 flex items-center justify-between gap-4 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                <WifiOff className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-amber-300">Offline Mode Active</h3>
                <p className="text-xs text-amber-200/80">
                  You are currently disconnected from the internet. All titles shown below are ready for instant playback!
                </p>
              </div>
            </div>
            <Badge className="bg-amber-500 text-black font-black text-xs px-2.5 py-1 shrink-0">
              Offline Ready
            </Badge>
          </div>
        )}

        {/* Page Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[.08] pb-6">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-orange-400 mb-1">
              <HardDrive className="w-4 h-4" />
              <span>Offline Device Storage & Local Files</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              My Downloads
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
              Watch your favorite cinema offline or save .MP4 files directly to your device memories to open in VLC, MX Player, or any external media player.
            </p>
          </div>

          {/* Storage & Actions */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 bg-white/[.04] border border-white/[.08] rounded-xl px-3.5 py-2">
              <HardDrive className="w-4 h-4 text-orange-400" />
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Storage Used</p>
                <p className="text-xs font-bold text-white tabular-nums">{totalStorageFormatted}</p>
              </div>
            </div>

            {downloads.length > 0 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportAll}
                  className="h-10 border-orange-500/40 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 text-xs rounded-xl font-bold"
                >
                  <HardDriveDownload className="w-3.5 h-3.5 mr-1.5" /> Save All to Device (.MP4)
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearAll}
                  className="h-10 border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 text-xs rounded-xl"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Clear All
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Helpful Info Tip */}
        <div className="rounded-2xl border border-white/[.08] bg-white/[.02] p-4 flex items-center gap-3 text-xs text-slate-300">
          <Info className="w-4 h-4 text-orange-400 shrink-0" />
          <span>
            <strong>Device Storage Ready:</strong> Tap <span className="text-orange-400 font-semibold">Save .MP4</span> on any title to save the full video file into your phone or PC memory. You can then open and watch it using VLC, QuickTime, Windows Media Player, MX Player, or your phone's default gallery.
          </span>
        </div>

        {/* Search & Filters Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search downloaded titles..."
              className="pl-9 bg-white/[.04] border-white/10 text-xs rounded-xl text-white placeholder:text-slate-500 h-10"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/[.08] w-full sm:w-auto justify-center">
            <button
              onClick={() => setFilterType('all')}
              className={`text-xs font-semibold px-4 py-2 rounded-lg transition ${
                filterType === 'all' ? 'bg-orange-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({downloads.length})
            </button>
            <button
              onClick={() => setFilterType('movie')}
              className={`text-xs font-semibold px-4 py-2 rounded-lg transition ${
                filterType === 'movie' ? 'bg-orange-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Movies
            </button>
            <button
              onClick={() => setFilterType('tv')}
              className={`text-xs font-semibold px-4 py-2 rounded-lg transition ${
                filterType === 'tv' ? 'bg-orange-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Series
            </button>
          </div>
        </div>

        {/* Downloads Catalog Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-pulse">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-64 rounded-2xl bg-white/[.05] border border-white/[.08]" />
            ))}
          </div>
        ) : filteredDownloads.length === 0 ? (
          /* Empty State */
          <div className="py-16 text-center rounded-3xl border border-dashed border-white/[.12] bg-white/[.02] p-8">
            <div className="w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center mx-auto mb-4">
              <Download className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-white">No Offline Downloads Found</h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto mt-2 mb-6">
              {downloads.length === 0
                ? 'You haven’t downloaded any movies or TV series yet. Tap the download icon on any movie or series to save to your device storage!'
                : 'No downloaded titles match your filter or search query.'}
            </p>
            <Link to="/movies">
              <Button className="bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-xs px-5">
                Browse Movies Catalog <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredDownloads.map((item) => (
              <div
                key={item.id}
                className="group relative rounded-2xl border border-white/10 bg-[#0c121e] hover:border-orange-500/40 transition-all duration-300 overflow-hidden shadow-xl flex flex-col justify-between"
              >
                {/* Poster / Backdrop Header */}
                <div className="relative aspect-video w-full overflow-hidden bg-black/60">
                  <img
                    src={item.backdropUrl || item.posterUrl || '/images/placeholder.jpg'}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0c121e] via-transparent to-black/40" />

                  {/* Badges */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    <Badge className="bg-black/70 backdrop-blur-md text-[10px] text-white border border-white/15">
                      {item.mediaType === 'tv' ? <Tv className="w-3 h-3 mr-1" /> : <Film className="w-3 h-3 mr-1" />}
                      {item.mediaType === 'tv' ? 'Series' : 'Movie'}
                    </Badge>
                    {item.country && (
                      <Badge className="bg-orange-500 text-white text-[10px] font-bold">
                        {item.country}
                      </Badge>
                    )}
                  </div>

                  {/* Play Overlay Button */}
                  <button
                    onClick={() => handlePlayDownload(item)}
                    className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-[2px]"
                    aria-label={`Play ${item.title}`}
                  >
                    <div className="w-12 h-12 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/50 transform scale-90 group-hover:scale-100 transition-transform">
                      <Play className="w-6 h-6 fill-current ml-0.5" />
                    </div>
                  </button>
                </div>

                {/* Details Body */}
                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white group-hover:text-orange-400 transition-colors line-clamp-1">
                      {item.title}
                    </h3>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                      <span>{item.releaseYear || 'Cinema'}</span>
                      {item.duration && <span>· {item.duration} min</span>}
                      <span>· {item.fileSizeFormatted || 'Ready'}</span>
                    </div>
                  </div>

                  {/* Action Bar */}
                  <div className="space-y-2 pt-2 border-t border-white/[.06]">
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => handlePlayDownload(item)}
                        className="flex-1 h-8 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-lg px-2 shadow-sm"
                      >
                        <Play className="w-3 h-3 fill-current mr-1" /> Play Offline
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => saveToDeviceMemory(item.id, item.title)}
                        className="h-8 border-white/15 bg-white/[0.04] hover:bg-orange-500/20 hover:border-orange-500/40 text-slate-200 hover:text-white text-xs font-semibold rounded-lg px-2.5"
                        title="Save .MP4 file to device storage/memory"
                      >
                        <HardDriveDownload className="w-3.5 h-3.5 mr-1 text-orange-400" /> Save .MP4
                      </Button>

                      <button
                        onClick={() => removeDownload(item.id, item.title)}
                        className="w-8 h-8 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 flex items-center justify-center transition shrink-0"
                        title="Delete from offline storage"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
