import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSearchMulti } from '@/hooks/use-tmdb';
import MovieCard from '@/components/MovieCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search as SearchIcon, Film, Tv, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [activeFilter, setActiveFilter] = useState<'all' | 'movie' | 'tv'>('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Sync debounced query and URL search params
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

  const { data: searchData, isLoading, error } = useSearchMulti(debouncedQuery, currentPage);

  const rawItems = searchData?.items || [];
  const filteredItems =
    activeFilter === 'all'
      ? rawItems
      : rawItems.filter((item) => item.mediaType === activeFilter);

  const totalPages = Math.min(searchData?.totalPages || 1, 500);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="page-wrap">
        {/* Search Header and Bar */}
        <div className="mb-8 space-y-4">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent flex items-center">
            <SearchIcon className="w-8 h-8 mr-3 text-orange-400" />
            Search Catalog
          </h1>

          <div className="relative max-w-2xl">
            <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-orange-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Search for movies, TV series, actors..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-12 py-6 text-lg bg-gray-900 border-gray-700 text-white placeholder-gray-500 rounded-xl focus:border-orange-500 focus:ring-orange-500/20"
            />
          </div>

          {/* Media Type Filter Pills */}
          {debouncedQuery.trim().length > 0 && (
            <div className="flex items-center space-x-2 pt-2">
              <Button
                size="sm"
                variant={activeFilter === 'all' ? 'default' : 'outline'}
                onClick={() => setActiveFilter('all')}
                className={activeFilter === 'all' ? 'bg-orange-500 hover:bg-orange-600' : 'border-gray-700 text-gray-300'}
              >
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                All ({rawItems.length})
              </Button>
              <Button
                size="sm"
                variant={activeFilter === 'movie' ? 'default' : 'outline'}
                onClick={() => setActiveFilter('movie')}
                className={activeFilter === 'movie' ? 'bg-orange-500 hover:bg-orange-600' : 'border-gray-700 text-gray-300'}
              >
                <Film className="w-3.5 h-3.5 mr-1.5" />
                Movies ({rawItems.filter((i) => i.mediaType === 'movie').length})
              </Button>
              <Button
                size="sm"
                variant={activeFilter === 'tv' ? 'default' : 'outline'}
                onClick={() => setActiveFilter('tv')}
                className={activeFilter === 'tv' ? 'bg-orange-500 hover:bg-orange-600' : 'border-gray-700 text-gray-300'}
              >
                <Tv className="w-3.5 h-3.5 mr-1.5" />
                Series ({rawItems.filter((i) => i.mediaType === 'tv').length})
              </Button>
            </div>
          )}
        </div>

        {/* Results Info */}
        {debouncedQuery.trim().length > 0 && (
          <div className="flex items-center justify-between mb-6 text-sm text-gray-400">
            <p>
              Showing {filteredItems.length} result{filteredItems.length !== 1 ? 's' : ''} for{' '}
              <span className="text-white font-semibold">"{debouncedQuery}"</span>
            </p>
            {totalPages > 1 && <span>Page {currentPage} of {totalPages}</span>}
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="content-grid">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-80 bg-gray-900 rounded-xl animate-pulse" />
            ))}
          </div>
        )}

        {/* Results Grid */}
        {!isLoading && filteredItems.length > 0 && (
          <div className="content-grid">
            {filteredItems.map((item) => (
              <MovieCard key={item.id} movie={item} />
            ))}
          </div>
        )}

        {/* Empty States */}
        {!isLoading && debouncedQuery.trim().length > 0 && filteredItems.length === 0 && (
          <div className="text-center py-16 bg-gray-900/30 rounded-xl border border-gray-800">
            <SearchIcon className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-white text-lg font-semibold mb-1">
              No results found for "{debouncedQuery}"
            </p>
            <p className="text-gray-400 text-sm max-w-md mx-auto">
              Please double check your spelling or try searching for a different movie, TV show, or actor.
            </p>
          </div>
        )}

        {!isLoading && debouncedQuery.trim().length === 0 && (
          <div className="text-center py-20 bg-gray-900/20 rounded-xl border border-dashed border-gray-800">
            <SearchIcon className="w-16 h-16 text-orange-400/40 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Search OrangeFlix</h2>
            <p className="text-gray-400 text-sm max-w-md mx-auto">
              Type in any title above to instantly search through hundreds of thousands of movies and TV shows.
            </p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && filteredItems.length > 0 && (
          <div className="flex items-center justify-center space-x-4 mt-12">
            <Button
              variant="outline"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1 || isLoading}
              className="border-gray-700 text-white hover:bg-gray-800 disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            <span className="text-sm text-gray-400 font-medium px-2">
              Page {currentPage} of {totalPages}
            </span>

            <Button
              variant="outline"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages || isLoading}
              className="border-gray-700 text-white hover:bg-gray-800 disabled:opacity-30"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
