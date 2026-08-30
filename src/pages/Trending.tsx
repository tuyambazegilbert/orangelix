import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookmarkPlus, Film, Info, Play, Sparkles, Star, Tv } from 'lucide-react';
import { useTrending } from '@/hooks/use-tmdb';
import { useAuth } from '@/contexts/AuthContext';
import { MovieService } from '@/lib/movies';
import { FirebaseData } from '@/lib/firebase-data';
import MovieCard from '@/components/MovieCard';
import StageSlider from '@/components/StageSlider';
import GeoCountryShowcase from '@/components/geo/GeoCountryShowcase';
import { getAllCountries } from '@/features/geo/countryConfig';
import { toast } from 'sonner';

export default function Trending() {
  const navigate = useNavigate();
  const [type, setType] = useState<'all' | 'movie' | 'tv'>('all');
  const [window, setWindow] = useState<'day' | 'week'>('week');
  const { currentUser } = useAuth();
  const countries = useMemo(() => getAllCountries(), []);

  const query = useTrending(type, window);
  const [saved, setSaved] = useState(false);
  const items = query.data?.items || [];
  const featured = items.slice(0, 6);

  return (
    <div className="min-h-screen bg-[#080d17] text-white overflow-x-hidden">
      {/* 3D StageSlider Hero Section */}
      {featured.length > 0 && <StageSlider items={featured} />}

      <main className="page-wrap py-6 space-y-6">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-orange-400 mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Live Popularity & Trends
            </p>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">Trending Now</h1>
            <p className="mt-0.5 text-xs sm:text-sm text-slate-400">The most popular stories everyone is talking about.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-xl border border-white/[.1] bg-gray-900/60 p-1">
              {(
                [
                  { key: 'all', label: 'All', icon: Sparkles },
                  { key: 'movie', label: 'Movies', icon: Film },
                  { key: 'tv', label: 'Series', icon: Tv },
                ] as const
              ).map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setType(key)}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    type === key ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              ))}
            </div>

            <button
              onClick={() => setWindow(window === 'week' ? 'day' : 'week')}
              className="rounded-xl border border-white/[.1] bg-gray-900/60 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:bg-white/[.08] transition"
            >
              This {window === 'week' ? 'Week' : 'Day'}
            </button>
          </div>
        </header>

        {query.isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {Array.from({ length: 18 }).map((_, index) => (
              <div key={index} className="aspect-[2/3] bg-gray-900/60 border border-gray-800/80 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : items.length > 0 ? (
          <section className="space-y-4">
            <div className="content-grid">
              {items.map((item, index) => (
                <div className="relative" key={item.id}>
                  <span className="absolute left-2 top-2 z-20 grid h-6 min-w-6 place-items-center rounded-lg bg-[#080d16]/95 px-1.5 text-[10px] font-black text-orange-300 backdrop-blur border border-white/10 shadow-md">
                    #{index + 1}
                  </span>
                  <MovieCard movie={item} />
                </div>
              ))}
            </div>
          </section>
        ) : (
          <div className="rounded-2xl border border-white/[.08] bg-white/[.025] p-10 text-center text-sm text-slate-400">
            Trending titles are unavailable.{' '}
            <button onClick={() => query.refetch()} className="ml-1 font-semibold text-orange-400">
              Try again
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
