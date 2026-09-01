import { KeyboardEvent, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Info, Play, Star, Calendar } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { MediaItem } from '@/types/media';
import { BACKDROP_FALLBACK, POSTER_FALLBACK } from '@/lib/tmdb/images';

interface StageSliderProps { items: MediaItem[]; }

const circularIndex = (index: number, length: number) => (index + length) % length;
const detailPath = (item: MediaItem) => `/${item.mediaType === 'tv' ? 'series' : 'movie'}/${item.tmdbId}`;
const watchPath = (item: MediaItem) => `/watch/${item.mediaType}-${item.tmdbId}`;

const stages = [
  { offset: -2, className: 'hidden xl:block xl:-translate-x-[190%] xl:scale-[.62] xl:opacity-30 xl:z-0' },
  { offset: -1, className: '-translate-x-[64%] sm:-translate-x-[72%] md:-translate-x-[102%] scale-[.72] sm:scale-[.76] md:scale-[.79] opacity-45 sm:opacity-55 md:opacity-60 z-10' },
  { offset: 0, className: 'translate-x-0 scale-100 opacity-100 z-30 ring-1 ring-orange-400/80 shadow-[0_18px_44px_rgba(0,0,0,.62)]' },
  { offset: 1, className: 'translate-x-[64%] sm:translate-x-[72%] md:translate-x-[102%] scale-[.72] sm:scale-[.76] md:scale-[.79] opacity-45 sm:opacity-55 md:opacity-60 z-10' },
  { offset: 2, className: 'hidden xl:block xl:translate-x-[190%] xl:scale-[.62] xl:opacity-30 xl:z-0' },
];

export default function StageSlider({ items }: StageSliderProps) {
  const navigate = useNavigate();
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStart = useRef<number | null>(null);
  const count = items.length;
  const go = (amount: number) => setActive((current) => circularIndex(current + amount, count));

  useEffect(() => {
    if (!count || paused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => go(1), 7000);
    return () => window.clearInterval(timer);
  }, [count, paused]);

  if (!count) return null;
  const featured = items[active];
  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); go(-1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); go(1); }
  };

  const releaseDisplay = featured.releaseDate || (featured.releaseYear ? `${featured.releaseYear}` : '2024');
  const featuredCountryLabel = (featured as MediaItem & { _countryLabel?: string })._countryLabel;

  return (
    <section
      className="relative mx-auto max-w-[1600px] overflow-hidden border-b border-white/[.07] bg-[#080b12]"
      aria-roledescription="carousel"
      aria-label="Featured titles"
      tabIndex={0}
      onKeyDown={onKeyDown}
      onTouchStart={(event) => { touchStart.current = event.touches[0].clientX; setPaused(true); }}
      onTouchEnd={(event) => {
        const start = touchStart.current;
        if (start === null) return;
        const distance = event.changedTouches[0].clientX - start;
        if (Math.abs(distance) > 35) go(distance > 0 ? -1 : 1);
        touchStart.current = null;
        setPaused(false);
      }}
    >
      <img
        src={featured.backdropUrl || BACKDROP_FALLBACK}
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-[58%_center] opacity-65"
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,10,17,.92)_0%,rgba(7,10,17,.80)_35%,rgba(7,10,17,.30)_70%,rgba(7,10,17,.72)_100%),linear-gradient(0deg,rgba(7,10,17,.85)_0%,transparent_62%)]" />

      {/* Main Grid: Card Staging visible on ALL screens (including mobile) */}
      <div className="relative grid min-h-[380px] sm:min-h-[460px] grid-cols-1 gap-4 px-4 py-4 sm:px-8 md:min-h-[500px] md:grid-cols-[minmax(265px,.64fr)_minmax(620px,1.36fr)] md:items-center md:gap-6 md:px-[clamp(2rem,5vw,5rem)] lg:h-[520px] lg:min-h-0">
        
        {/* Text & Quick Actions */}
        <div className="z-30 max-w-md md:pb-4 space-y-2">
          <p className="section-eyebrow mb-1">OrangeFlix original</p>
          <h1 className="text-2xl sm:text-5xl lg:text-6xl font-black uppercase leading-[.92] tracking-[-.045em] text-white">
            {featured.title}
          </h1>

          {/* Meta with Release Date */}
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs font-medium text-slate-200 pt-0.5">
            <span className="font-bold text-emerald-400">
              {Math.max(82, Math.round(featured.voteAverage * 10))}% Match
            </span>
            <span className="inline-flex items-center gap-1 text-white">
              <Star className="h-3.5 w-3.5 fill-orange-400 text-orange-400" />
              {featured.voteAverage.toFixed(1)}
            </span>
            <span className="inline-flex items-center gap-1 text-slate-300">
              <Calendar className="h-3 w-3 text-orange-400" />
              {releaseDisplay}
            </span>
            <span className="rounded bg-white/10 px-1.5 py-0.5 text-[11px] font-semibold">
              {featured.mediaType === 'tv' ? 'Series' : 'Movie'}
            </span>
            {featuredCountryLabel && (
              <span className="rounded border border-orange-400/40 bg-orange-500/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-orange-200">
                {featuredCountryLabel}
              </span>
            )}
            {featured.duration && <span className="font-mono text-slate-300">{featured.duration} min</span>}
          </div>

          {/* Genres */}
          <p className="text-xs font-medium text-slate-300">
            {featured.genres?.slice(0, 2).join(' · ') || 'Drama · Science Fiction'}
          </p>

          {/* Long Description (Condensed on mobile to prioritize the visual 3D cards) */}
          <p className="hidden sm:line-clamp-2 md:line-clamp-3 max-w-md text-xs sm:text-sm leading-5 text-slate-200">
            {featured.description}
          </p>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-1.5">
            <Link
              to={watchPath(featured)}
              className="premium-button inline-flex h-9 items-center gap-1.5 rounded-lg px-4 text-xs font-bold shadow-md shadow-orange-500/20"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              Play now
            </Link>
            <Link
              to={detailPath(featured)}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/[.15] bg-white/[.08] px-3.5 text-xs font-semibold text-white transition hover:bg-white/[.15]"
            >
              <Info className="h-4 w-4" />
              More info
            </Link>
          </div>

          {/* Badges */}
          <div className="hidden sm:flex flex-wrap items-center gap-1.5 text-[9px] text-slate-400 pt-1">
            <span>Available in</span>
            <span className="rounded border border-white/[.14] px-1.5 py-0.5 font-semibold text-slate-300">4K UHD</span>
            <span className="rounded border border-white/[.14] px-1.5 py-0.5 font-semibold text-slate-300">Dolby Atmos</span>
            <span className="rounded border border-orange-400/35 px-1.5 py-0.5 font-semibold text-orange-200">HDR10+</span>
          </div>
        </div>

        {/* 3D Stage Carousel Cards: Left, Center & Right Cards Staged for Mobile & Desktop */}
        <div className="relative flex h-[240px] sm:h-[360px] md:h-[440px] items-center justify-center overflow-hidden sm:overflow-visible">
          {stages.map(({ offset, className }) => {
            const item = items[circularIndex(active + offset, count)];
            const current = offset === 0;
            const itemRelease = item.releaseDate || (item.releaseYear ? `${item.releaseYear}` : '2024');
            const itemCountryLabel = (item as MediaItem & { _countryLabel?: string })._countryLabel;

            return (
              <button
                key={`${item.id}-${offset}`}
                onClick={() => {
                  if (current) {
                    navigate(watchPath(item));
                  } else {
                    setActive(circularIndex(active + offset, count));
                  }
                }}
                onMouseEnter={current ? () => setPaused(true) : undefined}
                onMouseLeave={current ? () => setPaused(false) : undefined}
                className={`absolute h-[190px] w-[130px] sm:h-[300px] sm:w-[200px] md:h-[320px] md:w-[214px] overflow-hidden rounded-xl border border-white/[.12] bg-[#101724] text-left transition-[transform,opacity,filter] duration-500 ease-out cursor-pointer group/card ${className} ${
                  current
                    ? 'h-[225px] w-[155px] sm:h-[370px] sm:w-[250px] md:h-[405px] md:w-[270px] ring-2 ring-orange-500/80 shadow-[0_20px_50px_rgba(249,115,22,0.3)]'
                    : 'hover:opacity-90'
                }`}
                aria-current={current ? 'true' : undefined}
                aria-label={current ? `Watch ${item.title}` : `Show ${item.title}`}
              >
                <img
                  src={item.posterUrl || POSTER_FALLBACK}
                  alt={item.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover/card:scale-105"
                />

                {current && (
                  <>
                    {/* Animated Center Play Button Overlay on Hover */}
                    <div className="absolute inset-0 bg-black/45 backdrop-blur-[1px] opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-2">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-orange-600 to-amber-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/50 transform scale-90 group-hover/card:scale-100 transition-transform duration-300">
                        <Play className="w-6 h-6 sm:w-8 sm:h-8 fill-current ml-0.5" />
                      </div>
                      <span className="text-xs sm:text-sm font-bold text-white tracking-wide uppercase drop-shadow-md">
                        Watch Now
                      </span>
                    </div>

                    <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent px-3 pb-2.5 pt-10 sm:px-4 sm:pb-3.5 sm:pt-14">
                      <span className="block truncate text-xs font-bold text-white">
                        {item.title}
                      </span>
                      {itemCountryLabel && (
                        <span className="mt-1 inline-block rounded bg-orange-500/90 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-[0.08em] text-white">
                          {itemCountryLabel}
                        </span>
                      )}
                      <span className="mt-0.5 flex items-center justify-between text-[10px] text-orange-300">
                        <span>{item.voteAverage.toFixed(1)} ★</span>
                        <span className="text-slate-300 font-normal">{itemRelease}</span>
                      </span>
                    </span>
                  </>
                )}
              </button>
            );
          })}
        </div>

        {/* Carousel Pagination Dots */}
        <div className="absolute bottom-3 left-4 z-40 flex items-center gap-2 sm:left-8 md:left-[clamp(2rem,5vw,5rem)]">
          <button
            onClick={() => go(-1)}
            className="grid h-6 w-6 place-items-center rounded-full border border-white/[.15] bg-black/40 text-white transition hover:bg-white/[.15]"
            aria-label="Previous featured title"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          {items.slice(0, Math.min(5, count)).map((_, index) => (
            <button
              key={index}
              onClick={() => setActive(index)}
              className={`h-1 rounded-full transition-all ${
                active === index ? 'w-5 bg-orange-400' : 'w-1 bg-white/40'
              }`}
              aria-label={`Go to feature ${index + 1}`}
            />
          ))}
          <button
            onClick={() => go(1)}
            className="grid h-6 w-6 place-items-center rounded-full border border-white/[.15] bg-black/40 text-white transition hover:bg-white/[.15]"
            aria-label="Next featured title"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </section>
  );
}
