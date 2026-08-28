import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  BookmarkPlus,
  Check,
  ChevronDown,
  Clock3,
  Heart,
  Share2,
  Star,
  Sparkles,
  X,
  Play,
  Music2,
  BookOpen,
} from 'lucide-react';
import { useMovieDetails, useSeasonDetails, useSeriesDetails, useTrending } from '@/hooks/use-tmdb';
import { MediaDetail } from '@/types/media';
import { MovieService } from '@/lib/movies';
import { useAuth } from '@/contexts/AuthContext';
import { FirebaseData } from '@/lib/firebase-data';
import { Analytics } from '@/services/analytics';
import { ContentRelationships, ContentEntityRelations } from '@/features/contentGraph/ContentRelationships';
import { RecommendationService } from '@/features/recommendations/recommendationService';
import { RecommendedItem } from '@/features/recommendations/engine/types';
import RelatedMusic from '@/features/contentGraph/RelatedMusic';
import RelatedNews from '@/features/contentGraph/RelatedNews';
import RelatedBooks from '@/features/contentGraph/RelatedBooks';
import CinematicPlayer from '@/components/watch/CinematicPlayer';
import CastRail from '@/components/watch/CastRail';
import ContentRail from '@/components/ContentRail';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { POSTER_FALLBACK } from '@/lib/tmdb/images';

const duration = (minutes: number | null | undefined) =>
  minutes ? `${Math.floor(minutes / 60)}h ${minutes % 60}m` : '—';
const progressKey = (id: string) => `orangeflix_progress_${id}`;

function WatchSkeleton() {
  return (
    <main className="page-wrap">
      <div className="skeleton aspect-video rounded-xl" />
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_270px]">
        <div className="space-y-4">
          <div className="skeleton h-9 w-3/5 rounded" />
          <div className="skeleton h-4 w-2/5 rounded" />
          <div className="skeleton h-20 w-full rounded" />
        </div>
        <div className="skeleton h-44 rounded-xl" />
      </div>
      <div className="mt-8 flex gap-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div className="skeleton h-44 w-24 rounded-lg" key={index} />
        ))}
      </div>
    </main>
  );
}

export default function Watch() {
  const { id = '' } = useParams<{ id: string }>();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const isTv = id.startsWith('tv-') || params.get('type') === 'tv';
  const tmdbId = Number(id.replace(/^(tv|movie)-/, '')) || null;
  const legacy = !tmdbId ? MovieService.getMovies().find((movie) => movie.id === id) : null;

  const movie = useMovieDetails(!isTv ? tmdbId : null);
  const series = useSeriesDetails(isTv ? tmdbId : null);
  const trending = useTrending('all', 'week');
  const [season, setSeason] = useState(1);
  const seasonData = useSeasonDetails(isTv ? tmdbId : null, season);

  const [expanded, setExpanded] = useState(false);
  const [favorite, setFavorite] = useState(false);
  const [review, setReview] = useState('');
  const [reviews, setReviews] = useState(() => MovieService.getReviews(id));

  // Content Graph & Post-Watch State
  const [relations, setRelations] = useState<ContentEntityRelations>({
    soundtrack: null,
    news: [],
    sourceBook: null,
  });
  const [isLoadingRelations, setIsLoadingRelations] = useState(true);
  const [showPostWatch, setShowPostWatch] = useState(false);
  const [postWatchRecs, setPostWatchRecs] = useState<RecommendedItem[]>([]);
  const [hasCompleted, setHasCompleted] = useState(false);

  const media = useMemo<MediaDetail | null>(() => {
    if (legacy)
      return {
        id: legacy.id,
        tmdbId: 0,
        mediaType: legacy.type === 'Series' ? 'tv' : 'movie',
        title: legacy.title,
        description: legacy.description,
        posterUrl: legacy.imageUrl,
        backdropUrl: legacy.imageUrl,
        imageUrl: legacy.imageUrl,
        rating: legacy.rating,
        voteAverage: legacy.rating * 2,
        voteCount: legacy.totalRatings,
        releaseDate: null,
        releaseYear: legacy.releaseYear,
        genres: legacy.genre,
        duration: legacy.duration,
        tagline: null,
        status: null,
        cast: [],
        crew: [],
        videos: [],
        similar: [],
        recommendations: [],
      };
    return movie.data || series.data || null;
  }, [legacy, movie.data, series.data]);

  useEffect(() => {
    if (currentUser) setFavorite(MovieService.isFavorite(id, currentUser.id));
  }, [currentUser, id]);

  // Analytics & Content Graph loader
  useEffect(() => {
    if (media) {
      Analytics.logEvent('watch_start', {
        userId: currentUser?.id,
        entityType: media.mediaType,
        entityId: id,
        entityTitle: media.title,
      });

      setIsLoadingRelations(true);
      ContentRelationships.resolveForMovie(media.title, media.tmdbId || undefined, media.genres)
        .then((data) => setRelations(data))
        .finally(() => setIsLoadingRelations(false));
    }
  }, [media, id, currentUser]);

  if (movie.isLoading || series.isLoading) return <WatchSkeleton />;
  if (!media)
    return (
      <main className="page-wrap grid min-h-[65vh] place-items-center text-center">
        <div>
          <h1 className="text-2xl font-bold text-white">This title isn’t available</h1>
          <p className="mt-2 text-slate-400">It may have been removed or the link may be invalid.</p>
          <Link to="/movies" className="premium-button mt-5 inline-flex rounded-lg px-4 py-2 text-sm font-semibold">
            Browse movies
          </Link>
        </div>
      </main>
    );

  const rawId = id || `${media.mediaType}-${media.tmdbId}`;
  const savedProgress = Number(localStorage.getItem(progressKey(rawId)) || 0);
  const directVideo = legacy?.videoUrl || null;

  const writers = media.crew.filter((person) => /writer|screenplay/i.test(person.job)).slice(0, 2);
  const director = media.crew.find((person) => person.job === 'Director');

  const save = () => {
    if (!currentUser) return toast.error('Sign in to save this title');
    if (favorite) {
      MovieService.removeFromFavorites(rawId, currentUser.id);
      void FirebaseData.removeWatchlist(currentUser.id, rawId);
      setFavorite(false);
      toast.success('Removed from watchlist');
    } else {
      MovieService.addToFavorites(rawId, currentUser.id, {
        tmdbId: media.tmdbId || undefined,
        mediaType: media.mediaType,
        cachedMedia: media,
      });
      void FirebaseData.setWatchlist(currentUser.id, media);
      setFavorite(true);
      toast.success('Added to watchlist');
    }
  };

  const persistProgress = (seconds: number, total: number) => {
    localStorage.setItem(progressKey(rawId), String(Math.floor(seconds)));
    if (currentUser) void FirebaseData.setHistory(currentUser.id, media, seconds, total);

    // Check completion threshold (>= 80%)
    if (total > 0 && seconds / total >= 0.8 && !hasCompleted) {
      setHasCompleted(true);
      Analytics.logEvent('watch_complete', {
        userId: currentUser?.id,
        entityType: media.mediaType,
        entityId: rawId,
        entityTitle: media.title,
      });

      // Load post-watch recommendations
      RecommendationService.getPostWatch(media.title, undefined, currentUser?.id, 3).then((recs) => {
        setPostWatchRecs(recs);
        setShowPostWatch(true);
      });
    }
  };

  const submitReview = (event: FormEvent) => {
    event.preventDefault();
    if (!currentUser) return toast.error('Sign in to write a review');
    if (!review.trim()) return;
    const entry = MovieService.addReview({
      movieId: rawId,
      userId: currentUser.id,
      userName: currentUser.name,
      rating: 5,
      comment: review,
    });
    setReviews((value) => [entry, ...value]);
    setReview('');
    Analytics.logEvent('rating_submit', { userId: currentUser.id, entityId: rawId, entityTitle: media.title });
    toast.success('Review published');
  };

  return (
    <div className="min-h-screen pb-16">
      {/* Player Header */}
      <div className="relative overflow-hidden border-b border-white/[.07]">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-25 blur-2xl"
          style={{ backgroundImage: `url(${media.backdropUrl || media.imageUrl})` }}
        />
        <main className="page-wrap relative pt-5">
          <button
            onClick={() => navigate(-1)}
            className="mb-4 inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <CinematicPlayer
            title={media.title}
            poster={media.backdropUrl || media.imageUrl}
            videoUrl={directVideo}
            trailerKey={!directVideo ? media.trailerKey : null}
            initialProgress={savedProgress}
            onProgress={persistProgress}
          />
        </main>
      </div>

      {/* Main Content Area */}
      <main className="page-wrap pt-8 space-y-12">
        <section className="grid gap-8 border-b border-white/[.08] pb-8 lg:grid-cols-[minmax(0,1fr)_270px]">
          <div>
            <p className="section-eyebrow mb-2">{media.mediaType === 'tv' ? 'TV series' : 'Feature film'}</p>
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">{media.title}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-slate-400">
              <span className="flex items-center gap-1 font-semibold text-white">
                <Star className="h-4 w-4 fill-orange-400 text-orange-400" />
                {media.voteAverage.toFixed(1)}
              </span>
              <span>{media.releaseYear || 'New release'}</span>
              <span>{duration(media.duration)}</span>
              <span className="rounded border border-white/[.17] px-1.5 py-0.5 text-[10px] font-semibold">
                {media.mediaType === 'tv' ? 'SERIES' : 'PG-13'}
              </span>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {media.genres.map((genre) => (
                <span className="rounded-full border border-white/[.1] bg-white/[.035] px-3 py-1 text-xs text-slate-300" key={genre}>
                  {genre}
                </span>
              ))}
            </div>
            <p className={`mt-5 max-w-3xl text-sm leading-6 text-slate-300 ${expanded ? '' : 'line-clamp-3'}`}>
              {media.description}
            </p>
            {media.description.length > 170 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="mt-2 text-sm font-semibold text-orange-400 hover:text-orange-300"
              >
                {expanded ? 'Read less' : 'Read more'}
              </button>
            )}
            <div className="mt-6 flex flex-wrap gap-2">
              <button
                onClick={save}
                className={`inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-xs font-semibold ${
                  favorite
                    ? 'border-orange-400/40 bg-orange-400/10 text-orange-300'
                    : 'border-white/[.13] bg-white/[.04] text-white hover:bg-white/[.09]'
                }`}
              >
                <BookmarkPlus className="h-4 w-4" />
                {favorite ? 'In watchlist' : 'Watchlist'}
              </button>
              <button
                onClick={save}
                className="grid h-9 w-9 place-items-center rounded-lg border border-white/[.13] bg-white/[.04] text-slate-300 hover:bg-white/[.09]"
                aria-label="Favorite"
              >
                <Heart className={`h-4 w-4 ${favorite ? 'fill-orange-400 text-orange-400' : ''}`} />
              </button>
              <button
                onClick={() => {
                  void navigator.clipboard?.writeText(window.location.href);
                  Analytics.logEvent('share', { userId: currentUser?.id, entityId: rawId, entityTitle: media.title });
                  toast.success('Link copied');
                }}
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/[.13] bg-white/[.04] px-3 text-xs font-semibold text-slate-300 hover:bg-white/[.09]"
              >
                <Share2 className="h-4 w-4" /> Share
              </button>
            </div>
          </div>
          <aside className="glass rounded-xl p-5">
            <p className="section-eyebrow">Premium playback</p>
            <div className="mt-3 grid gap-3 text-sm text-slate-300">
              <span className="flex items-center gap-2">
                <Check className="h-4 w-4 text-orange-400" /> Up to 4K UHD
              </span>
              <span className="flex items-center gap-2">
                <Check className="h-4 w-4 text-orange-400" /> Continue across devices
              </span>
              <span className="flex items-center gap-2">
                <Check className="h-4 w-4 text-orange-400" /> No interruptions
              </span>
            </div>
          </aside>
        </section>

        {/* TV Episodes */}
        {isTv && media.seasons && (
          <section className="border-b border-white/[.08] py-8">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="section-eyebrow mb-1">Continue the story</p>
                <h2 className="section-title">Episodes</h2>
              </div>
              <label className="flex items-center gap-2 rounded-lg border border-white/[.1] bg-white/[.035] px-3 py-2 text-xs text-slate-300">
                Season
                <select
                  value={season}
                  onChange={(event) => setSeason(Number(event.target.value))}
                  className="bg-transparent text-white outline-none"
                >
                  {media.seasons
                    .filter((item) => item.seasonNumber > 0)
                    .map((item) => (
                      <option className="bg-[#121927]" key={item.id} value={item.seasonNumber}>
                        {item.seasonNumber}
                      </option>
                    ))}
                </select>
                <ChevronDown className="h-3 w-3" />
              </label>
            </div>
            <div className="scrollbar-hide flex gap-3 overflow-x-auto pb-2">
              {seasonData.data?.episodes?.map((episode) => (
                <article key={episode.id} className="w-52 shrink-0 overflow-hidden rounded-lg border border-white/[.08] bg-[#0e1522]">
                  <img
                    src={episode.stillUrl || media.backdropUrl || media.imageUrl}
                    alt=""
                    className="aspect-video w-full object-cover"
                  />
                  <div className="p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-orange-400">
                      Episode {episode.episodeNumber}
                    </p>
                    <h3 className="mt-1 truncate text-sm font-semibold text-white">{episode.name}</h3>
                    <p className="mt-1 text-[11px] text-slate-500">{episode.runtime || '—'} min</p>
                  </div>
                </article>
              )) || <div className="text-sm text-slate-500">Episodes are loading…</div>}
            </div>
          </section>
        )}

        {/* Cast & Talent */}
        <CastRail cast={media.cast} />

        {/* In-Page Content Graph Discoveries */}
        <RelatedMusic soundtrack={relations.soundtrack} tmdbId={media.tmdbId || undefined} isLoading={isLoadingRelations} />
        <RelatedBooks sourceBook={relations.sourceBook} isLoading={isLoadingRelations} />
        <RelatedNews news={relations.news} isLoading={isLoadingRelations} />

        {/* Recommendation Rails */}
        <ContentRail
          title="Because you watched this"
          eyebrow="Selected for you"
          items={media.recommendations}
          href={isTv ? '/series' : '/movies'}
        />
        <ContentRail
          title="More like this"
          eyebrow="Similar stories"
          items={media.similar}
          href={isTv ? '/series' : '/movies'}
        />
        <ContentRail
          title="Trending now"
          eyebrow="What everyone is watching"
          items={trending.data?.items.slice(0, 12) || []}
          href="/trending"
          loading={trending.isLoading}
        />

        {/* Community Reviews */}
        <section className="border-t border-white/[.08] py-8">
          <div className="flex items-end justify-between">
            <div>
              <p className="section-eyebrow mb-1">Audience reactions</p>
              <h2 className="section-title">
                Reviews <span className="text-slate-500">({reviews.length})</span>
              </h2>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-white">{media.voteAverage.toFixed(1)}</p>
              <div className="flex text-orange-400">
                <Star className="h-3 w-3 fill-current" />
                <Star className="h-3 w-3 fill-current" />
                <Star className="h-3 w-3 fill-current" />
                <Star className="h-3 w-3 fill-current" />
                <Star className="h-3 w-3 fill-current" />
              </div>
            </div>
          </div>
          {currentUser ? (
            <form onSubmit={submitReview} className="mt-5 flex gap-2">
              <input
                value={review}
                onChange={(event) => setReview(event.target.value)}
                className="h-10 min-w-0 flex-1 rounded-lg border border-white/[.1] bg-white/[.035] px-3 text-sm text-white outline-none focus:border-orange-400"
                placeholder="Write a review…"
              />
              <button className="premium-button rounded-lg px-4 text-sm font-semibold">Post</button>
            </form>
          ) : (
            <p className="mt-5 text-sm text-slate-400">
              <Link to="/login" className="font-semibold text-orange-400">
                Sign in
              </Link>{' '}
              to share your thoughts.
            </p>
          )}
          <div className="mt-5 grid gap-3">
            {reviews.slice(0, 3).map((entry) => (
              <article key={entry.id} className="rounded-xl border border-white/[.07] bg-white/[.025] p-4">
                <div className="flex justify-between gap-4">
                  <span className="text-sm font-semibold text-white">{entry.userName}</span>
                  <span className="text-xs text-orange-400">{'★'.repeat(entry.rating)}</span>
                </div>
                <p className="mt-2 text-sm text-slate-300">{entry.comment}</p>
              </article>
            ))}
            {!reviews.length && (
              <p className="py-5 text-center text-sm text-slate-500">
                No reviews yet. Be the first to share your thoughts.
              </p>
            )}
          </div>
        </section>
      </main>

      {/* Post-Watch Recommendation Overlay Modal */}
      {showPostWatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-2xl rounded-3xl border border-orange-500/30 bg-[#090e18] p-6 shadow-2xl space-y-6">
            <button
              onClick={() => setShowPostWatch(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1 text-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 text-xs font-bold mb-1">
                <Sparkles className="w-3.5 h-3.5" /> Watching Complete
              </div>
              <h2 className="text-2xl font-extrabold text-white">You finished {media.title} 🎬</h2>
              <p className="text-xs text-slate-400">Here are top picks curated specifically for what you should watch next:</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {postWatchRecs.map((rec) => (
                <div
                  key={rec.id}
                  className="rounded-2xl border border-white/[.08] bg-white/[.025] p-3 flex flex-col justify-between hover:border-orange-500/40 transition group"
                >
                  <div className="space-y-2">
                    <img
                      src={rec.posterUrl || POSTER_FALLBACK}
                      alt={rec.title}
                      className="w-full h-36 object-cover rounded-xl bg-slate-900"
                    />
                    <div>
                      <p className="text-xs font-bold text-white line-clamp-1 group-hover:text-orange-400 transition-colors">
                        {rec.title}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {rec.genres[0] || 'Film'} • ★ {rec.voteAverage}
                      </p>
                    </div>
                  </div>

                  <Link
                    to={`/watch/${rec.mediaType}-${rec.tmdbId}`}
                    onClick={() => setShowPostWatch(false)}
                    className="mt-3 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-orange-500 text-white text-xs font-bold hover:bg-orange-400 transition shadow-md shadow-orange-500/20"
                  >
                    <Play className="w-3 h-3 fill-current" /> Watch Next
                  </Link>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/[.08]">
              {relations.soundtrack && (
                <Link
                  to={`/music/movie/${media.tmdbId}`}
                  onClick={() => setShowPostWatch(false)}
                  className="text-xs text-orange-400 hover:underline flex items-center gap-1.5 font-semibold"
                >
                  <Music2 className="w-3.5 h-3.5" /> Explore Soundtrack
                </Link>
              )}
              {relations.sourceBook && (
                <Link
                  to="/books"
                  onClick={() => setShowPostWatch(false)}
                  className="text-xs text-amber-400 hover:underline flex items-center gap-1.5 font-semibold"
                >
                  <BookOpen className="w-3.5 h-3.5" /> Read Source Book
                </Link>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPostWatch(false)}
                className="text-xs text-slate-400 ml-auto"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
