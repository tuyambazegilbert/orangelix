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
    <div className="min-h-screen bg-[#070b14] text-white">
      <SEOHead
        title={`${movie.title} — Watch Online (${country.name} Cinema)`}
        description={movie.description || `Stream ${movie.title} from ${country.name} directly on OrangeFlix.`}
        url={`https://orangeflixx.vercel.app/${countryCode.toLowerCase()}/movies/${movie.slug || movie.id}`}
        image={movie.thumbnail || movie.thumbnailUrl}
      />

      <Breadcrumbs
        items={[
          { name: `${country.name} Cinema`, url: `/${countryCode.toLowerCase()}/movies` },
          { name: movie.title, url: `/${countryCode.toLowerCase()}/movies/${movie.slug}` },
        ]}
      />

      <div className="page-wrap !pt-2 sm:!pt-4 max-w-6xl mx-auto px-3 sm:px-6 space-y-4 sm:space-y-6">
        {/* Navigation & Country Location Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="text-xs text-gray-400 hover:text-white self-start"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
          </Button>

          {/* Quick Territory Switcher */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Globe className="w-3 h-3 text-orange-400" /> Switch Cinema:
            </span>
            <div className="flex items-center gap-1 overflow-x-auto pb-1 max-w-[260px] sm:max-w-none scrollbar-none">
              {allCountries.map((c) => (
                <button
                  key={c.countryCode}
                  onClick={() => navigate(`/${c.countryCode.toLowerCase()}/movies`)}
                  className={`px-2 py-1 rounded-lg text-xs font-semibold shrink-0 transition ${
                    c.countryCode.toUpperCase() === countryCode
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-900 text-gray-400 hover:text-white border border-gray-800'
                  }`}
                >
                  {c.flagEmoji} {c.countryCode}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Advanced Cinema Player (Custom Bespoke Controls & Offline Support) */}
        <section className="w-full">
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
                void FirebaseData.setHistory(
                  currentUser.id,
                  {
                    id: movie.id,
                    tmdbId: 0,
                    mediaType: 'movie',
                    title: movie.title,
                    description: movie.description,
                    posterUrl: movie.thumbnail || movie.thumbnailUrl,
                    backdropUrl: movie.thumbnail || movie.thumbnailUrl,
                    duration: Math.round((movie.durationSeconds || 0) / 60),
                    rating: 4.8,
                    voteAverage: 9.6,
                    voteCount: 120,
                    releaseYear: 2026,
                    genres: [country.name + ' Cinema'],
                  },
                  seconds,
                  duration
                );
              }
            }}
          />
        </section>

        {/* Title, Badges & Actions Bar */}
        <section className="space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
            <div className="space-y-2 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-black/70 backdrop-blur-md text-xs border border-white/15 text-white">
                  {country.flagEmoji} {country.name} Cinema
                </Badge>

                {movie.isFullMovieCandidate ? (
                  <Badge className="bg-orange-500 text-white text-xs font-semibold">
                    Full Movie
                  </Badge>
                ) : (
                  <Badge className="bg-violet-600 text-white text-xs font-semibold">
                    {classification === 'series' || classification === 'episode' ? 'TV Series' : 'Video'}
                  </Badge>
                )}

                <Badge variant="outline" className="text-red-400 border-red-500/30 text-xs flex items-center gap-1">
                  <Youtube className="w-3.5 h-3.5" />
                  YouTube Cinema
                </Badge>

                <div className="inline-flex items-center gap-1 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full text-amber-400 text-xs font-bold">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  {avgRating} ({reviews.length} reviews)
                </div>
              </div>

              <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight leading-tight">
                {movie.title}
              </h1>

              {/* Meta stats bar with Release Date */}
              <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-gray-400 pt-0.5">
                <span className="flex items-center gap-1 font-mono text-white">
                  <Clock className="w-3.5 h-3.5 text-orange-400" />
                  {movie.durationFormatted}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5 text-gray-500" />
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
            </div>

            {/* Action Buttons: Watchlist, Favorite, Share, Watch on YouTube */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handleWatchLaterToggle}
                className={`text-xs border-gray-800 h-9 rounded-xl ${
                  isWatchLater
                    ? 'bg-orange-500/20 border-orange-500/50 text-orange-400'
                    : 'bg-gray-900/80 text-gray-300 hover:text-white hover:bg-gray-800'
                }`}
              >
                {isWatchLater ? <Check className="w-3.5 h-3.5 mr-1.5 text-orange-400" /> : <Bookmark className="w-3.5 h-3.5 mr-1.5" />}
                {isWatchLater ? 'In Watchlist' : 'Add to Watchlist'}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleFavoriteToggle}
                className={`text-xs border-gray-800 h-9 rounded-xl ${
                  isFavorited
                    ? 'bg-rose-500/20 border-rose-500/50 text-rose-400'
                    : 'bg-gray-900/80 text-gray-300 hover:text-white hover:bg-gray-800'
                }`}
              >
                <Heart className={`w-3.5 h-3.5 mr-1.5 ${isFavorited ? 'fill-current text-rose-500' : ''}`} />
                {isFavorited ? 'Favorited' : 'Favorite'}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="bg-gray-900/80 border-gray-800 text-xs text-gray-300 hover:text-white hover:bg-gray-800 h-9 rounded-xl"
              >
                {isCopied ? <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 mr-1.5" />}
                {isCopied ? 'Copied!' : t.share}
              </Button>

              
            </div>
          </div>

          {/* ALL SERIES EPISODES / EPISODES PLAYLIST (WHEN MULTIPLE EPISODES AVAILABLE) */}
          {seriesEpisodes.length > 1 && (
            <section className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
                    <Tv className="w-3.5 h-3.5" /> Series Episodes & Playlist
                  </p>
                  <h2 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
                    All Episodes ({seriesEpisodes.length})
                  </h2>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {seriesEpisodes.map((ep, idx) => {
                  const isCurrent = ep.id === movie.id || ep.youtubeVideoId === movie.youtubeVideoId;
                  const epUrl = `/${countryCode.toLowerCase()}/movies/${ep.slug || ep.youtubeVideoId || ep.id}`;
                  const epThumb = ep.thumbnail || ep.thumbnailUrl || `https://img.youtube.com/vi/${ep.youtubeVideoId}/hqdefault.jpg`;
                  const epDate = ep.publishedAt ? new Date(ep.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';

                  return (
                    <Link
                      key={ep.id}
                      to={epUrl}
                      className={`group block p-2.5 rounded-2xl border transition-all duration-200 ${
                        isCurrent
                          ? 'bg-orange-500/15 border-orange-500/60 shadow-lg shadow-orange-500/10 scale-[1.01]'
                          : 'bg-gray-900/60 border-gray-800/80 hover:border-orange-500/40 hover:bg-gray-900/90'
                      }`}
                    >
                      <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-950 mb-2">
                        <img src={epThumb} alt={ep.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[11px] font-mono text-white">
                          <span className="bg-black/80 backdrop-blur px-1.5 py-0.5 rounded flex items-center gap-1 text-[10px]">
                            <Clock className="w-2.5 h-2.5 text-orange-400" /> {ep.durationFormatted}
                          </span>
                          {isCurrent ? (
                            <Badge className="bg-orange-500 text-white text-[9px] px-1.5 py-0">Now Playing</Badge>
                          ) : (
                            <span className="bg-black/60 px-1.5 py-0.5 rounded text-[10px] text-gray-300">Ep {idx + 1}</span>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <h3 className={`text-xs font-bold line-clamp-2 leading-snug ${isCurrent ? 'text-orange-400' : 'text-white group-hover:text-orange-300'}`}>
                          {ep.title}
                        </h3>
                        <div className="flex items-center justify-between text-[10px] text-gray-400">
                          <span className="truncate max-w-[120px]">{ep.channelTitle}</span>
                          <span>{epDate}</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {/* Description Card */}
          <Card className="bg-gray-900/50 border-gray-800/80 backdrop-blur-xl rounded-2xl">
            <CardContent className="p-5 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Synopsis & Details</h3>
              <p className="text-xs sm:text-sm text-gray-300 leading-relaxed whitespace-pre-line">
                {movie.description || 'No description provided for this stream.'}
              </p>

              {movie.tags && movie.tags.length > 0 && (
                <div className="pt-2 border-t border-gray-800/60 flex flex-wrap items-center gap-1.5">
                  {movie.tags.slice(0, 8).map((tag, idx) => (
                    <Badge key={idx} variant="secondary" className="bg-black/50 text-[10px] text-gray-400 border border-white/5">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* COMMUNITY RATINGS & REVIEWS SECTION */}
        <section className="space-y-5 pt-4 border-t border-gray-800/60">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-orange-400" />
                Viewer Reviews & Ratings ({reviews.length})
              </h2>
              <p className="text-xs text-gray-400">
                Rate this {country.name} title and share your thoughts with the community.
              </p>
            </div>

            <div className="flex items-center gap-1 bg-gray-900/80 border border-gray-800 px-2.5 py-1 rounded-xl text-xs">
              <span className="text-gray-400">Avg Rating:</span>
              <span className="font-bold text-amber-400 font-mono flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-current" /> {avgRating} / 5
              </span>
            </div>
          </div>

          {/* Add Review Form */}
          <Card className="bg-gray-900/40 border-gray-800/80 rounded-2xl">
            <CardContent className="p-4 space-y-3">
              <form onSubmit={handleSubmitReview} className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-gray-300">Your Rating:</span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setUserRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          className="p-1 text-gray-600 hover:text-amber-400 transition"
                          aria-label={`Rate ${star} stars`}
                        >
                          <Star
                            className={`w-4 h-4 ${
                              (hoverRating || userRating) >= star
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-gray-600'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <span className="text-xs text-gray-400">
                    Posting as: <strong className="text-white">{currentUser ? currentUser.name || 'You' : 'Guest'}</strong>
                  </span>
                </div>

                <Textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder={`Write your review about "${movie.title}"...`}
                  className="bg-gray-950 border-gray-800 text-xs text-white resize-none rounded-xl focus:border-orange-500 min-h-[70px]"
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
            </CardContent>
          </Card>

          {/* Reviews List */}
          <div className="space-y-2.5">
            {reviews.length === 0 ? (
              <div className="text-center py-6 bg-gray-900/20 rounded-2xl border border-gray-800/40 p-4">
                <MessageSquare className="w-6 h-6 text-gray-600 mx-auto mb-1.5" />
                <p className="text-xs text-gray-400 font-medium">Be the first to review this {country.name} movie!</p>
              </div>
            ) : (
              reviews.map((rev) => (
                <Card key={rev.id} className="bg-gray-900/30 border-gray-800/60 rounded-xl">
                  <CardContent className="p-3.5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold text-xs">
                          <User className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">{rev.userName || 'OrangeFlix Viewer'}</p>
                          <p className="text-[10px] text-gray-500">
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
                              (rev.rating || 5) >= s ? 'fill-amber-400 text-amber-400' : 'text-gray-700'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <p className="text-xs text-gray-300 pl-8 leading-relaxed">
                      {rev.comment}
                    </p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </section>

        {/* More Related Cinema from Country */}
        {related.length > 0 && (
          <section className="space-y-3 pt-6 border-t border-gray-800/60">
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
      </div>
    </div>
  );
}
