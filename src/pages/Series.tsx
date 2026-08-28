import { useState } from 'react';
import { useDiscoverSeries, useTvGenres, useSearchMulti } from '@/hooks/use-tmdb';
import MovieCard from '@/components/MovieCard';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, ChevronLeft, ChevronRight, Tv, SlidersHorizontal } from 'lucide-react';

export default function Series() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [sortBy, setSortBy] = useState('popularity.desc');
  const [currentPage, setCurrentPage] = useState(1);

  const { data: genresData } = useTvGenres();

  const isSearching = searchQuery.trim().length > 0;
  const { data: searchData, isLoading: isSearchLoading } = useSearchMulti(searchQuery, currentPage);

  const { data: discoverData, isLoading: isDiscoverLoading } = useDiscoverSeries({
    with_genres: selectedGenre !== 'all' ? selectedGenre : undefined,
    sort_by: sortBy,
    page: currentPage,
  });

  const activeData = isSearching
    ? {
        items: searchData?.items.filter((item) => item.mediaType === 'tv') || [],
        totalPages: searchData?.totalPages || 1,
        totalResults: searchData?.totalResults || 0,
      }
    : {
        items: discoverData?.items || [],
        totalPages: discoverData?.totalPages || 1,
        totalResults: discoverData?.totalResults || 0,
      };

  const isLoading = isSearching ? isSearchLoading : isDiscoverLoading;
  const totalPages = Math.min(activeData.totalPages, 500);

  const handleGenreChange = (genreId: string) => {
    setSelectedGenre(genreId);
    setCurrentPage(1);
  };

  const handleSortChange = (sort: string) => {
    setSortBy(sort);
    setCurrentPage(1);
  };

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="page-wrap">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent flex items-center">
              <Tv className="w-8 h-8 mr-3 text-orange-400" />
              TV Series
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Stream and discover top TV shows, seasons, and episodes from TMDB
            </p>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="glass p-4 rounded-xl mb-8 space-y-4 md:space-y-0 md:flex md:items-center md:gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search TV series by title or keyword..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10 bg-gray-950 border-gray-700 text-white placeholder-gray-500"
            />
          </div>

          {/* Genre Filter */}
          {!isSearching && (
            <div className="flex items-center space-x-2">
              <Select value={selectedGenre} onValueChange={handleGenreChange}>
                <SelectTrigger className="w-full md:w-48 bg-gray-950 border-gray-700 text-white">
                  <SelectValue placeholder="All Genres" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-700 text-white max-h-72">
                  <SelectItem value="all">All Genres</SelectItem>
                  {genresData?.list.map((genre) => (
                    <SelectItem key={genre.id} value={genre.id.toString()}>
                      {genre.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Sort Filter */}
          {!isSearching && (
            <div className="flex items-center space-x-2">
              <SlidersHorizontal className="w-4 h-4 text-orange-400 hidden lg:block" />
              <Select value={sortBy} onValueChange={handleSortChange}>
                <SelectTrigger className="w-full md:w-48 bg-gray-950 border-gray-700 text-white">
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-700 text-white">
                  <SelectItem value="popularity.desc">Most Popular</SelectItem>
                  <SelectItem value="vote_average.desc">Highest Rated</SelectItem>
                  <SelectItem value="first_air_date.desc">First Aired (Newest)</SelectItem>
                  <SelectItem value="first_air_date.asc">First Aired (Oldest)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Results Info */}
        <div className="flex items-center justify-between mb-6 text-sm text-gray-400">
          <span>
            {isSearching ? `Search results for "${searchQuery}"` : 'Discovering TV Series'}
          </span>
          <span>Page {currentPage} of {totalPages}</span>
        </div>

        {/* Series Grid */}
        {isLoading ? (
          <div className="content-grid">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-80 bg-gray-900 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : activeData.items.length > 0 ? (
          <div className="content-grid">
            {activeData.items.map((show) => (
              <MovieCard key={show.id} movie={show} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-gray-900/30 rounded-xl border border-gray-800">
            <Tv className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-white text-lg font-semibold mb-1">No TV series found</p>
            <p className="text-gray-400 text-sm">
              Try adjusting your search query, genre, or filter criteria.
            </p>
          </div>
        )}

        {/* Pagination Navigation */}
        {totalPages > 1 && (
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
