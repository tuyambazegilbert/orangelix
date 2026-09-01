import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { FirebaseData, LibraryItem } from '@/lib/firebase-data';
import { MovieService } from '@/lib/movies';
import { normalizeGenreList, normalizeIsoDate } from '@/lib/utils';
import {
  User,
  WatchHistoryItem,
  UserRating,
  UserStats,
  UserPreferences,
  Movie,
} from '@/types';
import { MediaItem } from '@/types/media';
import { POSTER_FALLBACK } from '@/lib/tmdb/images';
import ProfileOverview from '@/components/profile/ProfileOverview';
import ProfileHistory from '@/components/profile/ProfileHistory';
import ProfileFavorites from '@/components/profile/ProfileFavorites';
import ProfileWatchLater from '@/components/profile/ProfileWatchLater';
import ProfileRatings from '@/components/profile/ProfileRatings';
import ProfileAnalytics from '@/components/profile/ProfileAnalytics';
import ProfilePreferences from '@/components/profile/ProfilePreferences';
import ProfileSecurity from '@/components/profile/ProfileSecurity';
import EditProfileModal from '@/components/profile/EditProfileModal';
import {
  LayoutDashboard,
  History,
  Heart,
  Bookmark,
  Star,
  BarChart3,
  Sliders,
  Shield,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

type TabId =
  | 'overview'
  | 'history'
  | 'favorites'
  | 'watchlater'
  | 'ratings'
  | 'analytics'
  | 'preferences'
  | 'security';

export default function Profile() {
  const { currentUser, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<User | null>(currentUser);
  const [isLoading, setIsLoading] = useState(true);

  // User Library Data
  const [watchHistory, setWatchHistory] = useState<WatchHistoryItem[]>([]);
  const [favorites, setFavorites] = useState<(MediaItem | Movie)[]>([]);
  const [watchLater, setWatchLater] = useState<(MediaItem | Movie)[]>([]);
  const [ratings, setRatings] = useState<UserRating[]>([]);

  // Fetch all user personal data
  const loadUserData = useCallback(async () => {
    if (!currentUser) return;
    setIsLoading(true);

    try {
      // 1. Fetch Firestore data
      const [fsHistory, fsRatings, fsPrefs, cloudFavorites, cloudWatchLater] = await Promise.all([
        FirebaseData.getWatchHistory(currentUser.id),
        FirebaseData.getUserRatings(currentUser.id),
        FirebaseData.getUserPreferences(currentUser.id),
        FirebaseData.getFavorites(currentUser.id),
        FirebaseData.getWatchlist(currentUser.id),
      ]);

      // 2. Fetch local favorites & watchlater
      const localFavs = MovieService.getFavorites(currentUser.id);
      const localWatchLater = MovieService.getWatchLater(currentUser.id);

      // Map favorites
      const mappedFavs: (MediaItem | Movie)[] = localFavs.map((f) => {
        if (f.cachedMedia) return f.cachedMedia as MediaItem | Movie;
        const localMovie = MovieService.getMovieById(f.movieId);
        if (localMovie) return localMovie;
        return {
          id: f.movieId,
          title: 'Saved Title',
          description: '',
          type: 'Movie',
          genre: ['Action'],
          releaseYear: 2026,
          duration: 120,
          imageUrl: POSTER_FALLBACK,
          videoUrl: '',
          rating: 5,
          totalRatings: 1,
          createdAt: f.createdAt,
          updatedAt: f.createdAt,
        };
      });

      const mappedWatchLater: (MediaItem | Movie)[] = localWatchLater.map((w) => {
        if (w.cachedMedia) return w.cachedMedia as MediaItem | Movie;
        const localMovie = MovieService.getMovieById(w.movieId);
        if (localMovie) return localMovie;
        return {
          id: w.movieId,
          title: 'Queued Title',
          description: '',
          type: 'Movie',
          genre: ['Action'],
          releaseYear: 2026,
          duration: 120,
          imageUrl: POSTER_FALLBACK,
          videoUrl: '',
          rating: 5,
          totalRatings: 1,
          createdAt: w.createdAt,
          updatedAt: w.createdAt,
        };
      });

      const mapCloudLibrary = (item: LibraryItem): MediaItem => ({
        id: item.contentId,
        tmdbId: item.tmdbId || Number(item.contentId.replace(/\D/g, '')) || 0,
        mediaType: item.mediaType,
        title: item.title,
        description: '',
        posterUrl: item.posterUrl || null,
        backdropUrl: null,
        imageUrl: item.posterUrl || POSTER_FALLBACK,
        rating: (item.rating || 0) / 2,
        voteAverage: item.rating || 0,
        voteCount: 0,
        releaseDate: null,
        releaseYear: item.releaseYear || null,
        genres: [],
        duration: null,
      });
      const mergeLibrary = (local: (MediaItem | Movie)[], cloud: LibraryItem[]) => {
        const seen = new Set(local.map((item) => item.id));
        return [...local, ...cloud.map(mapCloudLibrary).filter((item) => !seen.has(item.id))];
      };

      const normalizedHistory: WatchHistoryItem[] = fsHistory.map((item) => ({
        ...item,
        title: item.title || 'Untitled',
        genre: normalizeGenreList(item.genre),
        watchedAt: normalizeIsoDate(item.watchedAt),
      }));

      setWatchHistory(normalizedHistory);
      setRatings(fsRatings);
      setFavorites(mergeLibrary(mappedFavs, cloudFavorites));
      setWatchLater(mergeLibrary(mappedWatchLater, cloudWatchLater));

      if (fsPrefs) {
        setUserProfile((prev) => (prev ? { ...prev, preferences: fsPrefs } : prev));
      }
    } catch (err) {
      console.warn('Profile data load skipped:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      setUserProfile(currentUser);
      void loadUserData();
    }
  }, [currentUser, loadUserData]);

  // Compute Live Personal Statistics
  const stats: UserStats = useMemo(() => {
    const moviesCount = watchHistory.filter((h) => h.mediaType !== 'tv').length;
    const seriesCount = watchHistory.filter((h) => h.mediaType === 'tv').length;
    const totalSeconds = watchHistory.reduce((sum, h) => sum + (h.progressSeconds || 0), 0);
    const totalHours = Math.max(1, Math.round(totalSeconds / 3600));

    // Favorite genre
    const genreCounts: { [key: string]: number } = {};
    watchHistory.forEach((h) => {
      const genres = normalizeGenreList(h.genre).length ? normalizeGenreList(h.genre) : ['Action'];
      genres.forEach((g) => {
        genreCounts[g] = (genreCounts[g] || 0) + 1;
      });
    });
    const sortedGenres = Object.entries(genreCounts).sort((a, b) => b[1] - a[1]);
    const topGenre = sortedGenres[0]?.[0] || 'Action';

    // Approximate active streak (Safe Date Parsing)
    const uniqueDays = new Set(
      watchHistory
        .map((h) => {
          if (!h.watchedAt) return null;
          const d = new Date(h.watchedAt);
          return isNaN(d.getTime()) ? null : d.toISOString().split('T')[0];
        })
        .filter(Boolean)
    );

    return {
      moviesWatched: moviesCount > 0 ? moviesCount : (watchHistory.length > 0 ? 1 : 0),
      seriesWatched: seriesCount,
      totalHoursWatched: totalHours,
      favoriteGenre: topGenre,
      streakDays: Math.max(1, uniqueDays.size),
      totalFavorites: favorites.length,
      totalWatchLater: watchLater.length,
      totalRatings: ratings.length,
    };
  }, [favorites.length, ratings.length, watchHistory, watchLater.length]);

  // Actions
  const handleRemoveHistoryItem = async (contentId: string) => {
    if (!currentUser) return;
    setWatchHistory((prev) => prev.filter((h) => h.contentId !== contentId));
    await FirebaseData.removeWatchHistory(currentUser.id, contentId);
    toast.success('Removed from watch history');
  };

  const handleClearHistory = async () => {
    if (!currentUser) return;
    setWatchHistory([]);
    await FirebaseData.clearWatchHistory(currentUser.id);
    toast.success('Watch history cleared');
  };

  const handleRemoveFavorite = (id: string) => {
    if (!currentUser) return;
    MovieService.removeFromFavorites(id, currentUser.id);
    void FirebaseData.removeFavorites(currentUser.id, id);
    setFavorites((prev) => prev.filter((f) => f.id !== id));
    toast.success('Removed from favorites');
  };

  const handleAddToWatchLater = (id: string, item: MediaItem | Movie) => {
    if (!currentUser) return;
    MovieService.addToWatchLater(id, currentUser.id, {
      mediaType: ('mediaType' in item ? item.mediaType : 'movie') as 'movie' | 'tv',
      cachedMedia: item,
    });
    void FirebaseData.setWatchlist(currentUser.id, item);
    setWatchLater((prev) => (prev.some((w) => w.id === id) ? prev : [...prev, item]));
    toast.success('Added to Watch Later queue');
  };

  const handleRemoveWatchLater = (id: string) => {
    if (!currentUser) return;
    MovieService.removeFromWatchLater(id, currentUser.id);
    void FirebaseData.removeWatchlist(currentUser.id, id);
    setWatchLater((prev) => prev.filter((w) => w.id !== id));
  };

  const handleMarkAsWatched = (item: MediaItem | Movie) => {
    if (!currentUser) return;
    const histItem: WatchHistoryItem = {
      contentId: item.id,
      mediaType: ('mediaType' in item && item.mediaType === 'tv' ? 'tv' : 'movie') as 'movie' | 'tv',
      title: item.title,
      posterUrl: 'posterUrl' in item ? item.posterUrl : ('imageUrl' in item ? item.imageUrl : ''),
      progressSeconds: 7200,
      durationSeconds: 7200,
      genre: 'genre' in item ? item.genre : ['Action'],
      watchedAt: new Date().toISOString(),
    };

    setWatchHistory((prev) => [histItem, ...prev]);
    void FirebaseData.saveWatchProgress(currentUser.id, histItem);
    handleRemoveWatchLater(item.id);
    toast.success(`Marked "${item.title}" as completed!`);
  };

  const handleUpdateRating = async (movieId: string, score: number) => {
    if (!currentUser) return;
    const movie = favorites.find((f) => f.id === movieId) || watchLater.find((w) => w.id === movieId);
    const newRating: UserRating = {
      movieId,
      mediaTitle: movie?.title || 'Rated Title',
      rating: score,
      posterUrl: movie && 'posterUrl' in movie ? movie.posterUrl : undefined,
      ratedAt: new Date().toISOString(),
    };

    setRatings((prev) => {
      const filtered = prev.filter((r) => r.movieId !== movieId);
      return [newRating, ...filtered];
    });

    await FirebaseData.saveUserRating(currentUser.id, newRating);
  };

  const handleRemoveRating = async (movieId: string) => {
    if (!currentUser) return;
    setRatings((prev) => prev.filter((r) => r.movieId !== movieId));
    await FirebaseData.removeUserRating(currentUser.id, movieId);
    toast.success('Rating removed');
  };

  const handlePreferencesUpdated = (prefs: UserPreferences) => {
    setUserProfile((prev) => (prev ? { ...prev, preferences: prefs } : prev));
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white page-wrap py-12 flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-orange-500 animate-spin mb-4" />
        <p className="text-sm text-gray-400">Loading your profile...</p>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  const navItems = [
    { id: 'overview' as TabId, label: 'Overview', icon: LayoutDashboard },
    { id: 'history' as TabId, label: 'Watch History', icon: History, count: watchHistory.length },
    { id: 'favorites' as TabId, label: 'Favorites', icon: Heart, count: favorites.length },
    { id: 'watchlater' as TabId, label: 'Watch Later', icon: Bookmark, count: watchLater.length },
    { id: 'ratings' as TabId, label: 'My Ratings', icon: Star, count: ratings.length },
    { id: 'analytics' as TabId, label: 'Taste & Analytics', icon: BarChart3 },
    { id: 'preferences' as TabId, label: 'Preferences & Playback', icon: Sliders },
    { id: 'security' as TabId, label: 'Security & Account', icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white pt-20 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Navigation Switcher: Mobile tabs & Desktop Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Sidebar / Left Navigation */}
          <div className="lg:col-span-3 space-y-4">
            {/* User Quick Info */}
            <div className="p-4 rounded-2xl bg-gray-900/80 border border-gray-800 backdrop-blur-xl flex items-center space-x-3.5">
              <div className="w-12 h-12 rounded-xl bg-gray-800 border border-orange-500/40 overflow-hidden shrink-0">
                {userProfile?.photoURL ? (
                  <img
                    src={userProfile.photoURL}
                    alt={userProfile.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-bold text-base text-white bg-gradient-to-br from-orange-500 to-yellow-500">
                    {userProfile?.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-white font-bold text-sm truncate">{userProfile?.name}</h3>
                <p className="text-gray-400 text-xs truncate">{userProfile?.email}</p>
              </div>
            </div>

            {/* Desktop Navigation List */}
            <nav className="hidden lg:flex flex-col space-y-1 p-2 rounded-2xl bg-gray-900/60 border border-gray-800 backdrop-blur-xl">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-orange-500/20 to-yellow-500/10 text-orange-400 border border-orange-500/40 shadow-sm'
                        : 'text-gray-400 hover:text-white hover:bg-white/[.04]'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-orange-400' : 'text-gray-500'}`} />
                      <span>{item.label}</span>
                    </div>

                    {item.count !== undefined && item.count > 0 && (
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                          isActive
                            ? 'bg-orange-500 text-white'
                            : 'bg-gray-800 text-gray-400'
                        }`}
                      >
                        {item.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Mobile Horizontal Tabs */}
            <div className="flex lg:hidden overflow-x-auto gap-2 pb-2 scrollbar-none">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-all ${
                      isActive
                        ? 'bg-orange-500 text-white shadow-lg shadow-orange-950/40'
                        : 'bg-gray-900 border border-gray-800 text-gray-400 hover:text-white'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                    {item.count !== undefined && item.count > 0 && (
                      <span className="text-[10px] bg-black/40 px-1.5 py-0.2 rounded-full">
                        {item.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-9">
            {isLoading ? (
              <div className="min-h-[400px] flex items-center justify-center bg-gray-900/40 rounded-3xl border border-gray-800">
                <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
              </div>
            ) : (
              <>
                {activeTab === 'overview' && userProfile && (
                  <ProfileOverview
                    currentUser={userProfile}
                    stats={stats}
                    watchHistory={watchHistory}
                    ratings={ratings}
                    favoritesCount={favorites.length}
                    watchlistCount={watchLater.length}
                    onEditProfile={() => setIsEditModalOpen(true)}
                    onRemoveHistoryItem={handleRemoveHistoryItem}
                    onNavigateTab={(tab) => setActiveTab(tab as TabId)}
                  />
                )}

                {activeTab === 'history' && (
                  <ProfileHistory
                    watchHistory={watchHistory}
                    onRemoveItem={handleRemoveHistoryItem}
                    onClearHistory={handleClearHistory}
                  />
                )}

                {activeTab === 'favorites' && (
                  <ProfileFavorites
                    favorites={favorites}
                    onRemoveFavorite={handleRemoveFavorite}
                    onAddToWatchLater={handleAddToWatchLater}
                  />
                )}

                {activeTab === 'watchlater' && (
                  <ProfileWatchLater
                    watchLater={watchLater}
                    onRemoveWatchLater={handleRemoveWatchLater}
                    onMarkAsWatched={handleMarkAsWatched}
                  />
                )}

                {activeTab === 'ratings' && (
                  <ProfileRatings
                    ratings={ratings}
                    onUpdateRating={handleUpdateRating}
                    onRemoveRating={handleRemoveRating}
                  />
                )}

                {activeTab === 'analytics' && (
                  <ProfileAnalytics watchHistory={watchHistory} stats={stats} />
                )}

                {activeTab === 'preferences' && userProfile && (
                  <ProfilePreferences
                    currentUser={userProfile}
                    onPreferencesUpdated={handlePreferencesUpdated}
                  />
                )}

                {activeTab === 'security' && userProfile && (
                  <ProfileSecurity currentUser={userProfile} />
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {userProfile && (
        <EditProfileModal
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          currentUser={userProfile}
          onProfileUpdated={(updated) => setUserProfile(updated)}
        />
      )}
    </div>
  );
}
