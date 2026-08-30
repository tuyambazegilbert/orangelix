/**
 * OrangeFlix Country Cinema StageSlider Hero
 * Matches the exact design, 3D carousel stages, animations, and typography of the Home Landing Page Hero.
 */

import { KeyboardEvent, useEffect, useRef, useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Info, Play, Star, Youtube, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import { GeoContentItem, GeoCountryConfig } from '@/types/geo-content';
import { getGeoTranslations } from '@/features/geo/translations';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CountryStageSliderProps {
  items: GeoContentItem[];
  country: GeoCountryConfig;
  language: string;
  allCountries: GeoCountryConfig[];
  onCountryChange: (countryCode: string) => void;
  onLanguageChange: (language: string) => void;
}

const circularIndex = (index: number, length: number) => (index + length) % length;

const stages = [
  { offset: -2, className: 'hidden xl:block xl:-translate-x-[190%] xl:scale-[.62] xl:opacity-30 xl:z-0' },
  { offset: -1, className: 'hidden md:block md:-translate-x-[102%] md:scale-[.79] md:opacity-60 md:z-10' },
  { offset: 0, className: 'translate-x-0 scale-100 opacity-100 z-30 ring-1 ring-orange-400/80 shadow-[0_18px_44px_rgba(0,0,0,.62)]' },
  { offset: 1, className: 'translate-x-[102%] scale-[.79] opacity-60 z-10 md:translate-x-[102%]' },
  { offset: 2, className: 'hidden xl:block xl:translate-x-[190%] xl:scale-[.62] xl:opacity-30 xl:z-0' },
];

export default function CountryStageSlider({
  items,
  country,
  language,
  allCountries,
  onCountryChange,
  onLanguageChange,
}: CountryStageSliderProps) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStart = useRef<number | null>(null);

  const featuredItems = useMemo(() => items.slice(0, 6), [items]);
  const count = featuredItems.length;
  const go = (amount: number) => setActive((current) => circularIndex(current + amount, count));
  const t = useMemo(() => getGeoTranslations(language), [language]);

  useEffect(() => {
    if (!count || paused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => go(1), 7000);
    return () => window.clearInterval(timer);
  }, [count, paused]);

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      go(-1);
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      go(1);
    }
  };

  if (!count) {
    return (
      <section className="relative overflow-hidden border-b border-white/[.07] bg-[radial-gradient(circle_at_78%_30%,rgba(249,115,22,.25),transparent_28%),linear-gradient(120deg,#080d1a,#10172b)] px-5 py-16 sm:px-10 lg:px-[clamp(2rem,8vw,10rem)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-4 max-w-xl">
            <p className="section-eyebrow text-orange-400 flex items-center gap-1.5">
              <span>{country.flagEmoji}</span> {country.name} Cinema
            </p>
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl">
              {t.watchMovies(country.name)}
            </h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              {t.discoverSubtitle(country.name)}
            </p>
          </div>

          {/* Country & Language Switchers */}
          <div className="flex flex-col sm:flex-row gap-3 shrink-0 bg-black/40 backdrop-blur-xl p-3.5 rounded-2xl border border-white/10">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider flex items-center gap-1">
                <Globe className="w-3 h-3 text-orange-400" /> Country
              </label>
              <Select value={country.countryCode} onValueChange={onCountryChange}>
                <SelectTrigger className="w-[150px] bg-gray-900/80 border-gray-700 text-xs text-white h-9">
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

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Language</label>
              <Select value={language} onValueChange={onLanguageChange}>
                <SelectTrigger className="w-[130px] bg-gray-900/80 border-gray-700 text-xs text-white h-9">
                  <SelectValue placeholder="Language" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-800 text-white">
                  <SelectItem value="rw" className="text-xs">🇷🇼 Kinyarwanda</SelectItem>
                  <SelectItem value="en" className="text-xs">🇬🇧 English</SelectItem>
                  <SelectItem value="fr" className="text-xs">🇫🇷 Français</SelectItem>
                  <SelectItem value="sw" className="text-xs">🇹🇿 Kiswahili</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const featured = featuredItems[active];
  const watchUrl = `/${country.countryCode.toLowerCase()}/movies/${featured.slug || featured.youtubeVideoId}`;
  const thumbnail = featured.thumbnail || featured.thumbnailUrl || `https://img.youtube.com/vi/${featured.youtubeVideoId}/hqdefault.jpg`;
  const score = featured.score ?? featured.classificationScore ?? 85;
  const matchPercent = Math.max(88, Math.min(99, Math.round(score * 1.05)));

  return (
    <section
      className="relative mx-auto max-w-[1600px] overflow-hidden border-b border-white/[.07] bg-[#080b12]"
      aria-roledescription="carousel"
      aria-label={`${country.name} Featured Cinema`}
      tabIndex={0}
      onKeyDown={onKeyDown}
      onTouchStart={(event) => {
        touchStart.current = event.touches[0].clientX;
        setPaused(true);
      }}
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
        src={thumbnail}
        alt={featured.title}
        className="absolute inset-0 h-full w-full object-cover object-[58%_center] opacity-75 blur-[1px] scale-105 transition-all duration-700"
      />

      {/* Cinematic Multi-stop Gradients */}
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,10,17,.92)_0%,rgba(7,10,17,.82)_35%,rgba(7,10,17,.22)_70%,rgba(7,10,17,.72)_100%),linear-gradient(0deg,rgba(7,10,17,.85)_0%,transparent_62%)]" />

      {/* Top Floating Country & Language Switchers */}
      <div className="absolute top-4 right-4 sm:right-8 z-40 hidden sm:flex items-center gap-2.5 bg-black/50 backdrop-blur-xl p-2 rounded-2xl border border-white/10 shadow-2xl">
        <Select value={country.countryCode} onValueChange={onCountryChange}>
          <SelectTrigger className="w-[140px] bg-gray-950/80 border-gray-700/80 text-xs text-white h-8">
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

        <Select value={language} onValueChange={onLanguageChange}>
          <SelectTrigger className="w-[125px] bg-gray-950/80 border-gray-700/80 text-xs text-white h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-gray-900 border-gray-800 text-white">
            <SelectItem value="rw" className="text-xs">🇷🇼 Kinyarwanda</SelectItem>
            <SelectItem value="en" className="text-xs">🇬🇧 English</SelectItem>
            <SelectItem value="fr" className="text-xs">🇫🇷 Français</SelectItem>
            <SelectItem value="sw" className="text-xs">🇹🇿 Kiswahili</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Main Grid Content Area */}
      <div className="relative grid min-h-[460px] grid-cols-1 gap-2 px-5 py-7 sm:px-8 md:min-h-[500px] md:grid-cols-[minmax(265px,.64fr)_minmax(620px,1.36fr)] md:items-center md:gap-6 md:px-[clamp(2rem,5vw,5rem)] lg:h-[520px] lg:min-h-0">
        {/* Left Column Text & Details */}
        <div className="z-30 max-w-md md:pb-4 space-y-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xl" role="img" aria-label={country.name}>{country.flagEmoji}</span>
            <p className="section-eyebrow text-orange-400 font-bold tracking-wider">
              {country.name} Cinema Spotlight
            </p>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black uppercase leading-[.92] tracking-[-.045em] text-white line-clamp-2">
            {featured.title}
          </h1>

          {/* Meta Bar */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs font-medium text-slate-200 pt-1">
            <span className="font-bold text-emerald-400">{matchPercent}% Match</span>
            <span className="inline-flex items-center gap-1 text-white">
              <Star className="h-3.5 w-3.5 fill-orange-400 text-orange-400" />
              {(score / 10).toFixed(1)}
            </span>
            <span>{new Date(featured.publishedAt).getFullYear() || '2026'}</span>
            <span className="rounded bg-orange-500/20 px-1.5 py-0.5 text-orange-300 font-semibold">
              {featured.isFullMovieCandidate ? 'Full Movie' : 'Series'}
            </span>
            <span className="font-mono text-slate-300">{featured.durationFormatted}</span>
          </div>

          <p className="text-xs font-medium text-orange-300 flex items-center gap-1.5">
            <Youtube className="w-3.5 h-3.5 text-red-500" />
            {featured.channelTitle}
          </p>

          <p className="line-clamp-3 max-w-md text-sm leading-5 text-slate-300 pt-1">
            {featured.description || 'Watch full authentic regional cinema directly on OrangeFlix.'}
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2.5 pt-2">
            <Link
              to={watchUrl}
              className="premium-button inline-flex h-10 items-center gap-2 rounded-lg px-5 text-xs font-bold shadow-lg shadow-orange-500/25"
            >
              <Play className="h-4 w-4 fill-current" />
              Play now
            </Link>

            <Link
              to={watchUrl}
              className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-white/[.15] bg-white/[.08] px-4 text-xs font-semibold text-white transition hover:bg-white/[.15] backdrop-blur-md"
            >
              <Info className="h-4 w-4" />
              More info
            </Link>
          </div>

          {/* Quality & Audio Badges */}
          <div className="flex flex-wrap items-center gap-1.5 text-[9px] text-slate-400 pt-1">
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

        {/* Right Column: 3D Stage Carousel Cards */}
        <div className="relative hidden h-[440px] items-center justify-center md:flex">
          {stages.map(({ offset, className }) => {
            const item = featuredItems[circularIndex(active + offset, count)];
            const current = offset === 0;
            const itemThumb = item.thumbnail || item.thumbnailUrl || `https://img.youtube.com/vi/${item.youtubeVideoId}/hqdefault.jpg`;
            const itemScore = item.score ?? item.classificationScore ?? 80;

            return (
              <button
                key={`${item.id}-${offset}`}
                onClick={() => setActive(circularIndex(active + offset, count))}
                onMouseEnter={current ? () => setPaused(true) : undefined}
                onMouseLeave={current ? () => setPaused(false) : undefined}
                className={`absolute h-[320px] w-[214px] overflow-hidden rounded-xl border border-white/[.12] bg-[#101724] text-left transition-[transform,opacity,filter] duration-500 ease-out ${className} ${
                  current ? 'h-[405px] w-[270px]' : 'hover:opacity-90'
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
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent px-4 pb-3.5 pt-14">
                    <span className="block truncate text-xs font-bold text-white">
                      {item.title}
                    </span>
                    <span className="mt-1 flex items-center justify-between text-[10px] text-orange-300">
                      <span>{(itemScore / 10).toFixed(1)} ★ · {item.durationFormatted}</span>
                      <span className="text-slate-400 font-normal truncate max-w-[100px]">{item.channelTitle}</span>
                    </span>
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom Pagination & Navigation Controls */}
        <div className="absolute bottom-4 left-5 z-40 flex items-center gap-2 md:left-[clamp(2rem,5vw,5rem)]">
          <button
            onClick={() => go(-1)}
            className="grid h-7 w-7 place-items-center rounded-full border border-white/[.15] bg-black/40 text-white transition hover:bg-white/[.15]"
            aria-label="Previous featured title"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {featuredItems.slice(0, Math.min(5, count)).map((_, index) => (
            <button
              key={index}
              onClick={() => setActive(index)}
              className={`h-1.5 rounded-full transition-all ${
                active === index ? 'w-6 bg-orange-400 shadow-sm shadow-orange-500/50' : 'w-1.5 bg-white/40'
              }`}
              aria-label={`Go to feature ${index + 1}`}
            />
          ))}

          <button
            onClick={() => go(1)}
            className="grid h-7 w-7 place-items-center rounded-full border border-white/[.15] bg-black/40 text-white transition hover:bg-white/[.15]"
            aria-label="Next featured title"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}

