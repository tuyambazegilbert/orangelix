import { useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDiscoverMovies, useMovieGenres } from '@/hooks/use-tmdb';
import MovieCard from '@/components/MovieCard';
import StageSlider from '@/components/StageSlider';
import GeoCountryShowcase from '@/components/geo/GeoCountryShowcase';
import { getAllCountries } from '@/features/geo/countryConfig';
import SEOHead from '@/components/seo/SEOHead';
import Breadcrumbs from '@/components/Breadcrumbs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { HeroSkeleton, MovieGridSkeleton } from '@/components/ui/Skeletons';
import { filterOutHeroItems, deduplicateList } from '@/lib/deduplication';
import {
  Film,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Grid,
  Flame,
  Tv,
  Music,
  Compass,
} from 'lucide-react';

const GENRE_SLUG_MAP: Record<string, { id: string; name: string; description: string; emoji: string }> = {
  all: {
    id: '',
    name: 'All Genres',
    description: 'Explore the complete world of cinema across every storytelling style and cinematic movement.',
    emoji: '🎬',
  },
  action: {
    id: '28',
    name: 'Action',
    description: 'High-octane pursuits, pulse-pounding stunts, explosive blockbusters, and relentless heroism.',
    emoji: '💥',
  },
  adventure: {
    id: '12',
    name: 'Adventure',
    description: 'Epic expeditions, treacherous journeys, uncharted realms, and heroic discoveries.',
    emoji: '🧭',
  },
  animation: {
    id: '16',
    name: 'Animation',
    description: 'Breathtaking visual artistry, fantastical adventures, and heartwarming storytelling across animation styles.',
    emoji: '🎨',
  },
  comedy: {
    id: '35',
    name: 'Comedy',
    description: 'Laugh-out-loud humor, witty satire, lighthearted escapism, and unforgettable comedic performances.',
    emoji: '😂',
  },
  crime: {
    id: '80',
    name: 'Crime',
    description: 'Underworld syndicates, gritty detective investigations, master heists, and moral dilemmas.',
    emoji: '🕵️',
  },
  documentary: {
    id: '99',
    name: 'Documentary',
    description: 'Eye-opening real-world investigations, historical chronicles, and intimate biographical portraits.',
    emoji: '📽️',
  },
  drama: {
    id: '18',
    name: 'Drama',
    description: 'Profound human narratives, emotionally charged journeys, character studies, and life-defining conflicts.',
    emoji: '🎭',
  },
  family: {
    id: '10751',
    name: 'Family',
    description: 'Uplifting, heartwarming adventures and timeless tales crafted for viewers of all ages.',
    emoji: '👨‍👩‍👧‍👦',
  },
  fantasy: {
    id: '14',
    name: 'Fantasy',
    description: 'Magical realms, mythical creatures, ancient prophecies, and boundless imagination.',
    emoji: '🧙',
  },
  history: {
    id: '36',
    name: 'History',
    description: 'Monumental epochs, dramatic revolutions, and the historic triumphs and tragedies that shaped humanity.',
    emoji: '🏛️',
  },
  horror: {
    id: '27',
    name: 'Horror',
    description: 'Supernatural terrors, psychological dread, chilling monsters, and spine-tingling atmospheric fear.',
    emoji: '👻',
  },
  music: {
    id: '10402',
    name: 'Music & Musical',
    description: 'Electrifying concerts, stirring symphonies, legendary artist biopics, and showstopping musical theater.',
    emoji: '🎵',
  },
  mystery: {
    id: '9648',
    name: 'Mystery',
    description: 'Unsolved puzzles, cryptic murders, whodunits, and mind-bending psychological investigations.',
    emoji: '🔍',
  },
  romance: {
    id: '10749',
    name: 'Romance',
    description: 'Passionate love stories, heartwarming encounters, poignant heartbreak, and soulful connections.',
    emoji: '💖',
  },
  'science-fiction': {
    id: '878',
    name: 'Science Fiction',
    description: 'Venture into interstellar odysseys, dystopian futures, cybernetics, and mind-bending space exploration.',
    emoji: '🚀',
  },
  thriller: {
    id: '53',
    name: 'Thriller',
    description: 'Nail-biting suspense, psychological enigmas, cat-and-mouse chases, and thrilling plot twists.',
    emoji: '⚡',
  },
  war: {
    id: '10752',
    name: 'War & Military',
    description: 'Epic wartime courage, harrowing frontlines, tactical heroism, and the human cost of conflict.',
    emoji: '⚔️',
  },
  western: {
    id: '37',
    name: 'Western',
    description: 'Frontier justice, rugged gunslingers, desolate desert landscapes, and classic outlaw lore.',
    emoji: '🤠',
  },
};

export default function Genres() {
  const { slug } = useParams<{ slug?: string }>();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('popularity.desc');
  const countries = useMemo(() => getAllCountries(), []);

  const normalizedSlug = (slug || 'all').toLowerCase();
  const genreInfo = GENRE_SLUG_MAP[normalizedSlug] || GENRE_SLUG_MAP['all'];

  // Discover movies for this genre
  const { data: discoverData, isLoading } = useDiscoverMovies({
    with_genres: genreInfo.id || undefined,
    sort_by: sortBy,
    page,
  });

  const items = useMemo(() => deduplicateList(discoverData?.items || []), [discoverData?.items]);
  const totalPages = Math.min(discoverData?.totalPages || 1, 500);
  const featuredItems = useMemo(() => items.slice(0, 6), [items]);
  const gridItems = useMemo(() => (page === 1 ? filterOutHeroItems(featuredItems, items) : items), [page, featuredItems, items]);

  return (
    <div className="min-h-screen bg-[#080d17] text-white overflow-x-hidden">
      <SEOHead
        title={`${genreInfo.name} Movies & TV Series — Watch Online on OrangeFlix`}
        description={genreInfo.description}
        url={`https://orangeflixx.vercel.app/genres${slug ? `/${normalizedSlug}` : ''}`}
      />

      {/* 3D StageSlider Hero Section */}
      {isLoading ? (
        <HeroSkeleton />
      ) : featuredItems.length > 0 ? (
        <StageSlider items={featuredItems} />
      ) : null}

      <main className="page-wrap py-3 sm:py-4 space-y-4">
        <Breadcrumbs
          items={[
            { name: 'Home', url: '/' },
            { name: 'Genres', url: '/genres' },
            ...(slug ? [{ name: genreInfo.name, url: `/genres/${normalizedSlug}` }] : []),
          ]}
        />

        {/* Ultra-Compact Pro Genre Command Hub */}
        <section className="rounded-xl border border-white/[.08] bg-gradient-to-r from-[#0d1322]/95 via-[#111827]/90 to-[#0d1322]/95 p-2 sm:p-2.5 backdrop-blur-md shadow-[0_8px_24px_rgba(0,0,0,0.25)] space-y-2">
          {/* Top Row: Title, Subtitle, and Inline Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-500/15 border border-orange-500/30 text-sm shrink-0">
                {genreInfo.emoji}
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-sm sm:text-base font-black text-white tracking-tight">
                    {genreInfo.name} <span className="text-orange-400">Cinema</span>
                  </h1>
                  <span className="hidden md:inline-flex items-center px-1.5 py-0.5 rounded bg-white/[.06] text-[10px] font-medium text-slate-300 truncate max-w-md">
                    {genreInfo.description}
                  </span>
                </div>
              </div>
            </div>

            {/* Sort & Pagination Indicators */}
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              <div className="flex items-center gap-1">
                <SlidersHorizontal className="w-3 h-3 text-orange-400" />
                <Select
                  value={sortBy}
                  onValueChange={(val) => {
                    setSortBy(val);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="w-[130px] sm:w-[150px] bg-slate-950/80 border-white/10 text-xs text-white rounded-lg h-7">
                    <SelectValue placeholder="Sort order" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-800 text-white">
                    <SelectItem value="popularity.desc">Most Popular</SelectItem>
                    <SelectItem value="vote_average.desc">Highest Rated</SelectItem>
                    <SelectItem value="primary_release_date.desc">Newest Releases</SelectItem>
                    <SelectItem value="revenue.desc">Top Box Office</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <span className="text-[10px] text-slate-400 font-mono px-1.5 py-0.5 rounded bg-white/[.04] border border-white/[.06]">
                <span className="text-orange-400 font-bold">{page}</span>/{totalPages}
              </span>
            </div>
          </div>

          {/* Bottom Row: Genre Pills Horizontal Ribbon */}
          <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none pt-1 border-t border-white/[.06]">
            {Object.entries(GENRE_SLUG_MAP).map(([key, info]) => {
              const isActive = (slug ? normalizedSlug : 'all') === key;
              return (
                <Link
                  key={key}
                  to={key === 'all' ? '/genres' : `/genres/${key}`}
                  className={`inline-flex items-center gap-1 h-6 px-2 rounded-md text-[11px] shrink-0 transition-all duration-150 border ${
                    isActive
                      ? 'bg-orange-500 border-orange-400 text-white font-bold shadow-sm'
                      : 'bg-white/[.04] border-white/10 text-slate-300 hover:text-white hover:border-orange-500/40 hover:bg-white/[.08]'
                  }`}
                >
                  <span className="text-xs">{info.emoji}</span>
                  <span>{info.name}</span>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Media Grid */}
        {isLoading ? (
          <MovieGridSkeleton count={18} />
        ) : gridItems.length === 0 ? (
          <div className="text-center py-20 bg-gray-900/30 rounded-3xl border border-gray-800/60 p-8 space-y-3">
            <Film className="w-12 h-12 text-gray-600 mx-auto" />
            <h3 className="text-xl font-bold text-white">No Movies Found in {genreInfo.name}</h3>
            <p className="text-gray-400 text-xs">Try selecting a different genre or sorting order.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {gridItems.map((media) => (
                <MovieCard key={media.id} movie={media} />
              ))}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-center gap-3 mt-12 py-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="bg-gray-900 border-gray-800 text-slate-300 hover:text-white rounded-xl text-xs h-9 px-4 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Previous
              </Button>
              <span className="text-xs font-mono text-slate-400">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="bg-gray-900 border-gray-800 text-slate-300 hover:text-white rounded-xl text-xs h-9 px-4 disabled:opacity-40"
              >
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
