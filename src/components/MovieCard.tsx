import { MediaItem } from '@/types/media';
import { Movie } from '@/types';
import { Link, useNavigate } from 'react-router-dom';
import { BookmarkPlus, Info, Play, Star } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { MovieService } from '@/lib/movies';
import { FirebaseData } from '@/lib/firebase-data';
import { POSTER_FALLBACK } from '@/lib/tmdb/images';
import { toast } from 'sonner';

interface MovieCardProps { movie: MediaItem | Movie; onFavoriteChange?: () => void; }

export default function MovieCard({ movie, onFavoriteChange }: MovieCardProps) {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [failed, setFailed] = useState(false);
  const media = 'tmdbId' in movie;
  const isTv = media ? movie.mediaType === 'tv' : movie.type?.toLowerCase() === 'series';
  const id = media ? `${isTv ? 'tv' : 'movie'}-${movie.tmdbId}` : movie.id;
  const detail = `/${isTv ? 'series' : 'movie'}/${media ? movie.tmdbId : movie.id}`;
  const image = failed ? POSTER_FALLBACK : (movie.imageUrl || (movie as MediaItem).posterUrl || POSTER_FALLBACK);
  const rating = media ? movie.voteAverage : movie.rating;
  const countryLabel = (movie as MediaItem & { _countryLabel?: string })._countryLabel;
  const isRegionalDiscovery = Boolean(countryLabel);
  const save = (event: React.MouseEvent) => { event.preventDefault(); event.stopPropagation(); if (!currentUser) return toast.error('Sign in to save titles'); const saved = MovieService.isFavorite(id, currentUser.id); if (saved) { MovieService.removeFromFavorites(id, currentUser.id); void FirebaseData.removeFavorites(currentUser.id, id); toast.success('Removed from favorites'); } else { MovieService.addToFavorites(id, currentUser.id, { tmdbId: media ? movie.tmdbId : undefined, mediaType: isTv ? 'tv' : 'movie', cachedMedia: movie }); void FirebaseData.setFavorites(currentUser.id, movie); toast.success('Added to favorites'); } onFavoriteChange?.(); };
  const watchPath = `/watch/${id}`;
  const openWatch = (event: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>) => { if ((event.target as HTMLElement).closest('a,button')) return; navigate(watchPath); };
  return <article role="link" tabIndex={0} onClick={openWatch} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openWatch(event); } }} className="group/movie min-w-0 cursor-pointer overflow-hidden rounded-xl border border-white/[.08] bg-[#101724] shadow-[0_8px_25px_rgba(0,0,0,.16)] transition duration-200 hover:-translate-y-1 hover:border-white/[.18] hover:shadow-[0_15px_32px_rgba(0,0,0,.32)]">
    <div className="relative aspect-[2/3] overflow-hidden bg-[#131d2d]">
      <Link to={watchPath} className="block h-full" aria-label={`Watch ${movie.title}`}><img src={image} alt={movie.title} loading="lazy" onError={() => setFailed(true)} className="h-full w-full object-cover transition duration-300 group-hover/movie:scale-[1.045] group-hover/movie:brightness-75" /></Link>
      <div className="absolute inset-x-0 bottom-0 flex translate-y-2 items-end justify-between bg-gradient-to-t from-[#080b11]/95 via-[#080b11]/20 to-transparent px-2.5 pb-2.5 pt-12 opacity-0 transition duration-200 group-hover/movie:translate-y-0 group-hover/movie:opacity-100 focus-within:translate-y-0 focus-within:opacity-100">
        <Link to={watchPath} className="grid h-8 w-8 place-items-center rounded-full bg-orange-500 text-white shadow-lg shadow-black/30" aria-label={`Play ${movie.title}`}><Play className="ml-0.5 h-3.5 w-3.5 fill-current" /></Link>
        <div className="flex gap-1.5"><button onClick={save} className="grid h-8 w-8 place-items-center rounded-full bg-white/15 text-white backdrop-blur hover:bg-white/25" aria-label={`Save ${movie.title}`}><BookmarkPlus className="h-3.5 w-3.5" /></button><Link to={detail} className="grid h-8 w-8 place-items-center rounded-full bg-white/15 text-white backdrop-blur hover:bg-white/25" aria-label={`Details for ${movie.title}`}><Info className="h-3.5 w-3.5" /></Link></div>
      </div>
      <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-md bg-[#090d15]/80 px-1.5 py-1 text-[10px] font-semibold text-white backdrop-blur"><Star className="h-2.5 w-2.5 fill-orange-400 text-orange-400" />{Number(rating || 0).toFixed(1)}</span>
      {isRegionalDiscovery && (
        <span className="absolute right-2 top-2 rounded-md bg-orange-500/90 px-1.5 py-1 text-[9px] font-bold uppercase tracking-[0.08em] text-white shadow-sm">
          Regional
        </span>
      )}
    </div>
    <div className="p-2.5">
      <Link to={watchPath} className="block truncate text-[13px] font-semibold text-slate-100 transition hover:text-orange-300">{movie.title}</Link>
      <p className="mt-1 truncate text-[11px] text-slate-500">
        {countryLabel ? `${countryLabel} • ` : ''}{movie.releaseYear || '—'}
        <span className="px-1 text-slate-700">•</span>
        {(media ? movie.genres?.[0] : movie.genre?.[0]) || (isTv ? 'Series' : 'Movie')}
      </p>
    </div>
  </article>;
}
