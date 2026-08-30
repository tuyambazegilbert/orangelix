/**
 * OrangeFlix Country Movie & YouTube Video Card
 * High-performance movie card with duration badge, channel info, view counts, release date, rating, and direct Add to Watchlist action.
 * Zero embedded iframes on cards for maximum browser performance.
 */

import { Link } from 'react-router-dom';
import { useState } from 'react';
import { GeoContentItem } from '@/types/geo-content';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, Clock, Eye, Sparkles, Youtube, Bookmark, Star, Check, Calendar } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { MovieService } from '@/lib/movies';
import { toast } from 'sonner';

interface CountryMovieCardProps {
  movie: GeoContentItem;
  countryCode?: string;
  showCategory?: boolean;
}

function formatViews(views: number): string {
  if (views >= 1000000) {
    return `${(views / 1000000).toFixed(1)}M`;
  }
  if (views >= 1000) {
    return `${Math.round(views / 1000)}K`;
  }
  return String(views);
}

export default function CountryMovieCard({ movie, countryCode }: CountryMovieCardProps) {
  const { currentUser } = useAuth();
  const code = (countryCode || movie.country || movie.countryCode || 'RW').toLowerCase();
  const detailUrl = `/${code}/movies/${movie.slug || movie.youtubeVideoId || movie.id}`;
  const thumbnail =
    movie.thumbnail || movie.thumbnailUrl || `https://img.youtube.com/vi/${movie.youtubeVideoId}/hqdefault.jpg`;
  const views = movie.views ?? movie.viewCount ?? 0;
  const score = movie.score ?? movie.classificationScore ?? 0;
  const classification = movie.classification || movie.contentType || 'movie';

  const rawId = `geo-${movie.id || movie.youtubeVideoId}`;
  const [inWatchlist, setInWatchlist] = useState<boolean>(() => {
    return currentUser ? MovieService.isInWatchLater(rawId, currentUser.id) : false;
  });

  const handleWatchlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!currentUser) {
      toast.info('Please sign in to save to your Watchlist');
      return;
    }

    if (inWatchlist) {
      MovieService.removeFromWatchLater(rawId, currentUser.id);
      setInWatchlist(false);
      toast.success('Removed from Watchlist');
    } else {
      MovieService.addToWatchLater(rawId, currentUser.id, {
        mediaType: 'movie',
        cachedMedia: {
          id: movie.id,
          title: movie.title,
          description: movie.description,
          imageUrl: thumbnail,
          duration: Math.round((movie.durationSeconds || 0) / 60),
          country: movie.country,
        },
      });
      setInWatchlist(true);
      toast.success(`Saved "${movie.title}" to Watchlist!`);
    }
  };

  // Approximate star rating from score or view popularity
  const ratingValue = score >= 70 ? (4.5 + (score % 5) * 0.1).toFixed(1) : (4.0 + (views > 10000 ? 0.4 : 0.1)).toFixed(1);

  // Release Date
  const releaseYear = movie.publishedAt ? new Date(movie.publishedAt).getFullYear() : '2026';

  return (
    <Link to={detailUrl} className="group block h-full select-none" aria-label={`Watch ${movie.title}`}>
      <Card className="h-full bg-gray-900/60 border-gray-800/80 hover:border-orange-500/60 transition-all duration-300 overflow-hidden flex flex-col justify-between hover:shadow-xl hover:shadow-orange-500/10 hover:-translate-y-1 rounded-2xl">
        <div className="relative aspect-video w-full overflow-hidden bg-gray-950">
          <img
            src={thumbnail}
            alt={movie.title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/35 pointer-events-none" />

          {/* Top Badges & Watchlist Button */}
          <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between z-10">
            <Badge className="bg-black/75 backdrop-blur-md text-[10px] text-white border border-white/15 px-2 py-0.5 shadow-sm">
              {movie.country === 'RW' || movie.countryCode === 'RW'
                ? '🇷🇼 Rwanda'
                : movie.country === 'UG' || movie.countryCode === 'UG'
                ? '🇺🇬 Uganda'
                : movie.country === 'KE' || movie.countryCode === 'KE'
                ? '🇰🇪 Kenya'
                : movie.country === 'NG' || movie.countryCode === 'NG'
                ? '🇳🇬 Nigeria'
                : movie.country === 'GH' || movie.countryCode === 'GH'
                ? '🇬🇭 Ghana'
                : movie.country === 'TZ' || movie.countryCode === 'TZ'
                ? '🇹🇿 Tanzania'
                : movie.country === 'ZA' || movie.countryCode === 'ZA'
                ? '🇿🇦 South Africa'
                : movie.country === 'US' || movie.countryCode === 'US'
                ? '🇺🇸 USA'
                : '🌍 Cinema'}
            </Badge>

            <div className="flex items-center gap-1">
              <Badge className="bg-orange-500/85 backdrop-blur-md text-[9px] text-white font-semibold border-none px-1.5 py-0.5">
                {movie.isFullMovieCandidate ? 'Movie' : 'Series'}
              </Badge>

              <button
                onClick={handleWatchlistToggle}
                className={`w-7 h-7 rounded-full flex items-center justify-center backdrop-blur-md border transition-all duration-200 ${
                  inWatchlist
                    ? 'bg-orange-500 text-white border-orange-400'
                    : 'bg-black/60 text-white/80 hover:text-white hover:bg-black/90 border-white/20'
                }`}
                title={inWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
                aria-label="Add to Watchlist"
              >
                {inWatchlist ? <Check className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Play Icon Center Hover */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            <div className="w-12 h-12 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/40 transform scale-75 group-hover:scale-100 transition-transform">
              <Play className="w-5 h-5 fill-current ml-0.5" />
            </div>
          </div>

          {/* Bottom Duration & Rating */}
          <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between text-xs text-white/90 font-medium">
            <span className="inline-flex items-center gap-1 bg-black/80 backdrop-blur-md px-2 py-0.5 rounded-md text-[11px] font-mono border border-white/10">
              <Clock className="w-3 h-3 text-orange-400" />
              {movie.durationFormatted}
            </span>

            <span className="inline-flex items-center gap-1 bg-amber-500/80 backdrop-blur-md px-1.5 py-0.5 rounded text-[10px] font-bold text-white shadow-sm">
              <Star className="w-3 h-3 fill-current text-yellow-200" />
              {ratingValue}
            </span>
          </div>
        </div>

        <CardContent className="p-3 flex-1 flex flex-col justify-between space-y-2">
          <div className="space-y-1">
            <h3 className="text-xs sm:text-sm font-bold text-white line-clamp-2 group-hover:text-orange-400 transition-colors leading-snug">
              {movie.title}
            </h3>
            <p className="text-[11px] text-gray-400 line-clamp-1 flex items-center gap-1">
              <Youtube className="w-3 h-3 text-red-500 shrink-0" />
              {movie.channelTitle}
            </p>
          </div>

          <div className="pt-2 border-t border-gray-800/60 flex items-center justify-between text-[11px] text-gray-400">
            <span className="inline-flex items-center gap-1 font-mono text-slate-300">
              <Calendar className="w-3 h-3 text-orange-400" />
              {releaseYear}
            </span>

            <span className="inline-flex items-center gap-1">
              <Eye className="w-3 h-3 text-gray-500" />
              {formatViews(views)}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
