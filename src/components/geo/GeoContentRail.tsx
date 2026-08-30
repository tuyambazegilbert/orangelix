/**
 * OrangeFlix Geo-Cinema Content Rail
 * World-class auto-scrolling horizontal rail for categorized regional cinema.
 * Features seamless infinite looping, zero-tremble smooth scroll, and clean hover pause.
 */

import { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { GeoContentItem } from '@/types/geo-content';
import CountryMovieCard from './CountryMovieCard';

interface GeoContentRailProps {
  title: string;
  eyebrow?: string;
  items: GeoContentItem[];
  countryCode: string;
  icon?: React.ReactNode;
  href?: string;
  onSeeAll?: () => void;
}

export default function GeoContentRail({
  title,
  eyebrow,
  items,
  countryCode,
  icon,
  href,
  onSeeAll,
}: GeoContentRailProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const pauseTimer = useRef<number | undefined>(undefined);

  const move = (direction: number, manual = true) => {
    const rail = ref.current;
    if (!rail) return;

    if (manual) {
      setPaused(true);
      window.clearTimeout(pauseTimer.current);
      pauseTimer.current = window.setTimeout(() => setPaused(false), 6500);
    }

    const amount = Math.max(rail.clientWidth * 0.72, 280);
    const half = rail.scrollWidth / 2;

    if (direction > 0 && rail.scrollLeft + amount >= half - 24) {
      rail.scrollTo({ left: 0, behavior: 'smooth' });
    } else if (direction < 0 && rail.scrollLeft <= 12) {
      rail.scrollTo({ left: Math.max(0, half - amount), behavior: 'smooth' });
    } else {
      rail.scrollBy({ left: direction * amount, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (!items || items.length < 2 || paused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const timer = window.setInterval(() => {
      move(1, false);
    }, 5200);

    return () => window.clearInterval(timer);
  }, [items.length, paused]);

  const pauseForInteraction = () => {
    setPaused(true);
    window.clearTimeout(pauseTimer.current);
    pauseTimer.current = window.setTimeout(() => setPaused(false), 6500);
  };

  if (!items || items.length === 0) return null;

  const displayItems = items.length > 1 ? [...items, ...items] : items;

  return (
    <section className="group/rail py-4 sm:py-6">
      {/* Header */}
      <div className="mb-3 flex items-end justify-between gap-4">
        <div>
          {eyebrow && (
            <p className="section-eyebrow mb-1 flex items-center gap-1">
              {icon || <Sparkles className="w-3 h-3" />}
              {eyebrow}
            </p>
          )}
          <h2 className="section-title flex items-center gap-2">
            {title}
            <span className="text-xs font-normal text-slate-500 font-mono">({items.length})</span>
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {href ? (
            <Link to={href} className="hidden text-xs font-semibold text-slate-400 transition hover:text-orange-400 sm:block mr-1">
              See all →
            </Link>
          ) : onSeeAll ? (
            <button
              onClick={onSeeAll}
              className="hidden text-xs font-semibold text-slate-400 transition hover:text-orange-400 sm:block mr-1"
            >
              See all →
            </button>
          ) : null}

          <button
            onClick={() => move(-1)}
            className="grid h-8 w-8 place-items-center rounded-full border border-white/[.1] bg-white/[.035] text-slate-300 transition hover:border-white/20 hover:bg-white/[.1] hover:text-white"
            aria-label={`Scroll ${title} left`}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => move(1)}
            className="grid h-8 w-8 place-items-center rounded-full border border-white/[.1] bg-white/[.035] text-slate-300 transition hover:border-white/20 hover:bg-white/[.1] hover:text-white"
            aria-label={`Scroll ${title} right`}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Infinite Smooth Scroll Container */}
      <div
        ref={ref}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocusCapture={pauseForInteraction}
        onPointerDown={pauseForInteraction}
        className="scrollbar-hide -mx-4 flex snap-x snap-mandatory gap-3.5 overflow-x-auto px-4 pb-2 sm:-mx-7 sm:px-7 lg:-mx-[3.75rem] lg:px-[3.75rem]"
      >
        {displayItems.map((movie, index) => (
          <div
            key={`${movie.id}-${index}`}
            className="w-[240px] sm:w-[270px] md:w-[290px] shrink-0 snap-start"
          >
            <CountryMovieCard movie={movie} countryCode={countryCode} />
          </div>
        ))}
      </div>
    </section>
  );
}
