/**
 * OrangeFlix Discovery V2 — Discovery Repository
 * Persistent Firestore operations for GeoContent, GeoSeries, and GeoEpisodes.
 */

import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  where,
  limit as firestoreLimit,
  DocumentSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { GeoContentItem, GeoContentStatus } from '@/types/geo-content';
import { GeoSeries, GeoEpisode } from '@/features/youtube/discoveryV2/types';
import { sanitizeFirestoreDoc } from '@/services/geo-content-service';
import { FIRESTORE_COLLECTIONS } from '@/features/youtube/discoveryV2/constants';

export const DiscoveryRepository = {
  /**
   * Fetch paginated content items with filtering
   */
  async getContentItems(options: {
    countryCode?: string;
    status?: string;
    contentType?: string;
    searchQuery?: string;
    limitCount?: number;
    lastDoc?: DocumentSnapshot;
  }): Promise<{ items: GeoContentItem[]; lastDoc?: DocumentSnapshot }> {
    if (!firestore) return { items: [] };

    try {
      const col = collection(firestore, FIRESTORE_COLLECTIONS.GEO_CONTENT);
      const limit = options.limitCount || 2500;
      let q = query(col, firestoreLimit(limit));

      if (options.countryCode && options.countryCode !== 'ALL') {
        q = query(
          col,
          where('countryCode', '==', options.countryCode.toUpperCase()),
          firestoreLimit(limit)
        );
      }

      const snap = await getDocs(q);
      const items = snap.docs.map((d) => {
        const data = d.data() as GeoContentItem;
        return {
          ...data,
          id: data.id || d.id,
          youtubeVideoId: data.youtubeVideoId || d.id,
        };
      });

      return {
        items,
        lastDoc: snap.docs[snap.docs.length - 1],
      };
    } catch (err) {
      console.warn('[DiscoveryRepository] getContentItems error:', err);
      return { items: [] };
    }
  },

  /**
   * Save or update a single content item
   */
  async saveContentItem(item: Partial<GeoContentItem>): Promise<boolean> {
    if (!firestore || !item.id) return false;

    try {
      const docRef = doc(firestore, FIRESTORE_COLLECTIONS.GEO_CONTENT, item.id);
      const cleanData = sanitizeFirestoreDoc({
        ...item,
        lastAnalyzedAt: new Date().toISOString(),
        updatedAt: serverTimestamp(),
      });
      await setDoc(docRef, cleanData, { merge: true });
      return true;
    } catch (err) {
      console.error(`[DiscoveryRepository] Failed to save item ${item.id}:`, err);
      return false;
    }
  },

  /**
   * Bulk update status of content items (Publish, Reject, Pending Review)
   */
  async bulkUpdateContentStatus(
    itemIds: string[],
    newStatus: GeoContentStatus,
    moderationReason?: string
  ): Promise<{ succeeded: number; failed: number }> {
    let succeeded = 0;
    let failed = 0;

    for (const id of itemIds) {
      if (!firestore) continue;
      try {
        const docRef = doc(firestore, FIRESTORE_COLLECTIONS.GEO_CONTENT, id);
        await setDoc(
          docRef,
          {
            status: newStatus,
            publicationStatus: newStatus,
            moderationStatus: newStatus === 'published' ? 'approved' : newStatus,
            moderationReason: moderationReason || `Admin manual ${newStatus}`,
            lastModeratedAt: new Date().toISOString(),
          },
          { merge: true }
        );
        succeeded++;
      } catch (err) {
        failed++;
        console.error(`[DiscoveryRepository] Bulk status update failed for ${id}:`, err);
      }
    }

    return { succeeded, failed };
  },

  /**
   * Delete a content item from Firestore
   */
  async deleteContentItem(id: string): Promise<boolean> {
    if (!firestore || !id) return false;
    try {
      await deleteDoc(doc(firestore, FIRESTORE_COLLECTIONS.GEO_CONTENT, id));
      return true;
    } catch (err) {
      console.error(`[DiscoveryRepository] Failed to delete item ${id}:`, err);
      return false;
    }
  },

  /**
   * Fetch canonical series
   */
  async getSeries(countryCode?: string): Promise<GeoSeries[]> {
    if (!firestore) return [];

    try {
      const col = collection(firestore, FIRESTORE_COLLECTIONS.GEO_SERIES);
      let q = query(col, firestoreLimit(500));

      if (countryCode && countryCode !== 'ALL') {
        q = query(
          col,
          where('countryCodes', 'array-contains', countryCode.toUpperCase()),
          firestoreLimit(500)
        );
      }

      const snap = await getDocs(q);
      return snap.docs.map((d) => {
        const data = d.data();
        return {
          seriesId: d.id,
          canonicalTitle: data.canonicalTitle || data.normalizedTitle || d.id,
          normalizedTitle: data.normalizedTitle || data.canonicalTitle || d.id,
          aliases: data.aliases || [],
          countryCodes: data.countryCodes || [],
          languages: data.languages || [],
          channelIds: data.channelIds || [],
          confidence: Number(data.confidence || 80),
          episodeCount: Number(data.episodeCount || 0),
          seasonCount: Number(data.seasonCount || 1),
          knownEpisodeNumbers: data.knownEpisodeNumbers || [],
          firstDiscoveredAt: data.firstDiscoveredAt?.toDate ? data.firstDiscoveredAt.toDate() : new Date(data.firstDiscoveredAt || Date.now()),
          lastSeenAt: data.lastSeenAt?.toDate ? data.lastSeenAt.toDate() : new Date(data.lastSeenAt || Date.now()),
          lastUpdatedAt: data.lastUpdatedAt?.toDate ? data.lastUpdatedAt.toDate() : new Date(data.lastUpdatedAt || Date.now()),
          status: data.status || 'active',
          classifierVersion: data.classifierVersion || '2.0.0',
          discoveryVersion: data.discoveryVersion || '2.0.0',
        } as GeoSeries;
      });
    } catch (err) {
      console.warn('[DiscoveryRepository] getSeries error:', err);
      return [];
    }
  },

  /**
   * Fetch resolved canonical episodes
   */
  async getEpisodes(countryCode?: string): Promise<GeoEpisode[]> {
    if (!firestore) return [];

    try {
      const col = collection(firestore, FIRESTORE_COLLECTIONS.GEO_EPISODES);
      const q = query(col, firestoreLimit(1000));
      const snap = await getDocs(q);

      return snap.docs.map((d) => {
        const data = d.data();
        return {
          episodeId: d.id,
          seriesId: data.seriesId || '',
          seasonId: data.seasonId || '',
          seasonNumber: data.seasonNumber ?? 1,
          episodeNumber: Number(data.episodeNumber || 1),
          title: data.title || '',
          normalizedTitle: data.normalizedTitle || '',
          videoIds: data.videoIds || [data.canonicalVideoId || ''],
          canonicalVideoId: data.canonicalVideoId || '',
          confidence: Number(data.confidence || 80),
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now()),
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt || Date.now()),
        } as GeoEpisode;
      });
    } catch (err) {
      console.warn('[DiscoveryRepository] getEpisodes error:', err);
      return [];
    }
  },
};

