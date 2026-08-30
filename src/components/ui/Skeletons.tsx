/**
 * OrangeFlix Skeleton Loading Components
 * Provides cinematic, fluid pulse skeletons for Hero Stages, Detail Backdrops, Content Rails, and Cards.
 */

import { Skeleton } from './skeleton';

/**
 * 3D Stage Slider Hero Skeleton
 * Accurately mirrors the StageSlider and CountryStageSlider layout with 3D card staging placeholders.
 */
export function HeroSkeleton() {
  return (
    <section className="relative mx-auto max-w-[1600px] overflow-hidden border-b border-white/[.07] bg-[#080b12]">
      {/* Dark Ambient Backdrop Shimmer */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(249,115,22,0.08),transparent_60%),linear-gradient(180deg,#070a11_0%,#0e1422_100%)]" />

      <div className="relative grid min-h-[380px] sm:min-h-[460px] grid-cols-1 gap-4 px-4 py-6 sm:px-8 md:min-h-[500px] md:grid-cols-[minmax(265px,.64fr)_minmax(620px,1.36fr)] md:items-center md:gap-6 md:px-[clamp(2rem,5vw,5rem)] lg:h-[520px] lg:min-h-0">
        {/* Left Column: Metadata, Title & Actions Skeleton */}
        <div className="z-30 max-w-md md:pb-4 space-y-3">
          {/* Eyebrow */}
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-28 rounded-full bg-white/10" />
            <Skeleton className="h-4 w-16 rounded-full bg-orange-500/20" />
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Skeleton className="h-8 sm:h-12 w-4/5 rounded-xl bg-white/15" />
            <Skeleton className="h-7 sm:h-10 w-2/3 rounded-xl bg-white/10" />
          </div>

          {/* Meta Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Skeleton className="h-5 w-20 rounded-md bg-emerald-500/20" />
            <Skeleton className="h-5 w-14 rounded-md bg-white/10" />
            <Skeleton className="h-5 w-16 rounded-md bg-orange-500/20" />
            <Skeleton className="h-5 w-16 rounded-md bg-white/10" />
          </div>

          {/* Description Lines */}
          <div className="hidden sm:block space-y-2 pt-1">
            <Skeleton className="h-3.5 w-full rounded bg-white/10" />
            <Skeleton className="h-3.5 w-5/6 rounded bg-white/10" />
            <Skeleton className="h-3.5 w-3/4 rounded bg-white/10" />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <Skeleton className="h-10 w-32 rounded-xl bg-orange-500/40" />
            <Skeleton className="h-10 w-28 rounded-xl bg-white/10" />
          </div>
        </div>

        {/* Right Column: 3D Stage Cards Skeleton Staging */}
        <div className="relative flex h-[240px] sm:h-[360px] md:h-[440px] items-center justify-center overflow-hidden sm:overflow-visible">
          {/* Left Angled Card */}
          <div className="absolute h-[190px] w-[130px] sm:h-[300px] sm:w-[200px] md:h-[320px] md:w-[214px] -translate-x-[64%] sm:-translate-x-[72%] md:-translate-x-[102%] scale-[.72] sm:scale-[.76] md:scale-[.79] opacity-40 rounded-xl bg-white/5 border border-white/10 animate-pulse" />

          {/* Center Main Card */}
          <div className="relative h-[225px] w-[155px] sm:h-[370px] sm:w-[250px] md:h-[405px] md:w-[270px] z-20 rounded-xl bg-gradient-to-b from-white/15 to-white/5 border border-orange-500/40 shadow-2xl shadow-orange-500/10 animate-pulse overflow-hidden p-4 flex flex-col justify-end">
            <div className="space-y-2">
              <Skeleton className="h-4 w-3/4 bg-white/20" />
              <div className="flex justify-between">
                <Skeleton className="h-3 w-1/3 bg-orange-400/30" />
                <Skeleton className="h-3 w-1/4 bg-white/20" />
              </div>
            </div>
          </div>

          {/* Right Angled Card */}
          <div className="absolute h-[190px] w-[130px] sm:h-[300px] sm:w-[200px] md:h-[320px] md:w-[214px] translate-x-[64%] sm:translate-x-[72%] md:translate-x-[102%] scale-[.72] sm:scale-[.76] md:scale-[.79] opacity-40 rounded-xl bg-white/5 border border-white/10 animate-pulse" />
        </div>
      </div>
    </section>
  );
}

/**
 * Content Rail Skeleton with Card Placeholders
 */
export function ContentRailSkeleton({ title = 'Loading collection...' }: { title?: string }) {
  return (
    <section className="py-4 sm:py-6">
      <div className="mb-3 flex items-end justify-between gap-4">
        <div className="space-y-1.5">
          <Skeleton className="h-3.5 w-24 bg-orange-500/20 rounded" />
          <Skeleton className="h-6 w-44 bg-white/15 rounded-lg" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-full bg-white/10" />
          <Skeleton className="h-8 w-8 rounded-full bg-white/10" />
        </div>
      </div>

      <div className="scrollbar-hide -mx-4 flex gap-3 overflow-x-hidden px-4 pb-2 sm:-mx-7 sm:px-7">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="w-[155px] sm:w-[180px] xl:w-[200px] shrink-0 rounded-2xl bg-white/5 border border-white/10 overflow-hidden animate-pulse"
            style={{ aspectRatio: '2 / 3.3' }}
          >
            <div className="h-3/4 w-full bg-white/10" />
            <div className="p-3 space-y-2">
              <Skeleton className="h-3 w-4/5 bg-white/20" />
              <div className="flex justify-between items-center">
                <Skeleton className="h-2.5 w-1/3 bg-orange-400/20" />
                <Skeleton className="h-2.5 w-1/4 bg-white/20" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/**
 * Single Movie/Series Card Skeleton
 */
export function MovieCardSkeleton() {
  return (
    <div
      className="w-full rounded-2xl bg-white/5 border border-white/10 overflow-hidden animate-pulse"
      style={{ aspectRatio: '2 / 3.3' }}
    >
      <div className="h-3/4 w-full bg-white/10" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-3.5 w-4/5 bg-white/20" />
        <div className="flex justify-between items-center">
          <Skeleton className="h-2.5 w-1/3 bg-orange-400/20" />
          <Skeleton className="h-2.5 w-1/4 bg-white/20" />
        </div>
      </div>
    </div>
  );
}

/**
 * Grid of Movie Skeletons
 */
export function MovieGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <MovieCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Detail Page Hero Backdrop & Poster Skeleton
 */
export function DetailHeroSkeleton() {
  return (
    <div className="min-h-screen bg-gray-950 text-white animate-pulse">
      {/* Backdrop */}
      <div className="relative h-[28vh] sm:h-[50vh] md:h-[65vh] min-h-[160px] sm:min-h-[360px] md:min-h-[480px] w-full bg-white/5 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/70 to-transparent" />
      </div>

      <div className="page-wrap !pt-2 -mt-16 sm:-mt-44 md:-mt-72 relative z-10 space-y-6 sm:space-y-12 pb-16">
        <div className="flex flex-col md:flex-row gap-6 sm:gap-8 items-center md:items-start">
          {/* Poster */}
          <div className="w-48 sm:w-64 md:w-72 lg:w-80 shrink-0 aspect-[2/3] rounded-2xl bg-white/10 border border-orange-500/20 shadow-2xl" />

          {/* Details */}
          <div className="flex-1 w-full space-y-4">
            <div className="flex gap-2">
              <Skeleton className="h-6 w-20 rounded-full bg-orange-500/30" />
              <Skeleton className="h-6 w-16 rounded-full bg-white/10" />
              <Skeleton className="h-6 w-24 rounded-full bg-white/10" />
            </div>
            <Skeleton className="h-10 sm:h-14 w-3/4 bg-white/20 rounded-xl" />
            <Skeleton className="h-4 w-48 bg-orange-400/20 rounded" />
            <div className="flex gap-3 pt-2">
              <Skeleton className="h-11 w-36 bg-orange-500/40 rounded-xl" />
              <Skeleton className="h-11 w-36 bg-white/10 rounded-xl" />
            </div>
            <div className="space-y-2 pt-4">
              <Skeleton className="h-4 w-full bg-white/10 rounded" />
              <Skeleton className="h-4 w-5/6 bg-white/10 rounded" />
              <Skeleton className="h-4 w-2/3 bg-white/10 rounded" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Series Multi-Episode Playlist Skeleton
 */
export function SeriesPlaylistSkeleton() {
  return (
    <div className="space-y-3 pt-4">
      <div className="flex justify-between items-center">
        <Skeleton className="h-5 w-40 bg-white/15 rounded" />
        <Skeleton className="h-4 w-20 bg-white/10 rounded" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex gap-3 p-2.5 rounded-xl bg-white/5 border border-white/10 animate-pulse">
            <div className="w-28 sm:w-32 aspect-video bg-white/10 rounded-lg shrink-0" />
            <div className="flex-1 space-y-2 py-1">
              <Skeleton className="h-3.5 w-full bg-white/20 rounded" />
              <Skeleton className="h-3 w-1/2 bg-orange-400/20 rounded" />
              <Skeleton className="h-2.5 w-1/3 bg-white/10 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
