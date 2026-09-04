import { useAuth } from '@/contexts/AuthContext';
import { MovieService } from '@/lib/movies';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Play, Trash2, Heart, Film } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Movie } from '@/types';
import { MediaItem } from '@/types/media';
import { POSTER_FALLBACK } from '@/lib/tmdb/images';
import { toast } from 'sonner';
import { MovieGridSkeleton } from '@/components/ui/Skeletons';

export default function WatchLater() {
  const { currentUser, isLoading: authLoading } = useAuth();
  const [items, setItems] = useState<(MediaItem | Movie)[]>([]);
  const [loading, setLoading] = useState(true);

  const loadWatchLaterMovies = () => {
    if (!currentUser) return;

    const watchLaterList = MovieService.getWatchLater(currentUser.id);
    const legacyMovies = MovieService.getMovies();
    const result: (MediaItem | Movie)[] = [];

    watchLaterList.forEach((item) => {
      if (item.cachedMedia) {
        result.push(item.cachedMedia);
      } else {
        const found = legacyMovies.find((m) => m.id === item.movieId);
        if (found) {
          result.push(found);
        }
      }
    });

    setItems(result);
    setLoading(false);
  };

  useEffect(() => {
    if (currentUser) {
      loadWatchLaterMovies();
    }
  }, [currentUser]);

  const removeFromWatchLater = (rawId: string) => {
    if (!currentUser) return;

    const success = MovieService.removeFromWatchLater(rawId, currentUser.id);
    if (success) {
      setItems((prev) => prev.filter((item) => {
        const itemId = 'tmdbId' in item && item.tmdbId
          ? `${item.mediaType === 'tv' ? 'tv-' : 'movie-'}${item.tmdbId}`
          : item.id;
        return itemId !== rawId;
      }));
      toast.success('Removed from Watch Later');
    }
  };

  const toggleFavorite = (media: MediaItem | Movie) => {
    if (!currentUser) return;

    const isMedia = 'tmdbId' in media;
    const rawId = isMedia && media.tmdbId
      ? `${media.mediaType === 'tv' ? 'tv-' : 'movie-'}${media.tmdbId}`
      : media.id;

    const isFav = MovieService.isFavorite(rawId, currentUser.id);
    if (isFav) {
      MovieService.removeFromFavorites(rawId, currentUser.id);
      toast.success('Removed from favorites');
    } else {
      MovieService.addToFavorites(rawId, currentUser.id, {
        tmdbId: isMedia ? media.tmdbId : undefined,
        mediaType: isMedia ? media.mediaType : 'movie',
        cachedMedia: media,
      });
      toast.success('Added to favorites');
    }
    loadWatchLaterMovies();
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white page-wrap py-12 space-y-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-8 h-8 rounded-full bg-orange-500/20 animate-pulse" />
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
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-orange-950/10 to-yellow-950/10 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center space-x-3 mb-8">
          <Clock className="w-8 h-8 text-orange-400" />
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent">
            Watch Later
          </h1>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-20 bg-gray-900/30 rounded-2xl border border-gray-800">
            <Clock className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Your Watch Later queue is empty</h2>
            <p className="text-gray-400 text-sm max-w-md mx-auto mb-6">
              Browse movies and series to add them to your watch later queue for quick access anytime.
            </p>
            <div className="flex justify-center space-x-4">
              <Button asChild className="bg-orange-500 hover:bg-orange-600">
                <Link to="/movies">
                  <Film className="w-4 h-4 mr-2" />
                  Browse Catalog
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="content-grid">
            {items.map((media) => {
              const isMedia = 'tmdbId' in media;
              const isTv = isMedia ? media.mediaType === 'tv' : media.type?.toLowerCase() === 'series';
              const rawId = isMedia && media.tmdbId
                ? `${isTv ? 'tv-' : 'movie-'}${media.tmdbId}`
                : media.id;
              const watchPath = `/watch/${rawId}`;
              const detailPath = isMedia
                ? `/${isTv ? 'series' : 'movie'}/${media.tmdbId}`
                : `/${isTv ? 'series' : 'movie'}/${media.id}`;
              const isFav = MovieService.isFavorite(rawId, currentUser.id);

              return (
                <Card
                  key={media.id}
                  className="bg-gray-900/50 border-orange-500/20 backdrop-blur-sm hover:bg-gray-900/70 transition-all duration-300 group overflow-hidden flex flex-col justify-between"
                >
                  <div className="relative">
                    <Link to={detailPath} className="block overflow-hidden">
                      <img
                        src={media.imageUrl || (media as MediaItem).posterUrl || POSTER_FALLBACK}
                        alt={media.title}
                        className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </Link>

                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          asChild
                          className="bg-orange-500 hover:bg-orange-600 text-white flex-1"
                        >
                          <Link to={watchPath}>
                            <Play className="w-4 h-4 mr-1" />
                            Watch
                          </Link>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleFavorite(media)}
                          className={`border-orange-500/30 text-orange-400 hover:bg-orange-500/20 ${
                            isFav ? 'bg-orange-500/20' : ''
                          }`}
                        >
                          <Heart className={`w-4 h-4 ${isFav ? 'fill-current text-red-500' : ''}`} />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeFromWatchLater(rawId)}
                          className="border-red-500/30 text-red-400 hover:bg-red-500/20"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <CardHeader className="pb-2 pt-3 px-4">
                    <Link to={detailPath}>
                      <CardTitle className="text-white text-base line-clamp-1 hover:text-orange-400 transition-colors">
                        {media.title}
                      </CardTitle>
                    </Link>
                  </CardHeader>

                  <CardContent className="pt-0 px-4 pb-4">
                    <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                      <span className="bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full font-medium">
                        {isTv ? 'Series' : 'Movie'}
                      </span>
                      {media.releaseYear && <span>{media.releaseYear}</span>}
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-yellow-400">★ {media.rating?.toFixed(1) || 'N/A'}</span>
                      {media.duration && <span className="text-gray-400">{media.duration}min</span>}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
