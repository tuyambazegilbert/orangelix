import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Info, Play, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MediaItem } from '@/types/media';
import { BACKDROP_FALLBACK, POSTER_FALLBACK } from '@/lib/tmdb/images';

export default function StageSlider({ items }: { items: MediaItem[] }) {
  const [active, setActive] = useState(0);
  const count = items.length;
  const go = (delta: number) => setActive((index) => (index + delta + count) % count);
  useEffect(() => { if (!count || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return; const timer = window.setInterval(() => go(1), 7000); return () => window.clearInterval(timer); }, [count]);
  if (!count) return null;
  const item = items[active]; const route = item.mediaType === 'tv' ? 'series' : 'movie';
  return <section className="relative mx-auto max-w-[1600px] overflow-hidden border-b border-white/[.07] bg-[#090e18]">
    <img src={item.backdropUrl || BACKDROP_FALLBACK} alt="" className="absolute inset-0 h-full w-full object-cover opacity-55 transition-opacity duration-500" />
    <div className="absolute inset-0 bg-[linear-gradient(90deg,#080d17_2%,rgba(8,13,23,.92)_35%,rgba(8,13,23,.2)_75%,#080d17),linear-gradient(0deg,#080d17,transparent_55%)]" />
    <div className="relative grid min-h-[470px] grid-cols-1 items-center gap-8 px-5 py-12 sm:px-10 lg:min-h-[560px] lg:grid-cols-[minmax(0,1fr)_minmax(500px,55%)] lg:px-[clamp(2rem,5vw,6rem)]">
      <div className="z-20 max-w-xl"><p className="section-eyebrow mb-3">OrangeFlix presents</p><h1 className="max-w-lg text-4xl font-extrabold tracking-[-.045em] text-white sm:text-5xl lg:text-6xl">{item.title}</h1><div className="mt-4 flex items-center gap-3 text-sm text-slate-300"><span className="inline-flex items-center gap-1 font-semibold text-white"><Star className="h-4 w-4 fill-orange-400 text-orange-400" />{item.voteAverage.toFixed(1)}</span><span>{item.releaseYear || 'New release'}</span><span className="rounded border border-white/20 px-1.5 py-.5 text-[10px]">{item.mediaType === 'tv' ? 'SERIES' : 'MOVIE'}</span></div><p className="mt-5 max-w-md text-sm leading-6 text-slate-300 sm:text-base">{item.description}</p><div className="mt-7 flex gap-3"><Link to={`/watch/${item.mediaType === 'tv' ? 'tv' : 'movie'}-${item.tmdbId}`} className="premium-button inline-flex h-10 items-center gap-2 rounded-lg px-5 text-sm font-semibold"><Play className="h-4 w-4 fill-current" />Watch now</Link><Link to={`/${route}/${item.tmdbId}`} className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/[.16] bg-white/[.07] px-5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/[.14]"><Info className="h-4 w-4" />Details</Link></div></div>
      <div className="relative hidden h-[380px] items-center justify-center lg:flex">{[-1, 1, 0].map((offset) => { const index = (active + offset + count) % count; const card = items[index]; const current = offset === 0; return <button key={`${card.id}-${offset}`} onClick={() => setActive(index)} className={`absolute aspect-[2/3] overflow-hidden rounded-xl border border-white/10 bg-[#101724] shadow-2xl transition-all duration-500 ${current ? 'z-20 h-[355px] translate-x-0 opacity-100' : `${offset < 0 ? '-translate-x-[190px]' : 'translate-x-[190px]'} z-10 h-[285px] opacity-45 blur-[1px]`}`} aria-label={`Show ${card.title}`}><img src={card.posterUrl || POSTER_FALLBACK} alt={card.title} className="h-full w-full object-cover" /><div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-4 pb-4 pt-12 text-left text-sm font-semibold text-white">{card.title}</div></button>; })}</div>
    </div>
    <div className="absolute bottom-5 right-5 z-30 flex items-center gap-2 lg:right-[clamp(2rem,5vw,6rem)]"><button onClick={() => go(-1)} className="grid h-9 w-9 place-items-center rounded-full border border-white/15 bg-black/25 text-white backdrop-blur transition hover:bg-white/15" aria-label="Previous feature"><ChevronLeft className="h-4 w-4" /></button>{items.slice(0, Math.min(count, 5)).map((_, index) => <button key={index} onClick={() => setActive(index)} className={`h-1.5 rounded-full transition-all ${index === active ? 'w-6 bg-orange-400' : 'w-1.5 bg-white/45'}`} aria-label={`Show feature ${index + 1}`} />)}<button onClick={() => go(1)} className="grid h-9 w-9 place-items-center rounded-full border border-white/15 bg-black/25 text-white backdrop-blur transition hover:bg-white/15" aria-label="Next feature"><ChevronRight className="h-4 w-4" /></button></div>
  </section>;
}
