import { useRef } from 'react';
import { ChevronLeft, ChevronRight, UserRound } from 'lucide-react';
import { MediaCast } from '@/types/media';

export default function CastRail({ cast }: { cast: MediaCast[] }) {
  const ref = useRef<HTMLDivElement>(null); const move = (direction: number) => ref.current?.scrollBy({ left: direction * 320, behavior: 'smooth' });
  if (!cast.length) return null;
  return <section className="py-7"><div className="mb-4 flex items-center justify-between"><div><p className="section-eyebrow mb-1">The people behind it</p><h2 className="section-title">Cast & crew</h2></div><div className="flex gap-2"><button onClick={() => move(-1)} className="grid h-8 w-8 place-items-center rounded-full border border-white/[.1] text-slate-300"><ChevronLeft className="h-4 w-4" /></button><button onClick={() => move(1)} className="grid h-8 w-8 place-items-center rounded-full border border-white/[.1] text-slate-300"><ChevronRight className="h-4 w-4" /></button></div></div><div ref={ref} className="scrollbar-hide flex gap-3 overflow-x-auto pb-2">{cast.slice(0, 18).map((person) => <article key={person.id} className="w-[86px] shrink-0"><div className="aspect-[.82] overflow-hidden rounded-lg bg-[#151d2d]">{person.profileUrl ? <img src={person.profileUrl} alt={person.name} loading="lazy" className="h-full w-full object-cover" /> : <span className="grid h-full place-items-center text-slate-600"><UserRound className="h-7 w-7" /></span>}</div><h3 className="mt-2 truncate text-xs font-semibold text-slate-200">{person.name}</h3><p className="mt-0.5 truncate text-[10px] text-slate-500">{person.character || 'Cast'}</p></article>)}</div></section>;
}
