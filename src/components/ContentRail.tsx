import { ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect, useRef, useState, useMemo } from 'react';
import MovieCard from './MovieCard';
import { MediaItem } from '@/types/media';
import { POSTER_FALLBACK } from '@/lib/tmdb/images';
import { deduplicateList } from '@/lib/deduplication';

interface ContentRailProps {
  title: string;
  eyebrow?: string;
  items: MediaItem[];
  href: string;
  loading?: boolean;
  variant?: 'poster' | 'continue';
  progressById?: Record<string, number>;
}

export default function ContentRail({
  title,
  eyebrow,
  items,
  href,
  loading,
  variant = 'poster',
  progressById = {},
}: ContentRailProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const pauseTimer = useRef<number | undefined>(undefined);

  const displayItems = useMemo(() => deduplicateList(items), [items]);

  const move = (direction: number, manual = true) => {
    const rail = ref.current;
    if (!rail) return;
    if (manual) {
      setPaused(true);
      window.clearTimeout(pauseTimer.current);
      pauseTimer.current = window.setTimeout(() => setPaused(false), 6500);
    }
    const amount = Math.max(rail.clientWidth * 0.72, 260);
    const maxScroll = rail.scrollWidth - rail.clientWidth;
    if (direction > 0 && rail.scrollLeft + amount >= maxScroll - 16) {
      rail.scrollTo({ left: 0, behavior: 'smooth' });
    } else if (direction < 0 && rail.scrollLeft <= 16) {
      rail.scrollTo({ left: Math.max(0, maxScroll), behavior: 'smooth' });
    } else {
      rail.scrollBy({ left: direction * amount, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (loading || displayItems.length < 2 || paused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    const timer = window.setInterval(() => move(1, false), 5200);
    return () => window.clearInterval(timer);
  }, [displayItems.length, loading, paused]);

  const pauseForInteraction = () => {
    setPaused(true);
    window.clearTimeout(pauseTimer.current);
    pauseTimer.current = window.setTimeout(() => setPaused(false), 6500);
  };

  if (!loading && displayItems.length === 0) return null;

  return (
    <section className="group/rail py-5 sm:py-7">
      <div className="mb-3 flex items-end justify-between gap-4">
        <div>
          {eyebrow && <p className="section-eyebrow mb-1">{eyebrow}</p>}
          <h2 className="section-title">{title}</h2>
        </div>
        <div className="flex items-center gap-2">
          <Link to={href} className="hidden text-xs font-semibold text-slate-400 transition hover:text-orange-400 sm:block">
            See all →
          </Link>
          <button
            onClick={() => move(-1)}
            className="grid h-8 w-8 place-items-center rounded-full border border-white/[.1] bg-white/[.035] text-slate-300 transition hover:border-white/20 hover:bg-white/[.1]"
            aria-label={`Scroll ${title} left`}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => move(1)}
            className="grid h-8 w-8 place-items-center rounded-full border border-white/[.1] bg-white/[.035] text-slate-300 transition hover:border-white/20 hover:bg-white/[.1]"
            aria-label={`Scroll ${title} right`}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div
        ref={ref}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocusCapture={pauseForInteraction}
        onPointerDown={pauseForInteraction}
        className="scrollbar-hide -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:-mx-7 sm:px-7 lg:-mx-[3.75rem] lg:px-[3.75rem]"
      >
        {loading
          ? Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className={`shrink-0 rounded-2xl bg-white/5 border border-white/10 overflow-hidden animate-pulse ${
                  variant === 'continue' ? 'w-[260px] aspect-[1.75/1]' : 'w-[155px] sm:w-[180px] xl:w-[200px]'
                }`}
                style={variant === 'poster' ? { aspectRatio: '2 / 3.3' } : undefined}
              >
                <div className="h-3/4 w-full bg-white/10" />
                <div className="p-3 space-y-2">
                  <div className="h-3.5 w-4/5 bg-white/20 rounded" />
                  <div className="flex justify-between items-center">
                    <div className="h-2.5 w-1/3 bg-orange-400/20 rounded" />
                    <div className="h-2.5 w-1/4 bg-white/20 rounded" />
                  </div>
                </div>
              </div>
            ))
          : displayItems.map((item, index) =>
              variant === 'continue' ? (
                <Link
                  key={`${item.id}-${index}`}
                  to={`/watch/${item.mediaType}-${item.tmdbId}`}
                  className="group/continue relative h-[128px] w-[260px] shrink-0 snap-start overflow-hidden rounded-xl border border-white/[.09] bg-[#101724] shadow-[0_8px_25px_rgba(0,0,0,.2)] sm:w-[290px]"
                >
                  <img
                    src={item.posterUrl || POSTER_FALLBACK}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover opacity-75 transition duration-300 group-hover/continue:scale-105 group-hover/continue:opacity-95"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#080d17]/95 via-[#080d17]/52 to-transparent" />
                  <div className="relative flex h-full flex-col justify-end p-3">
                    <span className="line-clamp-1 text-xs font-bold text-white">{item.title}</span>
                    <span className="mt-1 text-[10px] text-slate-300">{progressById[item.id] || 0}% watched</span>
                    <span className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/20">
                      <span
                        className="block h-full bg-orange-400"
                        style={{ width: `${progressById[item.id] || 0}%` }}
                      />
                    </span>
                  </div>
                  <span className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-full bg-black/50 text-white opacity-80 backdrop-blur transition group-hover/continue:bg-orange-500 group-hover/continue:opacity-100">
                    <Play className="ml-0.5 h-3 w-3 fill-current" />
                  </span>
                </Link>
              ) : (
                <div key={`${item.id}-${index}`} className="w-[155px] shrink-0 snap-start sm:w-[180px] xl:w-[200px]">
                  <MovieCard movie={item} />
                </div>
              )
            )}
      </div>
    </section>
  );
}
