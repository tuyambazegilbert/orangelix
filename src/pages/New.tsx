import { useState, useMemo } from 'react';
import { useNowPlayingMovies, useOnTheAirSeries } from '@/hooks/use-tmdb';
import { useAuth } from '@/contexts/AuthContext';
import MovieCard from '@/components/MovieCard';
import StageSlider from '@/components/StageSlider';
import GeoCountryShowcase from '@/components/geo/GeoCountryShowcase';
import { getAllCountries } from '@/features/geo/countryConfig';
import { Button } from '@/components/ui/button';
import { Sparkles, Film, Tv, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function New() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'all' | 'movies' | 'tv'>('all');
  const countries = useMemo(() => getAllCountries(), []);

  const { data: nowPlayingMovies, isLoading: isMoviesLoading } = useNowPlayingMovies(1);
  const { data: onTheAirSeries, isLoading: isTvLoading } = useOnTheAirSeries(1);

  const movies = nowPlayingMovies?.items || [];
  const series = onTheAirSeries?.items || [];

  const combinedItems =
    activeTab === 'movies'
      ? movies
      : activeTab === 'tv'
      ? series
      : [...movies.slice(0, 10), ...series.slice(0, 10)].sort(
          (a, b) => (b.popularity || 0) - (a.popularity || 0)
        );

  const isLoading = isMoviesLoading || isTvLoading;
  const featured = combinedItems.slice(0, 6);

  return (
    <div className="min-h-screen bg-[#080d17] text-white overflow-x-hidden">
      {/* 3D StageSlider Hero Section */}
      {featured.length > 0 && <StageSlider items={featured} />}

      <main className="page-wrap py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-5 h-5 text-orange-400" />
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                New Releases & Premieres
              </h1>
            </div>
            <p className="text-gray-400 text-xs sm:text-sm">
              Fresh theatrical movies and currently airing TV series on TMDB & Cinema
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 bg-gray-900/80 p-1 rounded-xl border border-gray-800 self-start md:self-auto">
            <Button
              size="sm"
              variant={activeTab === 'all' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('all')}
              className={`text-xs px-3 h-8 rounded-lg ${
                activeTab === 'all' ? 'bg-orange-500 hover:bg-orange-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              All Releases
            </Button>
            <Button
              size="sm"
              variant={activeTab === 'movies' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('movies')}
              className={`text-xs px-3 h-8 rounded-lg flex items-center gap-1 ${
                activeTab === 'movies' ? 'bg-orange-500 hover:bg-orange-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Film className="w-3.5 h-3.5" /> Movies
            </Button>
            <Button
              size="sm"
              variant={activeTab === 'tv' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('tv')}
              className={`text-xs px-3 h-8 rounded-lg flex items-center gap-1 ${
                activeTab === 'tv' ? 'bg-orange-500 hover:bg-orange-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Tv className="w-3.5 h-3.5" /> TV Series
            </Button>
          </div>
        </div>

        {/* Content Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {Array.from({ length: 18 }).map((_, index) => (
              <div key={index} className="aspect-[2/3] bg-gray-900/60 border border-gray-800/80 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : combinedItems.length === 0 ? (
          <div className="text-center py-20 bg-gray-900/30 rounded-3xl border border-gray-800/60 p-8 space-y-3">
            <Calendar className="w-12 h-12 text-gray-600 mx-auto" />
            <h3 className="text-xl font-bold text-white">No New Releases Found</h3>
            <p className="text-gray-400 text-xs">Check back soon for new additions.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {combinedItems.map((item) => (
              <MovieCard key={item.id} movie={item} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
