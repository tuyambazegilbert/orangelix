import { useParams, Link } from 'react-router-dom';
import { useSeriesDetails, useSeasonDetails } from '@/hooks/use-tmdb';
import { useAuth } from '@/contexts/AuthContext';
import { MovieService } from '@/lib/movies';
import MovieCard from '@/components/MovieCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Play,
  Heart,
  Clock,
  Star,
  ArrowLeft,
  Calendar,
  Tv,
  Users,
  Film,
  Layers,
} from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';

export default function SeriesDetail() {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useAuth();
  const seriesId = id ? parseInt(id, 10) : undefined;
  const { data: series, isLoading, error } = useSeriesDetails(seriesId);
  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [showTrailer, setShowTrailer] = useState(false);

  const { data: episodes, isLoading: isEpisodesLoading } = useSeasonDetails(
    seriesId,
    selectedSeason
  );

  const rawId = seriesId ? `tv-${seriesId}` : '';
  const isFav = currentUser && rawId ? MovieService.isFavorite(rawId, currentUser.id) : false;
  const isInLater = currentUser && rawId ? MovieService.isInWatchLater(rawId, currentUser.id) : false;

  const toggleFavorite = () => {
    if (!currentUser || !series) {
      toast.error('Please login to add favorites');
      return;
    }

    if (isFav) {
      MovieService.removeFromFavorites(rawId, currentUser.id);
      toast.success('Removed from favorites');
    } else {
      MovieService.addToFavorites(rawId, currentUser.id, {
        tmdbId: series.tmdbId,
        mediaType: 'tv',
        cachedMedia: series,
      });
      toast.success('Added to favorites');
    }
  };

  const toggleWatchLater = () => {
    if (!currentUser || !series) {
      toast.error('Please login to add to watch later');
      return;
    }

    if (isInLater) {
      MovieService.removeFromWatchLater(rawId, currentUser.id);
      toast.success('Removed from Watch Later');
    } else {
      MovieService.addToWatchLater(rawId, currentUser.id, {
        tmdbId: series.tmdbId,
        mediaType: 'tv',
        cachedMedia: series,
      });
      toast.success('Added to Watch Later');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500 mb-4"></div>
        <p className="text-gray-400">Loading series details...</p>
      </div>
    );
  }

  if (error || !series) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4">
        <div className="text-center max-w-md">
          <Tv className="w-16 h-16 text-orange-500/50 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Series Not Found</h1>
          <p className="text-gray-400 mb-6">
            {error instanceof Error ? error.message : 'The requested TV series could not be loaded.'}
          </p>
          <Button asChild className="bg-orange-500 hover:bg-orange-600">
            <Link to="/series">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Series
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
            backgroundImage: `url(${series.backdropUrl || series.posterUrl})`,
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
              <Link to="/series">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to TV Series
              </Link>
            </Button>
          </div>

          {/* Hero Content */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-end mb-8">
            {/* Poster Card */}
            <div className="hidden md:block md:col-span-1">
              <img
                src={series.imageUrl}
                alt={series.title}
                className="w-full rounded-xl shadow-2xl border border-orange-500/20 object-cover"
              />
            </div>

            {/* Meta Info */}
            <div className="md:col-span-3 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white font-semibold">
                  TV Series
                </Badge>
                {series.numberOfSeasons && (
                  <Badge variant="outline" className="border-gray-600 text-gray-300">
                    {series.numberOfSeasons} {series.numberOfSeasons === 1 ? 'Season' : 'Seasons'}
                  </Badge>
                )}
                {series.numberOfEpisodes && (
                  <Badge variant="outline" className="border-gray-600 text-gray-300">
                    {series.numberOfEpisodes} Episodes
                  </Badge>
                )}
                {series.releaseYear && (
                  <span className="text-gray-300 text-sm flex items-center">
                    <Calendar className="w-4 h-4 mr-1 text-orange-400" />
                    First Aired {series.releaseDate || series.releaseYear}
                  </span>
                )}
              </div>

              <h1 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
                {series.title}
              </h1>

              {series.createdByName && (
                <p className="text-gray-300 text-sm">
                  Created by <span className="text-orange-400 font-semibold">{series.createdByName}</span>
                </p>
              )}

              {series.tagline && (
                <p className="text-orange-400/90 italic text-lg font-medium">"{series.tagline}"</p>
              )}

              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-1 bg-black/50 px-3 py-1.5 rounded-lg border border-yellow-500/30">
                  <Star className="w-5 h-5 text-yellow-400 fill-current" />
                  <span className="text-white font-bold text-lg">{series.voteAverage.toFixed(1)}</span>
                  <span className="text-gray-400 text-xs">/10 ({series.voteCount} votes)</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {series.genres.map((genre) => (
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
                  <Link to={`/watch/tv-${series.tmdbId}`}>
                    <Play className="w-5 h-5 mr-2" />
                    Watch Now
                  </Link>
                </Button>

                {series.trailerKey && (
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

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
        {/* Trailer Embed */}
        {showTrailer && series.trailerKey && (
          <div className="space-y-4 animate-in fade-in slide-in-from-top duration-500">
            <h2 className="text-2xl font-bold text-white flex items-center">
              <Tv className="w-6 h-6 mr-2 text-orange-400" />
              Official Trailer
            </h2>
            <div className="aspect-video w-full max-w-4xl mx-auto rounded-xl overflow-hidden shadow-2xl border border-orange-500/30">
              <iframe
                src={`https://www.youtube.com/embed/${series.trailerKey}?autoplay=1`}
                title={`${series.title} Trailer`}
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
          <p className="text-gray-300 text-lg leading-relaxed max-w-4xl">{series.description}</p>
        </div>

        {/* Episode Guide / Seasons */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-800">
            <h2 className="text-2xl font-bold text-white flex items-center">
              <Layers className="w-6 h-6 mr-2 text-orange-400" />
              Episode Guide
            </h2>

            {series.seasons && series.seasons.length > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-gray-400 text-sm">Season:</span>
                <Select
                  value={selectedSeason.toString()}
                  onValueChange={(val) => setSelectedSeason(parseInt(val, 10))}
                >
                  <SelectTrigger className="w-48 bg-gray-900 border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-700 text-white">
                    {series.seasons
                      .filter((s) => s.seasonNumber > 0)
                      .map((season) => (
                        <SelectItem key={season.id} value={season.seasonNumber.toString()}>
                          {season.name || `Season ${season.seasonNumber}`} ({season.episodeCount} eps)
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Episode List */}
          {isEpisodesLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            </div>
          ) : episodes && episodes.length > 0 ? (
            <div className="space-y-4">
              {episodes.map((ep) => (
                <Card
                  key={ep.id}
                  className="bg-gray-900/60 border-gray-800 hover:border-orange-500/30 transition-all duration-300 overflow-hidden"
                >
                  <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-start">
                    <div className="relative w-full md:w-56 h-32 flex-shrink-0 rounded-lg overflow-hidden bg-gray-950">
                      <img
                        src={ep.stillUrl || series.backdropUrl || series.imageUrl}
                        alt={ep.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 left-2 bg-black/75 px-2 py-0.5 rounded text-xs font-bold text-orange-400">
                        EP {ep.episodeNumber}
                      </div>
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <h3 className="text-white font-semibold text-lg">
                          {ep.episodeNumber}. {ep.name}
                        </h3>
                        <div className="flex items-center space-x-3 text-xs text-gray-400">
                          {ep.airDate && <span>{ep.airDate}</span>}
                          {ep.runtime && <span>{ep.runtime} min</span>}
                          {ep.rating > 0 && (
                            <span className="flex items-center text-yellow-400 font-medium">
                              ★ {ep.rating}
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-gray-300 text-sm leading-relaxed line-clamp-3">
                        {ep.overview}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-8">
              No episode details available for this season.
            </p>
          )}
        </div>

        {/* Cast Section */}
        {series.cast && series.cast.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white flex items-center">
              <Users className="w-6 h-6 mr-2 text-orange-400" />
              Series Cast
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {series.cast.map((actor) => (
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

        {/* Similar Series */}
        {series.similar && series.similar.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">More Like This</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
              {series.similar.slice(0, 6).map((similarShow) => (
                <MovieCard key={similarShow.id} movie={similarShow} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

