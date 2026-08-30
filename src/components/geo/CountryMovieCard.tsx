/**
 * OrangeFlix Country Movie & YouTube Video Card
 * High-performance movie card with duration badge, channel info, view counts, and play action.
 * Zero embedded iframes on cards for maximum browser performance.
 */

import { Link } from 'react-router-dom';
import { GeoContentItem } from '@/types/geo-content';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, Clock, Eye, Sparkles, Youtube } from 'lucide-react';

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
  const code = (countryCode || movie.country || movie.countryCode || 'RW').toLowerCase();
  const detailUrl = `/${code}/movies/${movie.slug || movie.youtubeVideoId}`;
  const thumbnail = movie.thumbnail || movie.thumbnailUrl || `https://img.youtube.com/vi/${movie.youtubeVideoId}/hqdefault.jpg`;
  const views = movie.views ?? movie.viewCount ?? 0;
  const score = movie.score ?? movie.classificationScore ?? 0;
  const classification = movie.classification || movie.contentType || 'movie';

  return (
    <Link to={detailUrl} className="group block h-full">
      <Card className="h-full bg-gray-900/60 border-gray-800/80 hover:border-orange-500/50 transition-all duration-300 overflow-hidden flex flex-col justify-between hover:shadow-xl hover:shadow-orange-500/10 hover:-translate-y-1">
        <div className="relative aspect-video w-full overflow-hidden bg-gray-950">
          <img
            src={thumbnail}
            alt={movie.title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

          {/* Top Badges */}
          <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
            <Badge className="bg-black/70 backdrop-blur-md text-[10px] text-white border border-white/15 px-2 py-0.5">
              {movie.country === 'RW' || movie.countryCode === 'RW' ? '🇷🇼 Rwanda' : movie.country || movie.countryCode}
            </Badge>

            {movie.isFullMovieCandidate ? (
              <Badge className="bg-orange-500/90 backdrop-blur-md text-[10px] font-semibold text-white border-0 shadow-md">
                Full Movie
              </Badge>
            ) : (
              <Badge className="bg-violet-600/80 backdrop-blur-md text-[10px] text-white border-0">
                {classification === 'series' || classification === 'episode' ? 'Series' : 'Video'}
              </Badge>
            )}
          </div>

          {/* Play Icon Center Hover */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="w-12 h-12 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/40 transform scale-75 group-hover:scale-100 transition-transform">
              <Play className="w-5 h-5 fill-current ml-0.5" />
            </div>
          </div>

          {/* Bottom Duration & YouTube Indicator */}
          <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between text-xs text-white/90 font-medium">
            <span className="inline-flex items-center gap-1 bg-black/80 backdrop-blur-md px-2 py-0.5 rounded-md text-[11px] font-mono border border-white/10">
              <Clock className="w-3 h-3 text-orange-400" />
              {movie.durationFormatted}
            </span>

            <span className="inline-flex items-center gap-1 bg-red-600/80 backdrop-blur-md px-1.5 py-0.5 rounded text-[10px] font-semibold text-white">
              <Youtube className="w-3 h-3" />
              YouTube
            </span>
          </div>
        </div>

        <CardContent className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
          <div className="space-y-1">
            <h3 className="text-xs sm:text-sm font-bold text-white line-clamp-2 group-hover:text-orange-400 transition-colors">
              {movie.title}
            </h3>
            <p className="text-[11px] text-gray-400 line-clamp-1">{movie.channelTitle}</p>
          </div>

          <div className="pt-2 border-t border-gray-800/60 flex items-center justify-between text-[11px] text-gray-400">
            <span className="inline-flex items-center gap-1">
              <Eye className="w-3 h-3 text-gray-500" />
              {formatViews(views)} views
            </span>

            {score >= 80 && (
              <span className="inline-flex items-center gap-0.5 text-amber-400 font-semibold">
                <Sparkles className="w-3 h-3" /> Top Pick
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
