/**
 * OrangeFlix Discovery V2 — Query Stats Repository
 * Tracks query yield, efficiency, and execution history.
 */

import {
  collection,
  doc,
  getDocs,
  setDoc,
  query,
  limit as firestoreLimit,
} from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { FIRESTORE_COLLECTIONS } from '@/features/youtube/discoveryV2/constants';

export interface DiscoveryQueryStatItem {
  queryHash: string;
  countryCode: string;
  languageCode?: string;
  query: string;
  type: string;
  searches: number;
  candidatesFound: number;
  uniqueCandidates: number;
  moviesFound: number;
  seriesFound: number;
  episodesFound: number;
  publishedCount: number;
  rejectedCount: number;
  pendingCount: number;
  averageScore: number;
  lastRunAt: string;
  lastUsefulResultAt?: string;
  efficiencyScore: number;
  isEnabled: boolean;
}

export const QueryStatsRepository = {
  /**
   * Fetch all query statistics
   */
  async getQueryStats(countryCode?: string): Promise<DiscoveryQueryStatItem[]> {
    if (!firestore) return [];

    try {
      const col = collection(firestore, FIRESTORE_COLLECTIONS.QUERY_STATS);
      const q = query(col, firestoreLimit(150));
      const snap = await getDocs(q);

      let items = snap.docs.map((d) => {
        const data = d.data();
        return {
          queryHash: d.id,
          countryCode: data.countryCode || 'RW',
          languageCode: data.languageCode || 'en',
          query: data.query || d.id,
          type: data.type || 'movie',
          searches: Number(data.searches || data.runs || 1),
          candidatesFound: Number(data.candidatesFound || 0),
          uniqueCandidates: Number(data.uniqueCandidates || data.candidatesFound || 0),
          moviesFound: Number(data.moviesFound || 0),
          seriesFound: Number(data.seriesFound || 0),
          episodesFound: Number(data.episodesFound || 0),
          publishedCount: Number(data.publishedCount || 0),
          rejectedCount: Number(data.rejectedCount || 0),
          pendingCount: Number(data.pendingCount || 0),
          averageScore: Number(data.averageScore || data.averageOverallScore || 70),
          lastRunAt: data.lastRunAt || new Date().toISOString(),
          lastUsefulResultAt: data.lastUsefulResultAt,
          efficiencyScore: Number(data.efficiencyScore || 85),
          isEnabled: data.isEnabled !== false,
        } as DiscoveryQueryStatItem;
      });

      if (countryCode && countryCode !== 'ALL') {
        items = items.filter((item) => item.countryCode.toUpperCase() === countryCode.toUpperCase());
      }

      return items.sort((a, b) => b.efficiencyScore - a.efficiencyScore);
    } catch (err) {
      console.warn('[QueryStatsRepository] getQueryStats error:', err);
      return [];
    }
  },

  /**
   * Toggle query enabled state
   */
  async toggleQueryStatus(queryHash: string, isEnabled: boolean): Promise<boolean> {
    if (!firestore || !queryHash) return false;

    try {
      const docRef = doc(firestore, FIRESTORE_COLLECTIONS.QUERY_STATS, queryHash);
      await setDoc(docRef, { isEnabled, updatedAt: new Date().toISOString() }, { merge: true });
      return true;
    } catch (err) {
      console.error(`[QueryStatsRepository] Failed to toggle query ${queryHash}:`, err);
      return false;
    }
  },
};

