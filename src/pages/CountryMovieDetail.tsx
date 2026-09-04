/**
 * OrangeFlix Country Movie Detail & Official YouTube Player Page
 * Route: /:countryCode/movies/:slug and /:countryCode/watch/:id
 * Plays official YouTube embed with full Series Episodes Navigator, Watchlist, 5-Star Ratings & Community Reviews.
 */

import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { GeoContentItem } from '@/types/geo-content';
import { GeoContentService } from '@/services/geo-content-service';
import { getCountryConfig, getAllCountries } from '@/features/geo/countryConfig';
import { getGeoTranslations } from '@/features/geo/translations';
import { GeolocationService } from '@/services/geolocation';
import CountryMovieCard from '@/components/geo/CountryMovieCard';
import SEOHead from '@/components/seo/SEOHead';
import Breadcrumbs from '@/components/Breadcrumbs';
import { useAuth } from '@/contexts/AuthContext';
import { FirebaseData } from '@/lib/firebase-data';
import { Analytics } from '@/services/analytics';
import { MovieService } from '@/lib/movies';
import { Review } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  Clock,
  Eye,
  Calendar,
  Youtube,
  Share2,
  Heart,
  Sparkles,
  ArrowLeft,
  Tv,
  Check,
  AlertCircle,
  ExternalLink,
  Bookmark,
  Star,
  MessageSquare,
  Send,
  Globe,
  User,
  Play,
} from 'lucide-react';
import { toast } from 'sonner';

import { DetailHeroSkeleton, SeriesPlaylistSkeleton } from '@/components/ui/Skeletons';
import AdvancedCinematicPlayer from '@/components/watch/AdvancedCinematicPlayer';

export default function CountryMovieDetail() {
  const { countryCode: rawCountryCode, slug, id } = useParams<{
    countryCode?: string;
    slug?: string;
    id?: string;
  }>();

  const navigate = useNavigate();
  const lookupKey = slug || id || '';
  const countryCode = (rawCountryCode || 'rw').toUpperCase();
  const country = useMemo(() => getCountryConfig(countryCode), [countryCode]);
  const allCountries = useMemo(() => getAllCountries(), []);
  const { currentUser } = useAuth();

  const [movie, setMovie] = useState<GeoContentItem | null>(null);
  const [seriesEpisodes, setSeriesEpisodes] = useState<GeoContentItem[]>([]);
  const [related, setRelated] = useState<GeoContentItem[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const [isUnavailable, setIsUnavailable] = useState(false);

  // Watchlist & Favorite state
  const rawId = `geo-${lookupKey}`;
  const [isFavorited, setIsFavorited] = useState(false);
  const [isWatchLater, setIsWatchLater] = useState(false);

  // User Rating & Review form
  const [userRating, setUserRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const lang = GeolocationService.getUserLanguage();
  const t = useMemo(() => getGeoTranslations(lang), [lang]);

  useEffect(() => {
    let isMounted = true;
    if (!lookupKey) return;

    setIsLoading(true);
    const load = async () => {
      const item = await GeoContentService.getMovieBySlug(lookupKey, countryCode);
      if (isMounted && item) {
        setMovie(item);

        // Load reviews
        const movieReviews = MovieService.getReviews(`geo-${item.id || item.youtubeVideoId}`);
        setReviews(movieReviews);

        // Check favorite & watchlater
        if (currentUser) {
          setIsFavorited(MovieService.isFavorite(`geo-${item.id || item.youtubeVideoId}`, currentUser.id));
          setIsWatchLater(MovieService.isInWatchLater(`geo-${item.id || item.youtubeVideoId}`, currentUser.id));
        }

        // Verify video availability on YouTube in background
        void GeoContentService.verifyVideoAvailability(item.youtubeVideoId).then((avail) => {
          if (isMounted && !avail) {
            setIsUnavailable(true);
          }
        });

        // Track analytics
        Analytics.logEvent('watch_start', {
          userId: currentUser?.id,
          entityType: item.classification || item.contentType,
          entityId: item.youtubeVideoId,
          entityTitle: item.title,
        });

        // Load all episodes if series/channel
        void GeoContentService.getSeriesEpisodes(item).then((eps) => {
          if (isMounted) {
            setSeriesEpisodes(eps);
          }
        });

        // Load related local movies
        const rel = await GeoContentService.getMoviesByCountry({
          countryCode: item.country || item.countryCode || 'RW',
          status: 'published',
          limit: 6,
        });
        if (isMounted) {
          setRelated(rel.items.filter((m) => m.id !== item.id).slice(0, 4));
        }
      }
      if (isMounted) {
        setIsLoading(false);
      }
    };

    void load();
    return () => {
      isMounted = false;
    };
  }, [lookupKey, countryCode, currentUser]);

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: movie?.title || 'Watch on OrangeFlix',
          text: movie?.description || '',
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setIsCopied(true);
        toast.success('Link copied to clipboard!');
        setTimeout(() => setIsCopied(false), 2000);
      }
    } catch {
      // User cancelled
    }
  };

  const handleFavoriteToggle = () => {
    if (!currentUser || !movie) {
      toast.info('Please sign in to add to your favorites');
      return;
    }

    const mid = `geo-${movie.id || movie.youtubeVideoId}`;
    if (isFavorited) {
      MovieService.removeFromFavorites(mid, currentUser.id);
      setIsFavorited(false);
      toast.success('Removed from Favorites');
    } else {
      MovieService.addToFavorites(mid, currentUser.id, {
        mediaType: 'movie',
        cachedMedia: {
          id: movie.id,
          title: movie.title,
          description: movie.description,
          imageUrl: movie.thumbnail || movie.thumbnailUrl,
          duration: Math.round((movie.durationSeconds || 0) / 60),
          country: movie.country,
        },
      });
      setIsFavorited(true);
      toast.success('Added to Favorites!');
    }
  };

  const handleWatchLaterToggle = () => {
    if (!currentUser || !movie) {
      toast.info('Please sign in to save to your Watchlist');
      return;
    }

    const mid = `geo-${movie.id || movie.youtubeVideoId}`;
    if (isWatchLater) {
      MovieService.removeFromWatchLater(mid, currentUser.id);
      setIsWatchLater(false);
      toast.success('Removed from Watchlist');
    } else {
      MovieService.addToWatchLater(mid, currentUser.id, {
        mediaType: 'movie',
        cachedMedia: {
          id: movie.id,
          title: movie.title,
          description: movie.description,
          imageUrl: movie.thumbnail || movie.thumbnailUrl,
          duration: Math.round((movie.durationSeconds || 0) / 60),
          country: movie.country,
        },
      });
      setIsWatchLater(true);
      toast.success('Added to Watchlist!');
    }
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !movie) {
      toast.info('Please sign in to submit a review');
      return;
    }
    if (!commentText.trim()) {
      toast.error('Please enter a comment for your review');
      return;
    }

    setIsSubmittingReview(true);
    try {
      const mid = `geo-${movie.id || movie.youtubeVideoId}`;
      const newReview: Review = {
        id: `rev-${Date.now()}`,
        userId: currentUser.id,
        userName: currentUser.name || 'OrangeFlix Viewer',
        movieId: mid,
        rating: userRating,
        comment: commentText.trim(),
        createdAt: new Date().toISOString(),
      };

      MovieService.addReview(newReview);
      setReviews((prev) => [newReview, ...prev]);
      setCommentText('');
      toast.success('Thank you! Your review has been posted.');
    } catch {
      toast.error('Failed to submit review. Please try again.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (isLoading) {
    return <DetailHeroSkeleton />;
  }

  if (!movie) {
    return (
      <div className="min-h-screen bg-[#070b14] flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-16 h-16 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold text-white">Cinema Title Not Found</h1>
          <p className="text-sm text-gray-400">
            This {country.name} movie or series could not be found or has not yet been discovered on YouTube.
          </p>
          <Button asChild className="bg-orange-500 hover:bg-orange-600">
            <Link to={`/${countryCode.toLowerCase()}/movies`}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to {country.name} Movies
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const embedUrl = `https://www.youtube-nocookie.com/embed/${movie.youtubeVideoId}?autoplay=1&rel=0&modestbranding=1`;
  const youtubeWatchUrl = `https://www.youtube.com/watch?v=${movie.youtubeVideoId}`;
  const classification = movie.classification || movie.contentType || 'movie';
  const views = movie.views ?? movie.viewCount ?? 0;
  const formattedDate = movie.publishedAt
    ? new Date(movie.publishedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'Recently';

  const avgRating = reviews.length > 0
    ? (reviews.reduce((acc, r) => acc + (r.rating || 5), 0) / reviews.length).toFixed(1)
    : '4.8';

  return (
    <div className="min-h-screen pb-16 bg-[#070b14] text-white">
      <SEOHead
        title={`${movie.title} — Watch Online (${country.name} Cinema)`}
        description={movie.description || `Stream ${movie.title} from ${country.name} directly on OrangeFlix.`}
        url={`https://orangeflixx.vercel.app/${countryCode.toLowerCase()}/movies/${movie.slug || movie.id}`}
        image={movie.thumbnail || movie.thumbnailUrl}
      />

      <div className="max-w-[1720px] mx-auto px-3 sm:px-5 lg:px-8 pt-3 sm:pt-4">
        {/* Navigation & Cinema Location Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 sm:mb-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="text-xs text-slate-400 hover:text-white px-2 h-8"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
            </Button>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Link to={`/${countryCode.toLowerCase()}/movies`} className="hover:text-orange-400 font-semibold">
                {country.name} Cinema
              </Link>
              <span>/</span>
              <span className="text-white truncate max-w-[200px] sm:max-w-none">{movie.title}</span>
            </div>
          </div>

          {/* Quick Territory Switcher */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Globe className="w-3.5 h-3.5 text-orange-400" /> Switch Cinema:
            </span>
            <div className="flex items-center gap-1 overflow-x-auto pb-1 max-w-[280px] sm:max-w-none scrollbar-none">
              {allCountries.map((c) => (
                <button
                  key={c.countryCode}
                  onClick={() => navigate(`/${c.countryCode.toLowerCase()}/movies`)}
                  className={`px-2 py-0.5 rounded-lg text-xs font-semibold shrink-0 transition ${
                    c.countryCode.toUpperCase() === countryCode
                      ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/30'
                      : 'bg-white/5 text-slate-400 hover:text-white border border-white/10'
                  }`}
                >
                  {c.flagEmoji} {c.countryCode}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 2-Column Responsive High-Density Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 xl:gap-8 items-start">
          {/* Left Column (Player, Info, Actions, Synopsis, Reviews) */}
          <div className="lg:col-span-8 xl:col-span-8 2xl:col-span-8 space-y-4">
            {/* Cinematic Player */}
            <div className="w-full">
              <AdvancedCinematicPlayer
                id={`geo-${movie.id || movie.youtubeVideoId}`}
                title={movie.title}
                poster={movie.thumbnail || movie.thumbnailUrl}
                backdropUrl={movie.thumbnail || movie.thumbnailUrl}
                youtubeVideoId={movie.youtubeVideoId}
                country={country.name}
                durationMinutes={Math.round((movie.durationSeconds || 0) / 60) || 90}
                onProgress={(seconds, duration) => {
                  const mid = `geo-${movie.id || movie.youtubeVideoId}`;
                  localStorage.setItem(`orangeflix_progress_${mid}`, String(Math.floor(seconds)));
                  if (currentUser) {
                    const genreArray = (movie.tags || []).slice(0, 3);
                    const primaryGenre = genreArray.length > 0 ? genreArray[0] : 'Regional Cinema';

                    void FirebaseData.setHistory(
                      currentUser.id,
                      {
                        id: movie.id || movie.youtubeVideoId,
                        tmdbId: 0,
                        mediaType: 'movie',
                        title: movie.title,
                        description: movie.description || `From ${country.name}`,
                        posterUrl: movie.thumbnail || movie.thumbnailUrl,
                        backdropUrl: movie.thumbnail || movie.thumbnailUrl,
                        duration: Math.round((movie.durationSeconds || 0) / 60),
                        rating: Math.min(5, Number((Number(movie.score || movie.classificationScore || 0) / 20).toFixed(1)) || 4),
                        voteAverage: Number(movie.score || movie.classificationScore || 85),
                        voteCount: Number(movie.views || movie.viewCount || 0),
                        releaseYear: movie.publishedAt ? new Date(movie.publishedAt).getFullYear() : 2026,
                        genres: [country.name, primaryGenre, 'Cinema'].filter(Boolean),
                      },
                      seconds,
                      duration
                    );
                  }
                }}
              />
            </div>

            {/* Title & Metadata */}
            <div className="space-y-3 pt-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white">
                  {movie.title}
                </h1>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="inline-flex items-center gap-1 bg-amber-500/15 border border-amber-500/30 px-2.5 py-1 rounded-lg text-amber-400 text-xs font-bold">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    {avgRating} / 5
                  </div>
                  <span className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-slate-300">
                    {movie.isFullMovieCandidate ? 'FULL MOVIE' : classification === 'series' || classification === 'episode' ? 'SERIES' : 'VIDEO'}
                  </span>
                </div>
              </div>

              {/* Badges & Meta Stats */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-slate-400">
                <span className="rounded-full bg-orange-500/15 border border-orange-500/30 px-2 py-0.5 text-orange-400 font-bold">
                  {country.flagEmoji} {country.name} Cinema
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 font-mono text-white">
                  <Clock className="w-3.5 h-3.5 text-orange-400" />
                  {movie.durationFormatted}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5 text-slate-400" />
                  {views.toLocaleString()} {t.views}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 font-medium text-slate-300">
                  <Calendar className="w-3.5 h-3.5 text-orange-400" />
                  Released: {formattedDate}
                </span>
                <span>•</span>
                <span className="text-orange-400 font-medium">
                  {movie.channelTitle}
                </span>
              </div>

              {/* Action Deck */}
              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-white/[0.07]">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleWatchLaterToggle}
                  className={`text-xs h-9 rounded-xl transition ${
                    isWatchLater
                      ? 'bg-orange-500/20 border-orange-500/50 text-orange-400'
                      : 'border-white/[.13] bg-white/[.04] text-white hover:bg-white/[.09]'
                  }`}
                >
                  {isWatchLater ? <Check className="w-3.5 h-3.5 mr-1.5 text-orange-400" /> : <Bookmark className="w-3.5 h-3.5 mr-1.5" />}
                  {isWatchLater ? 'In Watchlist' : 'Add to Watchlist'}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleFavoriteToggle}
                  className={`text-xs h-9 rounded-xl transition ${
                    isFavorited
                      ? 'bg-rose-500/20 border-rose-500/50 text-rose-400'
                      : 'border-white/[.13] bg-white/[.04] text-white hover:bg-white/[.09]'
                  }`}
                >
                  <Heart className={`w-3.5 h-3.5 mr-1.5 ${isFavorited ? 'fill-current text-rose-500' : ''}`} />
                  {isFavorited ? 'Favorited' : 'Favorite'}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShare}
                  className="border-white/[.13] bg-white/[.04] text-xs text-white hover:bg-white/[.09] h-9 rounded-xl"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 mr-1.5" />}
                  {isCopied ? 'Copied!' : t.share}
                </Button>

                <div className="hidden sm:flex items-center gap-2 ml-auto text-[11px] text-slate-400 bg-white/[0.03] border border-white/[0.07] px-3 py-1.5 rounded-xl">
                  <Check className="h-3.5 w-3.5 text-orange-400" />
                  <span>Verified Creator Channel</span>
                </div>
              </div>

              {/* Synopsis & Details Card */}
              <div className="rounded-2xl border border-white/[.08] bg-white/[.025] p-4 space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Synopsis & Details</p>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                  {movie.description || 'No description provided for this stream.'}
                </p>

                {movie.tags && movie.tags.length > 0 && (
                  <div className="pt-2 border-t border-white/[0.05] flex flex-wrap items-center gap-1.5">
                    {movie.tags.slice(0, 8).map((tag, idx) => (
                      <span key={idx} className="rounded-md border border-white/10 bg-black/40 px-2 py-0.5 text-[10px] text-slate-400">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column (Series Episodes Playlist & Up Next Queue) */}
          <div className="lg:col-span-4 xl:col-span-4 2xl:col-span-4 space-y-4">
            {/* Series Episodes Playlist Navigator */}
            {seriesEpisodes.length > 1 && (
              <div className="rounded-2xl border border-white/[.08] bg-white/[.025] p-3.5 sm:p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Tv className="w-4 h-4 text-orange-400" />
                    <h3 className="text-sm font-bold text-white">Series Episodes ({seriesEpisodes.length})</h3>
                  </div>
                  <span className="text-[10px] text-orange-400 font-semibold uppercase tracking-wider">Playlist</span>
                </div>

                <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1 scrollbar-thin">
                  {seriesEpisodes.map((ep, idx) => {
                    const isCurrent = ep.id === movie.id || ep.youtubeVideoId === movie.youtubeVideoId;
                    const epUrl = `/${countryCode.toLowerCase()}/movies/${ep.slug || ep.youtubeVideoId || ep.id}`;
                    const epThumb = ep.thumbnail || ep.thumbnailUrl || `https://img.youtube.com/vi/${ep.youtubeVideoId}/hqdefault.jpg`;
                    const epDate = ep.publishedAt ? new Date(ep.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';

                    return (
                      <Link
                        key={ep.id}
                        to={epUrl}
                        className={`flex gap-2.5 p-2 rounded-xl border transition group ${
                          isCurrent
                            ? 'bg-orange-500/15 border-orange-500/60 shadow-md shadow-orange-500/10'
                            : 'bg-black/30 border-white/[0.05] hover:border-orange-500/40 hover:bg-white/[0.03]'
                        }`}
                      >
                        <div className="relative w-24 h-14 shrink-0 rounded-lg overflow-hidden bg-slate-900">
                          <img src={epThumb} alt={ep.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          <span className="absolute bottom-1 right-1 bg-black/80 px-1 py-0.2 rounded text-[9px] font-mono text-white">
                            {ep.durationFormatted}
                          </span>
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[10px] font-bold text-orange-400 uppercase">
                              Ep {idx + 1}
                            </span>
                            {isCurrent && (
                              <span className="bg-orange-500 text-white text-[9px] px-1.5 py-0.2 rounded-full font-bold">
                                Now Playing
                              </span>
                            )}
                          </div>
                          <h4 className={`truncate text-xs font-semibold mt-0.5 ${isCurrent ? 'text-orange-300' : 'text-white group-hover:text-orange-400'} transition-colors`}>
                            {ep.title}
                          </h4>
                          <p className="text-[10px] text-slate-400 mt-1 truncate">
                            {ep.channelTitle} • {epDate}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Up Next & Regional Recommendations Queue */}
            {related.length > 0 && (
              <div className="rounded-2xl border border-white/[.08] bg-white/[.025] p-3.5 sm:p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-orange-400" />
                    <h3 className="text-sm font-bold text-white">Up Next from {country.name}</h3>
                  </div>
                  <Link
                    to={`/${countryCode.toLowerCase()}/movies`}
                    className="text-[11px] font-semibold text-orange-400 hover:text-orange-300"
                  >
                    All →
                  </Link>
                </div>

                <div className="space-y-2">
                  {related.slice(0, 5).map((relItem) => (
                    <Link
                      key={relItem.id}
                      to={`/${countryCode.toLowerCase()}/movies/${relItem.slug || relItem.id}`}
                      className="flex gap-2.5 p-2 rounded-xl border border-white/[0.05] bg-black/20 hover:border-orange-500/40 hover:bg-white/[0.04] transition group"
                    >
                      <div className="relative w-24 h-14 shrink-0 rounded-lg overflow-hidden bg-slate-900">
                        <img
                          src={relItem.thumbnail || relItem.thumbnailUrl || `https://img.youtube.com/vi/${relItem.youtubeVideoId}/hqdefault.jpg`}
                          alt={relItem.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <span className="absolute bottom-1 right-1 bg-black/80 px-1 py-0.2 rounded text-[9px] font-mono text-white">
                          {relItem.durationFormatted}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="truncate text-xs font-semibold text-white group-hover:text-orange-400 transition-colors">
                          {relItem.title}
                        </h4>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-1">
                          <span className="truncate max-w-[110px]">{relItem.channelTitle}</span>
                          <span>•</span>
                          <span>{(relItem.views || relItem.viewCount || 0).toLocaleString()} views</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 2. Bottom Section: Full-Width Discoveries & Reviews */}
        <div className="space-y-10 pt-10 border-t border-white/[0.08] mt-8">
          {/* More Related Regional Productions Grid (Full Width) */}
          {related.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> More from {country.name}
                  </p>
                  <h2 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
                    Related Regional Productions
                  </h2>
                </div>

                <Link
                  to={`/${countryCode.toLowerCase()}/movies`}
                  className="text-xs text-orange-400 hover:text-orange-300 font-semibold"
                >
                  View all {country.name} movies →
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {related.map((m) => (
                  <CountryMovieCard key={m.id} movie={m} countryCode={countryCode} />
                ))}
              </div>
            </section>
          )}

          {/* Community Ratings & Reviews (Full Width) */}
          <section className="rounded-2xl border border-white/[.08] bg-white/[.02] p-5 sm:p-7 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.07] pb-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-orange-400">Audience Reactions</p>
                <h2 className="text-lg sm:text-xl font-bold text-white">
                  Viewer Reviews & Ratings ({reviews.length})
                </h2>
              </div>
              <div className="flex items-center gap-2 bg-white/[0.04] border border-white/10 px-3.5 py-1.5 rounded-xl text-xs">
                <span className="text-slate-400">Avg Rating:</span>
                <span className="font-bold text-amber-400 font-mono flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-current" /> {avgRating} / 5
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Review Composer Form */}
              <div className="lg:col-span-5">
                <div className="rounded-xl border border-white/[.07] bg-black/30 p-4 space-y-3">
                  <form onSubmit={handleSubmitReview} className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-slate-300">Your Rating:</span>
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setUserRating(star)}
                              onMouseEnter={() => setHoverRating(star)}
                              onMouseLeave={() => setHoverRating(0)}
                              className="p-1 text-slate-600 hover:text-amber-400 transition"
                              aria-label={`Rate ${star} stars`}
                            >
                              <Star
                                className={`w-4 h-4 ${
                                  (hoverRating || userRating) >= star
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'text-slate-600'
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>

                      <span className="text-xs text-slate-400">
                        Posting as: <strong className="text-white">{currentUser ? currentUser.name || 'You' : 'Guest'}</strong>
                      </span>
                    </div>

                    <Textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder={`Write your review about "${movie.title}"...`}
                      className="bg-black/50 border-white/10 text-xs text-white placeholder-slate-500 resize-none rounded-xl focus:border-orange-500 min-h-[75px]"
                    />

                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        disabled={isSubmittingReview || !commentText.trim()}
                        className="bg-orange-500 hover:bg-orange-600 text-white text-xs h-8 px-4 rounded-xl shadow-md shadow-orange-500/20"
                      >
                        <Send className="w-3.5 h-3.5 mr-1.5" />
                        Submit Review
                      </Button>
                    </div>
                  </form>
                </div>
              </div>

              {/* Reviews List */}
              <div className="lg:col-span-7 space-y-3">
                {reviews.length === 0 ? (
                  <p className="py-6 text-center text-xs text-slate-500">
                    No reviews yet. Be the first to share your rating for this {country.name} movie!
                  </p>
                ) : (
                  reviews.map((rev) => (
                    <div key={rev.id} className="rounded-xl border border-white/[.06] bg-black/20 p-3.5 space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold text-xs">
                            <User className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-white">{rev.userName || 'OrangeFlix Viewer'}</p>
                            <p className="text-[10px] text-slate-500">
                              {new Date(rev.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3 h-3 ${
                                (rev.rating || 5) >= s ? 'fill-amber-400 text-amber-400' : 'text-slate-700'
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      <p className="text-xs text-slate-300 pl-8 leading-relaxed">
                        {rev.comment}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
