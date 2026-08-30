/**
 * OrangeFlix Country Movie Detail & Official YouTube Player Page
 * Route: /:countryCode/movies/:slug and /:countryCode/watch/:id
 * Plays official YouTube embed without re-hosting or downloading videos.
 */

import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { GeoContentItem } from '@/types/geo-content';
import { GeoContentService } from '@/services/geo-content-service';
import { getCountryConfig } from '@/features/geo/countryConfig';
import { getGeoTranslations } from '@/features/geo/translations';
import { GeolocationService } from '@/services/geolocation';
import CountryMovieCard from '@/components/geo/CountryMovieCard';
import SEOHead from '@/components/seo/SEOHead';
import Breadcrumbs from '@/components/Breadcrumbs';
import { useAuth } from '@/contexts/AuthContext';
import { Analytics } from '@/services/analytics';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
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
} from 'lucide-react';
import { toast } from 'sonner';

export default function CountryMovieDetail() {
  const { countryCode: rawCountryCode, slug, id } = useParams<{
    countryCode?: string;
    slug?: string;
    id?: string;
  }>();

  const lookupKey = slug || id || '';
  const countryCode = (rawCountryCode || 'rw').toUpperCase();
  const country = useMemo(() => getCountryConfig(countryCode), [countryCode]);
  const { currentUser } = useAuth();

  const [movie, setMovie] = useState<GeoContentItem | null>(null);
  const [related, setRelated] = useState<GeoContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isUnavailable, setIsUnavailable] = useState(false);

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
          limit: 5,
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
  }, [lookupKey, countryCode, currentUser?.id]);

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
    setIsFavorited(!isFavorited);
    toast.success(isFavorited ? 'Removed from favorites' : 'Added to favorites!');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white page-wrap py-10">
        <div className="max-w-6xl mx-auto space-y-6 animate-pulse">
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

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <SEOHead
        title={`${movie.title} — Watch on OrangeFlix`}
        description={movie.description}
        image={movie.thumbnail || movie.thumbnailUrl}
        url={`https://orangeflixx.vercel.app/${countryCode.toLowerCase()}/movies/${movie.slug}`}
      />

      <div className="page-wrap py-6 max-w-6xl mx-auto space-y-8">
        <Breadcrumbs
          items={[
            { name: 'Home', url: '/' },
            { name: `${country.name} Movies`, url: `/${countryCode.toLowerCase()}/movies` },
            { name: movie.title, url: `/${countryCode.toLowerCase()}/movies/${movie.slug}` },
          ]}
        />

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

        {/* Title, Badges & Actions */}
        <section className="space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
            <div className="space-y-3 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2.5">
                <Badge className="bg-black/70 backdrop-blur-md text-xs border border-white/15 text-white">
                  {country.flagEmoji} {country.name}
                </Badge>

                {movie.isFullMovieCandidate ? (
                  <Badge className="bg-orange-500 text-white text-xs font-semibold">
                    Full Movie Candidate
                  </Badge>
                ) : (
                  <Badge className="bg-violet-600 text-white text-xs font-semibold">
                    {classification === 'series' || classification === 'episode' ? 'TV Series' : 'Video'}
                  </Badge>
                )}

                <Badge variant="outline" className="text-red-400 border-red-500/30 text-xs flex items-center gap-1">
                  <Youtube className="w-3.5 h-3.5" />
                  Available on YouTube
                </Badge>

                {score >= 80 && (
                  <Badge variant="outline" className="text-amber-400 border-amber-500/30 text-xs flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    High Quality Match ({score} pts)
                  </Badge>
                )}
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

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <a
                href={youtubeWatchUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors shadow-md shadow-red-600/20"
              >
                <Youtube className="w-3.5 h-3.5" />
                Watch on YouTube
                <ExternalLink className="w-3 h-3 ml-0.5" />
              </a>

              <Button
                variant="outline"
                size="sm"
                onClick={handleFavoriteToggle}
                className={`text-xs border-gray-800 ${
                  isFavorited
                    ? 'bg-rose-500/10 border-rose-500/40 text-rose-400'
                    : 'bg-gray-900/80 text-gray-300 hover:text-white hover:bg-gray-800'
                }`}
              >
                <Heart className={`w-3.5 h-3.5 mr-1.5 ${isFavorited ? 'fill-current text-rose-500' : ''}`} />
                {isFavorited ? 'Favorited' : t.addToFavorites}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="bg-gray-900/80 border-gray-800 text-xs text-gray-300 hover:text-white hover:bg-gray-800"
              >
                {isCopied ? <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 mr-1.5" />}
                {isCopied ? 'Copied!' : t.share}
              </Button>

              <Button asChild size="sm" className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold">
                <Link to={`/${countryCode.toLowerCase()}/movies`}>
                  <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                  All {country.name} Movies
                </Link>
              </Button>
            </div>
          </div>

          {/* Description Card */}
          <Card className="bg-gray-900/50 border-gray-800/80 backdrop-blur-xl">
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

        {/* Related Movies Rail */}
        {related.length > 0 && (
          <section className="space-y-4 pt-6 border-t border-gray-800/60">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Tv className="w-5 h-5 text-orange-400" />
                {t.relatedMovies}
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
