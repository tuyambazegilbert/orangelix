/**
 * OrangeFlix Discovery V2 — Discovery Run Repository
 * Tracks and persists Discovery Run audit logs in Firestore.
 */

import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  limit as firestoreLimit,
} from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { DiscoveryRun } from '@/features/youtube/discoveryV2/types';
import { sanitizeFirestoreDoc } from '@/services/geo-content-service';
import { FIRESTORE_COLLECTIONS } from '@/features/youtube/discoveryV2/constants';

export const DiscoveryRunRepository = {
  /**
   * Fetch recent discovery runs
   */
  async getRecentRuns(limitCount: number = 50): Promise<DiscoveryRun[]> {
    if (!firestore) return [];

    try {
      const col = collection(firestore, FIRESTORE_COLLECTIONS.DISCOVERY_RUNS);
      const q = query(col, firestoreLimit(limitCount));
      const snap = await getDocs(q);

      return snap.docs.map((d) => {
        const data = d.data();
        return {
          runId: d.id,
          mode: data.mode || 'manual',
          countryCodes: data.countryCodes || (data.countryCode ? [data.countryCode] : []),
          startedAt: data.startedAt?.toDate ? data.startedAt.toDate() : new Date(data.startedAt || Date.now()),
          completedAt: data.completedAt?.toDate ? data.completedAt.toDate() : data.completedAt ? new Date(data.completedAt) : undefined,
          status: data.status || 'completed',
          queriesExecuted: data.queriesExecuted || 0,
          cacheHits: data.cacheHits || 0,
          cacheMisses: data.cacheMisses || 0,
          candidatesFound: data.candidatesFound || 0,
          newVideos: data.newVideos || 0,
          updatedVideos: data.updatedVideos || 0,
          moviesFound: data.moviesFound || 0,
          seriesFound: data.seriesFound || 0,
          episodesFound: data.episodesFound || 0,
          seasonsFound: data.seasonsFound || 0,
          published: data.published || 0,
          pendingReview: data.pendingReview || 0,
          rejected: data.rejected || 0,
          quotaErrors: data.quotaErrors || 0,
          metadataErrors: data.metadataErrors || 0,
          firebaseErrors: data.firebaseErrors || 0,
          summary: data.summary || 'Discovery run',
          errorLog: data.errorLog,
        } as DiscoveryRun;
      }).sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
    } catch (err) {
      console.warn('[DiscoveryRunRepository] getRecentRuns error:', err);
      return [];
    }
  },

  /**
   * Save a discovery run log
   */
  async saveRun(run: DiscoveryRun): Promise<boolean> {
    if (!firestore || !run.runId) return false;

    try {
      const docRef = doc(firestore, FIRESTORE_COLLECTIONS.DISCOVERY_RUNS, run.runId);
      const cleanData = sanitizeFirestoreDoc({
        ...run,
        startedAt: run.startedAt instanceof Date ? run.startedAt.toISOString() : run.startedAt,
        completedAt: run.completedAt instanceof Date ? run.completedAt.toISOString() : run.completedAt,
      } as unknown as Record<string, unknown>);

      await setDoc(docRef, cleanData, { merge: true });
      return true;
    } catch (err) {
      console.error(`[DiscoveryRunRepository] Failed to save run ${run.runId}:`, err);
      return false;
    }
  },

  /**
   * Delete a discovery run from Firestore
   */
  async deleteRun(runId: string): Promise<boolean> {
    if (!firestore || !runId) return false;

    try {
      const docRef = doc(firestore, FIRESTORE_COLLECTIONS.DISCOVERY_RUNS, runId);
      await deleteDoc(docRef);
      return true;
    } catch (err) {
      console.error(`[DiscoveryRunRepository] Failed to delete run ${runId}:`, err);
      return false;
    }
  },

  /**
   * Clean up stale runs: mark runs stuck in 'running' older than maxAgeMinutes as 'failed' (interrupted)
   */
  async cleanUpStaleRuns(maxAgeMinutes: number = 15): Promise<number> {
    if (!firestore) return 0;

    try {
      const col = collection(firestore, FIRESTORE_COLLECTIONS.DISCOVERY_RUNS);
      const snap = await getDocs(col);
      const cutoffTime = Date.now() - maxAgeMinutes * 60 * 1000;
      let updatedCount = 0;

      for (const d of snap.docs) {
        const data = d.data();
        if (data.status === 'running') {
          const startedAtTime = data.startedAt?.toDate ? data.startedAt.toDate().getTime() : new Date(data.startedAt || 0).getTime();
          if (startedAtTime < cutoffTime) {
            await setDoc(
              d.ref,
              {
                status: 'failed',
                completedAt: new Date().toISOString(),
                summary: `${data.summary || 'Discovery run'} (Interrupted / timed out)`,
                errorLog: [...(data.errorLog || []), 'Execution interrupted or browser disconnected before completion.'],
              },
              { merge: true }
            );
            updatedCount++;
          }
        }
      }

      return updatedCount;
    } catch (err) {
      console.error('[DiscoveryRunRepository] Failed to clean up stale runs:', err);
      return 0;
    }
  },
};

