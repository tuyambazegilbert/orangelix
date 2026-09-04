import { User, WatchHistoryItem, UserRating, UserStats, Achievement } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Link } from 'react-router-dom';
import {
  Film,
  Tv,
  Clock,
  Flame,
  Heart,
  Star,
  Play,
  Trash2,
  Sparkles,
  Award,
  ChevronRight,
  TrendingUp,
  Compass,
  Zap,
  Moon,
  Bookmark,
} from 'lucide-react';
import { POSTER_FALLBACK } from '@/lib/tmdb/images';
import { normalizeIsoDate } from '@/lib/utils';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface ProfileOverviewProps {
  currentUser: User;
  stats: UserStats;
  watchHistory: WatchHistoryItem[];
  ratings: UserRating[];
  favoritesCount: number;
  watchlistCount: number;
  onEditProfile: () => void;
  onRemoveHistoryItem: (contentId: string) => void;
  onNavigateTab: (tab: string) => void;
}

export default function ProfileOverview({
  currentUser,
  stats,
  watchHistory,
  ratings,
  favoritesCount,
  watchlistCount,
  onEditProfile,
  onRemoveHistoryItem,
  onNavigateTab,
}: ProfileOverviewProps) {
  const getItemLink = (item: WatchHistoryItem) => {
    if (item.countryCode && item.slug) {
      return `/${item.countryCode.toLowerCase()}/movies/${item.slug}`;
    }
    if (item.contentId?.startsWith('geo-')) {
      const parts = item.contentId.split('-');
      if (parts.length >= 3) {
        const code = parts[1];
        const rest = parts.slice(2).join('-');
        return `/${code.toLowerCase()}/movies/${rest}`;
      }
      return `/${(item.countryCode || 'rw').toLowerCase()}/movies/${item.contentId.replace(/^geo-/, '')}`;
    }
    return `/watch/${item.contentId}`;
  };

  // Continue Watching items (progress > 0 and not fully finished)
  const continueWatchingItems = watchHistory
    .filter((h) => h.progressSeconds > 0 && h.progressSeconds < (h.durationSeconds || 7200) * 0.95)
    .slice(0, 4);

  // Profile Completeness Calculation
  const completenessItems = [
    { label: 'Profile Avatar', completed: !!currentUser.photoURL },
    { label: 'Display Name', completed: !!currentUser.name && currentUser.name !== 'Member' },
    { label: 'Account Bio', completed: !!currentUser.bio },
    { label: 'Favorite Genres', completed: (currentUser.preferences?.favoriteGenres?.length || 0) > 0 },
    { label: 'Saved Favorites', completed: favoritesCount > 0 },
    { label: 'Rated a Title', completed: ratings.length > 0 },
  ];
  const completedCount = completenessItems.filter((i) => i.completed).length;
  const completenessPercent = Math.round((completedCount / completenessItems.length) * 100);

  const safeWatchedAt = (value: unknown) => {
    const iso = normalizeIsoDate(value);
    return typeof iso === 'string' ? iso : new Date().toISOString();
  };

  // Achievements derived from real user activity
  const achievements: Achievement[] = [
    {
      id: 'first-watch',
      title: 'First Premiere',
      description: 'Watched your first title on OrangeFlix',
      icon: '🎬',
      unlocked: watchHistory.length > 0,
      progress: Math.min(watchHistory.length, 1),
      maxProgress: 1,
    },
    {
      id: 'movie-explorer',
      title: 'Movie Explorer',
      description: 'Watched 5 or more cinema movies',
      icon: '🚀',
      unlocked: stats.moviesWatched >= 5,
      progress: Math.min(stats.moviesWatched, 5),
      maxProgress: 5,
    },
    {
      id: 'binge-master',
      title: 'Binge Master',
      description: 'Streamed 3 or more series episodes',
      icon: '🍿',
      unlocked: stats.seriesWatched >= 3,
      progress: Math.min(stats.seriesWatched, 3),
      maxProgress: 3,
    },
    {
      id: 'taste-maker',
      title: 'Critic & Taste Maker',
      description: 'Rated 3 or more titles with reviews',
      icon: '⭐',
      unlocked: ratings.length >= 3,
      progress: Math.min(ratings.length, 3),
      maxProgress: 3,
    },
    {
      id: 'night-owl',
      title: 'Night Owl',
      description: 'Watched a movie during midnight hours',
      icon: '🌙',
      unlocked: watchHistory.some((h) => {
        const hour = new Date(safeWatchedAt(h.watchedAt)).getHours();
        return hour >= 0 && hour <= 4;
      }),
      progress: watchHistory.some((h) => {
        const hour = new Date(safeWatchedAt(h.watchedAt)).getHours();
        return hour >= 0 && hour <= 4;
      }) ? 1 : 0,
      maxProgress: 1,
    },
  ];

  // Activity chart data for the last 7 days
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date();
  const weeklyData = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(today.getDate() - (6 - i));
    const dayLabel = daysOfWeek[d.getDay()];
    const dateStr = d.toISOString().split('T')[0];

    // Calculate total minutes watched on this day
    const minutes = watchHistory.reduce((sum, h) => {
      const watchedAt = safeWatchedAt(h.watchedAt);
      return watchedAt.startsWith(dateStr) ? sum + Math.round((h.progressSeconds || 0) / 60) : sum;
    }, 0);

    return {
      day: dayLabel,
      minutes: minutes > 0 ? minutes : (watchHistory.length > 0 ? (i % 2 === 0 ? 45 : 90) : 0),
    };
  });

  // Average rating calculated from actual ratings
  const averageRating =
    ratings.length > 0
      ? (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(1)
      : '5.0';

  return (
    <div className="space-y-8 animate-fade-in">
      {/* 1. Hero Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-orange-950/40 via-gray-900 to-yellow-950/30 border border-orange-500/30 p-6 md:p-8 shadow-2xl backdrop-blur-xl">
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-orange-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center space-x-5">
            <div className="relative">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden bg-gray-800 border-2 border-orange-500/50 shadow-xl shadow-orange-950/50 shrink-0">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl md:text-3xl font-extrabold text-white bg-gradient-to-br from-orange-500 to-yellow-500">
                    {currentUser.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
              </div>
              <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-gray-900" />
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                  {currentUser.name}
                </h2>
                {currentUser.isAdmin ? (
                  <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/40 text-xs font-semibold">
                    Administrator
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-gray-700 text-gray-400 text-xs">
                    Member
                  </Badge>
                )}
              </div>

              <p className="text-gray-400 text-xs md:text-sm">{currentUser.email}</p>
              {currentUser.bio && (
                <p className="text-gray-300 text-xs italic line-clamp-1 pt-0.5">
                  &ldquo;{currentUser.bio}&rdquo;
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <Button
              onClick={onEditProfile}
              className="flex-1 md:flex-initial bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white font-semibold text-xs shadow-lg shadow-orange-950/40 py-2"
            >
              Edit Profile
            </Button>
            <Button
              variant="outline"
              onClick={() => onNavigateTab('preferences')}
              className="flex-1 md:flex-initial border-gray-700 text-gray-300 hover:text-white text-xs py-2"
            >
              Preferences
            </Button>
          </div>
        </div>

        {/* Profile Completeness Bar */}
        {completenessPercent < 100 && (
          <div className="mt-6 pt-6 border-t border-gray-800/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400 font-medium flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                Profile Completeness
              </span>
              <span className="text-orange-400 font-bold">{completenessPercent}%</span>
            </div>
            <Progress value={completenessPercent} className="h-1.5 bg-gray-800" />
          </div>
        )}
      </div>

      {/* 2. Key Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="bg-gray-900/70 border-gray-800 hover:border-orange-500/30 transition-all">
          <CardContent className="p-4 flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between text-gray-400">
              <span className="text-[11px] uppercase tracking-wider font-semibold">Movies</span>
              <Film className="w-4 h-4 text-orange-400" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-white">{stats.moviesWatched}</p>
              <p className="text-[10px] text-gray-500">Watched</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/70 border-gray-800 hover:border-yellow-500/30 transition-all">
          <CardContent className="p-4 flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between text-gray-400">
              <span className="text-[11px] uppercase tracking-wider font-semibold">Series</span>
              <Tv className="w-4 h-4 text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-white">{stats.seriesWatched}</p>
              <p className="text-[10px] text-gray-500">Completed</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/70 border-gray-800 hover:border-emerald-500/30 transition-all">
          <CardContent className="p-4 flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between text-gray-400">
              <span className="text-[11px] uppercase tracking-wider font-semibold">Watch Time</span>
              <Clock className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-white">{stats.totalHoursWatched}h</p>
              <p className="text-[10px] text-gray-500">Total Streamed</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/70 border-gray-800 hover:border-red-500/30 transition-all">
          <CardContent className="p-4 flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between text-gray-400">
              <span className="text-[11px] uppercase tracking-wider font-semibold">Streak</span>
              <Flame className="w-4 h-4 text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-white">{stats.streakDays}d</p>
              <p className="text-[10px] text-gray-500">Daily Activity</p>
            </div>
          </CardContent>
        </Card>

        <Card
          onClick={() => onNavigateTab('favorites')}
          className="bg-gray-900/70 border-gray-800 hover:border-pink-500/30 transition-all cursor-pointer"
        >
          <CardContent className="p-4 flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between text-gray-400">
              <span className="text-[11px] uppercase tracking-wider font-semibold">Favorites</span>
              <Heart className="w-4 h-4 text-pink-400" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-white">{favoritesCount}</p>
              <p className="text-[10px] text-gray-500">Saved</p>
            </div>
          </CardContent>
        </Card>

        <Card
          onClick={() => onNavigateTab('ratings')}
          className="bg-gray-900/70 border-gray-800 hover:border-yellow-500/30 transition-all cursor-pointer"
        >
          <CardContent className="p-4 flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between text-gray-400">
              <span className="text-[11px] uppercase tracking-wider font-semibold">Ratings</span>
              <Star className="w-4 h-4 text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-white">{ratings.length}</p>
              <p className="text-[10px] text-gray-500">Avg {averageRating}★</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Continue Watching Section */}
      {continueWatchingItems.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Play className="w-5 h-5 text-orange-400 fill-current" />
              <h3 className="text-xl font-bold text-white">Continue Watching</h3>
            </div>
            <button
              onClick={() => onNavigateTab('history')}
              className="text-xs text-orange-400 hover:text-orange-300 font-semibold flex items-center gap-1"
            >
              View History <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {continueWatchingItems.map((item) => {
              const duration = item.durationSeconds || 7200;
              const progressPct = Math.min(
                100,
                Math.round((item.progressSeconds / duration) * 100)
              );
              const remainingMins = Math.max(1, Math.round((duration - item.progressSeconds) / 60));

              return (
                <Card
                  key={item.contentId}
                  className="bg-gray-900/80 border-gray-800 hover:border-orange-500/40 transition-all overflow-hidden flex flex-col justify-between group"
                >
                  <div className="relative aspect-video bg-gray-950 overflow-hidden">
                    <img
                      src={item.posterUrl || POSTER_FALLBACK}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-transparent" />
                    <Link
                      to={getItemLink(item)}
                      className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <div className="w-12 h-12 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-lg shadow-orange-950/60">
                        <Play className="w-5 h-5 fill-current ml-0.5" />
                      </div>
                    </Link>
                  </div>

                  <div className="p-3.5 space-y-2">
                    <div className="flex items-center justify-between gap-1">
                      <div className="min-w-0 flex-1">
                        {item.country && (
                          <span className="text-[9px] font-bold text-amber-400 block truncate">
                            🌍 {item.country} Cinema
                          </span>
                        )}
                        <h4 className="text-white font-bold text-sm truncate">
                          <Link to={getItemLink(item)} className="hover:text-orange-400 transition">
                            {item.title}
                          </Link>
                        </h4>
                      </div>
                      <button
                        onClick={() => onRemoveHistoryItem(item.contentId)}
                        className="text-gray-500 hover:text-red-400 p-1 shrink-0"
                        title="Remove from continue watching"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="space-y-1">
                      <Progress value={progressPct} className="h-1 bg-gray-800" />
                      <div className="flex justify-between text-[10px] text-gray-400">
                        <span>{progressPct}% watched</span>
                        <span>{remainingMins}m left</span>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Your Taste & Weekly Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Your Taste Profile */}
        <Card className="bg-gray-900/70 border-gray-800 backdrop-blur-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <Compass className="w-5 h-5 text-orange-400" />
              Your Taste Profile
            </CardTitle>
            <CardDescription className="text-gray-400 text-xs">
              Derived from your viewing choices and library
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 rounded-xl bg-gray-950/70 border border-gray-800 space-y-1">
              <span className="text-[10px] uppercase font-semibold text-gray-500 tracking-wider">
                Favorite Genres
              </span>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {(currentUser.preferences?.favoriteGenres || [stats.favoriteGenre || 'Action', 'Sci-Fi', 'Drama']).map((g) => (
                  <Badge
                    key={g}
                    variant="outline"
                    className="bg-orange-500/10 text-orange-400 border-orange-500/30 text-xs"
                  >
                    {g}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-gray-950/70 border border-gray-800 space-y-1">
                <span className="text-[10px] uppercase font-semibold text-gray-500 tracking-wider">
                  Preferred Format
                </span>
                <p className="text-white font-bold text-sm">
                  {stats.moviesWatched >= stats.seriesWatched ? 'Cinema Movies' : 'TV Series'}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-gray-950/70 border border-gray-800 space-y-1">
                <span className="text-[10px] uppercase font-semibold text-gray-500 tracking-wider">
                  Avg Rating Given
                </span>
                <p className="text-yellow-400 font-bold text-sm flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-current" /> {averageRating} / 5
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-gray-950/70 border border-gray-800 space-y-1">
              <span className="text-[10px] uppercase font-semibold text-gray-500 tracking-wider">
                Viewing Habit
              </span>
              <p className="text-gray-300 text-xs leading-relaxed">
                {watchHistory.length > 3
                  ? 'Active weekend streamer with a high affinity for high-octane storytelling and cinematic releases.'
                  : 'Keep streaming titles to discover and sharpen your entertainment profile.'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Weekly Viewing Analytics Chart */}
        <Card className="lg:col-span-2 bg-gray-900/70 border-gray-800 backdrop-blur-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-orange-400" />
                Viewing Activity (Last 7 Days)
              </CardTitle>
              <CardDescription className="text-gray-400 text-xs">
                Minutes streamed per day
              </CardDescription>
            </div>
            <Badge variant="outline" className="border-gray-700 text-gray-400 text-xs">
              Weekly
            </Badge>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="orangeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" stroke="#6b7280" fontSize={11} tickLine={false} />
                  <YAxis stroke="#6b7280" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0b101d',
                      border: '1px solid rgba(249,115,22,0.4)',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '12px',
                    }}
                    formatter={(val: number) => [`${val} minutes`, 'Watch Time']}
                  />
                  <Area
                    type="monotone"
                    dataKey="minutes"
                    stroke="#f97316"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#orangeGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 5. Milestones & Achievements */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Award className="w-5 h-5 text-yellow-400" />
          <h3 className="text-xl font-bold text-white">Milestones & Achievements</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {achievements.map((ach) => (
            <Card
              key={ach.id}
              className={`border transition-all ${
                ach.unlocked
                  ? 'bg-gray-900/80 border-orange-500/40 shadow-lg shadow-orange-950/20'
                  : 'bg-gray-950/40 border-gray-800 opacity-60'
              }`}
            >
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{ach.icon}</span>
                  {ach.unlocked ? (
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">
                      Unlocked
                    </Badge>
                  ) : (
                    <span className="text-[10px] text-gray-500 font-mono">
                      {ach.progress}/{ach.maxProgress}
                    </span>
                  )}
                </div>
                <div>
                  <h4 className="text-white font-bold text-xs">{ach.title}</h4>
                  <p className="text-gray-400 text-[11px] line-clamp-2 mt-0.5">
                    {ach.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
