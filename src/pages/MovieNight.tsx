import { useState, useEffect } from 'react';
import { useTrending, useDiscoverMovies } from '@/hooks/use-tmdb';
import { WeatherApi, WeatherCondition } from '@/services/weather-api';
import MovieCard from '@/components/MovieCard';
import SEOHead from '@/components/seo/SEOHead';
import Breadcrumbs from '@/components/Breadcrumbs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  CloudRain,
  Sun,
  Cloud,
  CloudLightning,
  Snowflake,
  Search,
  Sparkles,
  MapPin,
  Clock,
  Flame,
  Film,
  Tv,
} from 'lucide-react';
import { toast } from 'sonner';

export default function MovieNight() {
  const [city, setCity] = useState('Kigali');
  const [searchCity, setSearchCity] = useState('');
  const [weather, setWeather] = useState<WeatherCondition | null>(null);
  const [loadingWeather, setLoadingWeather] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'mood' | 'under90' | 'epic' | 'series'>('mood');

  // Load weather
  const fetchWeather = async (targetCity: string) => {
    setLoadingWeather(true);
    const w = await WeatherApi.getWeatherByCity(targetCity);
    setWeather(w);
    setCity(w.city);
    setLoadingWeather(false);
  };

  useEffect(() => {
    fetchWeather(city);
  }, []);

  const handleCitySearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchCity.trim()) return;
    fetchWeather(searchCity.trim());
    toast.success(`Updated weather forecast for ${searchCity}`);
    setSearchCity('');
  };

  // Discover movies for current weather mood
  const trending = useTrending('all', 'day');
  const discover = useDiscoverMovies({
    sort_by: 'popularity.desc',
    page: 1,
  });

  const allItems = [...(trending.data?.items || []), ...(discover.data?.items || [])];

  // Filter items based on active filter
  const filteredItems = allItems.filter((item, index, self) => {
    const isFirst = self.findIndex((m) => m.id === item.id) === index;
    if (!isFirst) return false;

    if (activeFilter === 'under90') {
      return item.mediaType === 'movie';
    }
    if (activeFilter === 'epic') {
      return item.mediaType === 'movie' && (item.voteAverage || 0) >= 7.5;
    }
    if (activeFilter === 'series') {
      return item.mediaType === 'tv';
    }
    return true;
  }).slice(0, 16);

  const getWeatherIcon = (code?: number) => {
    if (code === undefined) return <Cloud className="w-8 h-8 text-orange-400" />;
    if (code === 0) return <Sun className="w-8 h-8 text-yellow-400" />;
    if (code >= 51 && code <= 67) return <CloudRain className="w-8 h-8 text-blue-400" />;
    if (code >= 71 && code <= 77) return <Snowflake className="w-8 h-8 text-sky-300" />;
    if (code >= 95) return <CloudLightning className="w-8 h-8 text-amber-400" />;
    return <Cloud className="w-8 h-8 text-orange-400" />;
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <SEOHead
        title="Tonight & Movie Night — Weather & Mood-Aware Discovery"
        description="Atmosphere-aware cinema discovery tailored to your evening, city weather, and mood."
        url="https://orangeflixx.vercel.app/movie-night"
      />

      <div className="page-wrap py-8">
        <Breadcrumbs items={[{ name: 'Movie Night & Tonight', url: '/movie-night' }]} />

        {/* Hero Atmosphere Banner */}
        <section className="relative overflow-hidden rounded-3xl border border-white/[.08] bg-gradient-to-br from-[#101728] via-[#090e1a] to-[#150e20] p-6 sm:p-10 mb-10 shadow-2xl">
          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-orange-500/10 blur-3xl" />
          <div className="pointer-events-none absolute -left-20 -bottom-20 h-72 w-72 rounded-full bg-violet-600/10 blur-3xl" />

          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-300 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Atmospheric Entertainment Intelligence</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
                Tonight in <span className="text-orange-400">{weather?.city || city}</span>
              </h1>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                {loadingWeather
                  ? 'Analyzing atmospheric conditions...'
                  : weather?.moodDescription}
              </p>
            </div>

            {/* Live Weather Card */}
            <div className="bg-gray-900/80 border border-white/[.1] rounded-2xl p-5 backdrop-blur-md flex items-center gap-4 shrink-0 shadow-lg">
              <div className="grid place-items-center w-14 h-14 rounded-xl bg-white/[.05] border border-white/[.08]">
                {getWeatherIcon(weather?.weatherCode)}
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-white">{weather?.temperature ?? 22}°C</span>
                  <span className="text-xs font-medium text-orange-400">{weather?.conditionText}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  <span>{weather?.city}, {weather?.country}</span>
                </div>
              </div>
            </div>
          </div>

          {/* City Change Search */}
          <form onSubmit={handleCitySearch} className="relative mt-8 flex max-w-md items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                type="text"
                placeholder="Check another city (e.g. Kigali, London, Paris, Tokyo)..."
                value={searchCity}
                onChange={(e) => setSearchCity(e.target.value)}
                className="pl-9 bg-black/40 border-white/10 text-xs text-white placeholder:text-slate-500 rounded-xl h-10"
              />
            </div>
            <Button type="submit" size="sm" className="bg-orange-500 hover:bg-orange-600 rounded-xl h-10 px-4">
              Update
            </Button>
          </form>
        </section>

        {/* Filter Mood Bar */}
        <div className="flex items-center justify-between flex-wrap gap-3 mb-8 border-b border-white/[.07] pb-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <Button
              variant={activeFilter === 'mood' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveFilter('mood')}
              className={activeFilter === 'mood' ? 'bg-orange-500 text-white' : 'border-white/10 text-slate-300'}
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              Weather Mood Picks
            </Button>
            <Button
              variant={activeFilter === 'under90' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveFilter('under90')}
              className={activeFilter === 'under90' ? 'bg-orange-500 text-white' : 'border-white/10 text-slate-300'}
            >
              <Clock className="w-3.5 h-3.5 mr-1.5" />
              Under 90 Minutes
            </Button>
            <Button
              variant={activeFilter === 'epic' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveFilter('epic')}
              className={activeFilter === 'epic' ? 'bg-orange-500 text-white' : 'border-white/10 text-slate-300'}
            >
              <Flame className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
              Critically Acclaimed Epics
            </Button>
            <Button
              variant={activeFilter === 'series' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveFilter('series')}
              className={activeFilter === 'series' ? 'bg-orange-500 text-white' : 'border-white/10 text-slate-300'}
            >
              <Tv className="w-3.5 h-3.5 mr-1.5" />
              Weekend Binge Series
            </Button>
          </div>
          <span className="text-xs text-slate-400">
            Showing {filteredItems.length} curated titles
          </span>
        </div>

        {/* Media Grid */}
        <div className="content-grid">
          {filteredItems.map((media) => (
            <MovieCard key={media.id} movie={media} />
          ))}
        </div>
      </div>
    </div>
  );
}

