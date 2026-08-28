import { useState } from 'react';
import { useNowPlayingMovies, useOnTheAirSeries } from '@/hooks/use-tmdb';
import { useAuth } from '@/contexts/AuthContext';
import { MovieService } from '@/lib/movies';
import MovieCard from '@/components/MovieCard';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Play, Heart, Clock, Star, Info, Film, Tv, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

export default function New() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'all' | 'movies' | 'tv'>('all');

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
  const featured = combinedItems[0];
  const remaining = combinedItems.slice(1);

  const featuredRawId = featured
    ? `${featured.mediaType === 'tv' ? 'tv-' : 'movie-'}${featured.tmdbId}`
    : '';
  const isFav = currentUser && featuredRawId ? MovieService.isFavorite(featuredRawId, currentUser.id) : false;
  const isInLater = currentUser && featuredRawId ? MovieService.isInWatchLater(featuredRawId, currentUser.id) : false;

  const toggleFavorite = () => {
    if (!currentUser || !featured) {
      toast.error('Please login to add favorites');
      return;
    }
    if (isFav) {
      MovieService.removeFromFavorites(featuredRawId, currentUser.id);
      toast.success('Removed from favorites');
    } else {
      MovieService.addToFavorites(featuredRawId, currentUser.id, {
        tmdbId: featured.tmdbId,
        mediaType: featured.mediaType,
        cachedMedia: featured,
      });
      toast.success('Added to favorites');
    }
  };

  const toggleWatchLater = () => {
    if (!currentUser || !featured) {
      toast.error('Please login to add to watch later');
      return;
    }
    if (isInLater) {
      MovieService.removeFromWatchLater(featuredRawId, currentUser.id);
      toast.success('Removed from Watch Later');
    } else {
      MovieService.addToWatchLater(featuredRawId, currentUser.id, {
        tmdbId: featured.tmdbId,
        mediaType: featured.mediaType,
        cachedMedia: featured,
      });
      toast.success('Added to Watch Later');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-orange-950/10 to-yellow-950/10 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <Sparkles className="w-8 h-8 text-orange-400" />
              <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent">
                New Releases
              </h1>
            </div>
            <p className="text-gray-400 text-lg">
              Fresh theatrical movies and currently airing TV series on TMDB
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center space-x-2 bg-gray-900/80 p-1.5 rounded-xl border border-gray-800 self-start md:self-auto">
            <Button
              size="sm"
              variant={activeTab === 'all' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('all')}
              className={activeTab === 'all' ? 'bg-orange-500 hover:bg-orange-600 text-white' : 'text-gray-400 hover:text-white'}
            >
              All Releases
            </Button>
            <Button
              size="sm"
              variant={activeTab === 'movies' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('movies')}
              className={activeTab === 'movies' ? 'bg-orange-500 hover:bg-orange-600 text-white' : 'text-gray-400 hover:text-white'}
            >
              <Film className="w-4 h-4 mr-1.5" />
              In Theaters
            </Button>
            <Button
              size="sm"
              variant={activeTab === 'tv' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('tv')}
              className={activeTab === 'tv' ? 'bg-orange-500 hover:bg-orange-600 text-white' : 'text-gray-400 hover:text-white'}
            >
              <Tv className="w-4 h-4 mr-1.5" />
              Airing on TV
            </Button>
          </div>
        </div>

        {/* Loading Spinner */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500 mb-4"></div>
            <p className="text-gray-400">Loading new releases...</p>
          </div>
        ) : combinedItems.length === 0 ? (
          <div className="text-center py-16 bg-gray-900/40 rounded-xl border border-gray-800">
            <p className="text-gray-400 text-lg">No new releases found.</p>
          </div>
        ) : (
          <>
            {/* Featured New Release */}
            {featured && (
              <Card className="bg-gradient-to-r from-emerald-950/30 via-gray-900/60 to-orange-950/30 border-emerald-500/30 mb-12 overflow-hidden backdrop-blur-sm shadow-2xl">
                <div className="flex flex-col lg:flex-row">
                  <div className="lg:w-1/3">
                    <img
                      src={featured.posterUrl || featured.imageUrl}
                      alt={featured.title}
                      className="w-full h-72 lg:h-full object-cover"
                    />
                  </div>
                  <div className="lg:w-2/3 p-6 lg:p-8 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center space-x-2 mb-3">
                        <span className="bg-emerald-500 text-white font-bold text-xs px-3 py-1 rounded-full uppercase tracking-wider">
                          Latest Release
                        </span>
                        {featured.releaseDate && (
                          <span className="text-gray-300 text-sm flex items-center">
                            <Calendar className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                            {featured.releaseDate}
                          </span>
                        )}
                      </div>

                      <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
                        {featured.title}
                      </h2>
                      <p className="text-gray-300 mb-6 line-clamp-4 leading-relaxed">
                        {featured.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-4 mb-6">
                        <div className="flex items-center space-x-1.5 bg-black/40 px-3 py-1 rounded-lg border border-yellow-500/20">
                          <Star className="w-5 h-5 text-yellow-400 fill-current" />
                          <span className="text-white font-bold">{featured.voteAverage.toFixed(1)}</span>
                          <span className="text-gray-400 text-xs">/10 ({featured.voteCount} votes)</span>
                        </div>

                        <span className="bg-orange-500/20 text-orange-400 px-3 py-1 rounded-full text-xs font-semibold">
                          {featured.mediaType === 'tv' ? 'Series' : 'Movie'}
                        </span>

                        {featured.genres.map((genre) => (
                          <span
                            key={genre}
                            className="bg-gray-800 text-gray-300 px-2.5 py-0.5 rounded-full text-xs"
                          >
                            {genre}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-800">
                      <Button
                        asChild
                        size="lg"
                        className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg"
                      >
                        <Link to={`/watch/${featured.mediaType === 'tv' ? 'tv-' : 'movie-'}${featured.tmdbId}`}>
                          <Play className="w-4 h-4 mr-2" />
                          Watch Now
                        </Link>
                      </Button>

                      <Button
                        asChild
                        variant="outline"
                        size="lg"
                        className="border-gray-700 text-white hover:bg-gray-800"
                      >
                        <Link to={`/${featured.mediaType === 'tv' ? 'series' : 'movie'}/${featured.tmdbId}`}>
                          <Info className="w-4 h-4 mr-2" />
                          Details
                        </Link>
                      </Button>

                      {currentUser && (
                        <>
                          <Button
                            variant="outline"
                            size="lg"
                            onClick={toggleFavorite}
                            className={`border-orange-500/30 text-orange-400 hover:bg-orange-500/20 ${
                              isFav ? 'bg-orange-500/20' : ''
                            }`}
                          >
                            <Heart className={`w-4 h-4 mr-2 ${isFav ? 'fill-current text-red-500' : ''}`} />
                            {isFav ? 'Favorited' : 'Add to Favorites'}
                          </Button>
                          <Button
                            variant="outline"
                            size="lg"
                            onClick={toggleWatchLater}
                            className={`border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20 ${
                              isInLater ? 'bg-yellow-500/20' : ''
                            }`}
                          >
                            <Clock className="w-4 h-4 mr-2" />
                            {isInLater ? 'In Watch Later' : 'Watch Later'}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Grid of New Releases */}
            <h2 className="text-2xl font-bold text-white mb-6">All Recent Releases</h2>
            <div className="content-grid">
              {remaining.map((item) => (
                <div key={item.id} className="relative">
                  <div className="absolute top-2 left-2 z-20 bg-emerald-500 text-white text-[11px] font-bold px-2 py-0.5 rounded shadow pointer-events-none uppercase">
                    NEW
                  </div>
                  <MovieCard movie={item} />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
