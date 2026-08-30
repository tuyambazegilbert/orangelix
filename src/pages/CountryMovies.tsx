/**
 * OrangeFlix Country-Specific Movie & Cinema Discovery Catalog
 * Route: /:countryCode/movies and /:countryCode/series (e.g. /rw/movies, /ke/movies, /ng/movies)
 * Conforms strictly to Sections 10, 14, 18, 20, 21 specifications.
 */

import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { GeoContentItem, GeoContentType } from '@/types/geo-content';
import { GeoContentService } from '@/services/geo-content-service';
import { GeolocationService } from '@/services/geolocation';
import { YouTubeClient } from '@/features/youtube/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  getCountryConfig,
  getAllCountries,
} from '@/features/geo/countryConfig';
import { getGeoTranslations } from '@/features/geo/translations';
import CountryMovieCard from '@/components/geo/CountryMovieCard';
import CountryStageSlider from '@/components/geo/CountryStageSlider';
import SEOHead from '@/components/seo/SEOHead';
import Breadcrumbs from '@/components/Breadcrumbs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Film,
  Search,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
  Clock,
  Tv,
  RefreshCw,
  Tag,
  Layers,
  AlertCircle,
  Clock3,
} from 'lucide-react';
import { toast } from 'sonner';

type CatalogTab = 'full_movies' | 'popular' | 'latest' | 'series' | 'episodes' | 'all';
type DurationRange = 'all' | 'under_20' | '20_45' | '45_90' | '90_plus';

export default function CountryMovies() {
  const { countryCode: rawCountryCode } = useParams<{ countryCode?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const isAdmin = Boolean(currentUser?.isAdmin);

  const countryCode = (rawCountryCode || 'rw').toUpperCase();
  const country = useMemo(() => getCountryConfig(countryCode), [countryCode]);

  // Determine initial tab from route
  const isSeriesRoute = location.pathname.includes('/series');
  const [activeTab, setActiveTab] = useState<CatalogTab>(isSeriesRoute ? 'series' : 'full_movies');
  const [language, setLanguage] = useState<string>(() => GeolocationService.getUserLanguage());
  const [searchQuery, setSearchQuery] = useState('');
  const [durationRange, setDurationRange] = useState<DurationRange>('all');
  const [movies, setMovies] = useState<GeoContentItem[]>([]);
  const [featuredMovies, setFeaturedMovies] = useState<GeoContentItem[]>([]);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [totalCountryItems, setTotalCountryItems] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [lastApiError, setLastApiError] = useState<string | null>(null);

  const t = useMemo(() => getGeoTranslations(language), [language]);
  const allCountries = useMemo(() => getAllCountries(), []);
  const hasApiKey = YouTubeClient.hasApiKey();

  // Update language handler
  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang);
    GeolocationService.setUserLanguage(newLang);
  };

  // Update country handler
  const handleCountryChange = (newCode: string) => {
    navigate(`/${newCode.toLowerCase()}/movies`);
  };

  // Load featured hero items & pending status
  useEffect(() => {
    let isMounted = true;
    const loadFeaturedAndCounts = async () => {
      const [recs, allRes, pendingRes] = await Promise.all([
        GeoContentService.getRecommendations(countryCode, 6),
        GeoContentService.getMoviesByCountry({ countryCode, status: 'all', limit: 100 }),
        GeoContentService.getMoviesByCountry({ countryCode, status: 'pending_review', limit: 100 }),
      ]);

      if (isMounted) {
        setFeaturedMovies(recs);
        setTotalCountryItems(allRes.total);
        setPendingCount(pendingRes.total);
        const log = GeoContentService.getDiscoverySummary(countryCode);
        if (log?.errorMessage) {
          setLastApiError(log.errorMessage);
        }
      }
    };
    void loadFeaturedAndCounts();
    return () => {
      isMounted = false;
    };
  }, [countryCode]);

  // Fetch catalog on filter changes
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    const load = async () => {
      let isFullMovieCandidate: boolean | undefined;
      let contentType: GeoContentType | 'all' | undefined;
      let sortBy: 'popular' | 'latest' | 'score' = 'popular';

      if (activeTab === 'full_movies') {
        isFullMovieCandidate = true;
        sortBy = 'popular';
      } else if (activeTab === 'popular') {
        sortBy = 'popular';
      } else if (activeTab === 'latest') {
        sortBy = 'latest';
      } else if (activeTab === 'series') {
        contentType = 'series';
      } else if (activeTab === 'episodes') {
        contentType = 'episode';
      }

      const res = await GeoContentService.getMoviesByCountry({
        countryCode,
        isFullMovieCandidate,
        contentType,
        searchQuery: searchQuery.trim() || undefined,
        durationRange,
        sortBy,
        status: 'published',
        limit: 60,
      });

      if (isMounted) {
        setMovies(res.items);
        if (featuredMovies.length === 0 && res.items.length > 0) {
          setFeaturedMovies(res.items.slice(0, 6));
        }
        setIsLoading(false);
      }
    };

    void load();
    return () => {
      isMounted = false;
    };
  }, [countryCode, activeTab, searchQuery, durationRange]);

  const handleRunDiscovery = async () => {
    setIsDiscovering(true);
    toast.info(`Running YouTube discovery worker for ${country.name}...`);
    try {
      const res = await GeoContentService.triggerDiscoverySync(countryCode);
      if (res.apiError) {
        setLastApiError(res.apiError);
        toast.error(`YouTube API Error: ${res.apiError}`);
      } else {
        setLastApiError(null);
        toast.success(
          `Discovered ${res.stats.uniqueVideos} unique videos for ${country.name} (${res.stats.publishedMovies} published movies, ${res.stats.publishedSeries} published series)!`
        );
      }

      // Reload catalog and hero
      const refreshed = await GeoContentService.getMoviesByCountry({
        countryCode,
        status: 'published',
        limit: 60,
      });
      const allRes = await GeoContentService.getMoviesByCountry({ countryCode, status: 'all', limit: 100 });
      const pendingRes = await GeoContentService.getMoviesByCountry({ countryCode, status: 'pending_review', limit: 100 });

      setMovies(refreshed.items);
      setFeaturedMovies(refreshed.items.slice(0, 6));
      setTotalCountryItems(allRes.total);
      setPendingCount(pendingRes.total);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Discovery sync failed.';
      toast.error(message);
    } finally {
      setIsDiscovering(false);
    }
  };

  const pageTitle = `${country.flagEmoji} ${t.watchMovies(country.name)} — OrangeFlix Cinema`;
  const pageDescription = t.discoverSubtitle(country.name);

  // Render context-aware empty states (Section 14)
  const renderEmptyState = () => {
    if (!hasApiKey) {
      return (
        <div className="space-y-3 max-w-md mx-auto">
          <AlertCircle className="w-12 h-12 text-amber-400 mx-auto" />
          <h3 className="text-lg font-bold text-white">YouTube Discovery Not Configured</h3>
          <p className="text-xs text-gray-400 leading-relaxed">
            YouTube discovery is not configured yet. Ask an administrator to configure the YouTube Data API key in environment variables.
          </p>
        </div>
      );
    }

    if (lastApiError) {
      return (
        <div className="space-y-3 max-w-md mx-auto">
          <AlertCircle className="w-12 h-12 text-rose-400 mx-auto" />
          <h3 className="text-lg font-bold text-white">YouTube Discovery Unavailable</h3>
          <p className="text-xs text-gray-400 leading-relaxed">
            YouTube discovery is temporarily unavailable. Check API configuration and quota limit ({lastApiError}).
          </p>
        </div>
      );
    }

    if (totalCountryItems === 0) {
      return (
        <div className="space-y-3 max-w-md mx-auto">
          <Film className="w-12 h-12 text-orange-400 mx-auto" />
          <h3 className="text-lg font-bold text-white">No {country.name} Cinema Indexed Yet</h3>
          <p className="text-xs text-gray-400 leading-relaxed">
            {isAdmin
              ? `Click "Discover ${country.name} Movies" below to find public ${country.name} movies and series from YouTube.`
              : `We're discovering ${country.name === 'Rwanda' ? 'Rwandan' : country.name} cinema 🎬. New movies from trusted YouTube channels will appear here.`}
          </p>
        </div>
      );
    }

    if (pendingCount > 0 && movies.length === 0 && !searchQuery.trim() && durationRange === 'all') {
      return (
        <div className="space-y-3 max-w-md mx-auto">
          <Clock3 className="w-12 h-12 text-amber-400 mx-auto" />
          <h3 className="text-lg font-bold text-white">Cinema Discovered & Awaiting Moderation</h3>
          <p className="text-xs text-gray-400 leading-relaxed">
            {country.name} cinema has been discovered and is awaiting admin channel approval or moderation ({pendingCount} pending titles).
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-3 max-w-md mx-auto">
        <Film className="w-12 h-12 text-gray-600 mx-auto" />
        <h3 className="text-lg font-bold text-white">No Matching Cinema Found</h3>
        <p className="text-xs text-gray-400 leading-relaxed">
          No matching {country.name} movies were found for these search filters. Try resetting the filters or searching with different keywords.
        </p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#080b12] text-white overflow-x-hidden">
      <SEOHead
        title={pageTitle}
        description={pageDescription}
        url={`https://orangeflixx.vercel.app/${countryCode.toLowerCase()}/movies`}
      />

      {/* Development configuration warning if API key missing */}
      {!hasApiKey && process.env.NODE_ENV !== 'production' && (
        <div className="border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-center text-xs text-amber-300">
          YouTube discovery is not configured. Check <code>VITE_YOUTUBE_API_KEY</code> and YouTube Data API v3.
        </div>
      )}

      {/* 3D StageSlider Hero (Matching Home Landing Page Hero) */}
      <CountryStageSlider
        items={featuredMovies.length > 0 ? featuredMovies : movies.slice(0, 6)}
        country={country}
        language={language}
        allCountries={allCountries}
        onCountryChange={handleCountryChange}
        onLanguageChange={handleLanguageChange}
      />

      <main className="page-wrap py-8 max-w-7xl mx-auto space-y-8">
        <Breadcrumbs
          items={[
            { name: 'Home', url: '/' },
            { name: `${country.name} Movies`, url: `/${countryCode.toLowerCase()}/movies` },
          ]}
        />

        {/* Section Header (Section 20) */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-2xl" role="img" aria-label={country.name}>{country.flagEmoji}</span>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {country.name} Cinema
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-gray-400">
            Curated cinema & stories from {country.name} discovered on YouTube.
          </p>
        </div>

        {/* Filter Controls & Search Bar */}
        <section className="space-y-4">
          <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
            {/* Navigation Tabs (Section 18, 20) */}
            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as CatalogTab)}
              className="w-full lg:w-auto"
            >
              <TabsList className="bg-gray-900/80 border border-gray-800 p-1 rounded-xl h-auto flex flex-wrap">
                <TabsTrigger
                  value="full_movies"
                  className="data-[state=active]:bg-orange-500 data-[state=active]:text-white text-xs px-3.5 py-1.5 rounded-lg flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {t.fullMovies}
                </TabsTrigger>
                <TabsTrigger
                  value="popular"
                  className="data-[state=active]:bg-orange-500 data-[state=active]:text-white text-xs px-3.5 py-1.5 rounded-lg flex items-center gap-1.5"
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  {t.popular}
                </TabsTrigger>
                <TabsTrigger
                  value="latest"
                  className="data-[state=active]:bg-orange-500 data-[state=active]:text-white text-xs px-3.5 py-1.5 rounded-lg flex items-center gap-1.5"
                >
                  <Clock className="w-3.5 h-3.5" />
                  {t.recentlyAdded}
                </TabsTrigger>
                <TabsTrigger
                  value="series"
                  className="data-[state=active]:bg-orange-500 data-[state=active]:text-white text-xs px-3.5 py-1.5 rounded-lg flex items-center gap-1.5"
                >
                  <Tv className="w-3.5 h-3.5" />
                  TV Series
                </TabsTrigger>
                <TabsTrigger
                  value="episodes"
                  className="data-[state=active]:bg-orange-500 data-[state=active]:text-white text-xs px-3.5 py-1.5 rounded-lg flex items-center gap-1.5"
                >
                  <Layers className="w-3.5 h-3.5" />
                  Episodes
                </TabsTrigger>
                <TabsTrigger
                  value="all"
                  className="data-[state=active]:bg-orange-500 data-[state=active]:text-white text-xs px-3.5 py-1.5 rounded-lg"
                >
                  {t.allContent}
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Search & Duration Range Dropdown (Section 18) */}
            <div className="flex items-center gap-2.5 flex-1 max-w-md">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t.searchPlaceholder(country.name)}
                  className="pl-9 bg-gray-900/80 border-gray-800 text-xs text-white h-10 rounded-xl focus:border-orange-500"
                />
              </div>

              <Select
                value={durationRange}
                onValueChange={(v) => setDurationRange(v as DurationRange)}
              >
                <SelectTrigger className="w-[150px] bg-gray-900/80 border-gray-800 text-xs text-white h-10 rounded-xl">
                  <SlidersHorizontal className="w-3.5 h-3.5 mr-1.5 text-orange-400" />
                  <SelectValue placeholder="Duration" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-800 text-white">
                  <SelectItem value="all" className="text-xs">All Durations</SelectItem>
                  <SelectItem value="under_20" className="text-xs">Under 20m</SelectItem>
                  <SelectItem value="20_45" className="text-xs">20–45m</SelectItem>
                  <SelectItem value="45_90" className="text-xs">45–90m</SelectItem>
                  <SelectItem value="90_plus" className="text-xs">90m+</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Quick Search Tag Chips */}
          {country.popularSearchSuggestions && country.popularSearchSuggestions.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[11px] text-gray-400 flex items-center gap-1 font-semibold">
                <Tag className="w-3 h-3 text-orange-400" /> Popular searches:
              </span>
              {country.popularSearchSuggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setSearchQuery(suggestion)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                    searchQuery.toLowerCase() === suggestion.toLowerCase()
                      ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
                      : 'bg-gray-900/60 text-gray-300 border-gray-800 hover:border-orange-500/40 hover:text-white'
                  }`}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Movies Grid */}
        <section className="space-y-4">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="rounded-2xl border border-gray-800 bg-gray-900/40 p-3 space-y-3 animate-pulse">
                  <div className="aspect-video w-full bg-gray-800/60 rounded-xl" />
                  <div className="h-4 bg-gray-800 rounded w-3/4" />
                  <div className="h-3 bg-gray-800/50 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : movies.length === 0 ? (
            <div className="text-center py-16 bg-gray-900/30 rounded-3xl border border-gray-800/80 p-8 space-y-4">
              {renderEmptyState()}

              {isAdmin && hasApiKey && (
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <Button
                    size="sm"
                    onClick={handleRunDiscovery}
                    disabled={isDiscovering}
                    className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold px-4"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isDiscovering ? 'animate-spin' : ''}`} />
                    {isDiscovering ? 'Searching YouTube...' : `Discover ${country.name} Movies`}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchQuery('');
                      setDurationRange('all');
                      setActiveTab('all');
                    }}
                    className="text-xs border-gray-700 text-gray-300 hover:text-white"
                  >
                    Reset Filters
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {movies.map((movie) => (
                <CountryMovieCard key={movie.id} movie={movie} countryCode={countryCode} />
              ))}
            </div>
          )}
        </section>

        {/* Informational Disclaimer */}
        <footer className="pt-6 border-t border-gray-800/60 text-center text-xs text-gray-500 space-y-1">
          <p>{t.disclaimer}</p>
          <p className="text-[11px] text-gray-600">
            OrangeFlix discovers and indexes public entertainment from YouTube using the YouTube Data API v3 and plays content via the official YouTube embedded player.
          </p>
        </footer>
      </main>
    </div>
  );
}
