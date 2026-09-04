export interface UserPreferences {
  theme: 'dark' | 'light' | 'system';
  language: string;
  favoriteGenres: string[];
  autoplayNext: boolean;
  autoplayPreviews: boolean;
  defaultQuality: 'auto' | '1080p' | '720p' | '4k';
  subtitles: 'on' | 'off' | 'auto';
  skipIntro: boolean;
  continueWatching: boolean;
  notifications: {
    newReleases: boolean;
    recommendations: boolean;
    securityAlerts: boolean;
  };
  privacy: {
    profileVisibility: 'public' | 'private';
    historyVisibility: 'private' | 'friends';
    personalizedAds: boolean;
  };
}

export interface User {
  id: string;
  email: string;
  name: string;
  username?: string;
  bio?: string;
  isAdmin: boolean;
  role?: 'admin' | 'member';
  createdAt: string;
  lastLoginAt?: string;
  photoURL?: string;
  status?: 'active' | 'suspended';
  preferences?: Partial<UserPreferences>;
}

export interface WatchHistoryItem {
  contentId: string;
  tmdbId?: number;
  mediaType: 'movie' | 'tv';
  title: string;
  posterUrl?: string;
  progressSeconds: number;
  durationSeconds?: number;
  genre?: string[];
  watchedAt: string;
  country?: string;
  countryCode?: string;
  slug?: string;
  youtubeVideoId?: string;
  channelTitle?: string;
}

export interface UserRating {
  movieId: string;
  mediaTitle: string;
  rating: number; // 1 to 5
  posterUrl?: string;
  mediaType?: 'movie' | 'tv';
  ratedAt: string;
}

export interface UserStats {
  moviesWatched: number;
  seriesWatched: number;
  totalHoursWatched: number;
  favoriteGenre: string;
  streakDays: number;
  totalFavorites: number;
  totalWatchLater: number;
  totalRatings: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress: number;
  maxProgress: number;
  unlockedAt?: string;
}

export interface Movie {
  id: string;
  title: string;
  description: string;
  type: string;
  genre: string[];
  releaseYear: number;
  duration: number; // in minutes
  imageUrl: string;
  videoUrl: string;
  backdropUrl?: string;
  trailerUrl?: string;
  rating: number;
  totalRatings: number;
  featured?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: string;
  movieId: string;
  mediaTitle?: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Favorite {
  id: string;
  movieId: string;
  userId: string;
  createdAt: string;
}

export interface AdminStats {
  totalUsers: number;
  totalMovies: number;
  totalReviews: number;
  totalWatchlists: number;
  firebaseConnected: boolean;
  tmdbConnected: boolean;
}

export interface AuthContextType {
  currentUser: User | null;
  login: (email: string, password: string) => Promise<User | null>;
  loginWithGoogle: () => Promise<User | null>;
  loginWithGoogleOneTap: (idToken: string) => Promise<User | null>;
  register: (email: string, password: string, name: string) => Promise<User | null>;
  logout: () => void;
  resetPassword: (email: string) => Promise<boolean>;
  confirmPasswordReset: (oobCode: string, newPassword: string) => Promise<boolean>;
  pendingLinkEmail: string | null;
  isLinkingAccount: boolean;
  linkAccountWithPassword: (password: string) => Promise<User | null>;
  cancelAccountLinking: () => void;
  isLoading: boolean;
}
