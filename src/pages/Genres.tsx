import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDiscoverMovies, useMovieGenres } from '@/hooks/use-tmdb';
import MovieCard from '@/components/MovieCard';
import SEOHead from '@/components/seo/SEOHead';
import Breadcrumbs from '@/components/Breadcrumbs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Film,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
} from 'lucide-react';

const GENRE_SLUG_MAP: Record<string, { id: string; name: string; description: string }> = {
  'science-fiction': {
    id: '878',
    name: 'Science Fiction',
    description: 'Venture into interstellar odysseys, dystopian futures, cybernetics, and mind-bending space exploration.',
  },
  action: {
    id: '28',
    name: 'Action',
    description: 'High-octane pursuits, pulse-pounding stunts, explosive blockbusters, and relentless heroism.',
  },
  drama: {
    id: '18',
    name: 'Drama',
    description: 'Profound human narratives, emotionally charged journeys, character studies, and life-defining conflicts.',
  },
  thriller: {
    id: '53',
    name: 'Thriller',
    description: 'Nail-biting suspense, psychological enigmas, cat-and-mouse chases, and thrilling plot twists.',
  },
  comedy: {
    id: '35',
    name: 'Comedy',
    description: 'Laugh-out-loud humor, witty satire, lighthearted escapism, and unforgettable comedic performances.',
  },
  animation: {
    id: '16',
    name: 'Animation',
    description: 'Breathtaking visual artistry, fantastical adventures, and heartwarming storytelling across animation styles.',
  },
  crime: {
    id: '80',
    name: 'Crime',
    description: 'Underworld syndicates, gritty detective investigations, master heists, and moral dilemmas.',
  },
  horror: {
    id: '27',
    name: 'Horror',
    description: 'Supernatural terrors, psychological dread, chilling monsters, and spine-tingling atmospheric fear.',
  },
};

export default function Genres() {
  const { slug } = useParams<{ slug: string }>();
  const normalizedSlug = slug ? slug.toLowerCase() : 'science-fiction';
  const genreInfo = GENRE_SLUG_MAP[normalizedSlug] || {
    id: '878',
    name: 'Science Fiction',
    description: 'Discover popular titles in this genre on OrangeFlix.',
  };

  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('popularity.desc');

  const { data: discoverData, isLoading } = useDiscoverMovies({
    with_genres: genreInfo.id,
    sort_by: sortBy,
    page,
  });

  const items = discoverData?.items || [];
  const totalPages = Math.min(discoverData?.totalPages || 1, 500);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <SEOHead
        title={`${genreInfo.name} Movies & TV Series — Watch Online`}
        description={genreInfo.description}
        url={`https://orangeflixx.vercel.app/genres/${normalizedSlug}`}
      />

      <div className="page-wrap py-8">
        <Breadcrumbs
          items={[
            { name: 'Genres', url: '/movies' },
            { name: genreInfo.name, url: `/genres/${normalizedSlug}` },
          ]}
        />

        {/* Hero Banner */}
        <section className="relative overflow-hidden rounded-3xl border border-white/[.08] bg-gradient-to-br from-[#101726] via-[#090d18] to-[#1a1024] p-6 sm:p-10 mb-8 shadow-2xl">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-400 text-xs font-semibold">
              <Film className="w-3.5 h-3.5" />
              <span>Curated Genre Hub</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              {genreInfo.name} <span className="text-orange-400">Cinema</span>
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              {genreInfo.description}
            </p>
          </div>
        </section>

        {/* Other Genre Quick Navigation */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-8 border-b border-white/[.07] scrollbar-hide">
          {Object.entries(GENRE_SLUG_MAP).map(([key, info]) => (
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
              <Link to={`/genres/${key}`}>{info.name}</Link>
            </Button>
          ))}
        </div>

        {/* Controls Bar */}
        <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-orange-400" />
            <span className="text-xs font-semibold text-slate-300">Sort by</span>
            <Select value={sortBy} onValueChange={(val) => { setSortBy(val); setPage(1); }}>
              <SelectTrigger className="w-[180px] bg-gray-900 border-white/10 text-xs rounded-xl h-9">
                <SelectValue placeholder="Sort order" />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-white/10 text-white">
                <SelectItem value="popularity.desc">Most Popular</SelectItem>
                <SelectItem value="vote_average.desc">Highest Rated</SelectItem>
                <SelectItem value="primary_release_date.desc">Newest Releases</SelectItem>
                <SelectItem value="revenue.desc">Top Box Office</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <span className="text-xs text-slate-400">
            Page {page} of {totalPages}
          </span>
        </div>

        {/* Media Grid */}
        {isLoading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-3" />
            <p className="text-xs text-slate-400">Loading {genreInfo.name} titles...</p>
          </div>
        ) : (
          <>
            <div className="content-grid">
              {items.map((media) => (
                <MovieCard key={media.id} movie={media} />
              ))}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-center gap-3 mt-12">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="border-white/10 text-slate-300"
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
                className="border-white/10 text-slate-300"
              >
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

