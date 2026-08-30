/**
 * OrangeFlix Geo Recommendation Floating Card
 * Non-intrusive, dismissible, localized entertainment recommendation widget.
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { GeoContentItem } from '@/types/geo-content';
import { GeolocationService, DetectedLocation } from '@/services/geolocation';
import { GeoContentService } from '@/services/geo-content-service';
import { getGeoTranslations } from '@/features/geo/translations';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Clock, ArrowRight, Sparkles, Film } from 'lucide-react';

export default function GeoRecommendationCard() {
  const [location, setLocation] = useState<DetectedLocation | null>(null);
  const [recommendations, setRecommendations] = useState<GeoContentItem[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if dismissed previously
    if (GeolocationService.hasDismissedPopup()) {
      return;
    }

    const init = async () => {
      const loc = await GeolocationService.detectVisitorCountry();
      setLocation(loc);

      const items = await GeoContentService.getRecommendations(loc.countryCode, 2);
      if (items.length > 0) {
        setRecommendations(items);
        // Small graceful delay to not jar the user on first render
        const timer = setTimeout(() => setIsVisible(true), 1200);
        return () => clearTimeout(timer);
      }
    };

    void init();
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    GeolocationService.dismissPopup(7); // Dismiss for 7 days
  };

  if (!isVisible || isDismissed || !location || recommendations.length === 0) {
    return null;
  }

  const lang = GeolocationService.getUserLanguage();
  const t = getGeoTranslations(lang);
  const countryCode = location.countryCode.toLowerCase();
  const catalogUrl = `/${countryCode}/movies`;

  return (
    <aside
      aria-label="Local Cinema Recommendations"
      className="fixed bottom-6 right-6 z-40 w-full max-w-sm sm:max-w-md animate-in fade-in slide-in-from-bottom-6 duration-500"
    >
      <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-[#0e1424]/90 backdrop-blur-2xl p-4 sm:p-5 shadow-2xl shadow-black/80 ring-1 ring-orange-500/20">
        {/* Glow ambient */}
        <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-orange-500/15 blur-2xl" />

        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl" role="img" aria-label={location.countryName}>
              {location.flag}
            </span>
            <Badge className="bg-orange-500/15 text-orange-400 border border-orange-500/30 text-[11px] font-semibold py-0.5">
              <Sparkles className="w-3 h-3 mr-1" />
              {t.forYou}
            </Badge>
          </div>

          <button
            onClick={handleDismiss}
            className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/15 text-gray-400 hover:text-white flex items-center justify-center transition-colors"
            aria-label={t.dismiss}
            title={t.dismiss}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Title & Subtitle */}
        <div className="space-y-0.5 mb-3.5">
          <h4 className="text-sm sm:text-base font-bold text-white tracking-tight">
            {t.watchMovies(location.countryName)}
          </h4>
          <p className="text-xs text-gray-400 line-clamp-1">
            {t.discoverSubtitle(location.countryName)}
          </p>
        </div>

        {/* Mini Movie Thumbnails Grid */}
        <div className="grid grid-cols-2 gap-2.5 mb-3.5">
          {recommendations.slice(0, 2).map((item) => (
            <Link
              key={item.id}
              to={`/${countryCode}/movies/${item.slug || item.youtubeVideoId}`}
              className="group block relative rounded-xl overflow-hidden bg-gray-950 border border-white/10 hover:border-orange-500/40 transition-all"
            >
              <div className="relative aspect-video w-full overflow-hidden">
                <img
                  src={item.thumbnailUrl}
                  alt={item.title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute bottom-1 right-1 bg-black/80 backdrop-blur-sm px-1.5 py-0.2 rounded text-[9px] font-mono text-white flex items-center gap-0.5">
                  <Clock className="w-2.5 h-2.5 text-orange-400" />
                  {item.durationFormatted}
                </span>
              </div>
              <div className="p-2 space-y-0.5">
                <p className="text-[11px] font-bold text-white truncate group-hover:text-orange-400 transition-colors">
                  {item.title}
                </p>
                <p className="text-[10px] text-gray-400 truncate">{item.channelTitle}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Action Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-white/10">
          <span className="text-[11px] text-gray-400 flex items-center gap-1">
            <Film className="w-3 h-3 text-orange-400" /> YouTube Cinema
          </span>

          <Button
            asChild
            size="sm"
            className="h-8 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold px-3 shadow-md shadow-orange-500/20"
          >
            <Link to={catalogUrl}>
              {t.seeAll} <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </Button>
        </div>
      </div>
    </aside>
  );
}

