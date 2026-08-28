import { Link, NavLink, useNavigate } from 'react-router-dom';
import { FormEvent, useState } from 'react';
import {
  Bell,
  Bookmark,
  ChevronDown,
  Compass,
  Home,
  LogOut,
  Menu,
  Search,
  Tv,
  UserRound,
  X,
  Sparkles,
  Newspaper,
  Music2,
  Moon,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const primaryLinks = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/movies', label: 'Movies', icon: Compass },
  { to: '/series', label: 'TV Shows', icon: Tv },
  { to: '/movie-night', label: 'Tonight', icon: Moon },
  { to: '/news', label: 'News', icon: Newspaper },
  { to: '/music', label: 'Soundtracks', icon: Music2 },
  { to: '/favorites', label: 'Watchlist', icon: Bookmark },
];

export default function Navbar() {
  const { currentUser, logout, isLoading } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-white/[.07] bg-[#080d17]/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-5 px-4 sm:px-7">
          <Link to="/" className="flex shrink-0 items-center gap-2.5" aria-label="OrangeFlix home">
            <img
              src="/android-chrome-192x192.png"
              alt="OrangeFlix logo"
              className="h-8 w-8 object-contain drop-shadow-[0_2px_8px_rgba(249,115,22,0.4)]"
            />
            <span className="text-[17px] font-bold tracking-tight text-white">
              Orange<span className="text-orange-400">Flix</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-0.5 xl:flex" aria-label="Primary navigation">
            {primaryLinks.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    isActive ? 'bg-white/[.08] text-orange-400' : 'text-slate-400 hover:text-white hover:bg-white/[.03]'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>

          <form onSubmit={submitSearch} className="ml-auto hidden w-full max-w-xs md:block">
            <label className="relative block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search movies, news, soundtracks..."
                className="h-9 w-full rounded-lg border border-white/[.08] bg-white/[.045] pl-9 pr-3 text-xs text-white placeholder:text-slate-500 outline-none transition focus:border-orange-400/60 focus:bg-white/[.07]"
              />
            </label>
          </form>

          {isLoading ? (
            <div className="hidden h-8 w-24 rounded-lg bg-white/[.06] animate-pulse md:block" />
          ) : currentUser ? (
            <div className="hidden items-center gap-3 md:flex">
              <Link
                to="/profile"
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-slate-300 hover:bg-white/[.07]"
              >
                <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-orange-400 to-violet-500 text-xs font-bold text-white shadow-sm">
                  {currentUser.name?.[0]?.toUpperCase() || 'U'}
                </span>
                <span className="font-semibold">{currentUser.name || 'Account'}</span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
              </Link>
              <button
                onClick={() => {
                  logout();
                  navigate('/');
                }}
                className="text-slate-500 hover:text-white p-1"
                aria-label="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="hidden rounded-lg bg-orange-500 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-orange-400 md:block shadow-md shadow-orange-500/20"
            >
              Sign in
            </Link>
          )}

          <button
            onClick={() => setOpen(!open)}
            className="ml-auto rounded-lg p-2 text-white xl:hidden"
            aria-expanded={open}
            aria-label="Toggle navigation"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {open && (
          <nav className="border-t border-white/[.07] bg-[#0a101c] px-4 py-3 xl:hidden space-y-1">
            {primaryLinks.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-medium text-slate-300 hover:bg-white/[.06] hover:text-white"
              >
                <Icon className="h-4 w-4 text-orange-400" />
                {label}
              </NavLink>
            ))}
            <div className="pt-2 border-t border-white/[.06] flex items-center justify-between">
              {isLoading ? (
                <div className="h-8 w-20 rounded bg-white/[.06] animate-pulse" />
              ) : currentUser ? (
                <button
                  onClick={() => {
                    logout();
                    setOpen(false);
                  }}
                  className="text-xs text-red-400 flex items-center gap-1.5 p-2"
                >
                  <LogOut className="w-4 h-4" /> Sign out ({currentUser.name})
                </button>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setOpen(false)}
                  className="w-full text-center py-2 rounded-lg bg-orange-500 text-white text-xs font-semibold"
                >
                  Sign in
                </Link>
              )}
            </div>
          </nav>
        )}
      </header>

      {/* Mobile Bottom Bar */}
      <nav
        className="fixed inset-x-0 bottom-0 z-50 flex justify-around border-t border-white/[.08] bg-[#090e18]/95 px-2 py-2 backdrop-blur-xl xl:hidden"
        aria-label="Mobile navigation"
      >
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex min-w-12 flex-col items-center gap-1 rounded-lg px-1.5 py-1 text-[10px] ${
              isActive ? 'text-orange-400 font-bold' : 'text-slate-500'
            }`
          }
        >
          <Home className="h-4 w-4" />
          Home
        </NavLink>
        <NavLink
          to="/movies"
          className={({ isActive }) =>
            `flex min-w-12 flex-col items-center gap-1 rounded-lg px-1.5 py-1 text-[10px] ${
              isActive ? 'text-orange-400 font-bold' : 'text-slate-500'
            }`
          }
        >
          <Compass className="h-4 w-4" />
          Movies
        </NavLink>
        <NavLink
          to="/movie-night"
          className={({ isActive }) =>
            `flex min-w-12 flex-col items-center gap-1 rounded-lg px-1.5 py-1 text-[10px] ${
              isActive ? 'text-orange-400 font-bold' : 'text-slate-500'
            }`
          }
        >
          <Moon className="h-4 w-4" />
          Tonight
        </NavLink>
        <NavLink
          to="/news"
          className={({ isActive }) =>
            `flex min-w-12 flex-col items-center gap-1 rounded-lg px-1.5 py-1 text-[10px] ${
              isActive ? 'text-orange-400 font-bold' : 'text-slate-500'
            }`
          }
        >
          <Newspaper className="h-4 w-4" />
          News
        </NavLink>
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `flex min-w-12 flex-col items-center gap-1 rounded-lg px-1.5 py-1 text-[10px] ${
              isActive ? 'text-orange-400 font-bold' : 'text-slate-500'
            }`
          }
        >
          <UserRound className="h-4 w-4" />
          Profile
        </NavLink>
      </nav>
    </>
  );
}
