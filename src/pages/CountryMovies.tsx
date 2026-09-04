/**
 * OrangeFlix Country-Specific Movie & Cinema Discovery Catalog
 * Route: /:countryCode/movies and /:countryCode/series (e.g. /rw/movies, /ke/movies, /ng/movies)
 * Conforms strictly to Sections 10, 14, 18, 20, 21 specifications.
 * Features categorized rails (Recommended for you on top, New Releases, Trending, Popular, Binge-Worthy Series, New in Theatres),
 * country location switching, and territory showcase.
 */

import { useState, useEffect, useMemo, useRef } from 'react';
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
import { getCanonicalMediaId, partitionRails } from '@/lib/deduplication';
import CountryMovieCard from '@/components/geo/CountryMovieCard';
import CountryStageSlider from '@/components/geo/CountryStageSlider';
import GeoContentRail from '@/components/geo/GeoContentRail';
import GeoCountryShowcase from '@/components/geo/GeoCountryShowcase';
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
  Flame,
  Star,
  Theater,
  Grid,
  ListFilter,
  Globe,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';

import { HeroSkeleton, ContentRailSkeleton, MovieGridSkeleton } from '@/components/ui/Skeletons';

type CatalogTab = 'rails' | 'full_movies' | 'popular' | 'latest' | 'series' | 'episodes' | 'all';
type DurationRange = 'all' | 'under_20' | '20_45' | '45_90' | '90_plus';

export default function CountryMovies() {
  const { countryCode: rawCountryCode } = useParams<{ countryCode?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const isAdmin = Boolean(currentUser?.isAdmin);

  const countryCode = (rawCountryCode || 'rw').toUpperCase();
  const country = useMemo(() => getCountryConfig(countryCode), [countryCode]);

  const isSeriesRoute = location.pathname.includes('/series');
  const [activeTab, setActiveTab] = useState<CatalogTab>(isSeriesRoute ? 'series' : 'rails');
  const [language, setLanguage] = useState<string>(() => GeolocationService.getUserLanguage());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [durationRange, setDurationRange] = useState<DurationRange>('all');
  const [movies, setMovies] = useState<GeoContentItem[]>([]);
  const [featuredMovies, setFeaturedMovies] = useState<GeoContentItem[]>([]);
  const [recommendedMovies, setRecommendedMovies] = useState<GeoContentItem[]>([]);
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
        GeoContentService.getRecommendations(countryCode, 8),
        GeoContentService.getMoviesByCountry({ countryCode, status: 'all', limit: 150 }),
        GeoContentService.getMoviesByCountry({ countryCode, status: 'pending_review', limit: 100 }),
      ]);

      if (isMounted) {
        setRecommendedMovies(recs);
        setFeaturedMovies(recs.slice(0, 6));
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

  // Pro Page-by-Page Pagination (50 items per page by default, scalable for 5,000+ videos)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(50);
  const [totalFilteredCount, setTotalFilteredCount] = useState<number>(0);
  const [jumpPageInput, setJumpPageInput] = useState<string>('');
  const gridTopRef = useRef<HTMLDivElement | null>(null);

  const isFiltered = Boolean(searchQuery.trim() || selectedCategory !== 'all' || durationRange !== 'all');

  // Reset page to 1 whenever catalog filters or tabs change
  useEffect(() => {
    setCurrentPage(1);
  }, [countryCode, activeTab, searchQuery, selectedCategory, durationRange, pageSize]);

  // Fetch catalog on filter / page / pageSize changes
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

      const effectiveSearch = searchQuery.trim() || (selectedCategory !== 'all' ? selectedCategory : undefined);
      const isGridMode = isFiltered || activeTab !== 'rails';
      const fetchPage = isGridMode ? currentPage : 1;
      const fetchLimit = isGridMode ? pageSize : 150;

      const res = await GeoContentService.getMoviesByCountry({
        countryCode,
        isFullMovieCandidate,
        contentType,
        searchQuery: effectiveSearch,
        durationRange,
        sortBy,
        status: 'published',
        page: fetchPage,
        limit: fetchLimit,
      });

      if (isMounted) {
        setMovies(res.items);
        setTotalFilteredCount(res.total);
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
  }, [countryCode, activeTab, searchQuery, selectedCategory, durationRange, currentPage, pageSize, isFiltered]);

  const totalPages = Math.max(1, Math.ceil(totalFilteredCount / pageSize));

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || newPage === currentPage) return;
    setCurrentPage(newPage);
    gridTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleJumpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseInt(jumpPageInput, 10);
    if (!isNaN(p) && p >= 1 && p <= totalPages) {
      handlePageChange(p);
      setJumpPageInput('');
    }
  };

  // Smart page numbers range with ellipsis for large catalogs (e.g. [1, 2, 3, '...', 50, 51, 52, '...', 100])
  const getPaginationRange = () => {
    const delta = 2;
    const range: (number | string)[] = [];
    const rangeWithDots: (number | string)[] = [];
    let l: number | undefined;

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
        range.push(i);
      }
    }

    for (const i of range) {
      if (typeof i === 'number') {
        if (l) {
          if (i - l === 2) {
            rangeWithDots.push(l + 1);
          } else if (i - l !== 1) {
            rangeWithDots.push('...');
          }
        }
        rangeWithDots.push(i);
        l = i;
      }
    }

    return rangeWithDots;
  };

  // Categorized movie splits for rails (Guaranteed 100% Unique & Deduplicated across rails)
  const partitionedRails = useMemo(() => {
    const heroExcluded = new Set(featuredMovies.map(getCanonicalMediaId).filter(Boolean));

    const recCandidates = recommendedMovies.length > 0 ? recommendedMovies : movies;
    const releaseCandidates = [...movies]
      .filter((m) => m.isFullMovieCandidate || m.classification === 'movie')
      .sort((a, b) => new Date(b.publishedAt || b.createdAt || '').getTime() - new Date(a.publishedAt || a.createdAt || '').getTime());
    const trendingCandidates = [...movies]
      .sort((a, b) => (b.views || b.viewCount || 0) - (a.views || a.viewCount || 0));
    const popularCandidates = [...movies]
      .filter((m) => (m.score || m.classificationScore || 0) >= 50 || (m.views || 0) > 2000)
      .sort((a, b) => (b.score || 0) * (b.views || 1) - (a.score || 0) * (a.views || 1));
    const seriesCandidates = [...movies]
      .filter((m) => m.classification === 'series' || m.classification === 'episode' || !m.isFullMovieCandidate);
    const theatreCandidates = [...movies]
      .filter((m) => m.isFullMovieCandidate && (m.durationSeconds || 0) >= 3600);

    return partitionRails<GeoContentItem>(
      [
        {
          key: 'recommended',
          items: recCandidates,
          maxCount: 10,
          fallbackItems: movies,
        },
        {
          key: 'newReleases',
          items: releaseCandidates,
          maxCount: 10,
          fallbackItems: movies,
        },
        {
          key: 'trending',
          items: trendingCandidates,
          maxCount: 10,
          fallbackItems: movies,
        },
        {
          key: 'popular',
          items: popularCandidates,
          maxCount: 10,
          fallbackItems: movies,
        },
        {
          key: 'series',
          items: seriesCandidates,
          maxCount: 10,
          fallbackItems: movies,
        },
        {
          key: 'theatres',
          items: theatreCandidates,
          maxCount: 10,
          fallbackItems: movies,
        },
      ],
      heroExcluded
    );
  }, [featuredMovies, recommendedMovies, movies]);

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

      GeoContentService.invalidateCache(countryCode);

      // Reload catalog and hero
      const refreshed = await GeoContentService.getMoviesByCountry({
        countryCode,
        status: 'published',
        forceRefresh: true,
        limit: 100,
      });
      const allRes = await GeoContentService.getMoviesByCountry({ countryCode, status: 'all', limit: 150 });
      const pendingRes = await GeoContentService.getMoviesByCountry({ countryCode, status: 'pending_review', limit: 100 });

      setMovies(refreshed.items);
      setFeaturedMovies(refreshed.items.slice(0, 6));
      setRecommendedMovies(refreshed.items.slice(0, 8));
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

  // Render context-aware empty states
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

      {/* 3D StageSlider Hero (Matching Home Landing Page Hero) */}
      {isLoading && featuredMovies.length === 0 && movies.length === 0 ? (
        <HeroSkeleton />
      ) : (
        <CountryStageSlider
          items={featuredMovies.length > 0 ? featuredMovies : movies.slice(0, 6)}
          country={country}
          language={language}
          allCountries={allCountries}
          onCountryChange={handleCountryChange}
          onLanguageChange={handleLanguageChange}
        />
      )}

      <main className="page-wrap py-3 sm:py-4 max-w-7xl mx-auto px-3 sm:px-6 space-y-4">
        {/* Ultra-Compact Pro Cinema Command Deck */}
        <section className="rounded-xl border border-white/[.08] bg-gradient-to-r from-[#0d1322]/95 via-[#111827]/90 to-[#0d1322]/95 p-2 sm:p-2.5 backdrop-blur-md shadow-[0_8px_24px_rgba(0,0,0,0.25)] space-y-2">
          {/* Row 1: Territory Chips (Left) + View Mode Tabs (Right) */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1 overflow-x-auto scrollbar-none py-0.5">
              <GeoCountryShowcase
                showTitle={false}
                currentCountryCode={countryCode}
                countries={allCountries}
                onSelectCountry={handleCountryChange}
              />
              <span className="text-[10px] font-mono text-slate-400 bg-white/[.04] px-1.5 py-0.5 rounded border border-white/[.06] shrink-0">
                {totalCountryItems} titles
              </span>
            </div>

            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as CatalogTab)}
              className="shrink-0 self-end lg:self-auto"
            >
              <TabsList className="bg-slate-950/80 border border-white/10 p-0.5 rounded-lg h-7 flex flex-wrap">
                <TabsTrigger
                  value="rails"
                  className="data-[state=active]:bg-orange-500 data-[state=active]:text-white text-[11px] px-2 py-0.5 rounded-md flex items-center gap-1 font-medium transition-all"
                >
                  <Sparkles className="w-3 h-3" />
                  Featured Rails
                </TabsTrigger>
                <TabsTrigger
                  value="full_movies"
                  className="data-[state=active]:bg-orange-500 data-[state=active]:text-white text-[11px] px-2 py-0.5 rounded-md flex items-center gap-1 font-medium transition-all"
                >
                  <Film className="w-3 h-3" />
                  Full Movies
                </TabsTrigger>
                <TabsTrigger
                  value="series"
                  className="data-[state=active]:bg-orange-500 data-[state=active]:text-white text-[11px] px-2 py-0.5 rounded-md flex items-center gap-1 font-medium transition-all"
                >
                  <Tv className="w-3 h-3" />
                  Series
                </TabsTrigger>
                <TabsTrigger
                  value="all"
                  className="data-[state=active]:bg-orange-500 data-[state=active]:text-white text-[11px] px-2 py-0.5 rounded-md flex items-center gap-1 font-medium transition-all"
                >
                  <Grid className="w-3 h-3" />
                  All Grid
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Row 2: Inlined Search + Filters + Categories Ribbon */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pt-1.5 border-t border-white/[.06]">
            {/* Search Input */}
            <div className="relative shrink-0 w-44 sm:w-56">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-slate-400 w-3 h-3" />
              <Input
                type="search"
                placeholder={t.searchPlaceholder(country.name)}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-7 bg-slate-950/80 border-white/10 text-white placeholder-slate-500 rounded-lg text-xs h-7 focus:border-orange-500"
              />
            </div>

            {/* Duration Filter Dropdown */}
            <Select value={durationRange} onValueChange={(v) => setDurationRange(v as DurationRange)}>
              <SelectTrigger className="w-32 shrink-0 bg-slate-950/80 border-white/10 text-white rounded-lg text-xs h-7">
                <Clock className="w-3 h-3 mr-1 text-orange-400" />
                <SelectValue placeholder={t.allDurations} />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-800 text-white">
                <SelectItem value="all">{t.allDurations}</SelectItem>
                <SelectItem value="under_20">{t.shortLength}</SelectItem>
                <SelectItem value="20_45">{t.mediumLength}</SelectItem>
                <SelectItem value="45_90">Standard (45-90m)</SelectItem>
                <SelectItem value="90_plus">{t.featureLength}</SelectItem>
              </SelectContent>
            </Select>

            {/* Language Switcher */}
            <Select value={language} onValueChange={handleLanguageChange}>
              <SelectTrigger className="w-28 shrink-0 bg-slate-950/80 border-white/10 text-white rounded-lg text-xs h-7">
                <Globe className="w-3 h-3 mr-1 text-orange-400" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-800 text-white">
                <SelectItem value="rw">🇷🇼 Kinyarwanda</SelectItem>
                <SelectItem value="en">🇬🇧 English</SelectItem>
                <SelectItem value="fr">🇫🇷 Français</SelectItem>
                <SelectItem value="sw">🇹🇿 Kiswahili</SelectItem>
              </SelectContent>
            </Select>

            {/* Subtle Divider */}
            {country.popularCategories && country.popularCategories.length > 0 && (
              <div className="h-4 w-px bg-white/10 shrink-0" />
            )}

            {/* Quick Categories Ribbon inlined in the same row */}
            {country.popularCategories && country.popularCategories.length > 0 && (
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`text-[11px] px-2 py-0.5 rounded-md border shrink-0 transition-all ${
                    selectedCategory === 'all'
                      ? 'bg-orange-500 text-white border-orange-400 font-bold shadow-sm'
                      : 'bg-white/[.04] text-slate-300 border-white/10 hover:border-orange-500/40 hover:text-white'
                  }`}
                >
                  All
                </button>
                {country.popularCategories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat.toLowerCase())}
                    className={`text-[11px] px-2 py-0.5 rounded-md border shrink-0 transition-all ${
                      selectedCategory.toLowerCase() === cat.toLowerCase()
                        ? 'bg-orange-500 text-white border-orange-400 font-bold shadow-sm'
                        : 'bg-white/[.04] text-slate-300 border-white/10 hover:border-orange-500/40 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* MODE 1: FEATURED CATEGORIZED RAILS (When not actively filtering with keyword) */}
        {!isFiltered && activeTab === 'rails' && (
          isLoading && movies.length === 0 ? (
            <div className="space-y-6">
              <ContentRailSkeleton title="Recommended for you" />
              <ContentRailSkeleton title="New Releases" />
              <ContentRailSkeleton title="Trending" />
              <ContentRailSkeleton title="Popular" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* 1. RECOMMENDED FOR YOU (ON TOP) */}
              <GeoContentRail
                title="Recommended for you"
                eyebrow="Personalized Cinema Picks"
                icon={<Star className="w-3 h-3 text-amber-400 fill-current" />}
                items={partitionedRails.recommended || []}
                countryCode={countryCode}
                onSeeAll={() => setActiveTab('all')}
              />

              {/* 2. NEW RELEASES */}
              <GeoContentRail
                title="New Releases"
                eyebrow="Freshly Uploaded & Discovered"
                icon={<Clock className="w-3 h-3 text-cyan-400" />}
                items={partitionedRails.newReleases || []}
                countryCode={countryCode}
                onSeeAll={() => setActiveTab('latest')}
              />

              {/* 3. TRENDING */}
              <GeoContentRail
                title="Trending"
                eyebrow="Most Watched This Week"
                icon={<Flame className="w-3 h-3 text-rose-500" />}
                items={partitionedRails.trending || []}
                countryCode={countryCode}
                onSeeAll={() => setActiveTab('popular')}
              />

              {/* 4. POPULAR */}
              <GeoContentRail
                title="Popular"
                eyebrow="Critically Acclaimed Regional Hits"
                icon={<TrendingUp className="w-3 h-3 text-emerald-400" />}
                items={partitionedRails.popular || []}
                countryCode={countryCode}
                onSeeAll={() => setActiveTab('popular')}
              />

              {/* 5. BINGE-WORTHY SERIES */}
              <GeoContentRail
                title="Binge-worthy series"
                eyebrow="Continuous Multi-Part Storytelling"
                icon={<Tv className="w-3 h-3 text-violet-400" />}
                items={partitionedRails.series || []}
                countryCode={countryCode}
                onSeeAll={() => setActiveTab('series')}
              />

              {/* 6. NEW IN THEATRES */}
              <GeoContentRail
                title="New in theatres"
                eyebrow="Feature-Length Regional Cinema"
                icon={<Theater className="w-3 h-3 text-orange-400" />}
                items={partitionedRails.theatres || []}
                countryCode={countryCode}
                onSeeAll={() => setActiveTab('full_movies')}
              />
            </div>
          )
        )}

        {/* MODE 2: MOVIES GRID (When filtering or when tab is selected) */}
        {(isFiltered || activeTab !== 'rails') && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Film className="w-4 h-4 text-orange-400" />
                {activeTab === 'full_movies'
                  ? `Full Length ${country.name} Movies`
                  : activeTab === 'series'
                  ? `${country.name} TV Shows & Series`
                  : activeTab === 'popular'
                  ? `Popular ${country.name} Cinema`
                  : activeTab === 'latest'
                  ? `Latest ${country.name} Releases`
                  : `All ${country.name} Cinema Items`}
                <span className="text-xs font-mono text-gray-500 font-normal">({movies.length})</span>
              </h2>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveTab('rails')}
                className="text-xs text-orange-400 hover:bg-orange-500/10"
              >
                ← Back to Featured Rails
              </Button>
            </div>

            {isLoading ? (
              <MovieGridSkeleton count={12} />
            ) : movies.length === 0 ? (
              <div className="text-center py-16 bg-gray-900/30 rounded-3xl border border-gray-800/80 p-8 space-y-4">
                {renderEmptyState()}

                {isAdmin && hasApiKey && (
                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    <Button
                      size="sm"
                      onClick={handleRunDiscovery}
                      disabled={isDiscovering}
                      className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold px-4 shadow-md"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isDiscovering ? 'animate-spin' : ''}`} />
                      {isDiscovering ? 'Searching YouTube...' : `Discover ${country.name} Movies`}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <div ref={gridTopRef} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
                  {movies.map((movie) => (
                    <CountryMovieCard key={movie.id} movie={movie} countryCode={countryCode} />
                  ))}
                </div>

                {/* Pro Scalable Pagination Bar (50 items/page, Next/Previous, Ellipsis, Page Size) */}
                <div className="mt-8 pt-4 pb-2 border-t border-white/[.08] flex flex-col md:flex-row items-center justify-between gap-4">
                  {/* Results Count & Page Size Selector */}
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span>
                      Showing <strong className="text-white font-mono">{((currentPage - 1) * pageSize) + 1}</strong>–<strong className="text-white font-mono">{Math.min(currentPage * pageSize, totalFilteredCount)}</strong> of <strong className="text-orange-400 font-mono">{totalFilteredCount.toLocaleString()}</strong> titles
                    </span>
                    <div className="h-3.5 w-px bg-white/10 hidden sm:block" />
                    <div className="flex items-center gap-1.5">
                      <span className="hidden sm:inline text-[11px]">Per page:</span>
                      <Select value={String(pageSize)} onValueChange={(val) => setPageSize(Number(val))}>
                        <SelectTrigger className="w-[85px] bg-slate-950/80 border-white/10 text-xs text-white rounded-lg h-7">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-900 border-gray-800 text-white">
                          <SelectItem value="24">24 / page</SelectItem>
                          <SelectItem value="50">50 / page</SelectItem>
                          <SelectItem value="100">100 / page</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Numbered Page Navigation */}
                  <div className="flex items-center gap-1.5 flex-wrap justify-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage <= 1 || isLoading}
                      className="bg-slate-950/80 border-white/10 text-slate-300 hover:text-white hover:bg-white/[.08] rounded-lg text-xs h-7 px-2.5 disabled:opacity-30"
                    >
                      <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Prev
                    </Button>

                    {getPaginationRange().map((pageItem, idx) => {
                      if (pageItem === '...') {
                        return (
                          <span key={`dots-${idx}`} className="px-1.5 text-xs text-slate-500 font-mono select-none">
                            ...
                          </span>
                        );
                      }
                      const pageNum = Number(pageItem);
                      const isActive = pageNum === currentPage;
                      return (
                        <button
                          key={`page-${pageNum}`}
                          onClick={() => handlePageChange(pageNum)}
                          disabled={isLoading}
                          className={`min-w-[28px] h-7 px-2 rounded-lg text-xs font-mono font-medium transition-all ${
                            isActive
                              ? 'bg-orange-500 border border-orange-400 text-white font-bold shadow-sm shadow-orange-500/30'
                              : 'bg-slate-950/80 border border-white/10 text-slate-300 hover:text-white hover:border-orange-500/40 hover:bg-white/[.08]'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage >= totalPages || isLoading}
                      className="bg-slate-950/80 border-white/10 text-slate-300 hover:text-white hover:bg-white/[.08] rounded-lg text-xs h-7 px-2.5 disabled:opacity-30"
                    >
                      Next <ChevronRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </div>

                  {/* Quick Jump-to-Page Input */}
                  {totalPages > 4 && (
                    <form onSubmit={handleJumpSubmit} className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[11px] text-slate-400">Go to:</span>
                      <Input
                        type="number"
                        min={1}
                        max={totalPages}
                        placeholder={`1-${totalPages}`}
                        value={jumpPageInput}
                        onChange={(e) => setJumpPageInput(e.target.value)}
                        className="w-16 bg-slate-950/80 border-white/10 text-white text-xs h-7 px-1.5 text-center rounded-lg"
                      />
                      <Button
                        type="submit"
                        variant="outline"
                        size="sm"
                        disabled={!jumpPageInput.trim()}
                        className="bg-slate-900 border-white/10 text-slate-300 hover:text-white rounded-lg text-[11px] h-7 px-2 disabled:opacity-30"
                      >
                        Go
                      </Button>
                    </form>
                  )}
                </div>
              </>
            )}
          </section>
        )}

       
      </main>
    </div>
  );
}
