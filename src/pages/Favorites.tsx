import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import { MovieService } from '@/lib/movies';
import MovieCard from '@/components/MovieCard';
import { Button } from '@/components/ui/button';
import { Heart, Film } from 'lucide-react';
import { MediaItem } from '@/types/media';
import { Movie } from '@/types';
import { MovieGridSkeleton } from '@/components/ui/Skeletons';

export default function Favorites() {
  const { currentUser, isLoading } = useAuth();
  const [favoriteList, setFavoriteList] = useState<(MediaItem | Movie)[]>([]);

  const loadFavorites = () => {
    if (!currentUser) return;
    const favorites = MovieService.getFavorites(currentUser.id);
    const legacyMovies = MovieService.getMovies();

    const items: (MediaItem | Movie)[] = [];

    favorites.forEach((fav) => {
      if (fav.cachedMedia) {
        items.push(fav.cachedMedia);
      } else {
        const found = legacyMovies.find((m) => m.id === fav.movieId);
        if (found) {
          items.push(found);
        }
      }
    });

    setFavoriteList(items);
  };

  useEffect(() => {
    if (currentUser) {
      loadFavorites();
    }
  }, [currentUser]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white page-wrap py-12 space-y-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-8 h-8 rounded-full bg-red-500/20 animate-pulse" />
          <div className="h-8 w-48 bg-white/20 rounded-xl animate-pulse" />
        </div>
        <MovieGridSkeleton count={12} />
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="page-wrap">
        <div className="flex items-center space-x-3 mb-8">
          <Heart className="w-8 h-8 text-red-500 fill-current" />
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent">
            My Favorites
          </h1>
        </div>

        {favoriteList.length > 0 ? (
          <div className="content-grid">
            {favoriteList.map((media) => (
              <MovieCard
                key={media.id}
                movie={media}
                onFavoriteChange={loadFavorites}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-gray-900/30 rounded-2xl border border-gray-800">
            <Heart className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">No favorites yet</h2>
            <p className="text-gray-400 text-sm max-w-md mx-auto mb-6">
              Browse movies and series across OrangeFlix and click the heart icon on any card to save your favorite titles here.
            </p>
            <div className="flex justify-center space-x-4">
              <Button asChild className="bg-orange-500 hover:bg-orange-600">
                <Link to="/movies">
                  <Film className="w-4 h-4 mr-2" />
                  Explore Movies
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
