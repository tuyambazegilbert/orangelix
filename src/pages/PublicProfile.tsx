import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MovieService } from '@/lib/movies';
import { Movie } from '@/types';
import { MediaItem } from '@/types/media';
import MovieCard from '@/components/MovieCard';
import SEOHead from '@/components/seo/SEOHead';
import Breadcrumbs from '@/components/Breadcrumbs';
import { Button } from '@/components/ui/button';
import {
  User,
  Heart,
  Share2,
  Film,
  Sparkles,
  Check,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';

export default function PublicProfile() {
  const { username } = useParams<{ username: string }>();
  const [copied, setCopied] = useState(false);
  const [publicFavorites, setPublicFavorites] = useState<(MediaItem | Movie)[]>([]);

  useEffect(() => {
    // Load sample legacy public titles for demo profile
    const movies = MovieService.getMovies();
    setPublicFavorites(movies.slice(0, 6));
  }, [username]);

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success('Public profile link copied!');
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <SEOHead
        title={`${username}'s Cinema Library — OrangeFlix`}
        description={`Explore ${username}'s favorite movies, TV shows, and curated collections on OrangeFlix.`}
        type="profile"
      />

      <div className="page-wrap py-8">
        <Breadcrumbs items={[{ name: 'Community', url: '/movies' }, { name: `@${username}`, url: `/u/${username}` }]} />

        {/* Public Profile Hero */}
        <section className="relative overflow-hidden rounded-3xl border border-white/[.08] bg-gradient-to-br from-[#13192c] via-[#090d18] to-[#1c112b] p-6 sm:p-10 mb-10 shadow-2xl">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-orange-500/20 border-2 border-orange-500/40 grid place-items-center shrink-0 shadow-xl">
              <span className="text-3xl font-black text-orange-400 uppercase">
                {username?.charAt(0) || 'U'}
              </span>
            </div>

            <div className="flex-1 text-center sm:text-left space-y-2">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h1 className="text-2xl sm:text-4xl font-extrabold text-white">
                  @{username}
                </h1>
                <ShieldCheck className="w-5 h-5 text-orange-400" title="Verified Film Lover" />
              </div>

              <p className="text-sm text-slate-300 max-w-lg">
                Film lover, cinema explorer, and passionate OrangeFlix community member.
              </p>

              <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-3">
                <Button
                  size="sm"
                  onClick={handleShare}
                  className="bg-orange-500 hover:bg-orange-600 rounded-xl text-xs"
                >
                  {copied ? <Check className="w-3.5 h-3.5 mr-1 text-white" /> : <Share2 className="w-3.5 h-3.5 mr-1" />}
                  {copied ? 'Link Copied' : 'Share Profile'}
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Public Favorites Gallery */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-white/[.08] pb-3">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-500 fill-current" />
                Public Favorites ({publicFavorites.length})
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Titles marked as public by {username}</p>
            </div>
          </div>

          <div className="content-grid">
            {publicFavorites.map((item) => (
              <MovieCard key={item.id} movie={item} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

