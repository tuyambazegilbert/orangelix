import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  BookmarkPlus,
  Check,
  ChevronDown,
  Clock3,
  Heart,
  Share2,
  Star,
  Sparkles,
  X,
  Play,
  Music2,
  BookOpen,
  Download,
  CheckCircle2,
  Flame,
  CloudSun,
  MapPin,
  CloudRain,
  Sun,
  Cloud,
  Snowflake,
  Zap,
} from 'lucide-react';
import { useOfflineDownloads } from '@/hooks/use-offline-downloads';
import { useMovieDetails, useSeasonDetails, useSeriesDetails, useTrending } from '@/hooks/use-tmdb';
import { MediaDetail } from '@/types/media';
import { MovieService } from '@/lib/movies';
import { useAuth } from '@/contexts/AuthContext';
import { FirebaseData } from '@/lib/firebase-data';
import { Analytics } from '@/services/analytics';
import { ContentRelationships, ContentEntityRelations } from '@/features/contentGraph/ContentRelationships';
import { RecommendationService } from '@/features/recommendations/recommendationService';
import { RecommendedItem } from '@/features/recommendations/engine/types';
import { WeatherApi, WeatherCondition } from '@/services/weather-api';
import { GeolocationService, DetectedLocation } from '@/services/geolocation';
import { GeoContentService } from '@/services/geo-content-service';
import { GeoContentItem } from '@/types/geo-content';
import RelatedMusic from '@/features/contentGraph/RelatedMusic';
import RelatedNews from '@/features/contentGraph/RelatedNews';
import RelatedBooks from '@/features/contentGraph/RelatedBooks';
import CinematicPlayer from '@/components/watch/CinematicPlayer';
import CastRail from '@/components/watch/CastRail';
import ContentRail from '@/components/ContentRail';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { POSTER_FALLBACK } from '@/lib/tmdb/images';
import { getCanonicalMediaId, partitionRails } from '@/lib/deduplication';
import MediaReviewsSection from '@/components/reviews/MediaReviewsSection';
import { WhereToWatchProviders } from '@/components/watch/WhereToWatchProviders';

const duration = (minutes: number | null | undefined) =>
  minutes ? `${Math.floor(minutes / 60)}h ${minutes % 60}m` : '—';
const progressKey = (id: string) => `orangeflix_progress_${id}`;

function WatchSkeleton() {
  return (
    <main className="max-w-[1720px] mx-auto px-3 sm:px-5 lg:px-8 pt-3 sm:pt-4 space-y-4 animate-pulse">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 xl:gap-8">
        <div className="lg:col-span-8 space-y-4">
          <div className="aspect-video w-full rounded-2xl bg-white/10 border border-white/10" />
          <div className="h-8 w-2/3 bg-white/20 rounded-xl" />
          <div className="flex gap-2">
            <div className="h-5 w-20 bg-orange-500/20 rounded" />
            <div className="h-5 w-16 bg-white/10 rounded" />
            <div className="h-5 w-24 bg-white/10 rounded" />
          </div>
        </div>
        <div className="lg:col-span-4 space-y-3">
          <div className="h-6 w-1/3 bg-white/20 rounded" />
          <div className="h-20 w-full bg-white/10 rounded-xl" />
          <div className="h-20 w-full bg-white/10 rounded-xl" />
          <div className="h-20 w-full bg-white/10 rounded-xl" />
        </div>
      </div>
    </main>
  );
}

export default function Watch() {
  const { id = '' } = useParams<{ id: string }>();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const isTv = id.startsWith('tv-') || params.get('type') === 'tv';
  const tmdbId = Number(id.replace(/^(tv|movie)-/, '')) || null;
  const legacy = !tmdbId ? MovieService.getMovies().find((movie) => movie.id === id) : null;

  const movie = useMovieDetails(!isTv ? tmdbId : null);
  const series = useSeriesDetails(isTv ? tmdbId : null);
  const trending = useTrending('all', 'week');

  const initialSeason = Number(params.get('season')) || 1;
  const initialEpisode = Number(params.get('episode')) || 1;
  const [season, setSeason] = useState(initialSeason);
  const [currentEpisode, setCurrentEpisode] = useState(initialEpisode);
  const seasonData = useSeasonDetails(isTv ? tmdbId : null, season);

  // Sync with URL query params
  useEffect(() => {
    const pSeason = Number(params.get('season'));
    const pEpisode = Number(params.get('episode'));
    if (pSeason && pSeason > 0 && pSeason !== season) {
      setSeason(pSeason);
    }
    if (pEpisode && pEpisode > 0 && pEpisode !== currentEpisode) {
      setCurrentEpisode(pEpisode);
    }
  }, [params, season, currentEpisode]);

  // Sync season if selected season not in series seasons
  useEffect(() => {
    if (series.data?.seasons && series.data.seasons.length > 0) {
      const hasSeason = series.data.seasons.some((s) => s.seasonNumber === season);
      if (!hasSeason) {
        const firstValid = series.data.seasons.find((s) => s.seasonNumber > 0) || series.data.seasons[0];
        if (firstValid) {
          setSeason(firstValid.seasonNumber);
        }
      }
    }
  }, [series.data?.seasons, season]);

  const [expanded, setExpanded] = useState(false);
  const [favorite, setFavorite] = useState(false);

  // Content Graph & Post-Watch State
  const [relations, setRelations] = useState<ContentEntityRelations>({
    soundtrack: null,
    news: [],
    sourceBook: null,
  });
  const [isLoadingRelations, setIsLoadingRelations] = useState(true);
  const [showPostWatch, setShowPostWatch] = useState(false);
  const [postWatchRecs, setPostWatchRecs] = useState<RecommendedItem[]>([]);
  const [hasCompleted, setHasCompleted] = useState(false);

  // Weather & Geo Suggestions State
  const [showWeatherModal, setShowWeatherModal] = useState(false);
  const [showGeoModal, setShowGeoModal] = useState(false);
  const [weatherState, setWeatherState] = useState<{
    condition: WeatherCondition | null;
    recs: RecommendedItem[];
    loading: boolean;
  }>({
    condition: null,
    recs: [],
    loading: false,
  });
  const [geoState, setGeoState] = useState<{
    location: DetectedLocation | null;
    items: GeoContentItem[];
    loading: boolean;
  }>({
    location: null,
    items: [],
    loading: false,
  });

  // Prefetch visitor country on mount for localized button display
  useEffect(() => {
    GeolocationService.detectVisitorCountry()
      .then((loc) => {
        setGeoState((prev) => ({ ...prev, location: loc }));
      })
      .catch(() => {});
  }, []);

  const handleOpenWeatherPicks = async () => {
    setShowWeatherModal(true);
    if (!weatherState.condition || weatherState.recs.length === 0) {
      setWeatherState((prev) => ({ ...prev, loading: true }));
      try {
        const w = await WeatherApi.getWeatherByCity('Kigali');
        if (w) {
          const recs = await RecommendationService.getWeatherRecs(
            w.conditionText || w.condition || 'Clear',
            w.temperature || 22,
            currentUser?.id,
            6
          );
          setWeatherState({ condition: w, recs, loading: false });
        } else {
          setWeatherState((prev) => ({ ...prev, loading: false }));
        }
      } catch {
        setWeatherState((prev) => ({ ...prev, loading: false }));
      }
    }
  };

  const handleOpenGeoPicks = async () => {
    setShowGeoModal(true);
    if (geoState.items.length === 0) {
      setGeoState((prev) => ({ ...prev, loading: true }));
      try {
        const loc = geoState.location || (await GeolocationService.detectVisitorCountry());
        const items = await GeoContentService.getRecommendations(loc.countryCode, 6);
        setGeoState({ location: loc, items, loading: false });
      } catch {
        setGeoState((prev) => ({ ...prev, loading: false }));
      }
    }
  };

  const getWeatherIcon = (condition?: string) => {
    const c = (condition || '').toLowerCase();
    if (c.includes('rain') || c.includes('drizzle')) return <CloudRain className="w-5 h-5 text-sky-400" />;
    if (c.includes('snow') || c.includes('ice') || c.includes('blizzard')) return <Snowflake className="w-5 h-5 text-blue-300" />;
    if (c.includes('storm') || c.includes('thunder')) return <Zap className="w-5 h-5 text-amber-400" />;
    if (c.includes('cloud') || c.includes('overcast') || c.includes('fog')) return <Cloud className="w-5 h-5 text-slate-300" />;
    return <Sun className="w-5 h-5 text-amber-400" />;
  };

  const { startDownload, isDownloaded, getDownloadProgress } = useOfflineDownloads();

  const media = useMemo<MediaDetail | null>(() => {
    if (legacy)
      return {
        id: legacy.id,
        tmdbId: 0,
        mediaType: legacy.type === 'Series' ? 'tv' : 'movie',
        title: legacy.title,
        description: legacy.description,
        posterUrl: legacy.imageUrl,
        backdropUrl: legacy.imageUrl,
        imageUrl: legacy.imageUrl,
        rating: legacy.rating,
        voteAverage: legacy.rating * 2,
        voteCount: legacy.totalRatings,
        releaseDate: null,
        releaseYear: legacy.releaseYear,
        genres: legacy.genre,
        duration: legacy.duration,
        tagline: null,
        status: null,
        cast: [],
        crew: [],
        videos: [],
        similar: [],
        recommendations: [],
      };
    return movie.data || series.data || null;
  }, [legacy, movie.data, series.data]);

  useEffect(() => {
    if (currentUser) setFavorite(MovieService.isFavorite(id, currentUser.id));
  }, [currentUser, id]);

  useEffect(() => {
    if (id.startsWith('geo-')) {
      const parts = id.split('-');
      if (parts.length >= 3) {
        const countryCode = parts[1];
        const slug = parts.slice(2).join('-');
        navigate(`/${countryCode.toLowerCase()}/movies/${slug}`, { replace: true });
      } else {
        navigate(`/rw/movies/${id.replace(/^geo-/, '')}`, { replace: true });
      }
    }
  }, [id, navigate]);

  // Analytics & Content Graph loader
  useEffect(() => {
    if (media) {
      Analytics.logEvent('watch_start', {
        userId: currentUser?.id,
        entityType: media.mediaType,
        entityId: id,
        entityTitle: media.title,
      });

      setIsLoadingRelations(true);
      ContentRelationships.resolveForMovie(media.title, media.tmdbId || undefined, media.genres)
        .then((data) => setRelations(data))
        .finally(() => setIsLoadingRelations(false));
    }
  }, [media, id, currentUser]);

  const rawId = id || (media ? `${media.mediaType}-${media.tmdbId}` : '');
  const savedProgress = Number(localStorage.getItem(progressKey(rawId)) || 0);
  const directVideo = legacy?.videoUrl || null;

  const writers = media ? media.crew.filter((person) => /writer|screenplay/i.test(person.job)).slice(0, 2) : [];
  const director = media ? media.crew.find((person) => person.job === 'Director') : undefined;

  const partitionedWatchRails = useMemo(() => {
    if (!media) return { upNext: [], selectedForYou: [], similarStories: [], trendingNow: [] };

    const currentKey = getCanonicalMediaId(media);
    const excludeSet = new Set<string>([currentKey, rawId.toLowerCase()]);

    const recs = (media.recommendations || []) as any[];
    const sims = (media.similar || []) as any[];
    const trends = (trending.data?.items || []) as any[];

    const partitioned = partitionRails<any>(
      [
        {
          key: 'upNext',
          items: [...recs, ...sims, ...trends],
          maxCount: 7,
        },
        {
          key: 'selectedForYou',
          items: recs,
          maxCount: 12,
          fallbackItems: trends,
        },
        {
          key: 'similarStories',
          items: sims,
          maxCount: 12,
          fallbackItems: trends,
        },
        {
          key: 'trendingNow',
          items: trends,
          maxCount: 12,
        },
      ],
      excludeSet
    );

    return {
      upNext: (partitioned.upNext || []) as MediaDetail[],
      selectedForYou: (partitioned.selectedForYou || []) as MediaItem[],
      similarStories: (partitioned.similarStories || []) as MediaItem[],
      trendingNow: (partitioned.trendingNow || []) as MediaItem[],
    };
  }, [media, trending.data?.items, rawId]);

  const upNextList = partitionedWatchRails.upNext;

  const save = () => {
    if (!currentUser || !media) return toast.error('Sign in to save this title');
    if (favorite) {
      MovieService.removeFromFavorites(rawId, currentUser.id);
      void FirebaseData.removeWatchlist(currentUser.id, rawId);
      setFavorite(false);
      toast.success('Removed from watchlist');
    } else {
      MovieService.addToFavorites(rawId, currentUser.id, {
        tmdbId: media.tmdbId || undefined,
        mediaType: media.mediaType,
        cachedMedia: media,
      });
      void FirebaseData.setWatchlist(currentUser.id, media);
      setFavorite(true);
      toast.success('Added to watchlist');
    }
  };

  const persistProgress = (seconds: number, total: number) => {
    if (!media) return;
    localStorage.setItem(progressKey(rawId), String(Math.floor(seconds)));
    if (currentUser) void FirebaseData.setHistory(currentUser.id, media, seconds, total);
    Analytics.logEvent('watch_progress', {
      userId: currentUser?.id,
      entityType: media.mediaType,
      entityId: rawId,
      entityTitle: media.title,
      metadata: {
        seconds: Math.floor(seconds),
        durationSeconds: Math.floor(total),
        completionPercent: total > 0 ? Number(((seconds / total) * 100).toFixed(1)) : 0,
      },
    });

    // Check completion threshold (>= 80%)
    if (total > 0 && seconds / total >= 0.8 && !hasCompleted) {
      setHasCompleted(true);
      Analytics.logEvent('watch_complete', {
        userId: currentUser?.id,
        entityType: media.mediaType,
        entityId: rawId,
        entityTitle: media.title,
      });

      // Load post-watch recommendations
      RecommendationService.getPostWatch(media.title, undefined, currentUser?.id, 3).then((recs) => {
        setPostWatchRecs(recs);
        setShowPostWatch(true);
      });
    }
  };

  if (movie.isLoading || series.isLoading) return <WatchSkeleton />;
  if (!media)
    return (
      <main className="page-wrap grid min-h-[65vh] place-items-center text-center">
        <div>
          <h1 className="text-2xl font-bold text-white">This title isn’t available</h1>
          <p className="mt-2 text-slate-400">It may have been removed or the link may be invalid.</p>
          <Link to="/movies" className="premium-button mt-5 inline-flex rounded-lg px-4 py-2 text-sm font-semibold">
            Browse movies
          </Link>
        </div>
      </main>
    );

  return (
    <div className="min-h-screen pb-16">
      <div className="max-w-[1720px] mx-auto px-3 sm:px-5 lg:px-8 pt-3 sm:pt-4">
        {/* Navigation & Breadcrumb Header */}
        <div className="flex items-center justify-between gap-3 mb-3 sm:mb-4">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-orange-500/30 bg-orange-500/10 px-2.5 py-0.5 text-[11px] font-bold text-orange-400 uppercase tracking-wider">
              {media.mediaType === 'tv' ? 'TV Series' : 'Feature Film'}
            </span>
            {media.releaseYear && (
              <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-slate-300">
                {media.releaseYear}
              </span>
            )}
          </div>
        </div>

        {/* 1. Top Section: 2-Column Responsive High-Density Player & Queue Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 xl:gap-8 items-start">
          {/* Left Column (Player, Title, Actions, Synopsis) */}
          <div className="lg:col-span-8 xl:col-span-8 2xl:col-span-8 space-y-4">
            {/* Cinematic Player */}
            <div className="w-full">
              <CinematicPlayer
                id={rawId}
                title={media.title}
                poster={media.posterUrl || media.imageUrl}
                backdropUrl={media.backdropUrl || media.imageUrl}
                videoUrl={directVideo}
                trailerKey={!directVideo ? media.trailerKey : null}
                youtubeVideoId={!directVideo ? media.trailerKey : null}
                durationMinutes={media.duration || undefined}
                initialProgress={savedProgress}
                onProgress={persistProgress}
              />
            </div>

            {/* Title & Metadata */}
            <div className="space-y-3 pt-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white">
                  {media.title}
                </h1>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="flex items-center gap-1 rounded-lg bg-orange-500/15 border border-orange-500/30 px-2.5 py-1 text-xs font-bold text-orange-400">
                    <Star className="h-3.5 w-3.5 fill-current" />
                    {media.voteAverage.toFixed(1)} / 10
                  </span>
                  <span className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-slate-300">
                    {media.mediaType === 'tv' ? 'SERIES' : 'PG-13'}
                  </span>
                </div>
              </div>

              {/* Details & Tags */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-slate-400">
                {director && (
                  <span className="text-slate-300">
                    Directed by <strong className="text-white">{director.name}</strong>
                  </span>
                )}
                {director && <span>•</span>}
                <span>{media.releaseYear || 'New release'}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock3 className="h-3.5 w-3.5 text-orange-400" />
                  {duration(media.duration)}
                </span>
                {media.genres.length > 0 && <span>•</span>}
                <div className="flex flex-wrap gap-1.5">
                  {media.genres.map((genre) => (
                    <span
                      key={genre}
                      className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[11px] text-slate-300"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Deck */}
              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-white/[0.07]">
                <button
                  onClick={save}
                  className={`inline-flex h-9 items-center gap-2 rounded-xl border px-3 text-xs font-semibold transition ${
                    favorite
                      ? 'border-orange-400/40 bg-orange-400/15 text-orange-300'
                      : 'border-white/[.13] bg-white/[.04] text-white hover:bg-white/[.09]'
                  }`}
                >
                  <BookmarkPlus className="h-4 w-4" />
                  {favorite ? 'In Watchlist' : 'Watchlist'}
                </button>

                <button
                  onClick={save}
                  className="grid h-9 w-9 place-items-center rounded-xl border border-white/[.13] bg-white/[.04] text-slate-300 hover:bg-white/[.09] transition"
                  aria-label="Favorite"
                >
                  <Heart className={`h-4 w-4 ${favorite ? 'fill-rose-500 text-rose-500' : ''}`} />
                </button>

                {/* Offline Download button */}
                <button
                  onClick={() => {
                    void startDownload({
                      id: rawId,
                      title: media.title,
                      mediaType: media.mediaType === 'tv' ? 'tv' : 'movie',
                      posterUrl: media.posterUrl || media.imageUrl,
                      backdropUrl: media.backdropUrl || media.imageUrl,
                      duration: media.duration || undefined,
                      releaseYear: media.releaseYear,
                      rating: media.voteAverage,
                      genres: media.genres,
                      videoUrl: directVideo || undefined,
                      youtubeVideoId: media.trailerKey || undefined,
                    });
                  }}
                  disabled={isDownloaded(rawId) || getDownloadProgress(rawId)?.status === 'downloading'}
                  className={`inline-flex h-9 items-center gap-2 rounded-xl border px-3 text-xs font-semibold transition ${
                    isDownloaded(rawId)
                      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                      : getDownloadProgress(rawId)?.status === 'downloading'
                      ? 'border-orange-500/40 bg-orange-500/10 text-orange-400 animate-pulse'
                      : 'border-white/[.13] bg-white/[.04] text-white hover:bg-white/[.09]'
                  }`}
                >
                  {isDownloaded(rawId) ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Downloaded (Offline)
                    </>
                  ) : getDownloadProgress(rawId)?.status === 'downloading' ? (
                    <>
                      <Download className="h-4 w-4 animate-bounce" /> {getDownloadProgress(rawId)?.progress}%
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" /> Download for Offline
                    </>
                  )}
                </button>

                <button
                  onClick={() => {
                    void navigator.clipboard?.writeText(window.location.href);
                    Analytics.logEvent('share', { userId: currentUser?.id, entityId: rawId, entityTitle: media.title });
                    toast.success('Link copied to clipboard');
                  }}
                  className="inline-flex h-9 items-center gap-2 rounded-xl border border-white/[.13] bg-white/[.04] px-3 text-xs font-semibold text-slate-300 hover:bg-white/[.09] transition"
                >
                  <Share2 className="h-4 w-4" /> Share
                </button>

                {/* Manual Trigger for Up Next Recommendations Modal */}
                <button
                  onClick={() => {
                    if (postWatchRecs.length === 0 && media) {
                      RecommendationService.getPostWatch(media.title, undefined, currentUser?.id, 3).then((recs) => {
                        setPostWatchRecs(recs);
                        setShowPostWatch(true);
                      });
                    } else {
                      setShowPostWatch(true);
                    }
                  }}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-orange-500/40 bg-orange-500/15 px-3 text-xs font-bold text-orange-300 hover:bg-orange-500/25 transition shadow-sm"
                  title="Curated Recommendations for What to Watch Next"
                >
                  <Sparkles className="h-3.5 w-3.5 text-orange-400" />
                  <span>Next Picks</span>
                </button>

                {/* Weather Picks Button */}
                <button
                  onClick={handleOpenWeatherPicks}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-sky-500/40 bg-sky-500/15 px-3 text-xs font-bold text-sky-300 hover:bg-sky-500/25 transition shadow-sm"
                  title="Weather-based entertainment suggestions matching local atmospheric conditions"
                >
                  <CloudSun className="h-3.5 w-3.5 text-sky-400" />
                  <span>Weather Picks</span>
                </button>

                {/* Local & Regional Cinema Button */}
                <button
                  onClick={handleOpenGeoPicks}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-3 text-xs font-bold text-emerald-300 hover:bg-emerald-500/25 transition shadow-sm"
                  title="Discover authentic African & regional films based on your location"
                >
                  <MapPin className="h-3.5 w-3.5 text-emerald-400" />
                  <span>{geoState.location ? `${geoState.location.flag} Local Cinema` : 'Local Cinema'}</span>
                </button>

                <div className="hidden 2xl:flex items-center gap-2 ml-auto text-[11px] text-slate-400 bg-white/[0.03] border border-white/[0.07] px-3 py-1.5 rounded-xl">
                  <Check className="h-3.5 w-3.5 text-orange-400" />
                  <span>4K UHD • Lossless Audio</span>
                </div>
              </div>

              {/* Synopsis Box */}
              <div className="rounded-2xl border border-white/[.08] bg-white/[.025] p-4 space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Synopsis</p>
                <p className={`text-xs sm:text-sm leading-relaxed text-slate-300 ${expanded ? '' : 'line-clamp-3'}`}>
                  {media.description}
                </p>
                {media.description.length > 180 && (
                  <button
                    onClick={() => setExpanded(!expanded)}
                    className="text-xs font-semibold text-orange-400 hover:text-orange-300"
                  >
                    {expanded ? 'Show less' : 'Show more'}
                  </button>
                )}
                {writers.length > 0 && (
                  <p className="pt-2 text-xs text-slate-400 border-t border-white/[0.05]">
                    Written by: {writers.map((w) => w.name).join(', ')}
                  </p>
                )}
              </div>

              {/* Where to Watch Full Movie / Series (TMDB & JustWatch Providers) */}
              <WhereToWatchProviders
                mediaType={media.mediaType === 'tv' ? 'tv' : 'movie'}
                tmdbId={media.tmdbId}
                title={media.title}
              />
            </div>
          </div>

          {/* Right Column (TV Episodes Playlist, Up Next Queue, Trending Rail) */}
          <div className="lg:col-span-4 xl:col-span-4 2xl:col-span-4 space-y-4">
            {/* TV Episodes Playlist Navigator */}
            {isTv && media.seasons && (
              <div className="rounded-2xl border border-white/[.08] bg-white/[.025] p-3.5 sm:p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-orange-400">Episodes Navigator</p>
                    <h2 className="text-sm font-bold text-white">Season Episodes</h2>
                  </div>
                  <label className="flex items-center gap-1.5 rounded-lg border border-white/[.1] bg-black/40 px-2.5 py-1 text-xs text-slate-300">
                    <span>S</span>
                    <select
                      value={season}
                      onChange={(event) => setSeason(Number(event.target.value))}
                      className="bg-transparent text-white outline-none font-semibold cursor-pointer"
                    >
                      {media.seasons
                        .filter((item) => item.seasonNumber > 0)
                        .map((item) => (
                          <option className="bg-[#121927] text-white" key={item.id} value={item.seasonNumber}>
                            {item.seasonNumber}
                          </option>
                        ))}
                    </select>
                    <ChevronDown className="h-3 w-3 text-slate-400" />
                  </label>
                </div>

                <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1 scrollbar-thin">
                  {seasonData.isLoading ? (
                    <div className="text-xs text-slate-400 py-6 text-center flex flex-col items-center gap-2">
                      <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                      <span>Loading season episodes...</span>
                    </div>
                  ) : seasonData.data && seasonData.data.length > 0 ? (
                    seasonData.data.map((episode) => {
                      const isCurrent = currentEpisode === episode.episodeNumber;
                      return (
                        <article
                          key={episode.id}
                          onClick={() => {
                            setCurrentEpisode(episode.episodeNumber);
                            navigate(`/watch/tv-${tmdbId}?season=${season}&episode=${episode.episodeNumber}`, { replace: true });
                          }}
                          className={`flex gap-2.5 p-2 rounded-xl border transition group cursor-pointer ${
                            isCurrent
                              ? 'bg-orange-500/15 border-orange-500/60 shadow-md shadow-orange-500/10'
                              : 'bg-black/30 border-white/[0.05] hover:border-orange-500/40 hover:bg-white/[0.03]'
                          }`}
                        >
                          <div className="relative w-24 h-14 shrink-0 rounded-lg overflow-hidden bg-slate-900">
                            <img
                              src={episode.stillUrl || media.backdropUrl || media.imageUrl}
                              alt={episode.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                            <span className="absolute bottom-1 right-1 bg-black/80 px-1 py-0.2 rounded text-[9px] font-mono text-white">
                              {episode.runtime ? `${episode.runtime}m` : '45m'}
                            </span>
                            {isCurrent && (
                              <div className="absolute inset-0 bg-orange-500/30 flex items-center justify-center">
                                <Play className="w-4 h-4 text-white fill-current animate-pulse" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1">
                              <p className="text-[10px] font-bold text-orange-400 uppercase">
                                Episode {episode.episodeNumber}
                              </p>
                              {isCurrent && (
                                <span className="bg-orange-500 text-white text-[8px] font-bold px-1.5 py-0.2 rounded-full">
                                  Playing
                                </span>
                              )}
                            </div>
                            <h3 className={`truncate text-xs font-semibold ${isCurrent ? 'text-orange-300' : 'text-white group-hover:text-orange-300'} transition-colors`}>
                              {episode.name}
                            </h3>
                            <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                              {episode.overview || 'Watch episode now on OrangeFlix'}
                            </p>
                          </div>
                        </article>
                      );
                    })
                  ) : (
                    <div className="text-xs text-slate-500 py-4 text-center">No episodes found for this season.</div>
                  )}
                </div>
              </div>
            )}

            {/* Up Next Recommendations Queue (Rich 8-Item Fill) */}
            {upNextList.length > 0 && (
              <div className="rounded-2xl border border-white/[.08] bg-white/[.025] p-3.5 sm:p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-orange-400" />
                    <h3 className="text-sm font-bold text-white">Up Next & Recommended</h3>
                  </div>
                  <Link
                    to={isTv ? '/series' : '/movies'}
                    className="text-[11px] font-semibold text-orange-400 hover:text-orange-300"
                  >
                    View more →
                  </Link>
                </div>

                <div className="space-y-2">
                  {upNextList.slice(0, 7).map((rec) => (
                    <Link
                      key={rec.id || rec.tmdbId}
                      to={`/watch/${rec.mediaType || (isTv ? 'tv' : 'movie')}-${rec.tmdbId || rec.id}`}
                      className="flex gap-2.5 p-2 rounded-xl border border-white/[0.05] bg-black/20 hover:border-orange-500/40 hover:bg-white/[0.04] transition group"
                    >
                      <div className="relative w-24 h-14 shrink-0 rounded-lg overflow-hidden bg-slate-900">
                        <img
                          src={rec.backdropUrl || rec.posterUrl || rec.imageUrl || POSTER_FALLBACK}
                          alt={rec.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <span className="absolute bottom-1 right-1 bg-black/80 px-1 py-0.2 rounded text-[9px] font-mono text-orange-400 flex items-center gap-0.5">
                          <Star className="h-2 w-2 fill-current" />
                          {rec.voteAverage?.toFixed(1) || '4.5'}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="truncate text-xs font-semibold text-white group-hover:text-orange-400 transition-colors">
                          {rec.title}
                        </h4>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-1">
                          <span>{rec.releaseYear || 'Cinema'}</span>
                          <span>•</span>
                          <span className="truncate max-w-[100px]">{rec.genres?.[0] || 'Popular'}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Trending Rail Queue */}
            {trending.data?.items && trending.data.items.length > 0 && (
              <div className="rounded-2xl border border-white/[.08] bg-white/[.025] p-3.5 sm:p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Flame className="h-4 w-4 text-orange-400" />
                    <h3 className="text-sm font-bold text-white">Trending This Week</h3>
                  </div>
                  <Link
                    to="/trending"
                    className="text-[11px] font-semibold text-orange-400 hover:text-orange-300"
                  >
                    All →
                  </Link>
                </div>

                <div className="space-y-2">
                  {trending.data.items.slice(0, 4).map((trendItem) => (
                    <Link
                      key={trendItem.id}
                      to={`/watch/${trendItem.mediaType || 'movie'}-${trendItem.tmdbId || trendItem.id}`}
                      className="flex gap-2.5 p-2 rounded-xl border border-white/[0.05] bg-black/20 hover:border-orange-500/40 hover:bg-white/[0.04] transition group"
                    >
                      <div className="relative w-20 h-12 shrink-0 rounded-lg overflow-hidden bg-slate-900">
                        <img
                          src={trendItem.backdropUrl || trendItem.posterUrl || POSTER_FALLBACK}
                          alt={trendItem.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="truncate text-xs font-semibold text-white group-hover:text-orange-400 transition-colors">
                          {trendItem.title}
                        </h4>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-1">
                          <span className="text-orange-400 font-bold">★ {trendItem.voteAverage?.toFixed(1) || '4.8'}</span>
                          <span>•</span>
                          <span>{trendItem.releaseYear || '2026'}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 2. Bottom Section: Full-Width Cinematic Discoveries & Content Graph Area */}
        <div className="space-y-10 pt-10 border-t border-white/[0.08] mt-8">
          {/* Cast & Talent Rail (Spans full width so all actor cards have space) */}
          <CastRail cast={media.cast} />

          {/* In-Page Content Graph Discoveries (Full Width) */}
          <RelatedMusic soundtrack={relations.soundtrack} tmdbId={media.tmdbId || undefined} isLoading={isLoadingRelations} />
          <RelatedBooks sourceBook={relations.sourceBook} isLoading={isLoadingRelations} />
          <RelatedNews news={relations.news} isLoading={isLoadingRelations} />

          {/* Recommendation Rails (Guaranteed 100% Unique & Deduplicated) */}
          {partitionedWatchRails.selectedForYou.length > 0 && (
            <ContentRail
              title="Because you watched this"
              eyebrow="Selected for you"
              items={partitionedWatchRails.selectedForYou}
              href={isTv ? '/series' : '/movies'}
            />
          )}
          {partitionedWatchRails.similarStories.length > 0 && (
            <ContentRail
              title="More like this"
              eyebrow="Similar stories"
              items={partitionedWatchRails.similarStories}
              href={isTv ? '/series' : '/movies'}
            />
          )}
          {partitionedWatchRails.trendingNow.length > 0 && (
            <ContentRail
              title="Trending now"
              eyebrow="What everyone is watching"
              items={partitionedWatchRails.trendingNow}
              href="/trending"
              loading={trending.isLoading}
            />
          )}

          {/* Community & TMDB Critic Reviews (Full Width) */}
          <MediaReviewsSection
            mediaType={media.mediaType === 'tv' ? 'tv' : 'movie'}
            tmdbId={media.tmdbId}
            mediaTitle={media.title}
            voteAverage={media.voteAverage}
            voteCount={media.voteCount}
            rawId={rawId}
          />
        </div>
      </div>

      {/* Post-Watch Recommendation Overlay Modal */}
      {showPostWatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-2xl rounded-3xl border border-orange-500/30 bg-[#090e18] p-6 shadow-2xl space-y-6">
            <button
              onClick={() => setShowPostWatch(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1 text-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 text-xs font-bold mb-1">
                <Sparkles className="w-3.5 h-3.5" /> Watching Complete
              </div>
              <h2 className="text-2xl font-extrabold text-white">You finished {media.title} 🎬</h2>
              <p className="text-xs text-slate-400">Here are top picks curated specifically for what you should watch next:</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {postWatchRecs.map((rec) => (
                <div
                  key={rec.id}
                  className="rounded-2xl border border-white/[.08] bg-white/[.025] p-3 flex flex-col justify-between hover:border-orange-500/40 transition group"
                >
                  <div className="space-y-2">
                    <img
                      src={rec.posterUrl || POSTER_FALLBACK}
                      alt={rec.title}
                      className="w-full h-36 object-cover rounded-xl bg-slate-900"
                    />
                    <div>
                      <p className="text-xs font-bold text-white line-clamp-1 group-hover:text-orange-400 transition-colors">
                        {rec.title}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {rec.genres[0] || 'Film'} • ★ {rec.voteAverage}
                      </p>
                    </div>
                  </div>

                  <Link
                    to={`/watch/${rec.mediaType}-${rec.tmdbId}`}
                    onClick={() => setShowPostWatch(false)}
                    className="mt-3 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-orange-500 text-white text-xs font-bold hover:bg-orange-400 transition shadow-md shadow-orange-500/20"
                  >
                    <Play className="w-3 h-3 fill-current" /> Watch Next
                  </Link>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/[.08]">
              {relations.soundtrack && (
                <Link
                  to={`/music/movie/${media.tmdbId}`}
                  onClick={() => setShowPostWatch(false)}
                  className="text-xs text-orange-400 hover:underline flex items-center gap-1.5 font-semibold"
                >
                  <Music2 className="w-3.5 h-3.5" /> Explore Soundtrack
                </Link>
              )}
              {relations.sourceBook && (
                <Link
                  to="/books"
                  onClick={() => setShowPostWatch(false)}
                  className="text-xs text-amber-400 hover:underline flex items-center gap-1.5 font-semibold"
                >
                  <BookOpen className="w-3.5 h-3.5" /> Read Source Book
                </Link>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPostWatch(false)}
                className="text-xs text-slate-400 ml-auto"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Weather Recommendations Modal */}
      {showWeatherModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-sky-500/30 bg-[#090e18] p-6 shadow-2xl space-y-5">
            <button
              onClick={() => setShowWeatherModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1 text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 text-xs font-bold mb-1">
                {getWeatherIcon(weatherState.condition?.conditionText || weatherState.condition?.condition)}
                <span>
                  {weatherState.condition
                    ? `${weatherState.condition.city} • ${Math.round(weatherState.condition.temperature)}°C • ${weatherState.condition.conditionText}`
                    : 'Local Weather'}
                </span>
              </div>
              <h2 className="text-2xl font-extrabold text-white">Atmospheric Weather Picks 🌤️</h2>
              <p className="text-xs text-slate-400">
                {weatherState.condition?.matchReason || 'Curated cinematic stories tailored for current skies and temperature'}
              </p>
            </div>

            {weatherState.loading ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-3">
                <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-slate-400">Matching atmospheric picks for your weather...</p>
              </div>
            ) : weatherState.recs.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No weather suggestions available at the moment.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {weatherState.recs.map((rec) => (
                  <div
                    key={rec.id}
                    className="rounded-2xl border border-white/[.08] bg-white/[.025] p-3 flex flex-col justify-between hover:border-sky-500/40 transition group"
                  >
                    <div className="space-y-2">
                      <img
                        src={rec.posterUrl || POSTER_FALLBACK}
                        alt={rec.title}
                        className="w-full h-36 object-cover rounded-xl bg-slate-900"
                      />
                      <div>
                        <p className="text-xs font-bold text-white line-clamp-1 group-hover:text-sky-300 transition-colors">
                          {rec.title}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {rec.genres[0] || 'Film'} • ★ {rec.voteAverage}
                        </p>
                      </div>
                    </div>

                    <Link
                      to={`/watch/${rec.mediaType}-${rec.tmdbId}`}
                      onClick={() => setShowWeatherModal(false)}
                      className="mt-3 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-sky-500 text-white text-xs font-bold hover:bg-sky-400 transition shadow-md shadow-sky-500/20"
                    >
                      <Play className="w-3 h-3 fill-current" /> Watch Now
                    </Link>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/[.08]">
              <Link
                to="/movie-night"
                onClick={() => setShowWeatherModal(false)}
                className="text-xs text-sky-400 hover:underline flex items-center gap-1.5 font-semibold"
              >
                <Sparkles className="w-3.5 h-3.5" /> Explore Full Movie Night & Moods
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowWeatherModal(false)}
                className="text-xs text-slate-400 ml-auto"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Geo / Regional Cinema Suggestions Modal */}
      {showGeoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-emerald-500/30 bg-[#090e18] p-6 shadow-2xl space-y-5">
            <button
              onClick={() => setShowGeoModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1 text-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold mb-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  {geoState.location ? `${geoState.location.flag} ${geoState.location.countryName} Cinema` : 'Local Cinema'}
                </span>
              </div>
              <h2 className="text-2xl font-extrabold text-white">Local & African Cinema 🌍</h2>
              <p className="text-xs text-slate-400">
                Authentic African cinema, movies, and series trending in your territory
              </p>
            </div>

            {geoState.loading ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-3">
                <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-slate-400">Loading regional cinema spotlight...</p>
              </div>
            ) : geoState.items.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No local cinema found for this territory right now.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {geoState.items.map((item) => {
                  const countryCode = geoState.location?.countryCode.toLowerCase() || 'rw';
                  const itemSlug = item.slug || item.id;
                  return (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-white/[.08] bg-white/[.025] p-3 flex flex-col justify-between hover:border-emerald-500/40 transition group"
                    >
                      <div className="space-y-2">
                        <div className="relative">
                          <img
                            src={item.thumbnailUrl || POSTER_FALLBACK}
                            alt={item.title}
                            className="w-full h-36 object-cover rounded-xl bg-slate-900"
                          />
                          {item.videoDuration && (
                            <span className="absolute bottom-1.5 right-1.5 bg-black/80 px-1.5 py-0.5 rounded text-[10px] text-white font-mono">
                              {item.videoDuration}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white line-clamp-1 group-hover:text-emerald-300 transition-colors">
                            {item.title}
                          </p>
                          <p className="text-[10px] text-slate-400 line-clamp-1">
                            {item.channelTitle || item.genre?.[0] || 'African Cinema'}
                          </p>
                        </div>
                      </div>

                      <Link
                        to={`/${countryCode}/movies/${itemSlug}`}
                        onClick={() => setShowGeoModal(false)}
                        className="mt-3 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 transition shadow-md shadow-emerald-600/20"
                      >
                        <Play className="w-3 h-3 fill-current" /> Watch Local Film
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/[.08]">
              {geoState.location && (
                <Link
                  to={`/${geoState.location.countryCode.toLowerCase()}/movies`}
                  onClick={() => setShowGeoModal(false)}
                  className="text-xs text-emerald-400 hover:underline flex items-center gap-1.5 font-semibold"
                >
                  <MapPin className="w-3.5 h-3.5" /> Explore {geoState.location.countryName} Catalog
                </Link>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowGeoModal(false)}
                className="text-xs text-slate-400 ml-auto"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
