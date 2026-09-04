import { FormEvent, useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { NewsApi, NewsArticle } from '@/services/news-api';
import { MusicApi, SoundtrackTrack } from '@/services/music-api';
import { GeoContentItem } from '@/types/geo-content';
import { MediaItem } from '@/types/media';
import { HybridSearchEngine, HybridSearchResult } from '@/lib/search/hybrid-search-engine';
import { parseSearchQuery, ParsedSearchQuery } from '@/lib/search/query-parser';
import MovieCard from '@/components/MovieCard';
import CountryMovieCard from '@/components/geo/CountryMovieCard';
import SEOHead from '@/components/seo/SEOHead';
import Breadcrumbs from '@/components/Breadcrumbs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Search as SearchIcon,
  Film,
  Tv,
  Newspaper,
  Music2,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Globe,
  User,
  ShieldAlert,
  Compass,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { SearchPageSkeleton } from '@/components/ui/Skeletons';

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlQuery = searchParams.get('q')?.trim() || '';
  const [query, setQuery] = useState(urlQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(urlQuery);
  const previousUrlQuery = useRef(urlQuery);
  const [activeTab, setActiveTab] = useState<'all' | 'movies' | 'tv' | 'cinema' | 'news' | 'music'>('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Search results state
  const [searchResults, setSearchResults] = useState<HybridSearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [newsResults, setNewsResults] = useState<NewsArticle[]>([]);
  const [musicResults, setMusicResults] = useState<SoundtrackTrack[]>([]);

  // Keep in sync with URL
  useEffect(() => {
    if (previousUrlQuery.current === urlQuery) return;
    previousUrlQuery.current = urlQuery;
    setQuery(urlQuery);
    setDebouncedQuery(urlQuery);
    setCurrentPage(1);
  }, [urlQuery]);

  // Debounced search trigger
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
      if (query.trim()) {
        setSearchParams({ q: query.trim() }, { replace: true });
      } else {
        setSearchParams({}, { replace: true });
      }
      setCurrentPage(1);
    }, 300);

    return () => clearTimeout(handler);
  }, [query, setSearchParams]);

  // Execute Hybrid Multi-Stage Search
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setSearchResults(null);
      setNewsResults([]);
      setMusicResults([]);
      return;
    }

    let isMounted = true;
    setIsSearching(true);

    void Promise.all([
      HybridSearchEngine.search(debouncedQuery, currentPage),
      NewsApi.searchArticles(debouncedQuery).catch(() => []),
      MusicApi.searchMovieSoundtrack(debouncedQuery).catch(() => ({ tracks: [] })),
    ]).then(([res, news, music]) => {
      if (isMounted) {
        setSearchResults(res);
        setNewsResults(news);
        setMusicResults(music.tracks || []);
        setIsSearching(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [debouncedQuery, currentPage]);

  const rawItems = searchResults?.items || [];
  const movieItems = rawItems.filter((i) => i.mediaType === 'movie');
  const tvItems = rawItems.filter((i) => i.mediaType === 'tv');
  const geoResults = searchResults?.geoCinemaItems || [];

  const totalAllResults = rawItems.length + geoResults.length + newsResults.length + musicResults.length;
  const analysis = searchResults?.queryAnalysis;

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    const nextQuery = query.trim();
    setDebouncedQuery(nextQuery);
    setSearchParams(nextQuery ? { q: nextQuery } : {}, { replace: true });
    setCurrentPage(1);
  };

  const handleApplySuggestion = (suggestion: string) => {
    setQuery(suggestion);
    setDebouncedQuery(suggestion);
    setSearchParams({ q: suggestion }, { replace: true });
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-[#080b12] text-white">
      <SEOHead
        title={debouncedQuery ? `Search results for "${debouncedQuery}" — OrangeFlix` : 'Search Movies, Series, Cinema & Music — OrangeFlix'}
        description="Hybrid multi-stage search engine for blockbusters, regional African cinema, cast, characters, news, and soundtracks."
        noindex={!debouncedQuery}
      />

      <div className="page-wrap py-6 space-y-6">
        <Breadcrumbs items={[{ name: 'Hybrid Search 2.0', url: '/search' }]} />

        {/* Search Header and Pro Search Bar */}
        <section className="space-y-4 max-w-3xl">
          

          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Search <span className="text-orange-400">OrangeFlix Cinema</span>
          </h1>

          <form onSubmit={submitSearch} className="relative">
            <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-orange-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Search by title, character (e.g. Iron Man), actor, director, genre, or plot description..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-12 py-5 text-sm sm:text-base bg-slate-900/90 border-white/10 text-white placeholder-slate-500 rounded-2xl focus:border-orange-500 focus:ring-orange-500/20 shadow-xl"
            />
          </form>
        </section>

        {/* Query Intent & Typo Correction Feedback Banner */}
        {analysis && debouncedQuery && (
          <div className="space-y-3">
            {/* 1. Typo Correction / "Showing results for" Banner */}
            {analysis.isCorrected && analysis.correctedQuery !== analysis.normalizedQuery && (
              <div className="p-3.5 rounded-xl bg-orange-500/10 border border-orange-500/25 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-orange-400 shrink-0" />
                  <span>
                    Showing results for <strong className="text-white capitalize">{analysis.correctedQuery}</strong>
                    <span className="text-slate-400 ml-1.5">(auto-corrected from "{analysis.rawQuery}")</span>
                  </span>
                </div>
                <button
                  onClick={() => handleApplySuggestion(analysis.rawQuery)}
                  className="text-orange-400 hover:underline shrink-0 font-medium"
                >
                  Search exact "{analysis.rawQuery}"
                </button>
              </div>
            )}

            

            {/* 3. Fallback Notice if exact returned 0 and relaxed were fetched */}
            {searchResults?.isFallback && (
              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/25 flex items-center gap-2.5 text-xs text-blue-200">
                <Info className="w-4 h-4 text-blue-400 shrink-0" />
                <span>No exact matches were found for your query. Showing top trending and recommended cinema below.</span>
              </div>
            )}
          </div>
        )}

        {/* Multi-Entity Tab Bar */}
        {debouncedQuery && (
          <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-white/[.08] scrollbar-none">
            <Button
              variant={activeTab === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('all')}
              className={
                activeTab === 'all'
                  ? 'bg-orange-500 text-white rounded-lg text-xs font-semibold h-7 px-3'
                  : 'bg-slate-900 border-white/10 text-slate-300 rounded-lg text-xs h-7 px-3 hover:text-white'
              }
            >
              All Results ({totalAllResults})
            </Button>
            <Button
              variant={activeTab === 'cinema' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('cinema')}
              className={
                activeTab === 'cinema'
                  ? 'bg-orange-500 text-white rounded-lg text-xs font-semibold h-7 px-3'
                  : 'bg-slate-900 border-white/10 text-slate-300 rounded-lg text-xs h-7 px-3 hover:text-white'
              }
            >
              <Globe className="w-3 h-3 mr-1" /> African Cinema ({geoResults.length})
            </Button>
            <Button
              variant={activeTab === 'movies' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('movies')}
              className={
                activeTab === 'movies'
                  ? 'bg-orange-500 text-white rounded-lg text-xs font-semibold h-7 px-3'
                  : 'bg-slate-900 border-white/10 text-slate-300 rounded-lg text-xs h-7 px-3 hover:text-white'
              }
            >
              <Film className="w-3 h-3 mr-1" /> Movies ({movieItems.length})
            </Button>
            <Button
              variant={activeTab === 'tv' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('tv')}
              className={
                activeTab === 'tv'
                  ? 'bg-orange-500 text-white rounded-lg text-xs font-semibold h-7 px-3'
                  : 'bg-slate-900 border-white/10 text-slate-300 rounded-lg text-xs h-7 px-3 hover:text-white'
              }
            >
              <Tv className="w-3 h-3 mr-1" /> Series ({tvItems.length})
            </Button>
            {newsResults.length > 0 && (
              <Button
                variant={activeTab === 'news' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTab('news')}
                className={
                  activeTab === 'news'
                    ? 'bg-orange-500 text-white rounded-lg text-xs font-semibold h-7 px-3'
                    : 'bg-slate-900 border-white/10 text-slate-300 rounded-lg text-xs h-7 px-3 hover:text-white'
                }
              >
                <Newspaper className="w-3 h-3 mr-1" /> News ({newsResults.length})
              </Button>
            )}
            {musicResults.length > 0 && (
              <Button
                variant={activeTab === 'music' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTab('music')}
                className={
                  activeTab === 'music'
                    ? 'bg-orange-500 text-white rounded-lg text-xs font-semibold h-7 px-3'
                    : 'bg-slate-900 border-white/10 text-slate-300 rounded-lg text-xs h-7 px-3 hover:text-white'
                }
              >
                <Music2 className="w-3 h-3 mr-1" /> Soundtracks ({musicResults.length})
              </Button>
            )}
          </div>
        )}

        {/* Search Results Presentation */}
        {isSearching ? (
          <SearchPageSkeleton />
        ) : !debouncedQuery.trim() ? (
          <div className="text-center py-16 bg-slate-900/30 rounded-3xl border border-white/[.08] p-8 space-y-3 max-w-xl mx-auto">
            <SearchIcon className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-white">Start searching OrangeFlix</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Search by title, famous characters (e.g. Iron Man, Batman), actors, directors, release years, or natural plot descriptions.
            </p>
          </div>
        ) : totalAllResults === 0 ? (
          <div className="text-center py-16 bg-slate-900/30 rounded-3xl border border-white/[.08] p-8 space-y-3 max-w-xl mx-auto">
            <SearchIcon className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-white">No results found</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              We couldn't find any titles matching "{debouncedQuery}". Try checking for spelling errors or searching by another character, actor, or genre.
            </p>
          </div>
        ) : (
          <div className="space-y-10">
            {/* 1. African Cinema Section */}
            {(activeTab === 'all' || activeTab === 'cinema') && geoResults.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <Globe className="w-4 h-4 text-orange-400" />
                    African & Regional Cinema ({geoResults.length})
                  </h2>
                  {activeTab === 'all' && geoResults.length > 4 && (
                    <button
                      onClick={() => setActiveTab('cinema')}
                      className="text-xs text-orange-400 hover:underline font-semibold flex items-center gap-1"
                    >
                      View all {geoResults.length} titles <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
                  {(activeTab === 'cinema' ? geoResults : geoResults.slice(0, 8)).map((movie) => (
                    <CountryMovieCard
                      key={movie.id}
                      movie={movie}
                      countryCode={movie.country || movie.countryCode || 'RW'}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* 2. TMDB Ranked Movies & TV Shows */}
            {(activeTab === 'all' || activeTab === 'movies' || activeTab === 'tv') && rawItems.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Film className="w-4 h-4 text-orange-400" />
                  {activeTab === 'movies' ? `Movies (${movieItems.length})` : activeTab === 'tv' ? `Series (${tvItems.length})` : `Ranked Titles (${rawItems.length})`}
                </h2>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {(activeTab === 'movies' ? movieItems : activeTab === 'tv' ? tvItems : rawItems).map((item) => (
                    <MovieCard key={item.id} movie={item} />
                  ))}
                </div>
              </section>
            )}

            {/* 3. News Articles */}
            {(activeTab === 'all' || activeTab === 'news') && newsResults.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Newspaper className="w-4 h-4 text-orange-400" />
                  Related News & Industry Stories ({newsResults.length})
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {newsResults.map((article) => (
                    <Link
                      key={article.id}
                      to={`/news/${article.slug}`}
                      className="p-4 rounded-xl bg-slate-900/60 border border-white/[.08] hover:border-orange-500/30 transition flex flex-col justify-between"
                    >
                      <div>
                        <Badge className="bg-orange-500/20 text-orange-400 text-[10px] mb-2 font-bold">
                          {article.category}
                        </Badge>
                        <h4 className="font-bold text-white text-xs line-clamp-2">{article.title}</h4>
                        <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">{article.summary}</p>
                      </div>
                      <span className="text-[11px] text-orange-400 mt-3 inline-flex items-center gap-1 font-semibold">
                        Read Story <ArrowRight className="w-3 h-3" />
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* 4. Soundtracks */}
            {(activeTab === 'all' || activeTab === 'music') && musicResults.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Music2 className="w-4 h-4 text-orange-400" />
                  Soundtrack Themes & Audio Tracks ({musicResults.length})
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {musicResults.slice(0, 6).map((track) => (
                    <div
                      key={track.id}
                      className="p-2.5 rounded-xl bg-slate-900/60 border border-white/[.08] flex items-center gap-3"
                    >
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-950 shrink-0">
                        <img src={track.artworkUrl} alt={track.trackName} className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-bold text-white truncate">{track.trackName}</h4>
                        <p className="text-[11px] text-slate-400 truncate">{track.artistName}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
