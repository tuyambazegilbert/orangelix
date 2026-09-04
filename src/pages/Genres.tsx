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

  const items = discoverData?.items || [];
  const totalPages = Math.min(discoverData?.totalPages || 1, 500);
  const featuredItems = items.slice(0, 6);

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

      <main className="page-wrap py-6 space-y-6">
        <Breadcrumbs
          items={[
            { name: 'Home', url: '/' },
            { name: 'Genres', url: '/genres' },
            ...(slug ? [{ name: genreInfo.name, url: `/genres/${normalizedSlug}` }] : []),
          ]}
        />

        {/* Hero Banner Header */}
        <section className="relative overflow-hidden rounded-3xl border border-white/[.08] bg-gradient-to-br from-[#101726] via-[#090d18] to-[#1a1024] p-6 sm:p-8 shadow-2xl">
          <div className="max-w-3xl space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-400 text-xs font-semibold">
              <span className="text-sm">{genreInfo.emoji}</span>
              <span>Curated Genre Hub</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              {genreInfo.name} <span className="text-orange-400">Cinema</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {genreInfo.description}
            </p>
          </div>
        </section>

        {/* Genre Quick Navigation Chips */}
        <div className="space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-orange-400 flex items-center gap-1">
            <Grid className="w-3 h-3" /> Select Genre Category
          </p>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {Object.entries(GENRE_SLUG_MAP).map(([key, info]) => {
              const isActive = (slug ? normalizedSlug : 'all') === key;
              return (
                <Button
                  key={key}
                  asChild
                  variant={isActive ? 'default' : 'outline'}
                  size="sm"
                  className={
                    isActive
                      ? 'bg-orange-500 hover:bg-orange-600 text-white rounded-full text-xs font-bold shrink-0 shadow-md shadow-orange-500/20'
                      : 'bg-gray-900/60 border-gray-800 text-slate-300 rounded-full text-xs hover:border-orange-500/40 hover:text-white shrink-0'
                  }
                >
                  <Link to={key === 'all' ? '/genres' : `/genres/${key}`}>
                    <span className="mr-1">{info.emoji}</span> {info.name}
                  </Link>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Controls Bar */}
        <div className="flex items-center justify-between flex-wrap gap-4 p-4 rounded-2xl bg-gray-900/50 border border-gray-800/80">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-orange-400" />
            <span className="text-xs font-semibold text-slate-300">Sort by</span>
            <Select
              value={sortBy}
              onValueChange={(val) => {
                setSortBy(val);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[180px] bg-gray-950 border-gray-800 text-xs text-white rounded-xl h-9">
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

          <span className="text-xs text-slate-400 font-mono">
            Page <span className="text-orange-400 font-bold">{page}</span> of {totalPages}
          </span>
        </div>

        {/* Media Grid */}
        {isLoading ? (
          <MovieGridSkeleton count={18} />
        ) : items.length === 0 ? (
          <div className="text-center py-20 bg-gray-900/30 rounded-3xl border border-gray-800/60 p-8 space-y-3">
            <Film className="w-12 h-12 text-gray-600 mx-auto" />
            <h3 className="text-xl font-bold text-white">No Movies Found in {genreInfo.name}</h3>
            <p className="text-gray-400 text-xs">Try selecting a different genre or sorting order.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {items.map((media) => (
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
