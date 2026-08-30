import { useNowPlayingMovies, usePopularMovies, usePopularSeries, useTopRatedMovies, useTrending } from '@/hooks/use-tmdb';
import StageSlider from '@/components/StageSlider';
import ContentRail from '@/components/ContentRail';
import GeoCountryShowcase from '@/components/geo/GeoCountryShowcase';
import GeoContentRail from '@/components/geo/GeoContentRail';
import { getAllCountries } from '@/features/geo/countryConfig';
import { GeoContentService } from '@/services/geo-content-service';
import { GeoContentItem } from '@/types/geo-content';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Check, Crown, Sparkles, Film } from 'lucide-react';
import { tmdbClient } from '@/lib/tmdb/client';
import { useAuth } from '@/contexts/AuthContext';
import { FirebaseData } from '@/lib/firebase-data';
import { useEffect, useState, useMemo } from 'react';
import { WatchHistoryItem } from '@/types';
import { MediaItem } from '@/types/media';

export default function Home() {
  const navigate = useNavigate();
  const trending = useTrending('all', 'week');
  const movies = usePopularMovies(1);
  const shows = usePopularSeries(1);
  const releases = useNowPlayingMovies(1);
  const topRated = useTopRatedMovies(1);
  const { currentUser } = useAuth();
  const [history, setHistory] = useState<WatchHistoryItem[]>([]);
  const [geoCinemaItems, setGeoCinemaItems] = useState<GeoContentItem[]>([]);

  const countries = useMemo(() => getAllCountries(), []);
  const featured = trending.data?.items?.slice(0, 6) || [];

  useEffect(() => {
    if (!currentUser) { setHistory([]); return; }
    void FirebaseData.getWatchHistory(currentUser.id).then(setHistory);
  }, [currentUser]);

  // Load African & Regional Cinema highlights
  useEffect(() => {
    let isMounted = true;
    GeoContentService.getRecommendations('RW', 8).then((items) => {
      if (isMounted && items.length > 0) {
        setGeoCinemaItems(items);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const continueItems: MediaItem[] = history.filter((item) => item.progressSeconds > 0 && item.progressSeconds < (item.durationSeconds || 7200) * .95).map((item) => ({
    id: item.contentId, tmdbId: item.tmdbId || Number(item.contentId.replace(/\D/g, '')) || 0, mediaType: item.mediaType, title: item.title, description: '', posterUrl: item.posterUrl || null, backdropUrl: null, imageUrl: item.posterUrl || '', rating: 0, voteAverage: 0, voteCount: 0, releaseDate: null, releaseYear: null, genres: item.genre || [], duration: item.durationSeconds ? Math.round(item.durationSeconds / 60) : null,
  }));
  const continueProgress = Object.fromEntries(history.map((item) => [item.contentId, Math.min(100, Math.round(item.progressSeconds / (item.durationSeconds || 7200) * 100))]));

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#080d17]">
      {!tmdbClient.hasToken() && (
        <div className="border-b border-orange-400/20 bg-orange-400/[.07] px-4 py-2 text-center text-xs text-orange-200">
          Add <code className="rounded bg-black/20 px-1.5 py-0.5">VITE_TMDB_ACCESS_TOKEN</code> to enable the live catalogue.
        </div>
      )}

      {/* 3D Stage Slider Hero Section */}
      {trending.isLoading ? (
        <div className="skeleton h-[420px] border-b border-white/[.07]" />
      ) : featured.length ? (
        <StageSlider items={featured} />
      ) : (
        <section className="relative overflow-hidden border-b border-white/[.07] bg-[radial-gradient(circle_at_78%_30%,rgba(120,82,220,.35),transparent_24%),linear-gradient(120deg,#090e18,#10172b)] px-5 py-20 sm:px-10 lg:px-[clamp(2rem,8vw,10rem)]">
          <p className="section-eyebrow mb-3">OrangeFlix</p>
          <h1 className="max-w-xl text-4xl font-extrabold tracking-tight text-white sm:text-6xl">
            A world of stories is waiting.
          </h1>
          <p className="mt-5 max-w-md text-slate-300">
            Browse acclaimed films and unforgettable series, all in one cinematic home.
          </p>
          <Link to="/movies" className="premium-button mt-7 inline-flex h-10 items-center rounded-lg px-5 text-sm font-semibold">
            Explore movies
          </Link>
        </section>
      )}

      <main className="page-wrap space-y-6 py-6">
        <ContentRail title="Trending now" eyebrow="Most watched this week" items={trending.data?.items?.slice(6, 18) || []} href="/trending" loading={trending.isLoading} />
        {continueItems.length > 0 && <ContentRail title="Continue watching" eyebrow="Pick up where you left off" items={continueItems} href="/profile" variant="continue" progressById={continueProgress} />}
        <ContentRail title="Popular movies" eyebrow="Find your next favorite" items={movies.data?.items?.slice(0, 12) || []} href="/movies" loading={movies.isLoading} />
        
        {/* OrangeFlix Premium Banner */}
        <section className="my-5 grid overflow-hidden rounded-2xl border border-white/[.1] bg-[radial-gradient(circle_at_75%_0%,rgba(130,93,255,.35),transparent_38%),linear-gradient(105deg,#131525,#271b35)] p-6 sm:my-8 sm:grid-cols-[1fr_auto] sm:items-center sm:p-8">
          <div>
            <p className="section-eyebrow mb-2 text-orange-300">OrangeFlix Premium</p>
            <h2 className="text-2xl font-bold tracking-tight text-white">Your cinema, without limits.</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">Watch in 4K, download for offline nights, and keep every screen in the house in sync.</p>
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-200">
              {['4K Ultra HD', 'No interruptions', 'Watch anywhere'].map((feature) => (
                <span className="flex items-center gap-1.5" key={feature}>
                  <Check className="h-3.5 w-3.5 text-orange-300" />{feature}
                </span>
              ))}
            </div>
          </div>
          <Link to="/profile" className="mt-6 inline-flex h-10 items-center justify-center gap-2 self-start rounded-lg bg-white px-5 text-sm font-semibold text-slate-900 transition hover:bg-orange-100 sm:mt-0">
            <Crown className="h-4 w-4 text-orange-500" />Explore Premium
          </Link>
        </section>

        <ContentRail title="Binge-worthy series" eyebrow="Pick up a new obsession" items={shows.data?.items?.slice(0, 12) || []} href="/series" loading={shows.isLoading} />
        <ContentRail title="New in theatres" eyebrow="Fresh arrivals" items={releases.data?.items?.slice(0, 12) || []} href="/new" loading={releases.isLoading} />
        <ContentRail title="Recommended for you" eyebrow="Highly rated picks" items={topRated.data?.items?.slice(0, 12) || []} href="/movies?sort=rating" loading={topRated.isLoading} />
        
        {/* Geo Cinema Section Placed at Bottom of Landing Page */}
        <section className="pt-4 border-t border-gray-800/80 space-y-4">
          <GeoCountryShowcase
            currentCountryCode="RW"
            countries={countries}
            onSelectCountry={(code) => navigate(`/${code.toLowerCase()}/movies`)}
          />

          {/* African & Regional Cinema Spotlight Rail */}
          {geoCinemaItems.length > 0 && (
            <GeoContentRail
              title="African & Regional Cinema Spotlight"
              eyebrow="Full Movies from YouTube"
              icon={<Film className="w-3 h-3 text-orange-400" />}
              items={geoCinemaItems}
              countryCode="RW"
              onSeeAll={() => navigate('/rw/movies')}
            />
          )}
        </section>

        {/* Bottom Discover Banner */}
        <section className="mt-7 flex flex-col justify-between gap-5 rounded-xl border border-white/[.08] bg-[#0d1320] p-5 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-orange-400/10 text-orange-400">
              <Sparkles className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-semibold text-white">Not sure where to start?</h2>
              <p className="text-sm text-slate-400">Browse tailored genres and collections.</p>
            </div>
          </div>
          <Link to="/movies" className="inline-flex items-center gap-2 text-sm font-semibold text-orange-400 hover:text-orange-300">
            Discover more <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      </main>
    </div>
  );
}
