import { FormEvent, useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useSearchMulti } from '@/hooks/use-tmdb';
import { NewsApi, NewsArticle } from '@/services/news-api';
import { MusicApi, SoundtrackTrack } from '@/services/music-api';
import { GeoContentService } from '@/services/geo-content-service';
import { GeoContentItem } from '@/types/geo-content';
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
  Play,
  ArrowRight,
  Globe,
} from 'lucide-react';

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlQuery = searchParams.get('q')?.trim() || '';
  const [query, setQuery] = useState(urlQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(urlQuery);
  const previousUrlQuery = useRef(urlQuery);
  const [activeTab, setActiveTab] = useState<'all' | 'movies' | 'tv' | 'cinema' | 'news' | 'music'>('all');
  const [currentPage, setCurrentPage] = useState(1);

  // External & Geo search results
  const [newsResults, setNewsResults] = useState<NewsArticle[]>([]);
  const [musicResults, setMusicResults] = useState<SoundtrackTrack[]>([]);
  const [geoResults, setGeoResults] = useState<GeoContentItem[]>([]);
  const [isGeoLoading, setIsGeoLoading] = useState(false);

  // A header search can navigate to this same route with a different `q` value.
  // Keep the mounted page in sync with the URL before its local debounce runs.
  useEffect(() => {
    if (previousUrlQuery.current === urlQuery) return;
    previousUrlQuery.current = urlQuery;
    setQuery(urlQuery);
    setDebouncedQuery(urlQuery);
    setCurrentPage(1);
  }, [urlQuery]);

  // Update the address and results after the user pauses typing in this page's input.
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
      if (query.trim()) {
        setSearchParams({ q: query.trim() }, { replace: true });
      } else {
        setSearchParams({}, { replace: true });
      }
      setCurrentPage(1);
    }, 350);

    return () => clearTimeout(handler);
  }, [query, setSearchParams]);

  // TMDB Multi Search
  const { data: searchData, isLoading } = useSearchMulti(debouncedQuery, currentPage);

  // Search Geo Cinema, News and Music when query changes
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setNewsResults([]);
      setMusicResults([]);
      setGeoResults([]);
      return;
    }

    let current = true;
    setIsGeoLoading(true);

    void GeoContentService.searchAllCinematicMovies(debouncedQuery, 40)
      .then((results) => {
        if (current) {
          setGeoResults(results);
          setIsGeoLoading(false);
        }
      })
      .catch(() => {
        if (current) setIsGeoLoading(false);
      });

    void NewsApi.searchArticles(debouncedQuery).then((results) => {
      if (current) setNewsResults(results);
    });
    void MusicApi.searchMovieSoundtrack(debouncedQuery).then((res) => {
      if (current) setMusicResults(res.tracks);
    });
    return () => { current = false; };
  }, [debouncedQuery]);

  const rawItems = searchData?.items || [];
  const movieItems = rawItems.filter((i) => i.mediaType === 'movie');
  const tvItems = rawItems.filter((i) => i.mediaType === 'tv');

  const totalPages = Math.min(searchData?.totalPages || 1, 500);
  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    const nextQuery = query.trim();
    setDebouncedQuery(nextQuery);
    setSearchParams(nextQuery ? { q: nextQuery } : {}, { replace: true });
    setCurrentPage(1);
  };

  const totalAllResults = rawItems.length + geoResults.length + newsResults.length + musicResults.length;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <SEOHead
        title={debouncedQuery ? `Search results for "${debouncedQuery}"` : 'Search Movies, Series, Cinema & Music'}
        description="Search across our complete catalog of films, television series, African & global cinema, entertainment news, and soundtrack scores."
        noindex={!debouncedQuery}
      />

      <div className="page-wrap py-8">
        <Breadcrumbs items={[{ name: 'Search 2.0', url: '/search' }]} />

        {/* Search Header and Bar */}
        <div className="mb-8 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Search 2.0 Multi-Entity Engine</span>
          </div>

          <h1 className="text-3xl md:text-4xl font-extrabold text-white">
            Search <span className="text-orange-400">OrangeFlix</span>
          </h1>

          <form onSubmit={submitSearch} className="relative max-w-2xl">
            <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-orange-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Search for movies, African cinema, series, news, soundtracks..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-12 py-6 text-base bg-gray-900 border-gray-700 text-white placeholder-gray-500 rounded-2xl focus:border-orange-500 focus:ring-orange-500/20"
            />
          </form>
        </div>

        {/* Multi-Entity Tab Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-8 border-b border-white/[.07] scrollbar-hide">
          <Button
            variant={activeTab === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('all')}
            className={activeTab === 'all' ? 'bg-orange-500 text-white rounded-full text-xs font-semibold' : 'border-white/10 text-slate-300 rounded-full text-xs'}
          >
            All Results ({totalAllResults})
          </Button>
          <Button
            variant={activeTab === 'cinema' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('cinema')}
            className={activeTab === 'cinema' ? 'bg-orange-500 text-white rounded-full text-xs font-semibold' : 'border-white/10 text-slate-300 rounded-full text-xs'}
          >
            <Globe className="w-3.5 h-3.5 mr-1" /> Geo Cinema ({geoResults.length})
          </Button>
          <Button
            variant={activeTab === 'movies' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('movies')}
            className={activeTab === 'movies' ? 'bg-orange-500 text-white rounded-full text-xs font-semibold' : 'border-white/10 text-slate-300 rounded-full text-xs'}
          >
            <Film className="w-3.5 h-3.5 mr-1" /> Movies ({movieItems.length})
          </Button>
          <Button
            variant={activeTab === 'tv' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('tv')}
            className={activeTab === 'tv' ? 'bg-orange-500 text-white rounded-full text-xs font-semibold' : 'border-white/10 text-slate-300 rounded-full text-xs'}
          >
            <Tv className="w-3.5 h-3.5 mr-1" /> Series ({tvItems.length})
          </Button>
          <Button
            variant={activeTab === 'news' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('news')}
            className={activeTab === 'news' ? 'bg-orange-500 text-white rounded-full text-xs font-semibold' : 'border-white/10 text-slate-300 rounded-full text-xs'}
          >
            <Newspaper className="w-3.5 h-3.5 mr-1" /> News ({newsResults.length})
          </Button>
          <Button
            variant={activeTab === 'music' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('music')}
            className={activeTab === 'music' ? 'bg-orange-500 text-white rounded-full text-xs font-semibold' : 'border-white/10 text-slate-300 rounded-full text-xs'}
          >
            <Music2 className="w-3.5 h-3.5 mr-1" /> Soundtracks ({musicResults.length})
          </Button>
        </div>

        {/* Content Presentation */}
        {isLoading && isGeoLoading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-3" />
            <p className="text-xs text-slate-400">Searching global catalog...</p>
          </div>
        ) : !debouncedQuery.trim() ? (
          <div className="text-center py-20 bg-gray-900/30 rounded-3xl border border-gray-800">
            <SearchIcon className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white">Start searching OrangeFlix</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              Type any movie title, African cinema title, series name, director, news story, or soundtrack album.
            </p>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Geo Cinema Section */}
            {(activeTab === 'all' || activeTab === 'cinema') && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Globe className="w-5 h-5 text-orange-400" />
                    African & Global Geo Cinema ({geoResults.length})
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

                {geoResults.length === 0 ? (
                  activeTab === 'cinema' ? (
                    <div className="p-8 text-center bg-gray-900/40 rounded-2xl border border-gray-800">
                      <p className="text-xs text-slate-400">No geo cinema matching "{debouncedQuery}".</p>
                    </div>
                  ) : null
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                    {(activeTab === 'cinema' ? geoResults : geoResults.slice(0, 8)).map((movie) => (
                      <CountryMovieCard
                        key={movie.id}
                        movie={movie}
                        countryCode={movie.country || movie.countryCode || 'RW'}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TMDB Movies & Series Grid */}
            {(activeTab === 'all' || activeTab === 'movies' || activeTab === 'tv') && (
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                  <Film className="w-5 h-5 text-orange-400" />
                  Movies & Television
                </h2>
                {rawItems.length === 0 ? (
                  <p className="text-xs text-slate-500">No films or series matching this query.</p>
                ) : (
                  <div className="content-grid">
                    {(activeTab === 'movies' ? movieItems : activeTab === 'tv' ? tvItems : rawItems).map((item) => (
                      <MovieCard key={item.id} movie={item} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* News Articles Section */}
            {(activeTab === 'all' || activeTab === 'news') && newsResults.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                  <Newspaper className="w-5 h-5 text-orange-400" />
                  Related News & Industry Stories ({newsResults.length})
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {newsResults.map((article) => (
                    <Link
                      key={article.id}
                      to={`/news/${article.slug}`}
                      className="p-4 rounded-2xl bg-gray-900/60 border border-white/[.08] hover:border-orange-500/30 transition flex flex-col justify-between"
                    >
                      <div>
                        <Badge className="bg-orange-500/20 text-orange-400 text-[10px] mb-2 font-bold">
                          {article.category}
                        </Badge>
                        <h4 className="font-bold text-white text-sm line-clamp-2">{article.title}</h4>
                        <p className="text-xs text-slate-400 line-clamp-2 mt-1">{article.summary}</p>
                      </div>
                      <span className="text-[11px] text-orange-400 mt-3 inline-flex items-center gap-1 font-semibold">
                        Read Story <ArrowRight className="w-3 h-3" />
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Soundtracks Section */}
            {(activeTab === 'all' || activeTab === 'music') && musicResults.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                  <Music2 className="w-5 h-5 text-orange-400" />
                  Soundtrack Themes & Audio Tracks ({musicResults.length})
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {musicResults.slice(0, 6).map((track) => (
                    <div
                      key={track.id}
                      className="p-3 rounded-xl bg-gray-900/60 border border-white/[.08] flex items-center gap-3"
                    >
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-950 shrink-0">
                        <img src={track.artworkUrl} alt={track.trackName} className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-bold text-white truncate">{track.trackName}</h4>
                        <p className="text-[11px] text-slate-400 truncate">{track.artistName}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pagination for Movies/TV */}
            {(activeTab === 'all' || activeTab === 'movies' || activeTab === 'tv') && rawItems.length > 0 && (
              <div className="flex items-center justify-center gap-3 pt-6 border-t border-white/[.07]">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  className="border-white/10 text-slate-300"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                </Button>
                <span className="text-xs font-mono text-slate-400">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="border-white/10 text-slate-300"
                >
                  Next <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
