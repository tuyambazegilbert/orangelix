import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTrending, useTopRatedMovies } from '@/hooks/use-tmdb';
import MovieCard from '@/components/MovieCard';
import SEOHead from '@/components/seo/SEOHead';
import Breadcrumbs from '@/components/Breadcrumbs';
import { Button } from '@/components/ui/button';
import {
  Sparkles,
  Layers,
  Award,
  Clock,
  Flame,
  Film,
} from 'lucide-react';

interface CollectionMeta {
  title: string;
  tagline: string;
  description: string;
  curator: string;
  icon: string;
}

const COLLECTIONS_MAP: Record<string, CollectionMeta> = {
  'sci-fi-essentials': {
    title: 'Sci-Fi Essentials',
    tagline: 'Minds bent, universes explored',
    description: 'A definitive collection of mind-bending science fiction, visionary space odysseys, and dystopian cinema that redefine imagination.',
    curator: 'OrangeFlix Editorial',
    icon: 'sparkles',
  },
  'award-winners': {
    title: 'Academy Award Winners',
    tagline: 'The pinnacle of cinematic storytelling',
    description: 'Masterworks recognized with Oscar, Palme d’Or, and BAFTA honors for unforgettable writing, acting, and directing.',
    curator: 'Cinema Vault Team',
    icon: 'award',
  },
  'under-90-minutes': {
    title: 'Under 90 Minutes',
    tagline: 'High impact, zero filler',
    description: 'Tightly paced thrillers, indie gems, and punchy comedies you can watch and finish in a single evening.',
    curator: 'OrangeFlix Quick Picks',
    icon: 'clock',
  },
  'weekend-binge': {
    title: 'Weekend Binge Series',
    tagline: 'Unputdownable television journeys',
    description: 'Multi-season masterpieces and thrilling miniseries designed for late-night viewing and unforgettable cliffhangers.',
    curator: 'Series Desk',
    icon: 'layers',
  },
};

export default function Collections() {
  const { slug } = useParams<{ slug: string }>();
  const normalizedSlug = slug ? slug.toLowerCase() : 'sci-fi-essentials';
  const collection = COLLECTIONS_MAP[normalizedSlug] || COLLECTIONS_MAP['sci-fi-essentials'];

  const trending = useTrending('all', 'week');
  const topRated = useTopRatedMovies(1);

  const items = normalizedSlug === 'award-winners'
    ? (topRated.data?.items || [])
    : (trending.data?.items || []);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <SEOHead
        title={`${collection.title} — Curated Cinema Collection`}
        description={collection.description}
        url={`https://orangeflixx.vercel.app/collections/${normalizedSlug}`}
      />

      <div className="page-wrap py-8">
        <Breadcrumbs
          items={[
            { name: 'Collections', url: '/movies' },
            { name: collection.title, url: `/collections/${normalizedSlug}` },
          ]}
        />

        {/* Hero Collection Header */}
        <section className="relative overflow-hidden rounded-3xl border border-white/[.08] bg-gradient-to-br from-[#18162d] via-[#0d101e] to-[#251021] p-6 sm:p-10 mb-8 shadow-2xl">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-400 text-xs font-semibold">
              <Layers className="w-3.5 h-3.5" />
              <span>Curated Editorial Collection</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              {collection.title}
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              {collection.description}
            </p>
            <p className="text-xs text-slate-500 font-medium">Curated by {collection.curator}</p>
          </div>
        </section>

        {/* Collection Selector Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-8 border-b border-white/[.07] scrollbar-hide">
          {Object.entries(COLLECTIONS_MAP).map(([key, info]) => (
            <Button
              key={key}
              asChild
              variant={key === normalizedSlug ? 'default' : 'outline'}
              size="sm"
              className={
                key === normalizedSlug
                  ? 'bg-orange-500 text-white rounded-full text-xs font-semibold shrink-0'
                  : 'border-white/10 text-slate-300 rounded-full text-xs hover:border-orange-500/40 shrink-0'
              }
            >
              <Link to={`/collections/${key}`}>{info.title}</Link>
            </Button>
          ))}
        </div>

        {/* Media Grid */}
        <div className="content-grid">
          {items.map((media) => (
            <MovieCard key={media.id} movie={media} />
          ))}
        </div>
      </div>
    </div>
  );
}

