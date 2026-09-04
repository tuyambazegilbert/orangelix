import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { WeatherApi, WeatherCondition } from '@/services/weather-api';
import { RecommendationService } from '@/features/recommendations/recommendationService';
import { RecommendedItem } from '@/features/recommendations/engine/types';
import { useAuth } from '@/contexts/AuthContext';
import { Analytics } from '@/services/analytics';
import { Badge } from '@/components/ui/badge';
import {
  CloudRain,
  Sun,
  Cloud,
  Snowflake,
  Zap,
  X,
  Play,
  Sparkles,
  ChevronDown,
  Compass,
} from 'lucide-react';
import { POSTER_FALLBACK } from '@/lib/tmdb/images';

const PREF_OPT_OUT_KEY = 'orangeflix_weather_rec_disabled';
const SESSION_DISMISS_KEY = 'orangeflix_weather_rec_dismissed';

export default function WeatherAssistant() {
  const { currentUser } = useAuth();
  const [weather, setWeather] = useState<WeatherCondition | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendedItem[]>([]);
  const [isOpen, setIsOpen] = useState(true); // Open proactively with list visible
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isOptedOut, setIsOptedOut] = useState(false);

  useEffect(() => {
    // Check opt-out and dismissal flags
    try {
      if (localStorage.getItem(PREF_OPT_OUT_KEY) === 'true') {
        setIsOptedOut(true);
        return;
      }
      if (sessionStorage.getItem(SESSION_DISMISS_KEY) === 'true') {
        setIsDismissed(true);
        return;
      }
    } catch {
      // Storage blocked
    }

    // Load weather & recommendations proactively
    WeatherApi.getWeatherByCity('Kigali')
      .then(async (w) => {
        if (!w) return;
        setWeather(w);
        const recs = await RecommendationService.getWeatherRecs(
          w.conditionText || w.condition || 'Clear',
          w.temperature || 22,
          currentUser?.id,
          3
        ).catch(() => []);

        setRecommendations(recs);
        if (recs.length > 0) {
          Analytics.logEvent('weather_recommendation_impression', {
            userId: currentUser?.id,
            metadata: { weatherCondition: w.conditionText, temp: w.temperature },
          });
          // Smooth entrance delay matching GeoRecommendationCard
          const timer = setTimeout(() => setIsVisible(true), 1200);
          return () => clearTimeout(timer);
        }
      })
      .catch(() => {
        // Fallback gracefully on weather fetch error
      });
  }, [currentUser]);

  if (!isVisible || isOptedOut || isDismissed || !weather || recommendations.length === 0) {
    return null;
  }

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    try {
      sessionStorage.setItem(SESSION_DISMISS_KEY, 'true');
    } catch {
      // Ignore storage errors in private browsing
    }
  };

  const handleOptOut = () => {
    setIsVisible(false);
    setIsOptedOut(true);
    try {
      localStorage.setItem(PREF_OPT_OUT_KEY, 'true');
    } catch {
      // Ignore storage errors in private browsing
    }
  };

  const getWeatherIcon = (cond: string) => {
    const c = (cond || '').toLowerCase();
    if (c.includes('rain') || c.includes('drizzle')) return <CloudRain className="w-4 h-4 text-sky-400" />;
    if (c.includes('snow')) return <Snowflake className="w-4 h-4 text-blue-200" />;
    if (c.includes('thunder') || c.includes('storm')) return <Zap className="w-4 h-4 text-amber-400" />;
    if (c.includes('cloud') || c.includes('overcast')) return <Cloud className="w-4 h-4 text-slate-300" />;
    return <Sun className="w-4 h-4 text-yellow-400" />;
  };

  return (
    <aside
      className="fixed bottom-6 left-6 z-40 max-w-sm w-[calc(100vw-2rem)] sm:w-80 animate-in fade-in slide-in-from-bottom-6 duration-500"
      aria-label="Weather-aware entertainment assistant"
    >
      {isOpen ? (
        <div className="rounded-2xl border border-white/15 bg-[#090e18]/95 p-4 shadow-2xl backdrop-blur-2xl space-y-3 ring-1 ring-orange-500/20">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/[.08] pb-2.5">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-white/[.06]">
                {getWeatherIcon(weather.conditionText || weather.condition)}
              </div>
              <div>
                <p className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>{weather.temperature}°C</span>
                  <span className="text-slate-400">• {weather.city}</span>
                </p>
                <p className="text-[10px] text-orange-400 font-medium">
                  {weather.moodTitle || weather.moodCategory || 'Prime'} Picks for Tonight
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-md transition"
                aria-label="Minimize weather assistant"
                title="Minimize"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
              <button
                onClick={handleDismiss}
                className="text-slate-400 hover:text-white p-1 rounded-md transition"
                aria-label="Dismiss assistant for this session"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 leading-snug">
            Curated atmospheric cinema matching current {(weather.conditionText || 'clear').toLowerCase()} weather in {weather.city}:
          </p>

          {/* Proactive Recommendation List - Directly Rendered */}
          <div className="space-y-2">
            {recommendations.slice(0, 3).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 p-2 rounded-xl bg-white/[.03] border border-white/[.06] hover:border-orange-500/30 transition group"
              >
                <img
                  src={item.posterUrl || POSTER_FALLBACK}
                  alt={item.title}
                  className="w-10 h-14 object-cover rounded-lg bg-slate-900 shrink-0"
                />

                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-white truncate group-hover:text-orange-400 transition-colors">
                    {item.title}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">
                    {item.genres[0] || 'Movie'} • ★ {item.voteAverage}
                  </p>
                  <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30 text-[9px] px-1.5 py-0 mt-0.5 font-normal">
                    {item.primaryReason}
                  </Badge>
                </div>

                <Link
                  to={`/watch/movie-${item.tmdbId}`}
                  onClick={() => {
                    Analytics.logEvent('weather_recommendation_click', {
                      userId: currentUser?.id,
                      entityId: item.tmdbId.toString(),
                      entityTitle: item.title,
                    });
                  }}
                  className="p-2 rounded-full bg-orange-500 text-white hover:bg-orange-400 transition shadow-sm shrink-0"
                  aria-label={`Watch ${item.title}`}
                >
                  <Play className="w-3 h-3 fill-current" />
                </Link>
              </div>
            ))}
          </div>

          {/* Footer Controls */}
          <div className="flex items-center justify-between pt-2 border-t border-white/[.06] text-[10px] text-slate-500">
            <Link to="/movie-night" className="text-orange-400 hover:underline flex items-center gap-1 font-semibold">
              <Compass className="w-3 h-3" /> Full Tonight Hub
            </Link>
            <button onClick={handleOptOut} className="hover:text-slate-400 hover:underline">
              Don&apos;t show again
            </button>
          </div>
        </div>
      ) : (
        /* Compact Minimized Floating Pill */
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2.5 rounded-full border border-orange-500/30 bg-[#0a101c]/95 px-3.5 py-2 shadow-2xl backdrop-blur-xl hover:border-orange-400 transition group"
        >
          {getWeatherIcon(weather.conditionText || weather.condition)}
          <span className="text-xs font-semibold text-white">
            {weather.temperature}°C • <span className="text-orange-400">{weather.city}</span> picks ({recommendations.length})
          </span>
          <Sparkles className="w-3.5 h-3.5 text-orange-400 group-hover:scale-110 transition-transform" />
        </button>
      )}
    </aside>
  );
}
