/**
 * OrangeFlix Skeleton Loading Components (Studio Pro Edition)
 * Provides bespoke, fluid pulse & shimmer skeletons matching the exact design system
 * across all public pages (Home, Movies, Series, Watch, Soundtracks, News, Books, Countries, Search, Details).
 */

import { Skeleton } from './skeleton';
import { Sparkles, Disc3, BookOpen, Newspaper, Globe, Film, Search, Tv } from 'lucide-react';

/**
 * 1. 3D Stage Slider Hero Skeleton
 * Accurately mirrors StageSlider and CountryStageSlider layout with 3D card staging placeholders.
 */
export function HeroSkeleton() {
  return (
    <section className="relative mx-auto max-w-[1720px] overflow-hidden border-b border-white/[.07] bg-[#080b12]">
      {/* Dark Ambient Backdrop Shimmer */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(249,115,22,0.12),transparent_60%),linear-gradient(180deg,#070a11_0%,#0c121e_100%)]" />

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
          <div className="absolute h-[190px] w-[130px] sm:h-[300px] sm:w-[200px] md:h-[320px] md:w-[214px] -translate-x-[64%] sm:-translate-x-[72%] md:-translate-x-[102%] scale-[.72] sm:scale-[.76] md:scale-[.79] opacity-40 rounded-2xl bg-white/5 border border-white/10 animate-pulse" />

          {/* Center Main Card */}
          <div className="relative h-[225px] w-[155px] sm:h-[370px] sm:w-[250px] md:h-[405px] md:w-[270px] z-20 rounded-2xl bg-gradient-to-b from-white/15 to-white/5 border border-orange-500/40 shadow-2xl shadow-orange-500/10 animate-pulse overflow-hidden p-4 flex flex-col justify-end">
            <div className="space-y-2">
              <Skeleton className="h-4 w-3/4 bg-white/20" />
              <div className="flex justify-between">
                <Skeleton className="h-3 w-1/3 bg-orange-400/30" />
                <Skeleton className="h-3 w-1/4 bg-white/20" />
              </div>
            </div>
          </div>

          {/* Right Angled Card */}
          <div className="absolute h-[190px] w-[130px] sm:h-[300px] sm:w-[200px] md:h-[320px] md:w-[214px] translate-x-[64%] sm:translate-x-[72%] md:translate-x-[102%] scale-[.72] sm:scale-[.76] md:scale-[.79] opacity-40 rounded-2xl bg-white/5 border border-white/10 animate-pulse" />
        </div>
      </div>
    </section>
  );
}

/**
 * 2. Content Rail Skeleton with Card Placeholders
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
 * 3. Single Movie/Series Card Skeleton
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
 * 4. Grid of Movie Skeletons
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
 * 5. Detail Page Hero Backdrop & Poster Skeleton
 */
export function DetailHeroSkeleton() {
  return (
    <div className="min-h-screen bg-[#070b14] text-white animate-pulse">
      {/* Backdrop */}
      <div className="relative h-[28vh] sm:h-[50vh] md:h-[65vh] min-h-[160px] sm:min-h-[360px] md:min-h-[480px] w-full bg-white/5 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-[#070b14] via-[#070b14]/70 to-transparent" />
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
 * 6. Watch Page Full Skeleton (12-Column Cinema Architecture)
 * Accurately mirrors /watch/:id with player, metadata bar, where to watch, and queue.
 */
export function WatchPageSkeleton() {
  return (
    <main className="max-w-[1720px] mx-auto px-3 sm:px-5 lg:px-8 pt-3 sm:pt-4 space-y-6 animate-pulse">
      {/* Top Breadcrumb & Metadata skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-20 bg-white/10 rounded" />
          <Skeleton className="h-4 w-4 bg-white/10 rounded" />
          <Skeleton className="h-4 w-32 bg-orange-400/20 rounded" />
        </div>
        <Skeleton className="h-6 w-24 rounded-full bg-white/10" />
      </div>

      {/* 12-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 xl:gap-8 items-start">
        {/* Left 8 Columns: Cinema Player & Primary Content */}
        <div className="lg:col-span-8 space-y-5">
          {/* Cinema Player Viewport */}
          <div className="relative aspect-video w-full rounded-2xl sm:rounded-3xl bg-white/10 border border-white/15 overflow-hidden shadow-2xl flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 animate-pulse">
              <Film className="w-8 h-8" />
            </div>
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
              <Skeleton className="h-3 w-32 bg-white/20 rounded" />
              <Skeleton className="h-3 w-20 bg-white/20 rounded" />
            </div>
          </div>

          {/* Title & Star Rating Bar */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <Skeleton className="h-8 sm:h-10 w-3/5 bg-white/20 rounded-xl" />
              <Skeleton className="h-7 w-24 bg-orange-500/20 rounded-lg" />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Skeleton className="h-5 w-20 rounded-md bg-white/10" />
              <Skeleton className="h-5 w-16 rounded-md bg-white/10" />
              <Skeleton className="h-5 w-24 rounded-md bg-orange-500/20" />
              <Skeleton className="h-5 w-28 rounded-md bg-white/10" />
            </div>
          </div>

          {/* Action Buttons Cluster */}
          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <Skeleton className="h-10 w-28 rounded-xl bg-orange-500/30" />
            <Skeleton className="h-10 w-28 rounded-xl bg-white/10" />
            <Skeleton className="h-10 w-36 rounded-xl bg-white/10" />
            <Skeleton className="h-10 w-24 rounded-xl bg-white/10" />
          </div>

          {/* Synopsis */}
          <div className="rounded-2xl border border-white/[.08] bg-white/[.02] p-4 sm:p-5 space-y-2">
            <Skeleton className="h-4 w-32 bg-white/20 rounded" />
            <Skeleton className="h-3.5 w-full bg-white/10 rounded" />
            <Skeleton className="h-3.5 w-5/6 bg-white/10 rounded" />
            <Skeleton className="h-3.5 w-2/3 bg-white/10 rounded" />
          </div>

          {/* Where to Watch Banner */}
          <div className="rounded-2xl border border-white/[.08] bg-white/[.03] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-44 bg-orange-400/20 rounded" />
              <Skeleton className="h-4 w-20 bg-white/10 rounded" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-10 w-10 rounded-xl bg-white/10" />
              <Skeleton className="h-10 w-10 rounded-xl bg-white/10" />
              <Skeleton className="h-10 w-10 rounded-xl bg-white/10" />
            </div>
          </div>
        </div>

        {/* Right 4 Columns: Up Next / Season Queue */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between pb-1">
            <Skeleton className="h-5 w-32 bg-white/20 rounded-lg" />
            <Skeleton className="h-4 w-16 bg-white/10 rounded" />
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-3 p-3 rounded-2xl bg-white/[.03] border border-white/[.07]">
              <div className="w-24 sm:w-28 aspect-video bg-white/10 rounded-xl shrink-0" />
              <div className="flex-1 space-y-2 py-0.5 min-w-0">
                <Skeleton className="h-3.5 w-4/5 bg-white/20 rounded" />
                <Skeleton className="h-3 w-1/2 bg-orange-400/20 rounded" />
                <Skeleton className="h-2.5 w-1/3 bg-white/10 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

/**
 * 7. Series Multi-Episode Playlist Skeleton
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

/**
 * 8. Studio Soundtrack & Music Skeleton
 * Matches /music and /music/movie/:id studio hub.
 */
export function SoundtrackSkeleton() {
  return (
    <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 animate-pulse">
      {/* Studio Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-white/[.09] bg-gradient-to-r from-gray-900/90 via-[#0d121f]/95 to-[#170e24]/90 p-6 sm:p-8">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 lg:gap-8">
          {/* Vinyl Mockup */}
          <div className="relative w-44 h-44 sm:w-52 sm:h-52 rounded-2xl bg-white/10 border border-white/15 shrink-0 flex items-center justify-center">
            <Disc3 className="w-16 h-16 text-orange-400/40 animate-spin" />
          </div>

          {/* Details & Deck */}
          <div className="flex-1 w-full space-y-3 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <Skeleton className="h-5 w-28 rounded-full bg-orange-500/20" />
              <Skeleton className="h-5 w-20 rounded-full bg-white/10" />
            </div>
            <Skeleton className="h-8 sm:h-12 w-3/4 mx-auto md:mx-0 bg-white/20 rounded-xl" />
            <Skeleton className="h-4 w-44 mx-auto md:mx-0 bg-orange-400/20 rounded" />
            <div className="flex items-center justify-center md:justify-start gap-3 pt-2">
              <Skeleton className="h-10 w-36 rounded-xl bg-orange-500/40" />
              <Skeleton className="h-10 w-28 rounded-xl bg-white/10" />
            </div>
          </div>
        </div>
      </div>

      {/* Tracklist Rows */}
      <div className="space-y-3">
        <div className="flex justify-between items-center pb-2 border-b border-white/[.08]">
          <Skeleton className="h-5 w-40 bg-white/20 rounded" />
          <Skeleton className="h-4 w-24 bg-white/10 rounded" />
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[.03] border border-white/[.06]">
            <div className="flex items-center gap-3 min-w-0">
              <Skeleton className="h-10 w-10 rounded-xl bg-white/10 shrink-0" />
              <div className="space-y-1.5">
                <Skeleton className="h-3.5 w-48 bg-white/20 rounded" />
                <Skeleton className="h-3 w-28 bg-orange-400/20 rounded" />
              </div>
            </div>
            <Skeleton className="h-3 w-12 bg-white/10 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * 9. News & Cinema Editorial Skeleton
 * Matches /news and /news/:slug layout.
 */
export function NewsSkeleton() {
  return (
    <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 animate-pulse">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/[.08] pb-6">
        <div className="space-y-2">
          <Skeleton className="h-5 w-48 rounded-full bg-orange-500/20" />
          <Skeleton className="h-9 sm:h-12 w-80 bg-white/20 rounded-xl" />
          <Skeleton className="h-4 w-96 bg-white/10 rounded" />
        </div>
        <Skeleton className="h-11 w-full md:w-80 rounded-xl bg-white/10" />
      </div>

      {/* Category Pills */}
      <div className="flex gap-2 overflow-x-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-24 rounded-full bg-white/10 shrink-0" />
        ))}
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Hero Story */}
        <div className="lg:col-span-8 rounded-3xl bg-white/[.04] border border-white/[.08] aspect-video sm:aspect-[16/9] p-6 flex flex-col justify-end space-y-3">
          <Skeleton className="h-5 w-24 rounded-full bg-orange-500/30" />
          <Skeleton className="h-8 sm:h-10 w-4/5 bg-white/25 rounded-xl" />
          <Skeleton className="h-4 w-2/3 bg-white/15 rounded" />
        </div>

        {/* Side Stories */}
        <div className="lg:col-span-4 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-4 rounded-2xl bg-white/[.03] border border-white/[.07] space-y-2">
              <Skeleton className="h-4 w-20 rounded-full bg-orange-500/20" />
              <Skeleton className="h-4 w-full bg-white/20 rounded" />
              <Skeleton className="h-3 w-2/3 bg-white/10 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Grid Articles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pt-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-2xl bg-white/[.03] border border-white/[.07] overflow-hidden">
            <div className="aspect-video bg-white/10" />
            <div className="p-4 space-y-2">
              <Skeleton className="h-3.5 w-4/5 bg-white/20 rounded" />
              <Skeleton className="h-3 w-1/2 bg-orange-400/20 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * 10. Books & Novel Adaptations Skeleton
 * Matches /books discovery hub.
 */
export function BooksSkeleton() {
  return (
    <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 animate-pulse">
      {/* Hero Banner */}
      <div className="rounded-3xl border border-white/[.08] bg-gradient-to-br from-[#1b1c2b] via-[#10131e] to-[#251525] p-6 sm:p-10 space-y-3">
        <Skeleton className="h-5 w-48 rounded-full bg-amber-500/20" />
        <Skeleton className="h-9 sm:h-12 w-80 bg-white/20 rounded-xl" />
        <Skeleton className="h-4 w-96 bg-white/10 rounded" />
        <Skeleton className="h-11 w-full max-w-lg rounded-xl bg-white/10 pt-2" />
      </div>

      {/* Literary Source Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="p-4 rounded-2xl bg-white/[.03] border border-white/[.07] flex gap-4">
            <div className="w-20 h-28 bg-white/10 rounded-xl shrink-0" />
            <div className="flex-1 space-y-2 py-1">
              <Skeleton className="h-4 w-4/5 bg-white/20 rounded" />
              <Skeleton className="h-3 w-1/2 bg-amber-400/20 rounded" />
              <Skeleton className="h-2.5 w-full bg-white/10 rounded" />
              <Skeleton className="h-2.5 w-3/4 bg-white/10 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * 11. Search Page Skeleton
 * Matches /search layout.
 */
export function SearchPageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-hidden border-b border-white/[.08] pb-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-7 w-24 rounded-lg bg-white/10 shrink-0" />
        ))}
      </div>

      {/* Results Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <MovieCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

/**
 * 12. Public Profile Skeleton
 */
export function PublicProfileSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-pulse">
      {/* Profile Header Banner */}
      <div className="relative rounded-3xl bg-white/5 border border-white/10 p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6">
        <div className="w-24 h-24 rounded-full bg-white/15 border-2 border-orange-500/40 shrink-0" />
        <div className="space-y-2 text-center sm:text-left flex-1">
          <Skeleton className="h-7 w-48 bg-white/20 rounded-xl mx-auto sm:mx-0" />
          <Skeleton className="h-4 w-32 bg-orange-400/20 rounded mx-auto sm:mx-0" />
          <div className="flex gap-2 justify-center sm:justify-start pt-1">
            <Skeleton className="h-6 w-20 rounded-md bg-white/10" />
            <Skeleton className="h-6 w-24 rounded-md bg-white/10" />
          </div>
        </div>
      </div>

      {/* Profile Sections Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <MovieCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

/**
 * 13. News Article Detail Skeleton
 * Matches /news/:slug layout.
 */
export function NewsArticleDetailSkeleton() {
  return (
    <article className="page-wrap py-8 max-w-4xl mx-auto space-y-6 animate-pulse">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-16 bg-white/10 rounded" />
        <Skeleton className="h-4 w-4 bg-white/10 rounded" />
        <Skeleton className="h-4 w-24 bg-orange-400/20 rounded" />
      </div>

      {/* Category Pill & Date */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-6 w-28 rounded-full bg-orange-500/20" />
        <Skeleton className="h-4 w-32 rounded bg-white/10" />
      </div>

      {/* Headline Title */}
      <div className="space-y-2">
        <Skeleton className="h-10 sm:h-14 w-full rounded-2xl bg-white/20" />
        <Skeleton className="h-10 sm:h-14 w-3/4 rounded-2xl bg-white/20" />
      </div>

      {/* Subtitle */}
      <Skeleton className="h-5 w-5/6 rounded-lg bg-white/10" />

      {/* Author Bar */}
      <div className="flex items-center justify-between py-4 border-y border-white/[.08]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/15" />
          <div className="space-y-1">
            <Skeleton className="h-4 w-28 bg-white/20 rounded" />
            <Skeleton className="h-3 w-20 bg-white/10 rounded" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-20 rounded-xl bg-white/10" />
          <Skeleton className="h-8 w-8 rounded-xl bg-white/10" />
        </div>
      </div>

      {/* Featured Cover Image */}
      <div className="w-full aspect-[16/9] rounded-3xl bg-white/10 border border-white/10 overflow-hidden" />

      {/* Article Body Paragraphs */}
      <div className="space-y-4 pt-4">
        <Skeleton className="h-4 w-full bg-white/15 rounded" />
        <Skeleton className="h-4 w-full bg-white/10 rounded" />
        <Skeleton className="h-4 w-11/12 bg-white/10 rounded" />
        <Skeleton className="h-4 w-full bg-white/10 rounded" />
        <Skeleton className="h-4 w-4/5 bg-white/10 rounded" />
        <div className="py-4" />
        <Skeleton className="h-4 w-full bg-white/10 rounded" />
        <Skeleton className="h-4 w-10/12 bg-white/10 rounded" />
        <Skeleton className="h-4 w-full bg-white/10 rounded" />
      </div>
    </article>
  );
}

/**
 * 14. Artist & People Detail Skeleton
 * Matches /people/:id biography and credits layout.
 */
export function PeopleDetailSkeleton() {
  return (
    <div className="page-wrap py-8 space-y-8 animate-pulse">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-20 bg-white/10 rounded" />
        <Skeleton className="h-4 w-4 bg-white/10 rounded" />
        <Skeleton className="h-4 w-32 bg-orange-400/20 rounded" />
      </div>

      {/* Hero Bio Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-white/[.08] bg-gradient-to-br from-[#121829] via-[#090d18] to-[#1a1126] p-6 sm:p-10 shadow-2xl">
        <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
          <div className="w-48 h-64 sm:w-56 sm:h-80 rounded-2xl bg-white/10 shrink-0 border border-white/10 shadow-2xl" />

          <div className="flex-1 space-y-4 text-center md:text-left w-full">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <Skeleton className="h-6 w-24 rounded-full bg-orange-500/30" />
              <Skeleton className="h-6 w-28 rounded-full bg-white/10" />
            </div>

            <Skeleton className="h-9 sm:h-12 w-3/4 mx-auto md:mx-0 rounded-2xl bg-white/20" />

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-1">
              <Skeleton className="h-4 w-32 bg-white/10 rounded" />
              <Skeleton className="h-4 w-36 bg-white/10 rounded" />
            </div>

            <div className="space-y-2 pt-2">
              <Skeleton className="h-3.5 w-full bg-white/10 rounded" />
              <Skeleton className="h-3.5 w-full bg-white/10 rounded" />
              <Skeleton className="h-3.5 w-4/5 bg-white/10 rounded" />
            </div>
          </div>
        </div>
      </section>

      {/* Filmography Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center border-b border-white/[.08] pb-3">
          <Skeleton className="h-6 w-44 bg-white/20 rounded" />
          <Skeleton className="h-4 w-20 bg-white/10 rounded" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <MovieCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * 15. Downloads Hub Skeleton
 * Matches /downloads layout.
 */
export function DownloadsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-white/10 bg-[#0c121e] overflow-hidden p-4 space-y-3"
          >
            <div className="aspect-video w-full rounded-xl bg-white/10" />
            <div className="space-y-2 pt-1">
              <Skeleton className="h-4 w-4/5 bg-white/20 rounded" />
              <div className="flex justify-between items-center">
                <Skeleton className="h-3 w-1/3 bg-orange-400/20 rounded" />
                <Skeleton className="h-3 w-1/4 bg-white/10 rounded" />
              </div>
            </div>
            <div className="pt-2 flex gap-2">
              <Skeleton className="h-8 flex-1 rounded-xl bg-orange-500/20" />
              <Skeleton className="h-8 w-9 rounded-xl bg-white/10" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

