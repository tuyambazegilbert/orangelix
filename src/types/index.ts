export interface User {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
  role?: 'admin' | 'member';
  createdAt: string;
  lastLoginAt?: string;
  photoURL?: string;
  status?: 'active' | 'suspended';
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
