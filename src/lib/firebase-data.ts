import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { firestore } from './firebase';
import { MediaItem } from '@/types/media';
import { AdminStats, Movie, Review, User } from '@/types';

type StoredContent =
  | Pick<MediaItem, 'tmdbId' | 'mediaType' | 'title' | 'posterUrl' | 'releaseYear' | 'voteAverage'>
  | Pick<Movie, 'id' | 'title' | 'imageUrl' | 'releaseYear' | 'rating' | 'type'>;

const contentId = (content: StoredContent) =>
  'tmdbId' in content && content.tmdbId ? `${content.mediaType}-${content.tmdbId}` : (content as { id: string }).id;

const compactContent = (content: StoredContent) =>
  'tmdbId' in content && content.tmdbId
    ? {
        contentId: contentId(content),
        tmdbId: content.tmdbId,
        mediaType: content.mediaType,
        title: content.title,
        posterUrl: content.posterUrl,
        releaseYear: content.releaseYear,
        rating: content.voteAverage,
      }
    : {
        contentId: (content as { id: string }).id,
        title: (content as Movie).title,
        posterUrl: (content as Movie).imageUrl,
        releaseYear: (content as Movie).releaseYear,
        rating: (content as Movie).rating,
        mediaType: (content as Movie).type?.toLowerCase() === 'series' ? 'tv' : 'movie',
      };

export interface AdminActivity {
  id: string;
  action: string;
  details: string;
  actorEmail?: string;
  timestamp: string;
}

/** Global Cloud Database Service powered by Firebase Firestore */
export const FirebaseData = {
  // -------------------------------------------------------------
  // USERS & PROFILES
  // -------------------------------------------------------------
  async saveProfile(userId: string, input: Partial<User>) {
    if (!firestore) return;
    try {
      const userRef = doc(firestore, 'users', userId);
      const existing = await getDoc(userRef);
      const data = existing.data();

      // Preserve existing admin status if present
      const isAdmin = input.isAdmin ?? data?.isAdmin ?? false;

      await setDoc(
        userRef,
        {
          id: userId,
          email: input.email || data?.email || '',
          name: input.name || data?.name || 'OrangeFlix User',
          isAdmin,
          role: isAdmin ? 'admin' : 'member',
          lastLoginAt: new Date().toISOString(),
          updatedAt: serverTimestamp(),
          createdAt: data?.createdAt || input.createdAt || new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (err) {
      console.warn('Firestore saveProfile skipped:', err);
    }
  },

  async getUserProfile(userId: string): Promise<User | null> {
    if (!firestore) return null;
    try {
      const snap = await getDoc(doc(firestore, 'users', userId));
      if (!snap.exists()) return null;
      const d = snap.data();
      return {
        id: snap.id,
        email: d.email || '',
        name: d.name || 'OrangeFlix User',
        isAdmin: !!d.isAdmin,
        role: d.isAdmin ? 'admin' : 'member',
        createdAt: d.createdAt || new Date().toISOString(),
        lastLoginAt: d.lastLoginAt,
      };
    } catch (err) {
      console.warn('Firestore getUserProfile failed:', err);
      return null;
    }
  },

  async getAllUsers(): Promise<User[]> {
    if (!firestore) return [];
    try {
      const usersCol = collection(firestore, 'users');
      const snap = await getDocs(usersCol);
      return snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          email: data.email || '',
          name: data.name || 'Member',
          isAdmin: !!data.isAdmin,
          role: data.isAdmin ? 'admin' : 'member',
          createdAt: data.createdAt || new Date().toISOString(),
          lastLoginAt: data.lastLoginAt,
          status: data.status || 'active',
        };
      });
    } catch (err) {
      console.warn('Firestore getAllUsers error:', err);
      return [];
    }
  },

  async setUserAdminRole(userId: string, isAdmin: boolean): Promise<boolean> {
    if (!firestore) return false;
    try {
      await setDoc(
        doc(firestore, 'users', userId),
        {
          isAdmin,
          role: isAdmin ? 'admin' : 'member',
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      await this.logActivity(
        isAdmin ? 'PROMOTE_ADMIN' : 'REVOKE_ADMIN',
        `User ${userId} admin status updated to ${isAdmin}`
      );
      return true;
    } catch (err) {
      console.error('Failed to update user role:', err);
      return false;
    }
  },

  // -------------------------------------------------------------
  // GLOBAL CUSTOM MEDIA & CATALOG
  // -------------------------------------------------------------
  async getCustomCatalog(): Promise<Movie[]> {
    if (!firestore) return [];
    try {
      const col = collection(firestore, 'customMedia');
      const snap = await getDocs(col);
      return snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          title: data.title || '',
          description: data.description || '',
          type: data.type || 'Movie',
          genre: Array.isArray(data.genre) ? data.genre : ['Action'],
          releaseYear: data.releaseYear || new Date().getFullYear(),
          duration: data.duration || 120,
          imageUrl: data.imageUrl || '/images/ImageUpload.jpg',
          videoUrl: data.videoUrl || '',
          backdropUrl: data.backdropUrl,
          trailerUrl: data.trailerUrl,
          rating: data.rating || 5.0,
          totalRatings: data.totalRatings || 1,
          featured: !!data.featured,
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString(),
        };
      });
    } catch (err) {
      console.warn('Firestore getCustomCatalog failed:', err);
      return [];
    }
  },

  async saveCustomMovie(movie: Omit<Movie, 'createdAt' | 'updatedAt'> & { id?: string }): Promise<Movie> {
    const id = movie.id || `custom-${Date.now()}`;
    const now = new Date().toISOString();
    const movieObj: Movie = {
      ...movie,
      id,
      rating: movie.rating || 5.0,
      totalRatings: movie.totalRatings || 1,
      createdAt: now,
      updatedAt: now,
    };

    if (firestore) {
      try {
        await setDoc(doc(firestore, 'customMedia', id), {
          ...movieObj,
          updatedAt: serverTimestamp(),
        });
        await this.logActivity('SAVE_MOVIE', `Saved custom title: ${movie.title}`);
      } catch (err) {
        console.warn('Firestore saveCustomMovie error:', err);
      }
    }
    return movieObj;
  },

  async deleteCustomMovie(id: string): Promise<boolean> {
    if (!firestore) return true;
    try {
      await deleteDoc(doc(firestore, 'customMedia', id));
      await this.logActivity('DELETE_MOVIE', `Deleted custom title with id: ${id}`);
      return true;
    } catch (err) {
      console.error('Firestore deleteCustomMovie error:', err);
      return false;
    }
  },

  // -------------------------------------------------------------
  // GLOBAL REVIEWS
  // -------------------------------------------------------------
  async getGlobalReviews(): Promise<Review[]> {
    if (!firestore) return [];
    try {
      const col = collection(firestore, 'reviews');
      const q = query(col, orderBy('createdAt', 'desc'), limit(100));
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Review, 'id'>),
      }));
    } catch (err) {
      console.warn('Firestore getGlobalReviews failed:', err);
      return [];
    }
  },

  async saveGlobalReview(review: Omit<Review, 'id' | 'createdAt'>): Promise<Review> {
    const id = `rev-${Date.now()}`;
    const now = new Date().toISOString();
    const fullReview: Review = {
      ...review,
      id,
      createdAt: now,
    };

    if (firestore) {
      try {
        await setDoc(doc(firestore, 'reviews', id), fullReview);
      } catch (err) {
        console.warn('Firestore saveGlobalReview failed:', err);
      }
    }
    return fullReview;
  },

  async deleteGlobalReview(id: string): Promise<boolean> {
    if (!firestore) return true;
    try {
      await deleteDoc(doc(firestore, 'reviews', id));
      await this.logActivity('DELETE_REVIEW', `Deleted review id: ${id}`);
      return true;
    } catch (err) {
      console.error('Firestore deleteGlobalReview error:', err);
      return false;
    }
  },

  // -------------------------------------------------------------
  // WATCHLIST & FAVORITES
  // -------------------------------------------------------------
  async setWatchlist(userId: string, content: StoredContent) {
    if (!firestore) return;
    try {
      await setDoc(doc(firestore, 'watchlists', userId, 'items', contentId(content)), {
        ...compactContent(content),
        addedAt: serverTimestamp(),
      });
    } catch (err) {
      console.warn('Firestore setWatchlist skipped:', err);
    }
  },

  async removeWatchlist(userId: string, id: string) {
    if (firestore) {
      try {
        await deleteDoc(doc(firestore, 'watchlists', userId, 'items', id));
      } catch (err) {
        console.warn('Firestore removeWatchlist skipped:', err);
      }
    }
  },

  async setFavorites(userId: string, content: StoredContent) {
    if (!firestore) return;
    try {
      await setDoc(doc(firestore, 'favorites', userId, 'items', contentId(content)), {
        ...compactContent(content),
        addedAt: serverTimestamp(),
      });
    } catch (err) {
      console.warn('Firestore setFavorites skipped:', err);
    }
  },

  async removeFavorites(userId: string, id: string) {
    if (firestore) {
      try {
        await deleteDoc(doc(firestore, 'favorites', userId, 'items', id));
      } catch (err) {
        console.warn('Firestore removeFavorites skipped:', err);
      }
    }
  },

  // -------------------------------------------------------------
  // ADMIN METRICS & ACTIVITY LOGS
  // -------------------------------------------------------------
  async logActivity(action: string, details: string, actorEmail?: string) {
    if (!firestore) return;
    try {
      const id = `act-${Date.now()}`;
      await setDoc(doc(firestore, 'activityLogs', id), {
        action,
        details,
        actorEmail: actorEmail || 'Admin',
        timestamp: new Date().toISOString(),
        createdAt: serverTimestamp(),
      });
    } catch {
      // Ignore logging failure in dev
    }
  },

  async getRecentActivity(): Promise<AdminActivity[]> {
    if (!firestore) return [];
    try {
      const col = collection(firestore, 'activityLogs');
      const q = query(col, orderBy('createdAt', 'desc'), limit(15));
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({
        id: d.id,
        action: d.data().action || 'ACTIVITY',
        details: d.data().details || '',
        actorEmail: d.data().actorEmail || 'System',
        timestamp: d.data().timestamp || new Date().toISOString(),
      }));
    } catch {
      return [];
    }
  },

  async getPlatformStats(): Promise<AdminStats> {
    const defaultStats: AdminStats = {
      totalUsers: 0,
      totalMovies: 0,
      totalReviews: 0,
      totalWatchlists: 0,
      firebaseConnected: !!firestore,
      tmdbConnected: true,
    };

    if (!firestore) return defaultStats;

    try {
      const [usersSnap, moviesSnap, reviewsSnap] = await Promise.all([
        getDocs(collection(firestore, 'users')),
        getDocs(collection(firestore, 'customMedia')),
        getDocs(collection(firestore, 'reviews')),
      ]);

      return {
        totalUsers: usersSnap.size,
        totalMovies: moviesSnap.size,
        totalReviews: reviewsSnap.size,
        totalWatchlists: 0,
        firebaseConnected: true,
        tmdbConnected: true,
      };
    } catch (err) {
      console.warn('Failed to compute live Firestore stats:', err);
      return defaultStats;
    }
  },
};
