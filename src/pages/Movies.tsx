import { useState, useMemo, useEffect } from 'react';
import { useDiscoverMovies, useMovieGenres, useSearchMulti } from '@/hooks/use-tmdb';
import MovieCard from '@/components/MovieCard';
import StageSlider from '@/components/StageSlider';
import GeoCountryShowcase from '@/components/geo/GeoCountryShowcase';
import { getAllCountries } from '@/features/geo/countryConfig';
import { GeoContentService } from '@/services/geo-content-service';
import { GeoContentItem } from '@/types/geo-content';
import { MediaItem } from '@/types/media';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, ChevronLeft, ChevronRight, Film, SlidersHorizontal, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { HeroSkeleton, MovieGridSkeleton } from '@/components/ui/Skeletons';

const normalizeRegionalTitle = (title?: string) => {
  const cleaned = (title || 'Regional Cinema').replace(/\s+/g, ' ').trim();
  const words = cleaned.split(' ').filter(Boolean);

  if (words.length <= 3) {
    return cleaned;
  }

  return words.slice(0, 3).join(' ');
};

export default function Movies() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [sortBy, setSortBy] = useState('popularity.desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTerritory, setSelectedTerritory] = useState('RW');
  const [geoMovies, setGeoMovies] = useState<GeoContentItem[]>([]);

  const { data: genresData } = useMovieGenres();
  const countries = useMemo(() => getAllCountries(), []);

  const mapGeoToMediaItem = (movie: GeoContentItem): MediaItem => {
    const score = Number(movie.score || movie.classificationScore || 0);
    const rating = Math.min(5, Number((score / 20).toFixed(1)) || 0);
    const normalizedGenres = (movie.tags || []).slice(0, 3);
    const title = normalizeRegionalTitle(movie.title);

    const countryCode = (movie.country || movie.countryCode || 'RW').toUpperCase();
    const countryName = countries.find((c) => c.countryCode.toUpperCase() === countryCode)?.name || countryCode;

    return {
      id: `geo-${movie.id || movie.youtubeVideoId}`,
      tmdbId: Number((movie.youtubeVideoId || '').replace(/\D/g, '')) || 0,
      mediaType: 'movie',
      title,
      description: movie.description || 'Regional cinema discovery',
      posterUrl: movie.thumbnailUrl || movie.thumbnail || '',
      backdropUrl: null,
      imageUrl: movie.thumbnailUrl || movie.thumbnail || '',
      rating,
      voteAverage: score,
      voteCount: Number(movie.views || movie.viewCount || 0),
      releaseDate: movie.publishedAt || null,
      releaseYear: movie.publishedAt ? new Date(movie.publishedAt).getFullYear() : null,
      genres: normalizedGenres.length > 0 ? normalizedGenres : ['Regional'],
      duration: Math.round((movie.durationSeconds || 0) / 60),
      popularity: Number(movie.views || movie.viewCount || 0),
      _countryLabel: countryName,
    } as MediaItem & { _countryLabel?: string };
  };

  // If search query is present, use multi-search filtered to movies
  const isSearching = searchQuery.trim().length > 0;
  const { data: searchData, isLoading: isSearchLoading } = useSearchMulti(searchQuery, currentPage);

  // Discover movies query
  const { data: discoverData, isLoading: isDiscoverLoading } = useDiscoverMovies({
    with_genres: selectedGenre !== 'all' ? selectedGenre : undefined,
    sort_by: sortBy,
    page: currentPage,
  });

  const geoCatalogItems = useMemo(() => geoMovies.map(mapGeoToMediaItem), [geoMovies]);

  const activeData = useMemo(() => {
    const baseItems = isSearching
      ? (searchData?.items.filter((item) => item.mediaType === 'movie') || [])
      : (discoverData?.items || []);

    const mergedMap = new Map<string, MediaItem>();
    baseItems.forEach((item) => mergedMap.set(item.id, item));
    geoCatalogItems.forEach((item) => mergedMap.set(item.id, item));

    return {
      items: Array.from(mergedMap.values()),
      totalPages: isSearching ? (searchData?.totalPages || 1) : (discoverData?.totalPages || 1),
      totalResults: isSearching ? (searchData?.totalResults || 0) : (discoverData?.totalResults || 0),
    };
  }, [isSearching, searchData, discoverData, geoCatalogItems]);

  const isLoading = isSearching ? isSearchLoading : isDiscoverLoading;
  const totalPages = Math.min(activeData.totalPages, 500);

  // Top 6 featured items for the 3D Stage Slider Hero
  const featuredMovies = discoverData?.items?.slice(0, 6) || [];

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

  useEffect(() => {
    let isMounted = true;

    const loadGeoMovies = async () => {
      const items = await GeoContentService.getRecommendations(selectedTerritory, 8);
      if (isMounted) {
        setGeoMovies(items);
      }
    };

    void loadGeoMovies();
    return () => {
      isMounted = false;
    };
  }, [selectedTerritory]);

  return (
    <div className="min-h-screen bg-[#080d17] text-white overflow-x-hidden">
      {/* 3D StageSlider Hero Section */}
      {!isSearching && (
        isDiscoverLoading ? (
          <HeroSkeleton />
        ) : featuredMovies.length > 0 ? (
          <StageSlider items={featuredMovies} />
        ) : null
      )}

      <main className="page-wrap py-6 space-y-6">
        <GeoCountryShowcase
          currentCountryCode={selectedTerritory}
          countries={countries}
          onSelectCountry={(code) => setSelectedTerritory(code.toUpperCase())}
        />

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5 tracking-tight">
              <Film className="w-7 h-7 text-orange-400" />
              Explore All Movies
            </h1>
            <p className="text-gray-400 text-xs sm:text-sm mt-0.5">
              Browse top-rated blockbusters, regional hits, and trending movies from TMDB & Cinema
            </p>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="p-4 rounded-2xl bg-gray-900/50 border border-gray-800/80 space-y-4 md:space-y-0 md:flex md:items-center md:gap-4 shadow-xl">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="search"
              placeholder="Search movies by title, actor, keyword..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10 bg-gray-950 border-gray-800 text-white placeholder-gray-500 rounded-xl text-xs h-10 focus:border-orange-500"
            />
          </div>

          {/* Genre Filter */}
          {!isSearching && (
            <div className="flex items-center space-x-2">
              <Select value={selectedGenre} onValueChange={handleGenreChange}>
                <SelectTrigger className="w-full md:w-48 bg-gray-950 border-gray-800 text-white rounded-xl text-xs h-10">
                  <SelectValue placeholder="All Genres" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-800 text-white max-h-72">
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
              <Select value={sortBy} onValueChange={handleSortChange}>
                <SelectTrigger className="w-full md:w-48 bg-gray-950 border-gray-800 text-white rounded-xl text-xs h-10">
                  <SlidersHorizontal className="w-3.5 h-3.5 mr-1.5 text-orange-400" />
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-800 text-white">
                  <SelectItem value="popularity.desc">Most Popular</SelectItem>
                  <SelectItem value="vote_average.desc">Highest Rated</SelectItem>
                  <SelectItem value="primary_release_date.desc">Release Date</SelectItem>
                  <SelectItem value="revenue.desc">Top Box Office</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Content Grid */}
        {isLoading ? (
          <MovieGridSkeleton count={18} />
        ) : activeData.items.length === 0 ? (
          <div className="text-center py-20 bg-gray-900/30 rounded-3xl border border-gray-800/60 p-8 space-y-3">
            <Film className="w-12 h-12 text-gray-600 mx-auto" />
            <h3 className="text-xl font-bold text-white">No Movies Found</h3>
            <p className="text-gray-400 text-xs">
              {isSearching ? `No results found for "${searchQuery}". Try different keywords.` : 'No movies found with the selected filters.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {activeData.items.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <div className="flex justify-center items-center space-x-4 py-8">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="bg-gray-900 border-gray-800 text-white hover:bg-gray-800 disabled:opacity-40 rounded-xl text-xs h-9 px-4"
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Previous
            </Button>
            <span className="text-xs text-gray-400 font-mono">
              Page <span className="text-orange-400 font-bold">{currentPage}</span> of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="bg-gray-900 border-gray-800 text-white hover:bg-gray-800 disabled:opacity-40 rounded-xl text-xs h-9 px-4"
            >
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
