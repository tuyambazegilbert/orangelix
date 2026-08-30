/**
 * OrangeFlix Country-Specific 3D Stage Slider Hero
 * Features 3D carousel visible on both mobile and desktop with release dates and country switcher.
 */

import { KeyboardEvent, useEffect, useRef, useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Info, Play, Star, Globe, Youtube, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { GeoContentItem, GeoCountryConfig } from '@/types/geo-content';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getGeoTranslations } from '@/features/geo/translations';

export type SupportedLanguage = 'rw' | 'en' | 'fr' | 'sw';

interface CountryStageSliderProps {
  items: GeoContentItem[];
  country: GeoCountryConfig;
  language?: SupportedLanguage;
  allCountries: GeoCountryConfig[];
  onCountryChange?: (code: string) => void;
  onLanguageChange?: (lang: SupportedLanguage) => void;
}

const circularIndex = (index: number, length: number) => (index + length) % length;

const stages = [
  { offset: -2, className: 'hidden xl:block xl:-translate-x-[190%] xl:scale-[.62] xl:opacity-30 xl:z-0' },
  { offset: -1, className: 'hidden sm:block -translate-x-[70%] md:-translate-x-[102%] scale-[.75] md:scale-[.79] opacity-50 md:opacity-60 z-10' },
  { offset: 0, className: 'translate-x-0 scale-100 opacity-100 z-30 ring-1 ring-orange-400/80 shadow-[0_18px_44px_rgba(0,0,0,.62)]' },
  { offset: 1, className: 'hidden sm:block translate-x-[70%] md:translate-x-[102%] scale-[.75] md:scale-[.79] opacity-50 md:opacity-60 z-10' },
  { offset: 2, className: 'hidden xl:block xl:translate-x-[190%] xl:scale-[.62] xl:opacity-30 xl:z-0' },
];

export default function CountryStageSlider({
  items,
  country,
  language = 'rw',
  allCountries,
  onCountryChange,
  onLanguageChange,
}: CountryStageSliderProps) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStart = useRef<number | null>(null);

  const featuredItems = useMemo(() => {
    if (!items || items.length === 0) return [];
    return items.slice(0, 8);
  }, [items]);

  const count = featuredItems.length;
  const go = (amount: number) => setActive((current) => circularIndex(current + amount, count));

  useEffect(() => {
    if (!count || paused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => go(1), 7000);
    return () => window.clearInterval(timer);
  }, [count, paused]);

  if (!count) {
    const t = getGeoTranslations(language);
    return (
      <section className="relative mx-auto max-w-[1600px] overflow-hidden border-b border-white/[.07] bg-[#080b12] px-5 py-12 sm:px-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="text-2xl" role="img" aria-label={country.name}>{country.flagEmoji}</span>
              <p className="section-eyebrow text-orange-400">{country.name} Cinema</p>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
              {t.watchMovies(country.name)}
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              {t.discoverSubtitle(country.name)}
            </p>
          </div>

          {/* Country Switcher */}
          <div className="flex items-center gap-2 shrink-0 bg-black/40 backdrop-blur-xl p-2.5 rounded-2xl border border-white/10">
            <Select value={country.countryCode} onValueChange={onCountryChange}>
              <SelectTrigger className="w-[140px] bg-gray-900/80 border-gray-700 text-xs text-white h-8">
                <SelectValue placeholder="Country" />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-800 text-white">
                {allCountries.map((c) => (
                  <SelectItem key={c.countryCode} value={c.countryCode} className="text-xs">
                    {c.flagEmoji} {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>
    );
  }

  const featured = featuredItems[active];
  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); go(-1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); go(1); }
  };

  const backdrop = featured.thumbnail || featured.thumbnailUrl || `https://img.youtube.com/vi/${featured.youtubeVideoId}/maxresdefault.jpg`;
  const watchUrl = `/${(featured.country || country.countryCode).toLowerCase()}/movies/${featured.slug || featured.id}`;
  const score = featured.score ?? featured.classificationScore ?? 85;
  const matchPercent = Math.min(99, Math.max(78, score));

  // Release Date
  const releaseYear = featured.publishedAt ? new Date(featured.publishedAt).getFullYear() : '2026';
  const releaseDateFormatted = featured.publishedAt
    ? new Date(featured.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '2026';

  return (
    <section
      className="relative mx-auto max-w-[1600px] overflow-hidden border-b border-white/[.07] bg-[#080b12]"
      aria-roledescription="carousel"
      aria-label={`${country.name} Cinema Highlights`}
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
      {/* Background Backdrop Image */}
      <img
        src={backdrop}
        alt={featured.title}
        className="absolute inset-0 h-full w-full object-cover object-[58%_center] opacity-65"
      />

      {/* Cinematic Gradients */}
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,10,17,.92)_0%,rgba(7,10,17,.80)_35%,rgba(7,10,17,.30)_70%,rgba(7,10,17,.72)_100%),linear-gradient(0deg,rgba(7,10,17,.85)_0%,transparent_62%)]" />

      {/* Top Floating Country Switcher */}
      <div className="absolute top-3 right-3 sm:right-6 z-40 flex items-center gap-2 bg-black/60 backdrop-blur-xl p-1.5 rounded-xl border border-white/10 shadow-xl">
        <Select value={country.countryCode} onValueChange={onCountryChange}>
          <SelectTrigger className="w-[125px] sm:w-[140px] bg-gray-950/80 border-gray-700/80 text-xs text-white h-7 sm:h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-gray-900 border-gray-800 text-white">
            {allCountries.map((c) => (
              <SelectItem key={c.countryCode} value={c.countryCode} className="text-xs">
                {c.flagEmoji} {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Main Grid Content Area: Visible 3D Cards on ALL screen sizes */}
      <div className="relative grid min-h-[380px] sm:min-h-[460px] grid-cols-1 gap-4 px-4 py-5 sm:px-8 md:min-h-[500px] md:grid-cols-[minmax(265px,.64fr)_minmax(620px,1.36fr)] md:items-center md:gap-6 md:px-[clamp(2rem,5vw,5rem)] lg:h-[520px] lg:min-h-0">
        {/* Left Column Text & Details */}
        <div className="z-30 max-w-md md:pb-4 space-y-2">
          <div className="flex items-center gap-1.5">
            <span className="text-lg" role="img" aria-label={country.name}>{country.flagEmoji}</span>
            <p className="section-eyebrow text-orange-400 font-bold tracking-wider">
              {country.name} Cinema Spotlight
            </p>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black uppercase leading-[.92] tracking-[-.045em] text-white line-clamp-2">
            {featured.title}
          </h1>

          {/* Meta Bar with Release Date */}
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs font-medium text-slate-200 pt-0.5">
            <span className="font-bold text-emerald-400">{matchPercent}% Match</span>
            <span className="inline-flex items-center gap-1 text-white">
              <Star className="h-3.5 w-3.5 fill-orange-400 text-orange-400" />
              {(score / 10).toFixed(1)}
            </span>
            <span className="inline-flex items-center gap-1 text-slate-300">
              <Calendar className="h-3 w-3 text-orange-400" />
              {releaseDateFormatted}
            </span>
            <span className="rounded bg-orange-500/20 px-1.5 py-0.5 text-orange-300 font-semibold text-[11px]">
              {featured.isFullMovieCandidate ? 'Full Movie' : 'Series'}
            </span>
            <span className="font-mono text-slate-300">{featured.durationFormatted}</span>
          </div>

          <p className="text-xs font-medium text-orange-300 flex items-center gap-1.5">
            <Youtube className="w-3.5 h-3.5 text-red-500" />
            {featured.channelTitle}
          </p>

          {/* Description: Hidden on small mobile to give room to the 3D card carousel */}
          <p className="hidden sm:line-clamp-2 md:line-clamp-3 max-w-md text-xs sm:text-sm leading-5 text-slate-300 pt-0.5">
            {featured.description || 'Watch full authentic regional cinema directly on OrangeFlix.'}
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 pt-1.5">
            <Link
              to={watchUrl}
              className="premium-button inline-flex h-9 items-center gap-2 rounded-lg px-4 text-xs font-bold shadow-md shadow-orange-500/20"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              Play now
            </Link>

            <Link
              to={watchUrl}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/[.15] bg-white/[.08] px-3.5 text-xs font-semibold text-white transition hover:bg-white/[.15] backdrop-blur-md"
            >
              <Info className="h-4 w-4" />
              More info
            </Link>
          </div>

          {/* Quality & Audio Badges */}
          <div className="hidden sm:flex flex-wrap items-center gap-1.5 text-[9px] text-slate-400 pt-1">
            <span>Streamed via</span>
            <span className="rounded border border-red-500/30 bg-red-500/10 px-1.5 py-0.5 font-semibold text-red-300 flex items-center gap-1">
              <Youtube className="w-2.5 h-2.5" /> Official YouTube Embed
            </span>
            <span className="rounded border border-white/[.14] px-1.5 py-0.5 font-semibold text-slate-300">
              HD
            </span>
            <span className="rounded border border-orange-400/35 px-1.5 py-0.5 font-semibold text-orange-200">
              Verified Cinema
            </span>
          </div>
        </div>

        {/* Right Column: 3D Stage Carousel Cards (Visible & Scaled on Mobile) */}
        <div className="relative flex h-[260px] sm:h-[360px] md:h-[440px] items-center justify-center">
          {stages.map(({ offset, className }) => {
            const item = featuredItems[circularIndex(active + offset, count)];
            const current = offset === 0;
            const itemThumb = item.thumbnail || item.thumbnailUrl || `https://img.youtube.com/vi/${item.youtubeVideoId}/hqdefault.jpg`;
            const itemScore = item.score ?? item.classificationScore ?? 80;
            const itemYear = item.publishedAt ? new Date(item.publishedAt).getFullYear() : '2026';

            return (
              <button
                key={`${item.id}-${offset}`}
                onClick={() => setActive(circularIndex(active + offset, count))}
                onMouseEnter={current ? () => setPaused(true) : undefined}
                onMouseLeave={current ? () => setPaused(false) : undefined}
                className={`absolute h-[220px] w-[150px] sm:h-[300px] sm:w-[200px] md:h-[320px] md:w-[214px] overflow-hidden rounded-xl border border-white/[.12] bg-[#101724] text-left transition-[transform,opacity,filter] duration-500 ease-out ${className} ${
                  current ? 'h-[250px] w-[170px] sm:h-[370px] sm:w-[250px] md:h-[405px] md:w-[270px]' : 'hover:opacity-90'
                }`}
                aria-current={current ? 'true' : undefined}
                aria-label={`Show ${item.title}`}
              >
                <img
                  src={itemThumb}
                  alt={item.title}
                  className="h-full w-full object-cover"
                />

                {current && (
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent px-3 pb-2.5 pt-10 sm:px-4 sm:pb-3.5 sm:pt-14">
                    <span className="block truncate text-xs font-bold text-white">
                      {item.title}
                    </span>
                    <span className="mt-0.5 flex items-center justify-between text-[10px] text-orange-300">
                      <span>{(itemScore / 10).toFixed(1)} ★ · {item.durationFormatted}</span>
                      <span className="text-slate-300 font-normal">{itemYear}</span>
                    </span>
                  </span>
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
          {featuredItems.slice(0, Math.min(5, count)).map((_, index) => (
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
