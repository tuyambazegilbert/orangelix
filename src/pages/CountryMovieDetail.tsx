/**
 * OrangeFlix Country Movie Detail & Official YouTube Player Page
 * Route: /:countryCode/movies/:slug and /:countryCode/watch/:id
 * Plays official YouTube embed with full Watchlist, 5-Star Ratings & Community Reviews.
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
} from 'lucide-react';
import { toast } from 'sonner';

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
      toast.info('Please sign in to add to your Watchlist');
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
      toast.info('Please sign in to submit a rating & review');
      return;
    }

    if (!commentText.trim()) {
      toast.error('Please write a review comment');
      return;
    }

    setIsSubmittingReview(true);
    try {
      const mid = `geo-${movie.id || movie.youtubeVideoId}`;
      const newRev = MovieService.addReview({
        movieId: mid,
        userId: currentUser.id,
        userName: currentUser.name || 'Anonymous Viewer',
        rating: userRating,
        comment: commentText.trim(),
      });

      setReviews([newRev, ...reviews]);
      setCommentText('');
      toast.success('Review submitted successfully!');
    } catch {
      toast.error('Failed to submit review');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white page-wrap py-10">
        <div className="max-w-6xl mx-auto space-y-6 animate-pulse px-4">
          <div className="h-6 w-64 bg-gray-800 rounded" />
          <div className="aspect-video w-full bg-gray-900 rounded-3xl border border-gray-800" />
          <div className="h-8 w-1/2 bg-gray-800 rounded" />
          <div className="h-20 w-full bg-gray-900 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!movie || isUnavailable) {
    return (
      <div className="min-h-[70vh] bg-gray-950 text-white grid place-items-center text-center p-6">
        <div className="space-y-4 max-w-md bg-gray-900/60 border border-gray-800 p-8 rounded-3xl backdrop-blur-xl">
          <AlertCircle className="w-12 h-12 text-orange-400 mx-auto" />
          <h2 className="text-2xl font-bold">Stream Unavailable</h2>
          <p className="text-sm text-gray-400">
            This YouTube video has been made private, removed, or is no longer embeddable by its creator.
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

  const embedUrl = `https://www.youtube-nocookie.com/embed/${movie.youtubeVideoId}?autoplay=1&rel=0&modestbranding=1&enablejsapi=1`;
  const youtubeWatchUrl = movie.youtubeUrl || `https://www.youtube.com/watch?v=${movie.youtubeVideoId}`;

  const formattedDate = movie.publishedAt
    ? new Date(movie.publishedAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'Recent';

  const views = movie.views ?? movie.viewCount ?? 0;
  const score = movie.score ?? movie.classificationScore ?? 0;
  const classification = movie.classification || movie.contentType || 'movie';

  // Average review calculation
  const totalReviewRating = reviews.reduce((sum, r) => sum + r.rating, 0);
  const avgRating = reviews.length > 0 ? (totalReviewRating / reviews.length).toFixed(1) : (score >= 70 ? '4.8' : '4.5');

  return (
    <div className="min-h-screen bg-[#080b12] text-white">
      <SEOHead
        title={`${movie.title} — Watch on OrangeFlix`}
        description={movie.description}
        image={movie.thumbnail || movie.thumbnailUrl}
        url={`https://orangeflixx.vercel.app/${countryCode.toLowerCase()}/movies/${movie.slug}`}
      />

      <div className="page-wrap py-6 max-w-6xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Navigation Breadcrumbs & Country Location Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <Breadcrumbs
            items={[
              { name: `${country.name} Cinema`, url: `/${countryCode.toLowerCase()}/movies` },
              { name: movie.title, url: `/${countryCode.toLowerCase()}/movies/${movie.slug}` },
            ]}
          />

          {/* Quick Territory Switcher */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Globe className="w-3 h-3 text-orange-400" /> Switch Cinema:
            </span>
            <div className="flex items-center gap-1 overflow-x-auto">
              {allCountries.slice(0, 5).map((c) => (
                <button
                  key={c.countryCode}
                  onClick={() => navigate(`/${c.countryCode.toLowerCase()}/movies`)}
                  className={`text-xs px-2 py-0.5 rounded-lg border transition ${
                    c.countryCode === countryCode
                      ? 'bg-orange-500 text-white border-orange-500 font-bold'
                      : 'bg-gray-900 border-gray-800 text-gray-300 hover:text-white'
                  }`}
                >
                  {c.flagEmoji} {c.countryCode}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Embedded Official YouTube Player */}
        <section className="relative overflow-hidden rounded-3xl border border-white/15 bg-black shadow-2xl shadow-black/80 aspect-video w-full">
          <iframe
            src={embedUrl}
            title={movie.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="w-full h-full border-0"
          />
        </section>

        {/* Title, Badges & Actions Bar */}
        <section className="space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
            <div className="space-y-3 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2.5">
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

              <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                {movie.title}
              </h1>

              {/* Meta stats bar */}
              <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-gray-400 pt-1">
                <span className="flex items-center gap-1.5 font-mono text-white">
                  <Clock className="w-4 h-4 text-orange-400" />
                  {movie.durationFormatted}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-gray-500" />
                  {views.toLocaleString()} {t.views}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  {formattedDate}
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

              <a
                href={youtubeWatchUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition-colors shadow-md shadow-red-600/20 h-9"
              >
                <Youtube className="w-3.5 h-3.5" />
                YouTube
                <ExternalLink className="w-3 h-3 ml-0.5" />
              </a>
            </div>
          </div>

          {/* Description Card */}
          <Card className="bg-gray-900/50 border-gray-800/80 backdrop-blur-xl rounded-2xl">
            <CardContent className="p-6 space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">Synopsis & Details</h3>
              <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">
                {movie.description || 'No description provided for this stream.'}
              </p>

              {movie.tags && movie.tags.length > 0 && (
                <div className="pt-3 border-t border-gray-800/60 flex flex-wrap items-center gap-1.5">
                  {movie.tags.slice(0, 8).map((tag, idx) => (
                    <Badge key={idx} variant="secondary" className="bg-black/50 text-[11px] text-gray-400 border border-white/5">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* COMMUNITY RATINGS & REVIEWS SECTION */}
        <section className="space-y-6 pt-6 border-t border-gray-800/60">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-orange-400" />
                Viewer Reviews & Ratings ({reviews.length})
              </h2>
              <p className="text-xs text-gray-400">
                Rate this {country.name} movie and share your thoughts with the community.
              </p>
            </div>

            <div className="flex items-center gap-1 bg-gray-900/80 border border-gray-800 px-3 py-1.5 rounded-xl text-xs">
              <span className="text-gray-400">Avg Rating:</span>
              <span className="font-bold text-amber-400 font-mono flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-current" /> {avgRating} / 5
              </span>
            </div>
          </div>

          {/* Add Review Form */}
          <Card className="bg-gray-900/40 border-gray-800/80 rounded-2xl">
            <CardContent className="p-5 space-y-4">
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
                            className={`w-5 h-5 ${
                              (hoverRating || userRating) >= star
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-gray-600'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                    <span className="text-xs font-mono font-bold text-amber-400 ml-1">
                      {userRating} / 5
                    </span>
                  </div>

                  {!currentUser && (
                    <span className="text-xs text-amber-400">
                      Sign in to post reviews with your profile name
                    </span>
                  )}
                </div>

                <Textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="What did you think of this movie? Write your review..."
                  rows={3}
                  className="bg-gray-950 border-gray-800 text-xs text-white placeholder:text-gray-500 rounded-xl focus:border-orange-500 resize-none"
                />

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={isSubmittingReview || !commentText.trim()}
                    className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold px-4 h-9 rounded-xl shadow-md shadow-orange-500/20"
                  >
                    <Send className="w-3.5 h-3.5 mr-1.5" />
                    Submit Review
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Review List */}
          <div className="space-y-3">
            {reviews.length === 0 ? (
              <p className="text-xs text-gray-500 italic text-center py-6">
                Be the first viewer to review this {country.name} movie!
              </p>
            ) : (
              reviews.map((rev) => (
                <div
                  key={rev.id}
                  className="p-4 rounded-xl bg-gray-900/30 border border-gray-800/60 space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-[10px] font-bold text-white">
                        {rev.userName?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <span className="font-bold text-white">{rev.userName}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-0.5 text-amber-400">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 ${
                              i < rev.rating ? 'fill-current text-amber-400' : 'text-gray-700'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-[10px] text-gray-500">
                        {new Date(rev.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-gray-300 leading-relaxed pl-8">
                    {rev.comment}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Related Movies Rail */}
        {related.length > 0 && (
          <section className="space-y-4 pt-6 border-t border-gray-800/60">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Tv className="w-5 h-5 text-orange-400" />
                {t.relatedMovies} from {country.name}
              </h2>
              <Button asChild variant="ghost" size="sm" className="text-xs text-orange-400 hover:text-orange-300">
                <Link to={`/${countryCode.toLowerCase()}/movies`}>
                  {t.seeAll} →
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {related.map((item) => (
                <CountryMovieCard key={item.id} movie={item} countryCode={countryCode} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
