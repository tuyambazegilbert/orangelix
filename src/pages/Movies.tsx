import { useState, useMemo, useEffect } from 'react';
import { useDiscoverMovies, useMovieGenres, useSearchMulti } from '@/hooks/use-tmdb';
import MovieCard from '@/components/MovieCard';
import StageSlider from '@/components/StageSlider';
import GeoCountryShowcase from '@/components/geo/GeoCountryShowcase';
import { getAllCountries } from '@/features/geo/countryConfig';
import { GeoContentService } from '@/services/geo-content-service';
import { GeoContentItem } from '@/types/geo-content';
import { MediaItem } from '@/types/media';
import { filterOutHeroItems, deduplicateList } from '@/lib/deduplication';
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
  const featuredMovies = useMemo(() => discoverData?.items?.slice(0, 6) || [], [discoverData?.items]);

  const gridItems = useMemo(() => {
    const rawItems = activeData.items;
    if (!isSearching && currentPage === 1 && featuredMovies.length > 0) {
      return filterOutHeroItems(featuredMovies, rawItems);
    }
    return deduplicateList(rawItems);
  }, [isSearching, currentPage, featuredMovies, activeData.items]);

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

        {/* Compact Pro Movies Command Deck */}
        <section className="rounded-2xl border border-white/[.08] bg-gradient-to-r from-[#0d1322]/95 via-[#111827]/90 to-[#0d1322]/95 p-3.5 sm:p-4 backdrop-blur-md shadow-[0_12px_32px_rgba(0,0,0,0.25)] space-y-3">
          {/* Top Bar: Title & Status */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-500/15 border border-orange-500/30 text-orange-400 shrink-0">
                <Film className="w-4 h-4" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-black text-white tracking-tight">
                    Explore Movies
                  </h1>
                  <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md bg-white/[.06] text-[11px] font-medium text-slate-300">
                    Blockbusters & Regional Hits
                  </span>
                </div>
              </div>
            </div>

            <span className="text-[11px] text-slate-400 font-mono px-2 py-1 rounded bg-white/[.04] border border-white/[.06] shrink-0 self-end sm:self-auto">
              Page <span className="text-orange-400 font-bold">{currentPage}</span> of {totalPages}
            </span>
          </div>

          {/* Filters & Search Row */}
          <div className="flex flex-col md:flex-row md:items-center gap-2.5 pt-1 border-t border-white/[.06]">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
              <Input
                type="search"
                placeholder="Search movies by title, actor, keyword..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-8 bg-slate-950/80 border-white/10 text-white placeholder-slate-500 rounded-lg text-xs h-8 focus:border-orange-500"
              />
            </div>

            {/* Genre Filter */}
            {!isSearching && (
              <Select value={selectedGenre} onValueChange={handleGenreChange}>
                <SelectTrigger className="w-full md:w-44 bg-slate-950/80 border-white/10 text-white rounded-lg text-xs h-8">
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
            )}

            {/* Sort Filter */}
            {!isSearching && (
              <Select value={sortBy} onValueChange={handleSortChange}>
                <SelectTrigger className="w-full md:w-40 bg-slate-950/80 border-white/10 text-white rounded-lg text-xs h-8">
                  <SlidersHorizontal className="w-3.5 h-3.5 mr-1 text-orange-400" />
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-800 text-white">
                  <SelectItem value="popularity.desc">Most Popular</SelectItem>
                  <SelectItem value="vote_average.desc">Highest Rated</SelectItem>
                  <SelectItem value="primary_release_date.desc">Release Date</SelectItem>
                  <SelectItem value="revenue.desc">Top Box Office</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </section>

        {/* Content Grid */}
        {isLoading ? (
          <MovieGridSkeleton count={18} />
        ) : gridItems.length === 0 ? (
          <div className="text-center py-20 bg-gray-900/30 rounded-3xl border border-gray-800/60 p-8 space-y-3">
            <Film className="w-12 h-12 text-gray-600 mx-auto" />
            <h3 className="text-xl font-bold text-white">No Movies Found</h3>
            <p className="text-gray-400 text-xs">
              {isSearching ? `No results found for "${searchQuery}". Try different keywords.` : 'No movies found with the selected filters.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {gridItems.map((movie) => (
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
