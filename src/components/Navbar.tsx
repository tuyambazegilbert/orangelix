import { Link, NavLink, useNavigate } from 'react-router-dom';
import { FormEvent, useState } from 'react';
import { Bell, Bookmark, ChevronDown, Compass, Home, LogOut, Menu, Search, Tv, UserRound, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const primaryLinks = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/movies', label: 'Movies', icon: Compass },
  { to: '/series', label: 'TV Shows', icon: Tv },
  { to: '/trending', label: 'Trending', icon: Compass },
  { to: '/favorites', label: 'Watchlist', icon: Bookmark },
];

export default function Navbar() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const submitSearch = (event: FormEvent) => { event.preventDefault(); if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}`); };

  return <>
    <header className="sticky top-0 z-50 border-b border-white/[.07] bg-[#080d17]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-5 px-4 sm:px-7">
        <Link to="/" className="flex shrink-0 items-center gap-2.5" aria-label="OrangeFlix home">
          <img src="/android-chrome-192x192.png" alt="OrangeFlix logo" className="h-8 w-8 object-contain drop-shadow-[0_2px_8px_rgba(249,115,22,0.4)]" />
          <span className="text-[17px] font-bold tracking-tight text-white">Orange<span className="text-orange-400">Flix</span></span>
        </Link>
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary navigation">
          {primaryLinks.map(({ to, label }) => <NavLink key={to} to={to} className={({ isActive }) => `rounded-md px-3 py-2 text-sm transition ${isActive ? 'bg-white/[.08] text-white' : 'text-slate-400 hover:text-white'}`}>{label}</NavLink>)}
        </nav>
        <form onSubmit={submitSearch} className="ml-auto hidden w-full max-w-xs md:block">
          <label className="relative block"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search titles, people..." className="h-9 w-full rounded-lg border border-white/[.08] bg-white/[.045] pl-9 pr-3 text-xs text-white placeholder:text-slate-500 outline-none transition focus:border-orange-400/60 focus:bg-white/[.07]" /></label>
        </form>
        <button className="hidden rounded-lg p-2 text-slate-400 hover:bg-white/[.07] hover:text-white md:block" aria-label="Notifications"><Bell className="h-4 w-4" /></button>
        {currentUser ? <div className="hidden items-center gap-2 md:flex"><Link to="/profile" className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-slate-300 hover:bg-white/[.07]"><span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-orange-400 to-violet-500 text-xs font-bold text-white">{currentUser.name?.[0]?.toUpperCase() || 'U'}</span><ChevronDown className="h-3.5 w-3.5" /></Link><button onClick={() => { logout(); navigate('/'); }} className="text-slate-500 hover:text-white" aria-label="Sign out"><LogOut className="h-4 w-4" /></button></div> : <Link to="/login" className="hidden rounded-lg bg-orange-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-orange-400 md:block">Sign in</Link>}
        <button onClick={() => setOpen(!open)} className="ml-auto rounded-lg p-2 text-white lg:hidden" aria-expanded={open} aria-label="Toggle navigation">{open ? <X /> : <Menu />}</button>
      </div>
      {open && <nav className="border-t border-white/[.07] bg-[#0a101c] px-4 py-3 lg:hidden">{primaryLinks.map(({to, label, icon: Icon}) => <NavLink key={to} to={to} onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm text-slate-300 hover:bg-white/[.06] hover:text-white"><Icon className="h-4 w-4 text-orange-400" />{label}</NavLink>)}</nav>}
    </header>
    <nav className="fixed inset-x-0 bottom-0 z-50 flex justify-around border-t border-white/[.08] bg-[#090e18]/95 px-2 py-2 backdrop-blur-xl lg:hidden" aria-label="Mobile navigation">{primaryLinks.slice(0, 4).map(({to, label, icon: Icon}) => <NavLink key={to} to={to} className={({isActive}) => `flex min-w-14 flex-col items-center gap-1 rounded-lg px-2 py-1 text-[10px] ${isActive ? 'text-orange-400' : 'text-slate-500'}`}><Icon className="h-4 w-4" />{label}</NavLink>)}<NavLink to="/profile" className={({isActive}) => `flex min-w-14 flex-col items-center gap-1 rounded-lg px-2 py-1 text-[10px] ${isActive ? 'text-orange-400' : 'text-slate-500'}`}><UserRound className="h-4 w-4" />Profile</NavLink></nav>
  </>;
}
