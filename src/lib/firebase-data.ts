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
import { POSTER_FALLBACK } from '@/lib/tmdb/images';
import { AdminStats, Movie, Review, User, UserPreferences, WatchHistoryItem, UserRating } from '@/types';

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

function cleanFirestoreData<T extends Record<string, unknown>>(data: T): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue;
    if (value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      result[key] = cleanFirestoreData(value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }
  return result;
}

export interface AdminActivity {
  id: string;
  action: string;
  details: string;
  actorEmail?: string;
  timestamp: string;
}

export interface LibraryItem {
  contentId: string;
  tmdbId?: number;
  mediaType: 'movie' | 'tv';
  title: string;
  posterUrl?: string | null;
  releaseYear?: number | null;
  rating?: number;
  addedAt?: string;
}

/** Global Cloud Database Service powered by Firebase Firestore */
export const FirebaseData = {
  // -------------------------------------------------------------
  // USERS & PROFILES (Idempotent Canonical UID Provisioning)
  // -------------------------------------------------------------
  async ensureUserProfile(
    user: {
      uid: string;
      email?: string | null;
      displayName?: string | null;
      photoURL?: string | null;
      metadata?: { creationTime?: string };
    },
    extra?: { name?: string; isAdmin?: boolean }
  ): Promise<User> {
    const defaultUser: User = {
      id: user.uid,
      email: user.email || '',
      name: extra?.name || user.displayName || user.email?.split('@')[0] || 'OrangeFlix Member',
      // Privileges are granted only by an existing secure admin workflow, never
      // inferred from an email address in browser code.
      isAdmin: extra?.isAdmin ?? false,
      role: (extra?.isAdmin ?? false) ? 'admin' : 'member',
      photoURL: user.photoURL || '',
      status: 'active',
      createdAt: user.metadata?.creationTime || new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };

    if (!firestore) return defaultUser;

    try {
      const userRef = doc(firestore, 'users', user.uid);
      const existing = await getDoc(userRef);

      if (existing.exists()) {
        const d = existing.data();
        const isAdmin = extra?.isAdmin ?? d.isAdmin ?? defaultUser.isAdmin;
        const role = isAdmin ? 'admin' : (d.role || 'member');
        const resolvedName = d.name || extra?.name || user.displayName || defaultUser.name;
        const resolvedPhoto = d.photoURL || user.photoURL || '';

        // Safe update: metadata only, never overwrite user data
        await setDoc(
          userRef,
          cleanFirestoreData({
            email: user.email || d.email || '',
            name: resolvedName,
            photoURL: resolvedPhoto,
            lastLoginAt: new Date().toISOString(),
            updatedAt: serverTimestamp(),
          }),
          { merge: true }
        );

        // Also update public profile
        await setDoc(
          doc(firestore, 'profiles', user.uid),
          cleanFirestoreData({
            userId: user.uid,
            displayName: resolvedName,
            avatarUrl: resolvedPhoto,
            updatedAt: serverTimestamp(),
          }),
          { merge: true }
        );

        return {
          id: user.uid,
          email: user.email || d.email || '',
          name: resolvedName,
          isAdmin,
          role,
          photoURL: resolvedPhoto,
          status: d.status || 'active',
          createdAt: d.createdAt || defaultUser.createdAt,
          lastLoginAt: new Date().toISOString(),
        };
      }

      // Initial user profile creation
      await setDoc(userRef, cleanFirestoreData({
        ...defaultUser,
        updatedAt: serverTimestamp(),
      }));

      // Initial public profile
      await setDoc(doc(firestore, 'profiles', user.uid), cleanFirestoreData({
        userId: user.uid,
        displayName: defaultUser.name,
        avatarUrl: defaultUser.photoURL,
        updatedAt: serverTimestamp(),
      }));

      return defaultUser;
    } catch (err) {
      console.warn('Firestore ensureUserProfile error:', err);
      return defaultUser;
    }
  },

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
        cleanFirestoreData({
          id: userId,
          email: input.email || data?.email || '',
          name: input.name || data?.name || 'OrangeFlix User',
          isAdmin,
          role: isAdmin ? 'admin' : 'member',
          lastLoginAt: new Date().toISOString(),
          updatedAt: serverTimestamp(),
          createdAt: data?.createdAt || input.createdAt || new Date().toISOString(),
        }),
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
          imageUrl: data.imageUrl || POSTER_FALLBACK,
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
      await setDoc(
        doc(firestore, 'watchlists', userId, 'items', contentId(content)),
        cleanFirestoreData({
          ...compactContent(content),
          addedAt: serverTimestamp(),
        })
      );
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
      await setDoc(
        doc(firestore, 'favorites', userId, 'items', contentId(content)),
        cleanFirestoreData({
          ...compactContent(content),
          addedAt: serverTimestamp(),
        })
      );
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

  async getFavorites(userId: string): Promise<LibraryItem[]> {
    if (!firestore) return [];
    try {
      const snap = await getDocs(collection(firestore, 'favorites', userId, 'items'));
      return snap.docs.map((entry) => {
        const data = entry.data();
        return {
          contentId: entry.id,
          tmdbId: data.tmdbId,
          mediaType: data.mediaType === 'tv' ? 'tv' : 'movie',
          title: data.title || 'Saved title',
          posterUrl: data.posterUrl || null,
          releaseYear: data.releaseYear || null,
          rating: data.rating || 0,
          addedAt: data.addedAt?.toDate?.().toISOString?.() || data.addedAt,
        };
      });
    } catch (err) {
      console.warn('Firestore getFavorites skipped:', err);
      return [];
    }
  },

  async getWatchlist(userId: string): Promise<LibraryItem[]> {
    if (!firestore) return [];
    try {
      const snap = await getDocs(collection(firestore, 'watchlists', userId, 'items'));
      return snap.docs.map((entry) => {
        const data = entry.data();
        return {
          contentId: entry.id,
          tmdbId: data.tmdbId,
          mediaType: data.mediaType === 'tv' ? 'tv' : 'movie',
          title: data.title || 'Saved title',
          posterUrl: data.posterUrl || null,
          releaseYear: data.releaseYear || null,
          rating: data.rating || 0,
          addedAt: data.addedAt?.toDate?.().toISOString?.() || data.addedAt,
        };
      });
    } catch (err) {
      console.warn('Firestore getWatchlist skipped:', err);
      return [];
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

  // -------------------------------------------------------------
  // USER WATCH HISTORY & CONTINUITY
  // -------------------------------------------------------------
  async getWatchHistory(userId: string): Promise<WatchHistoryItem[]> {
    if (!firestore) return [];
    try {
      const col = collection(firestore, 'watchHistory', userId, 'items');
      const q = query(col, orderBy('watchedAt', 'desc'), limit(50));
      const snap = await getDocs(q);
      return snap.docs.map((d) => {
        const data = d.data();
        return {
          contentId: d.id,
          tmdbId: data.tmdbId,
          mediaType: data.mediaType || 'movie',
          title: data.title || 'Untitled',
          posterUrl: data.posterUrl,
          progressSeconds: data.progressSeconds || 0,
          durationSeconds: data.durationSeconds || 7200,
          genre: data.genre || [],
          watchedAt: data.watchedAt?.toDate ? data.watchedAt.toDate().toISOString() : data.watchedAt || new Date().toISOString(),
        };
      });
    } catch (err) {
      console.warn('Firestore getWatchHistory error:', err);
      return [];
    }
  },

  async saveWatchProgress(userId: string, item: Omit<WatchHistoryItem, 'watchedAt'> & { watchedAt?: string }) {
    if (!firestore) return;
    try {
      await setDoc(
        doc(firestore, 'watchHistory', userId, 'items', item.contentId),
        cleanFirestoreData({
          ...item,
          watchedAt: serverTimestamp(),
        })
      );
    } catch (err) {
      console.warn('Firestore saveWatchProgress error:', err);
    }
  },

  async setHistory(userId: string, media: StoredContent | { title?: string; genres?: string[]; posterUrl?: string; imageUrl?: string; mediaType?: string; tmdbId?: number }, seconds: number, total: number) {
    if (!firestore) return;
    try {
      const id = contentId(media as StoredContent);
      const title = 'title' in media ? media.title || 'Untitled' : 'Untitled';
      const posterUrl = 'posterUrl' in media ? media.posterUrl : ('imageUrl' in media ? media.imageUrl : undefined);
      const mediaType = ('mediaType' in media && media.mediaType === 'tv') ? 'tv' : 'movie';
      const genre = 'genres' in media && Array.isArray(media.genres) ? media.genres : ('genre' in media && Array.isArray(media.genre) ? media.genre : ['Action']);

      await setDoc(
        doc(firestore, 'watchHistory', userId, 'items', id),
        cleanFirestoreData({
          contentId: id,
          tmdbId: 'tmdbId' in media ? media.tmdbId : undefined,
          mediaType,
          title,
          posterUrl,
          progressSeconds: Math.floor(seconds),
          durationSeconds: Math.floor(total) || 7200,
          genre,
          watchedAt: serverTimestamp(),
        })
      );
    } catch (err) {
      console.warn('Firestore setHistory error:', err);
    }
  },

  async removeWatchHistory(userId: string, contentId: string) {
    if (!firestore) return;
    try {
      await deleteDoc(doc(firestore, 'watchHistory', userId, 'items', contentId));
    } catch (err) {
      console.warn('Firestore removeWatchHistory error:', err);
    }
  },

  async clearWatchHistory(userId: string) {
    if (!firestore) return;
    try {
      const snap = await getDocs(collection(firestore, 'watchHistory', userId, 'items'));
      const deletes = snap.docs.map((d) => deleteDoc(d.ref));
      await Promise.all(deletes);
    } catch (err) {
      console.warn('Firestore clearWatchHistory error:', err);
    }
  },

  // -------------------------------------------------------------
  // USER RATINGS
  // -------------------------------------------------------------
  async getUserRatings(userId: string): Promise<UserRating[]> {
    if (!firestore) return [];
    try {
      const col = collection(firestore, 'ratings', userId, 'items');
      const snap = await getDocs(col);
      return snap.docs.map((d) => {
        const data = d.data();
        return {
          movieId: d.id,
          mediaTitle: data.mediaTitle || 'Untitled',
          rating: data.rating || 5,
          posterUrl: data.posterUrl,
          mediaType: data.mediaType || 'movie',
          ratedAt: data.ratedAt?.toDate ? data.ratedAt.toDate().toISOString() : data.ratedAt || new Date().toISOString(),
        };
      });
    } catch (err) {
      console.warn('Firestore getUserRatings error:', err);
      return [];
    }
  },

  async saveUserRating(userId: string, rating: UserRating) {
    if (!firestore) return;
    try {
      await setDoc(
        doc(firestore, 'ratings', userId, 'items', rating.movieId),
        cleanFirestoreData({
          ...rating,
          ratedAt: serverTimestamp(),
        })
      );
    } catch (err) {
      console.warn('Firestore saveUserRating error:', err);
    }
  },

  async removeUserRating(userId: string, movieId: string) {
    if (!firestore) return;
    try {
      await deleteDoc(doc(firestore, 'ratings', userId, 'items', movieId));
    } catch (err) {
      console.warn('Firestore removeUserRating error:', err);
    }
  },

  // -------------------------------------------------------------
  // USER PREFERENCES
  // -------------------------------------------------------------
  async getUserPreferences(userId: string): Promise<UserPreferences | null> {
    if (!firestore) return null;
    try {
      const snap = await getDoc(doc(firestore, 'users', userId));
      if (snap.exists() && snap.data().preferences) {
        return snap.data().preferences as UserPreferences;
      }
      return null;
    } catch {
      return null;
    }
  },

  async saveUserPreferences(userId: string, prefs: Partial<UserPreferences>) {
    if (!firestore) return;
    try {
      await setDoc(
        doc(firestore, 'users', userId),
        cleanFirestoreData({
          preferences: prefs,
          updatedAt: serverTimestamp(),
        }),
        { merge: true }
      );
    } catch (err) {
      console.warn('Firestore saveUserPreferences error:', err);
    }
  },

  // -------------------------------------------------------------
  // DATA EXPORT & ACCOUNT DELETION
  // -------------------------------------------------------------
  async exportFullUserData(userId: string) {
    const defaultExport = {
      exportedAt: new Date().toISOString(),
      user: null as User | null,
      preferences: null as UserPreferences | null,
      history: [] as WatchHistoryItem[],
      ratings: [] as UserRating[],
      favorites: [] as unknown[],
      watchlist: [] as unknown[],
    };

    if (!firestore) return defaultExport;

    try {
      const [userProfile, prefs, history, ratings, favsSnap, watchSnap] = await Promise.all([
        this.getUserProfile(userId),
        this.getUserPreferences(userId),
        this.getWatchHistory(userId),
        this.getUserRatings(userId),
        getDocs(collection(firestore, 'favorites', userId, 'items')),
        getDocs(collection(firestore, 'watchlists', userId, 'items')),
      ]);

      return {
        exportedAt: new Date().toISOString(),
        user: userProfile,
        preferences: prefs,
        history,
        ratings,
        favorites: favsSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
        watchlist: watchSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
      };
    } catch (err) {
      console.error('Failed to export user data:', err);
      return defaultExport;
    }
  },

  async deleteUserAccountData(userId: string): Promise<boolean> {
    if (!firestore) return true;
    try {
      // 1. Delete subcollections
      const collectionsToPurge = ['favorites', 'watchlists', 'watchHistory', 'ratings'];
      for (const colName of collectionsToPurge) {
        const snap = await getDocs(collection(firestore, colName, userId, 'items'));
        await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
      }

      // 2. Delete user & profile docs
      await Promise.all([
        deleteDoc(doc(firestore, 'users', userId)),
        deleteDoc(doc(firestore, 'profiles', userId)),
      ]);

      await this.logActivity('DELETE_USER_ACCOUNT', `User account ${userId} requested full deletion.`);
      return true;
    } catch (err) {
      console.error('Failed to purge user account data:', err);
      return false;
    }
  },
};
