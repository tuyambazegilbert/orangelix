import { useParams, Link } from 'react-router-dom';
import { useSeriesDetails, useSeasonDetails } from '@/hooks/use-tmdb';
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
  Layers,
  Music2,
  Download,
  CheckCircle2,
} from 'lucide-react';
import { useOfflineDownloads } from '@/hooks/use-offline-downloads';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { PROFILE_FALLBACK, POSTER_FALLBACK, BACKDROP_FALLBACK } from '@/lib/tmdb/images';

import { DetailHeroSkeleton } from '@/components/ui/Skeletons';

export default function SeriesDetail() {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useAuth();
  const { startDownload, isDownloaded, getDownloadProgress } = useOfflineDownloads();
  const seriesId = id ? parseInt(id, 10) : undefined;
  const { data: series, isLoading, error } = useSeriesDetails(seriesId);
  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [showTrailer, setShowTrailer] = useState(false);
  const { data: seasonData } = useSeasonDetails(seriesId, selectedSeason);

  // Content Graph State
  const [relations, setRelations] = useState<ContentEntityRelations>({
    soundtrack: null,
    news: [],
    sourceBook: null,
  });
  const [isLoadingRelations, setIsLoadingRelations] = useState(true);

  // Track Analytics View
  useEffect(() => {
    if (series) {
      Analytics.logEvent('tv_view', {
        userId: currentUser?.id,
        entityType: 'tv',
        entityId: series.tmdbId?.toString(),
        entityTitle: series.title,
        metadata: { genres: series.genres },
      });

      // Fetch Content Graph relations
      setIsLoadingRelations(true);
      ContentRelationships.resolveForMovie({
        title: series.title,
        tmdbId: series.tmdbId,
        mediaType: 'tv',
        genres: series.genres,
        overview: series.description,
        backdropUrl: series.backdropUrl || undefined,
        posterUrl: series.posterUrl || undefined,
        releaseYear: series.releaseYear || undefined,
        cast: series.cast,
        crew: series.crew,
        voteAverage: series.voteAverage,
        voteCount: series.voteCount,
      })
        .then((data) => setRelations(data))
        .finally(() => setIsLoadingRelations(false));
    }
  }, [series, currentUser]);

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
      void FirebaseData.removeFavorites(currentUser.id, rawId);
      Analytics.logEvent('favorite_remove', { userId: currentUser.id, entityId: rawId, entityTitle: series.title });
      toast.success('Removed from favorites');
    } else {
      MovieService.addToFavorites(rawId, currentUser.id, {
        tmdbId: series.tmdbId,
        mediaType: 'tv',
        cachedMedia: series,
      });
      void FirebaseData.setFavorites(currentUser.id, series);
      Analytics.logEvent('favorite_add', { userId: currentUser.id, entityId: rawId, entityTitle: series.title });
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
      void FirebaseData.removeWatchlist(currentUser.id, rawId);
      Analytics.logEvent('watchlater_remove', { userId: currentUser.id, entityId: rawId, entityTitle: series.title });
      toast.success('Removed from Watch Later');
    } else {
      MovieService.addToWatchLater(rawId, currentUser.id, {
        tmdbId: series.tmdbId,
        mediaType: 'tv',
        cachedMedia: series,
      });
      void FirebaseData.setWatchlist(currentUser.id, series);
      Analytics.logEvent('watchlater_add', { userId: currentUser.id, entityId: rawId, entityTitle: series.title });
      toast.success('Added to Watch Later');
    }
  };

  if (isLoading) {
    return <DetailHeroSkeleton />;
  }

  if (error || !series) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-4">Series not found</h1>
        <Button asChild className="bg-orange-500 hover:bg-orange-600">
          <Link to="/series">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to TV Series
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <SEOHead
        title={`${series.title} — Watch TV Series, Episodes & Cast`}
        description={series.description || `Stream ${series.title} series on OrangeFlix with seasons, episode guides, and cast.`}
        image={series.backdropUrl || series.posterUrl || POSTER_FALLBACK}
        type="video.tv_show"
      />
      <StructuredData
        id="tv-jsonld"
        data={SchemaGenerators.tvSeries({
          title: series.title,
          description: series.description,
          imageUrl: series.posterUrl,
          releaseYear: series.releaseYear,
          rating: series.voteAverage,
          genres: series.genres,
        })}
      />

      {/* Backdrop Hero: Immersive and compact on mobile */}
      <div className="relative h-[28vh] sm:h-[50vh] md:h-[65vh] min-h-[160px] sm:min-h-[360px] md:min-h-[480px] w-full overflow-hidden">
        <img
          src={series.backdropUrl || BACKDROP_FALLBACK}
          alt={series.title}
          className="w-full h-full object-cover object-center scale-105 filter blur-[1px] brightness-50"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-gray-950 via-transparent to-transparent" />
      </div>

      <div className="page-wrap !pt-2 -mt-16 sm:-mt-44 md:-mt-72 relative z-10 space-y-6 sm:space-y-12 pb-16">
        <Breadcrumbs
          items={[
            { name: 'TV Series', url: '/series' },
            ...(series.genres?.[0]
              ? [{ name: series.genres[0], url: `/genres/${toGenreSlug(series.genres[0]) || ''}` }]
              : []),
            { name: series.title, url: `/series/${series.tmdbId}` },
          ]}
        />

        {/* Main Details Layout */}
        <div className="flex flex-col md:flex-row gap-6 sm:gap-8 items-center md:items-start">
          {/* Poster Card (Clickable to Watch) */}
          <Link
            to={`/watch/tv-${series.tmdbId}`}
            aria-label={`Watch ${series.title}`}
            className="w-48 sm:w-64 md:w-72 lg:w-80 shrink-0 mx-auto md:mx-0 rounded-2xl overflow-hidden shadow-2xl border border-orange-500/30 bg-gray-900 group relative block cursor-pointer"
          >
            <img
              src={series.posterUrl || POSTER_FALLBACK}
              alt={series.title}
              className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500"
            />
            {/* Animated Play Button Overlay on Hover */}
            <div className="absolute inset-0 bg-black/45 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-2">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-orange-600 to-amber-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/50 transform scale-90 group-hover:scale-100 transition-transform duration-300">
                <Play className="w-7 h-7 sm:w-8 sm:h-8 fill-current ml-0.5" />
              </div>
              <span className="text-xs sm:text-sm font-bold text-white tracking-wide uppercase drop-shadow-md">
                Watch Series Now
              </span>
            </div>
          </Link>

          {/* Metadata Info */}
          <div className="flex-1 space-y-6">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <Badge className="bg-orange-500 text-white font-bold px-3 py-1">
                  Series
                </Badge>
                {series.status && (
                  <Badge variant="outline" className="border-gray-600 text-gray-300">
                    {series.status}
                  </Badge>
                )}
                {series.releaseYear && (
                  <span className="text-gray-300 text-sm flex items-center">
                    <Calendar className="w-4 h-4 mr-1 text-orange-400" />
                    {series.releaseYear}
                  </span>
                )}
                {series.seasonsCount && (
                  <span className="text-gray-300 text-sm flex items-center">
                    <Layers className="w-4 h-4 mr-1 text-orange-400" />
                    {series.seasonsCount} {series.seasonsCount === 1 ? 'Season' : 'Seasons'}
                  </span>
                )}
              </div>

              <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
                {series.title}
              </h1>

              {series.tagline && (
                <p className="text-orange-400/90 italic text-base font-medium">
                  &ldquo;{series.tagline}&rdquo;
                </p>
              )}

              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-1.5 bg-black/50 px-3 py-1.5 rounded-lg border border-yellow-500/30">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span className="text-white font-bold text-base">{series.voteAverage.toFixed(1)}</span>
                  <span className="text-gray-400 text-xs">/10 ({series.voteCount} votes)</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {series.genres.map((genre) => (
                  <Link
                    key={genre}
                    to={toGenreSlug(genre) ? `/genres/${toGenreSlug(genre)}` : '/genres'}
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
                  <Link to={`/watch/tv-${series.tmdbId}`}>
                    <Play className="w-5 h-5 mr-2 fill-current" />
                    Watch Now
                  </Link>
                </Button>

                {series.trailerKey && (
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
                  <Link to={`/music/movie/${series.tmdbId}`}>
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

                {/* Download for Offline Button */}
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => {
                    void startDownload({
                      id: `tv-${series.tmdbId}`,
                      title: series.title,
                      mediaType: 'tv',
                      posterUrl: series.posterUrl || undefined,
                      backdropUrl: series.backdropUrl || undefined,
                      duration: series.duration || undefined,
                      releaseYear: series.releaseYear,
                      rating: series.voteAverage,
                      genres: series.genres,
                      youtubeVideoId: series.trailerKey || undefined,
                    });
                  }}
                  disabled={isDownloaded(`tv-${series.tmdbId}`) || getDownloadProgress(`tv-${series.tmdbId}`)?.status === 'downloading'}
                  className={`border-orange-500/30 text-orange-400 hover:bg-orange-500/20 ${
                    isDownloaded(`tv-${series.tmdbId}`) ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400' : ''
                  }`}
                >
                  {isDownloaded(`tv-${series.tmdbId}`) ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 mr-2 text-emerald-400" /> Downloaded
                    </>
                  ) : getDownloadProgress(`tv-${series.tmdbId}`)?.status === 'downloading' ? (
                    <>
                      <Download className="w-5 h-5 mr-2 animate-bounce text-orange-400" /> {getDownloadProgress(`tv-${series.tmdbId}`)?.progress}%
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5 mr-2" /> Download
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Trailer Section */}
        {showTrailer && series.trailerKey && (
          <div className="space-y-4 animate-in fade-in slide-in-from-top duration-500">
            <h2 className="text-2xl font-bold text-white flex items-center">
              <Tv className="w-6 h-6 mr-2 text-orange-400" />
              Official Trailer
            </h2>
            <div className="aspect-video w-full max-w-4xl mx-auto rounded-2xl overflow-hidden shadow-2xl border border-orange-500/30">
              <iframe
                src={`https://www.youtube.com/embed/${series.trailerKey}?autoplay=1`}
                title={`${series.title} Trailer`}
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
          <p className="text-gray-300 text-base leading-relaxed max-w-4xl">{series.description}</p>
        </div>

        {/* Seasons & Episode Guide */}
        {series.seasons && series.seasons.length > 0 && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800 pb-4">
              <h2 className="text-2xl font-bold text-white flex items-center">
                <Layers className="w-6 h-6 mr-2 text-orange-400" />
                Episodes Guide
              </h2>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-400">Season:</span>
                <Select
                  value={selectedSeason.toString()}
                  onValueChange={(val) => setSelectedSeason(parseInt(val, 10))}
                >
                  <SelectTrigger className="w-[180px] bg-gray-900 border-gray-700 text-white">
                    <SelectValue placeholder="Select Season" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-700 text-white">
                    {series.seasons
                      .filter((s) => s.seasonNumber > 0)
                      .map((season) => (
                        <SelectItem key={season.id} value={season.seasonNumber.toString()}>
                          {season.name} ({season.episodeCount} eps)
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Episode Cards */}
            {isEpisodesLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-2" />
                <p className="text-xs text-gray-400">Loading episodes...</p>
              </div>
            ) : episodes && episodes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {episodes.map((ep) => (
                  <Card
                    key={ep.id}
                    className="bg-gray-900/50 border-gray-800 overflow-hidden flex flex-col justify-between hover:border-orange-500/30 transition"
                  >
                    <div className="flex gap-4 p-4">
                      <div className="w-32 h-20 bg-gray-950 rounded-lg overflow-hidden shrink-0 relative">
                        <img
                          src={ep.stillUrl || series.backdropUrl || BACKDROP_FALLBACK}
                          alt={ep.name}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute bottom-1 right-1 bg-black/80 text-[10px] font-mono px-1 rounded text-orange-400">
                          {ep.duration ? `${ep.duration}m` : '45m'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-2">
                          <h4 className="font-bold text-white text-sm truncate">
                            E{ep.episodeNumber}. {ep.name}
                          </h4>
                        </div>
                        <p className="text-xs text-gray-400 line-clamp-2 mt-1">
                          {ep.overview || 'No episode synopsis provided.'}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm">No episodes found for this season.</p>
            )}
          </div>
        )}

        {/* Cast Section */}
        {series.cast && series.cast.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white flex items-center">
              <Users className="w-6 h-6 mr-2 text-orange-400" />
              Top Cast & Talent
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {series.cast.map((actor) => (
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
          tmdbId={series.tmdbId}
          isLoading={isLoadingRelations}
        />

        {/* Cross-Content Entity Module: Source Material */}
        <RelatedBooks
          sourceBook={relations.sourceBook}
          isLoading={isLoadingRelations}
        />

        {/* Cross-Content Entity Module: Related News Wire */}
        <RelatedNews
          news={relations.news}
          isLoading={isLoadingRelations}
        />

        {/* Similar Series */}
        {series.similar && series.similar.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">More Like This</h2>
            <div className="content-grid">
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
