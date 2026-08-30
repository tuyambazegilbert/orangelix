import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { FormEvent, useEffect, useState, useMemo } from 'react';
import {
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
  Film,
  Globe,
  Grid,
  Heart,
  SlidersHorizontal,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getAllCountries, getCountryConfig } from '@/features/geo/countryConfig';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

const primaryLinks = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/movies', label: 'Movies', icon: Compass },
  { to: '/series', label: 'TV Shows', icon: Tv },
  { to: '/trending', label: 'Trending', icon: Sparkles },
  { to: '/new', label: 'New Releases', icon: Moon },
  { to: '/genres', label: 'Genres', icon: Grid },
  { to: '/favorites', label: 'My List', icon: Bookmark },
  { to: '/news', label: 'News', icon: Newspaper },
  { to: '/music', label: 'Soundtracks', icon: Music2 },
];

export default function Navbar() {
  const { currentUser, logout, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const countries = useMemo(() => getAllCountries(), []);

  // Detect current active country from URL pathname e.g. /rw/movies -> RW
  const currentCountryCode = useMemo(() => {
    const match = location.pathname.match(/^\/([a-zA-Z]{2})\/(?:movies|watch|series)/);
    return match ? match[1].toUpperCase() : 'RW';
  }, [location.pathname]);

  const activeCountry = useMemo(() => getCountryConfig(currentCountryCode), [currentCountryCode]);

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 12);
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);

  useEffect(() => {
    if (location.pathname !== '/search') return;
    setQuery(new URLSearchParams(location.search).get('q') || '');
  }, [location.pathname, location.search]);

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    const nextQuery = query.trim();
    navigate(nextQuery ? `/search?q=${encodeURIComponent(nextQuery)}` : '/search');
    setOpen(false);
  };

  const handleCountrySelect = (code: string) => {
    navigate(`/${code.toLowerCase()}/movies`);
    setOpen(false);
  };

  return (
    <>
      <header
        className={`sticky top-0 z-50 transition-colors duration-300 ${
          scrolled
            ? 'border-b border-white/[.08] bg-[#080d17]/95 shadow-[0_8px_26px_rgba(0,0,0,.35)] backdrop-blur-xl'
            : 'border-b border-white/[.04] bg-[#080d17]/75 backdrop-blur-md'
        }`}
      >
        <div className="mx-auto flex h-16 max-w-[1700px] items-center gap-4 px-3.5 sm:px-6">
          {/* Logo */}
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

          {/* Desktop Navigation Links */}
          <nav className="hidden items-center gap-0.5 xl:flex" aria-label="Primary navigation">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                  isActive ? 'bg-white/[.08] text-orange-400' : 'text-slate-300 hover:text-white hover:bg-white/[.04]'
                }`
              }
            >
              Home
            </NavLink>

            <NavLink
              to="/movies"
              className={({ isActive }) =>
                `rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                  isActive ? 'bg-white/[.08] text-orange-400' : 'text-slate-300 hover:text-white hover:bg-white/[.04]'
                }`
              }
            >
              Movies
            </NavLink>

            <NavLink
              to="/series"
              className={({ isActive }) =>
                `rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                  isActive ? 'bg-white/[.08] text-orange-400' : 'text-slate-300 hover:text-white hover:bg-white/[.04]'
                }`
              }
            >
              TV Shows
            </NavLink>

            {/* Geo-Cinema Location Dropdown in Desktop Nav */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition border ${
                    location.pathname.includes('/movies') && location.pathname !== '/movies'
                      ? 'bg-orange-500/15 border-orange-500/30 text-orange-400'
                      : 'border-transparent text-slate-300 hover:text-white hover:bg-white/[.04]'
                  }`}
                >
                  <span className="text-sm">{activeCountry.flagEmoji}</span>
                  <span>{activeCountry.name} Cinema</span>
                  <ChevronDown className="w-3 h-3 opacity-60 ml-0.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-gray-900 border-gray-800 text-white w-56 shadow-2xl">
                <DropdownMenuLabel className="text-[11px] uppercase tracking-wider text-gray-400 font-bold px-2 py-1.5 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-orange-400" /> African & Global Cinema
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-gray-800" />
                {countries.map((c) => (
                  <DropdownMenuItem
                    key={c.countryCode}
                    onClick={() => handleCountrySelect(c.countryCode)}
                    className="flex items-center justify-between text-xs py-2 cursor-pointer hover:bg-gray-800 focus:bg-gray-800"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">{c.flagEmoji}</span>
                      <span className="font-medium text-white">{c.name}</span>
                    </div>
                    {c.countryCode === currentCountryCode && (
                      <Badge className="bg-orange-500 text-white text-[10px] px-1.5 py-0">Active</Badge>
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <NavLink
              to="/trending"
              className={({ isActive }) =>
                `rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                  isActive ? 'bg-white/[.08] text-orange-400' : 'text-slate-300 hover:text-white hover:bg-white/[.04]'
                }`
              }
            >
              Trending
            </NavLink>

            <NavLink
              to="/new"
              className={({ isActive }) =>
                `rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                  isActive ? 'bg-white/[.08] text-orange-400' : 'text-slate-300 hover:text-white hover:bg-white/[.04]'
                }`
              }
            >
              New
            </NavLink>

            <NavLink
              to="/genres"
              className={({ isActive }) =>
                `rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                  isActive ? 'bg-white/[.08] text-orange-400' : 'text-slate-300 hover:text-white hover:bg-white/[.04]'
                }`
              }
            >
              Genres
            </NavLink>

            <NavLink
              to="/favorites"
              className={({ isActive }) =>
                `rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                  isActive ? 'bg-white/[.08] text-orange-400' : 'text-slate-300 hover:text-white hover:bg-white/[.04]'
                }`
              }
            >
              My List
            </NavLink>
          </nav>

          {/* Search Bar */}
          <form onSubmit={submitSearch} className="ml-auto hidden w-full max-w-xs md:block">
            <label className="relative block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search movies, cinema, genres..."
                className="h-9 w-full rounded-xl border border-white/[.09] bg-white/[.05] pl-9 pr-3 text-xs text-white placeholder:text-slate-500 outline-none transition focus:border-orange-400/60 focus:bg-white/[.08]"
              />
            </label>
          </form>

          {/* Location Quick Switcher for tablet/laptop */}
          <div className="hidden lg:flex xl:hidden items-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1.5 bg-gray-900 border border-gray-800 rounded-lg px-2.5 py-1.5 text-xs text-white">
                  <span>{activeCountry.flagEmoji}</span>
                  <span className="font-semibold">{activeCountry.countryCode}</span>
                  <ChevronDown className="w-3 h-3 text-gray-400" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-gray-900 border-gray-800 text-white w-48">
                {countries.map((c) => (
                  <DropdownMenuItem
                    key={c.countryCode}
                    onClick={() => handleCountrySelect(c.countryCode)}
                    className="flex items-center gap-2 text-xs py-2 cursor-pointer"
                  >
                    <span>{c.flagEmoji}</span>
                    <span>{c.name}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* User Account / Profile */}
          {isLoading ? (
            <div className="hidden h-8 w-24 rounded-lg bg-white/[.06] animate-pulse md:block" />
          ) : currentUser ? (
            <div className="hidden items-center gap-2 md:flex">
              <Link
                to="/profile"
                className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 hover:bg-white/[.07] transition"
              >
                <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-orange-400 to-violet-500 text-xs font-bold text-white shadow-sm">
                  {currentUser.name?.[0]?.toUpperCase() || 'U'}
                </span>
                <span className="font-semibold text-white truncate max-w-[100px]">{currentUser.name || 'Account'}</span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
              </Link>
              <button
                onClick={() => {
                  logout();
                  navigate('/');
                }}
                className="text-slate-400 hover:text-red-400 p-1.5 transition"
                aria-label="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="hidden rounded-xl bg-orange-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-orange-400 md:block shadow-md shadow-orange-500/20"
            >
              Sign in
            </Link>
          )}

          {/* Mobile Country Quick Dropdown in Header */}
          <div className="xl:hidden ml-auto mr-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex items-center gap-1.5 bg-gray-900 border border-gray-800 rounded-xl px-2.5 py-1.5 text-xs text-white shadow-sm focus:outline-none"
                  aria-label="Select cinema country"
                >
                  <span className="text-sm">{activeCountry.flagEmoji}</span>
                  <span className="font-bold text-[11px] text-orange-400">{activeCountry.countryCode}</span>
                  <ChevronDown className="w-3 h-3 text-gray-400" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-gray-900 border-gray-800 text-white w-52 shadow-2xl">
                <DropdownMenuLabel className="text-[11px] uppercase tracking-wider text-gray-400 font-bold px-2 py-1.5 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-orange-400" /> Cinema Territories
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-gray-800" />
                {countries.map((c) => (
                  <DropdownMenuItem
                    key={c.countryCode}
                    onClick={() => handleCountrySelect(c.countryCode)}
                    className="flex items-center justify-between text-xs py-2 cursor-pointer hover:bg-gray-800"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">{c.flagEmoji}</span>
                      <span className="font-medium text-white">{c.name}</span>
                    </div>
                    {c.countryCode === currentCountryCode && (
                      <Badge className="bg-orange-500 text-white text-[9px] px-1.5 py-0">Active</Badge>
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setOpen(!open)}
            className="rounded-xl p-2.5 text-white bg-gray-900 border border-gray-800 xl:hidden focus:outline-none"
            aria-expanded={open}
            aria-label="Toggle navigation menu"
          >
            {open ? <X className="w-5 h-5 text-orange-400" /> : <Menu className="w-5 h-5 text-white" />}
          </button>
        </div>

        {/* Scalable, Comprehensive Mobile Drawer with all links */}
        {open && (
          <div className="border-t border-white/[.08] bg-[#090e1a]/98 px-4 py-4 xl:hidden max-h-[85vh] overflow-y-auto space-y-4 shadow-2xl backdrop-blur-2xl animate-in slide-in-from-top-2 duration-200">
            {/* Search in Drawer */}
            <form onSubmit={submitSearch} className="block w-full">
              <label className="relative block">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search movies, cinema, shows..."
                  className="h-10 w-full rounded-xl border border-white/[.12] bg-white/[.06] pl-10 pr-3 text-xs text-white placeholder:text-slate-400 outline-none focus:border-orange-500"
                />
              </label>
            </form>

            {/* Sleek Country Dropdown in Mobile Drawer */}
            <div className="space-y-2 p-3 bg-black/40 border border-white/10 rounded-2xl">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5" /> Cinema Territory
                </span>
                <span className="text-[11px] text-gray-400 font-mono">
                  {activeCountry.name}
                </span>
              </div>

              <Select
                value={currentCountryCode}
                onValueChange={(code) => {
                  handleCountrySelect(code);
                  setOpen(false);
                }}
              >
                <SelectTrigger className="w-full bg-gray-900 border-gray-700 text-xs text-white h-10 rounded-xl">
                  <SelectValue placeholder="Select Country Cinema" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-800 text-white">
                  {countries.map((c) => (
                    <SelectItem key={c.countryCode} value={c.countryCode} className="text-xs py-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{c.flagEmoji}</span>
                        <span className="font-semibold text-white">{c.name} Cinema</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* All Nav Links in Mobile Drawer */}
            <div className="grid grid-cols-2 gap-1.5">
              {primaryLinks.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-medium transition border ${
                      isActive
                        ? 'bg-orange-500/15 border-orange-500/30 text-orange-400 font-bold'
                        : 'bg-gray-900/40 border-gray-800/60 text-slate-300 hover:bg-white/[.06] hover:text-white'
                    }`
                  }
                >
                  <Icon className="h-4 w-4 text-orange-400 shrink-0" />
                  <span className="truncate">{label}</span>
                </NavLink>
              ))}
            </div>

            {/* User Profile / Auth Area in Drawer */}
            <div className="pt-2 border-t border-white/[.08] flex items-center justify-between">
              {isLoading ? (
                <div className="h-10 w-24 rounded bg-white/[.06] animate-pulse" />
              ) : currentUser ? (
                <div className="flex items-center justify-between w-full">
                  <Link
                    to="/profile"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2 text-xs font-semibold text-white p-1"
                  >
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-orange-400 to-violet-500 text-xs font-bold text-white shadow-sm">
                      {currentUser.name?.[0]?.toUpperCase() || 'U'}
                    </span>
                    <div>
                      <p className="font-bold text-white">{currentUser.name}</p>
                      <p className="text-[10px] text-gray-400">{currentUser.email}</p>
                    </div>
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setOpen(false);
                    }}
                    className="text-xs text-red-400 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Sign out
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setOpen(false)}
                  className="w-full text-center py-2.5 rounded-xl bg-orange-500 text-white text-xs font-bold shadow-lg shadow-orange-500/20"
                >
                  Sign in to OrangeFlix
                </Link>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Mobile Bottom Navigation Bar (Proportionate, Scalable, Maginified to Touch) */}
      <nav
        className="fixed inset-x-0 bottom-0 z-50 flex justify-around items-center border-t border-white/[.09] bg-[#090e18]/95 px-1 py-1.5 backdrop-blur-2xl xl:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.5)]"
        aria-label="Mobile navigation"
      >
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex min-w-[56px] flex-col items-center gap-0.5 rounded-xl px-1.5 py-1 text-[10px] transition ${
              isActive ? 'text-orange-400 font-bold bg-orange-500/10' : 'text-slate-400 hover:text-white'
            }`
          }
        >
          <Home className="h-4 w-4" />
          Home
        </NavLink>

        <NavLink
          to="/movies"
          className={({ isActive }) =>
            `flex min-w-[56px] flex-col items-center gap-0.5 rounded-xl px-1.5 py-1 text-[10px] transition ${
              isActive ? 'text-orange-400 font-bold bg-orange-500/10' : 'text-slate-400 hover:text-white'
            }`
          }
        >
          <Compass className="h-4 w-4" />
          Movies
        </NavLink>

        <NavLink
          to={`/${currentCountryCode.toLowerCase()}/movies`}
          className={({ isActive }) =>
            `flex min-w-[56px] flex-col items-center gap-0.5 rounded-xl px-1.5 py-1 text-[10px] transition ${
              isActive ? 'text-orange-400 font-bold bg-orange-500/10' : 'text-slate-400 hover:text-white'
            }`
          }
        >
          <Film className="h-4 w-4" />
          Cinema
        </NavLink>

        <NavLink
          to="/favorites"
          className={({ isActive }) =>
            `flex min-w-[56px] flex-col items-center gap-0.5 rounded-xl px-1.5 py-1 text-[10px] transition ${
              isActive ? 'text-orange-400 font-bold bg-orange-500/10' : 'text-slate-400 hover:text-white'
            }`
          }
        >
          <Bookmark className="h-4 w-4" />
          My List
        </NavLink>

        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `flex min-w-[56px] flex-col items-center gap-0.5 rounded-xl px-1.5 py-1 text-[10px] transition ${
              isActive ? 'text-orange-400 font-bold bg-orange-500/10' : 'text-slate-400 hover:text-white'
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
