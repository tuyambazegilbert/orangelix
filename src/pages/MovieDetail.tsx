import { useParams, Link } from 'react-router-dom';
import { useMovieDetails } from '@/hooks/use-tmdb';
import { useAuth } from '@/contexts/AuthContext';
import { MovieService } from '@/lib/movies';
import { FirebaseData } from '@/lib/firebase-data';
import { Analytics } from '@/services/analytics';
import { ContentRelationships, ContentEntityRelations } from '@/features/contentGraph/ContentRelationships';
import RelatedMusic from '@/features/contentGraph/RelatedMusic';
import RelatedNews from '@/features/contentGraph/RelatedNews';
import RelatedBooks from '@/features/contentGraph/RelatedBooks';
import MovieCard from '@/components/MovieCard';
import SEOHead from '@/components/seo/SEOHead';
import StructuredData, { SchemaGenerators } from '@/components/seo/StructuredData';
import Breadcrumbs from '@/components/Breadcrumbs';
import { Button } from '@/components/ui/button';
import { CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Play,
  Heart,
  Clock,
  Star,
  ArrowLeft,
  Calendar,
  Users,
  Tv,
  Music2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { PROFILE_FALLBACK, POSTER_FALLBACK, BACKDROP_FALLBACK } from '@/lib/tmdb/images';

export default function MovieDetail() {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useAuth();
  const movieId = id ? parseInt(id, 10) : undefined;
  const { data: movie, isLoading, error } = useMovieDetails(movieId);
  const [showTrailer, setShowTrailer] = useState(false);

  // Content Graph State
  const [relations, setRelations] = useState<ContentEntityRelations>({
    soundtrack: null,
    news: [],
    sourceBook: null,
  });
  const [isLoadingRelations, setIsLoadingRelations] = useState(true);

  // Track Analytics View
  useEffect(() => {
    if (movie) {
      Analytics.logEvent('movie_view', {
        userId: currentUser?.id,
        entityType: 'movie',
        entityId: movie.tmdbId?.toString(),
        entityTitle: movie.title,
        metadata: { genres: movie.genres },
      });

      // Fetch Content Graph relations
      setIsLoadingRelations(true);
      ContentRelationships.resolveForMovie(movie.title, movie.tmdbId, movie.genres)
        .then((data) => setRelations(data))
        .finally(() => setIsLoadingRelations(false));
    }
  }, [movie, currentUser]);

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
      void FirebaseData.removeFavorites(currentUser.id, rawId);
      Analytics.logEvent('favorite_remove', { userId: currentUser.id, entityId: rawId, entityTitle: movie.title });
      toast.success('Removed from favorites');
    } else {
      MovieService.addToFavorites(rawId, currentUser.id, {
        tmdbId: movie.tmdbId,
        mediaType: 'movie',
        cachedMedia: movie,
      });
      void FirebaseData.setFavorites(currentUser.id, movie);
      Analytics.logEvent('favorite_add', { userId: currentUser.id, entityId: rawId, entityTitle: movie.title });
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
      void FirebaseData.removeWatchlist(currentUser.id, rawId);
      toast.success('Removed from Watch Later');
    } else {
      MovieService.addToWatchLater(rawId, currentUser.id, {
        tmdbId: movie.tmdbId,
        mediaType: 'movie',
        cachedMedia: movie,
      });
      void FirebaseData.setWatchlist(currentUser.id, movie);
      Analytics.logEvent('watchlater_add', { userId: currentUser.id, entityId: rawId, entityTitle: movie.title });
      toast.success('Added to Watch Later');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500 mb-4" />
        <p className="text-gray-400">Loading cinema metadata...</p>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-4">Movie not found</h1>
        <Button asChild className="bg-orange-500 hover:bg-orange-600">
          <Link to="/movies">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Movies
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <SEOHead
        title={`${movie.title} (${movie.releaseYear || ''}) — Watch Online, Cast & Story`}
        description={movie.description || `Stream ${movie.title} on OrangeFlix with cast, official trailer, soundtrack, and ratings.`}
        image={movie.backdropUrl || movie.posterUrl || POSTER_FALLBACK}
        type="video.movie"
      />
      <StructuredData
        id="movie-jsonld"
        data={SchemaGenerators.movie({
          title: movie.title,
          description: movie.description,
          imageUrl: movie.posterUrl,
          releaseYear: movie.releaseYear,
          rating: movie.voteAverage,
          genres: movie.genres,
        })}
      />

      {/* Backdrop Hero */}
      <div className="relative h-[65vh] min-h-[480px] w-full overflow-hidden">
        <img
          src={movie.backdropUrl || BACKDROP_FALLBACK}
          alt={movie.title}
          className="w-full h-full object-cover object-center scale-105 filter blur-[1px] brightness-50"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-gray-950 via-transparent to-transparent" />
      </div>

      <div className="page-wrap -mt-72 relative z-10 space-y-12 pb-16">
        <Breadcrumbs
          items={[
            { name: 'Movies', url: '/movies' },
            ...(movie.genres?.[0]
              ? [{ name: movie.genres[0], url: `/genres/${movie.genres[0].toLowerCase().replace(/\s+/g, '-')}` }]
              : []),
            { name: movie.title, url: `/movie/${movie.tmdbId}` },
          ]}
        />

        {/* Main Details Layout */}
        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* Poster Card */}
          <div className="w-64 md:w-72 lg:w-80 shrink-0 mx-auto md:mx-0 rounded-2xl overflow-hidden shadow-2xl border border-orange-500/20 bg-gray-900 group">
            <img
              src={movie.posterUrl || POSTER_FALLBACK}
              alt={movie.title}
              className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>

          {/* Metadata Info */}
          <div className="flex-1 space-y-6">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <Badge className="bg-orange-500 text-white font-bold px-3 py-1">
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

              <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
                {movie.title}
              </h1>

              {movie.tagline && (
                <p className="text-orange-400/90 italic text-base font-medium">
                  &ldquo;{movie.tagline}&rdquo;
                </p>
              )}

              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-1.5 bg-black/50 px-3 py-1.5 rounded-lg border border-yellow-500/30">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span className="text-white font-bold text-base">{movie.voteAverage.toFixed(1)}</span>
                  <span className="text-gray-400 text-xs">/10 ({movie.voteCount} votes)</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {movie.genres.map((genre) => (
                  <Link
                    key={genre}
                    to={`/genres/${genre.toLowerCase().replace(/\s+/g, '-')}`}
                    className="bg-gray-800/80 backdrop-blur-sm text-gray-200 px-3 py-1 rounded-full text-xs border border-gray-700 hover:border-orange-400/50 hover:text-white transition"
                  >
                    {genre}
                  </Link>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 pt-3">
                <Button
                  asChild
                  size="lg"
                  className="bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20 font-bold"
                >
                  <Link to={`/watch/movie-${movie.tmdbId}`}>
                    <Play className="w-5 h-5 mr-2 fill-current" />
                    Watch Now
                  </Link>
                </Button>

                {movie.trailerKey && (
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => setShowTrailer(!showTrailer)}
                    className="border-orange-500/30 text-orange-400 hover:bg-orange-500/20"
                  >
                    <Tv className="w-5 h-5 mr-2" />
                    {showTrailer ? 'Hide Trailer' : 'Watch Trailer'}
                  </Button>
                )}

                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-white/10 text-slate-300 hover:border-orange-400/40 hover:text-orange-300"
                >
                  <Link to={`/music/movie/${movie.tmdbId}`}>
                    <Music2 className="w-5 h-5 mr-2 text-orange-400" />
                    Soundtrack
                  </Link>
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  onClick={toggleFavorite}
                  className={`border-orange-500/30 text-orange-400 hover:bg-orange-500/20 ${
                    isFav ? 'bg-orange-500/20' : ''
                  }`}
                >
                  <Heart className={`w-5 h-5 mr-2 ${isFav ? 'fill-current text-red-500' : ''}`} />
                  {isFav ? 'Saved' : 'Watchlist'}
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  onClick={toggleWatchLater}
                  className={`border-orange-500/30 text-orange-400 hover:bg-orange-500/20 ${
                    isInLater ? 'bg-orange-500/20' : ''
                  }`}
                >
                  <Clock className={`w-5 h-5 mr-2 ${isInLater ? 'text-yellow-400' : ''}`} />
                  {isInLater ? 'Queued' : 'Watch Later'}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Trailer Modal/Player */}
        {showTrailer && movie.trailerKey && (
          <div className="space-y-4 animate-in fade-in slide-in-from-top duration-500">
            <h2 className="text-2xl font-bold text-white flex items-center">
              <Tv className="w-6 h-6 mr-2 text-orange-400" />
              Official Trailer
            </h2>
            <div className="aspect-video w-full max-w-4xl mx-auto rounded-2xl overflow-hidden shadow-2xl border border-orange-500/30">
              <iframe
                src={`https://www.youtube.com/embed/${movie.trailerKey}?autoplay=1`}
                title={`${movie.title} Trailer`}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        )}

        {/* Synopsis */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-white">Storyline</h2>
          <p className="text-gray-300 text-base leading-relaxed max-w-4xl">{movie.description}</p>
        </div>

        {/* Cast Section */}
        {movie.cast && movie.cast.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white flex items-center">
              <Users className="w-6 h-6 mr-2 text-orange-400" />
              Top Cast & Talent
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {movie.cast.map((actor) => (
                <Link
                  key={actor.id}
                  to={`/people/${actor.id}`}
                  className="group block rounded-xl overflow-hidden bg-gray-900/60 border border-gray-800 hover:border-orange-500/40 transition-all duration-300"
                >
                  <img
                    src={actor.profileUrl || PROFILE_FALLBACK}
                    alt={actor.name}
                    className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <CardContent className="p-3">
                    <p className="text-white font-semibold text-xs line-clamp-1 group-hover:text-orange-400 transition-colors">
                      {actor.name}
                    </p>
                    <p className="text-gray-400 text-[11px] line-clamp-1">{actor.character}</p>
                  </CardContent>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Cross-Content Entity Module: Soundtrack */}
        <RelatedMusic
          soundtrack={relations.soundtrack}
          tmdbId={movie.tmdbId}
          isLoading={isLoadingRelations}
        />

        {/* Cross-Content Entity Module: Source Book Adaptation */}
        <RelatedBooks
          sourceBook={relations.sourceBook}
          isLoading={isLoadingRelations}
        />

        {/* Cross-Content Entity Module: Related News Wire */}
        <RelatedNews
          news={relations.news}
          isLoading={isLoadingRelations}
        />

        {/* Similar Movies */}
        {movie.similar && movie.similar.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">More Like This</h2>
            <div className="content-grid">
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
