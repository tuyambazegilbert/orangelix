import { useParams, Link } from 'react-router-dom';
import { useMovieDetails } from '@/hooks/use-tmdb';
import { useAuth } from '@/contexts/AuthContext';
import { MovieService } from '@/lib/movies';
import MovieCard from '@/components/MovieCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Play,
  Heart,
  Clock,
  Star,
  ArrowLeft,
  Calendar,
  Film,
  Users,
  Tv,
} from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';

export default function MovieDetail() {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useAuth();
  const movieId = id ? parseInt(id, 10) : undefined;
  const { data: movie, isLoading, error } = useMovieDetails(movieId);
  const [showTrailer, setShowTrailer] = useState(false);

  const rawId = movieId ? `movie-${movieId}` : '';
  const isFav = currentUser && rawId ? MovieService.isFavorite(rawId, currentUser.id) : false;
  const isInLater = currentUser && rawId ? MovieService.isInWatchLater(rawId, currentUser.id) : false;

  const toggleFavorite = () => {
    if (!currentUser || !movie) {
      toast.error('Please login to add favorites');
      return;
    }

    if (isFav) {
      MovieService.removeFromFavorites(rawId, currentUser.id);
      toast.success('Removed from favorites');
    } else {
      MovieService.addToFavorites(rawId, currentUser.id, {
        tmdbId: movie.tmdbId,
        mediaType: 'movie',
        cachedMedia: movie,
      });
      toast.success('Added to favorites');
    }
  };

  const toggleWatchLater = () => {
    if (!currentUser || !movie) {
      toast.error('Please login to add to watch later');
      return;
    }

    if (isInLater) {
      MovieService.removeFromWatchLater(rawId, currentUser.id);
      toast.success('Removed from Watch Later');
    } else {
      MovieService.addToWatchLater(rawId, currentUser.id, {
        tmdbId: movie.tmdbId,
        mediaType: 'movie',
        cachedMedia: movie,
      });
      toast.success('Added to Watch Later');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500 mb-4"></div>
        <p className="text-gray-400">Loading movie details...</p>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4">
        <div className="text-center max-w-md">
          <Film className="w-16 h-16 text-orange-500/50 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Movie Not Found</h1>
          <p className="text-gray-400 mb-6">
            {error instanceof Error ? error.message : 'The requested movie could not be loaded.'}
          </p>
          <Button asChild className="bg-orange-500 hover:bg-orange-600">
            <Link to="/movies">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Movies
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Hero Backdrop Banner */}
      <div className="relative h-[65vh] md:h-[75vh] w-full overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 scale-105"
          style={{
            backgroundImage: `url(${movie.backdropUrl || movie.posterUrl})`,
            filter: 'brightness(0.35)',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-gray-950 via-gray-950/80 to-transparent" />

        <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-between py-6">
          {/* Back button */}
          <div>
            <Button
              variant="ghost"
              asChild
              className="text-gray-300 hover:text-white hover:bg-black/40 backdrop-blur-sm"
            >
              <Link to="/movies">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Movies
              </Link>
            </Button>
          </div>

          {/* Hero Content */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-end mb-8">
            {/* Poster Card */}
            <div className="hidden md:block md:col-span-1">
              <img
                src={movie.imageUrl}
                alt={movie.title}
                className="w-full rounded-xl shadow-2xl border border-orange-500/20 object-cover"
              />
            </div>

            {/* Meta Info */}
            <div className="md:col-span-3 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white font-semibold">
                  Movie
                </Badge>
                {movie.status && (
                  <Badge variant="outline" className="border-gray-600 text-gray-300">
                    {movie.status}
                  </Badge>
                )}
                {movie.releaseYear && (
                  <span className="text-gray-300 text-sm flex items-center">
                    <Calendar className="w-4 h-4 mr-1 text-orange-400" />
                    {movie.releaseDate || movie.releaseYear}
                  </span>
                )}
                {movie.duration && (
                  <span className="text-gray-300 text-sm flex items-center">
                    <Clock className="w-4 h-4 mr-1 text-orange-400" />
                    {movie.duration} min
                  </span>
                )}
              </div>

              <h1 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
                {movie.title}
              </h1>

              {movie.tagline && (
                <p className="text-orange-400/90 italic text-lg font-medium">"{movie.tagline}"</p>
              )}

              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-1 bg-black/50 px-3 py-1.5 rounded-lg border border-yellow-500/30">
                  <Star className="w-5 h-5 text-yellow-400 fill-current" />
                  <span className="text-white font-bold text-lg">{movie.voteAverage.toFixed(1)}</span>
                  <span className="text-gray-400 text-xs">/10 ({movie.voteCount} votes)</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {movie.genres.map((genre) => (
                  <span
                    key={genre}
                    className="bg-gray-800/80 backdrop-blur-sm text-gray-200 px-3 py-1 rounded-full text-xs border border-gray-700"
                  >
                    {genre}
                  </span>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 pt-2">
                <Button
                  asChild
                  size="lg"
                  className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white shadow-lg hover:shadow-orange-500/50 transform hover:scale-105 transition-all duration-300"
                >
                  <Link to={`/watch/movie-${movie.tmdbId}`}>
                    <Play className="w-5 h-5 mr-2" />
                    Watch Now
                  </Link>
                </Button>

                {movie.trailerKey && (
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => setShowTrailer(!showTrailer)}
                    className="border-orange-500/30 text-orange-400 hover:bg-orange-500/20 backdrop-blur-sm"
                  >
                    <Tv className="w-5 h-5 mr-2" />
                    {showTrailer ? 'Hide Trailer' : 'Watch Trailer'}
                  </Button>
                )}

                {currentUser && (
                  <>
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={toggleFavorite}
                      className={`border-orange-500/30 text-orange-400 hover:bg-orange-500/20 backdrop-blur-sm ${
                        isFav ? 'bg-orange-500/20' : ''
                      }`}
                    >
                      <Heart className={`w-5 h-5 mr-2 ${isFav ? 'fill-current text-red-500' : ''}`} />
                      {isFav ? 'Favorited' : 'Add to Favorites'}
                    </Button>

                    <Button
                      size="lg"
                      variant="outline"
                      onClick={toggleWatchLater}
                      className={`border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20 backdrop-blur-sm ${
                        isInLater ? 'bg-yellow-500/20' : ''
                      }`}
                    >
                      <Clock className="w-5 h-5 mr-2" />
                      {isInLater ? 'In Watch Later' : 'Watch Later'}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
        {/* Trailer Embed (if toggled or top section) */}
        {showTrailer && movie.trailerKey && (
          <div className="space-y-4 animate-in fade-in slide-in-from-top duration-500">
            <h2 className="text-2xl font-bold text-white flex items-center">
              <Tv className="w-6 h-6 mr-2 text-orange-400" />
              Official Trailer
            </h2>
            <div className="aspect-video w-full max-w-4xl mx-auto rounded-xl overflow-hidden shadow-2xl border border-orange-500/30">
              <iframe
                src={`https://www.youtube.com/embed/${movie.trailerKey}?autoplay=1`}
                title={`${movie.title} Trailer`}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        )}

        {/* Synopsis */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-white">Storyline</h2>
          <p className="text-gray-300 text-lg leading-relaxed max-w-4xl">{movie.description}</p>
        </div>

        {/* Cast Section */}
        {movie.cast && movie.cast.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white flex items-center">
              <Users className="w-6 h-6 mr-2 text-orange-400" />
              Top Cast
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {movie.cast.map((actor) => (
                <Card
                  key={actor.id}
                  className="bg-gray-900/60 border-gray-800 overflow-hidden hover:border-orange-500/40 transition-all duration-300"
                >
                  <img
                    src={actor.profileUrl || ''}
                    alt={actor.name}
                    className="w-full h-44 object-cover"
                  />
                  <CardContent className="p-3">
                    <p className="text-white font-semibold text-sm line-clamp-1">{actor.name}</p>
                    <p className="text-gray-400 text-xs line-clamp-1">{actor.character}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Similar Movies */}
        {movie.similar && movie.similar.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">More Like This</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
              {movie.similar.slice(0, 6).map((similarMovie) => (
                <MovieCard key={similarMovie.id} movie={similarMovie} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

