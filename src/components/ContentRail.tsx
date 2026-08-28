import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useRef } from 'react';
import MovieCard from './MovieCard';
import { MediaItem } from '@/types/media';

interface ContentRailProps { title: string; eyebrow?: string; items: MediaItem[]; href: string; loading?: boolean; }

export default function ContentRail({ title, eyebrow, items, href, loading }: ContentRailProps) {
  const ref = useRef<HTMLDivElement>(null);
  const move = (direction: number) => ref.current?.scrollBy({ left: direction * Math.max(ref.current.clientWidth * .8, 320), behavior: 'smooth' });
  return <section className="group/rail py-5 sm:py-7">
    <div className="mb-3 flex items-end justify-between gap-4"><div>{eyebrow && <p className="section-eyebrow mb-1">{eyebrow}</p>}<h2 className="section-title">{title}</h2></div><div className="flex items-center gap-2"><Link to={href} className="hidden text-xs font-semibold text-slate-400 transition hover:text-orange-400 sm:block">View all</Link><button onClick={() => move(-1)} className="grid h-8 w-8 place-items-center rounded-full border border-white/[.1] bg-white/[.035] text-slate-300 transition hover:border-white/20 hover:bg-white/[.1]" aria-label={`Scroll ${title} left`}><ChevronLeft className="h-4 w-4" /></button><button onClick={() => move(1)} className="grid h-8 w-8 place-items-center rounded-full border border-white/[.1] bg-white/[.035] text-slate-300 transition hover:border-white/20 hover:bg-white/[.1]" aria-label={`Scroll ${title} right`}><ChevronRight className="h-4 w-4" /></button></div></div>
    <div ref={ref} className="scrollbar-hide -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:-mx-7 sm:px-7 lg:-mx-[3.75rem] lg:px-[3.75rem]">
      {loading ? Array.from({length: 8}).map((_, i) => <div key={i} className="skeleton w-[135px] shrink-0 rounded-xl sm:w-[155px]" style={{aspectRatio: '2 / 3.65'}} />) : items.map((item) => <div key={item.id} className="w-[135px] shrink-0 snap-start sm:w-[155px] xl:w-[170px]"><MovieCard movie={item} /></div>)}
    </div>
  </section>;
}
