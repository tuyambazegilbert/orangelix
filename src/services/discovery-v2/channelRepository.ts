/**
 * OrangeFlix Discovery V2 — Channel Repository
 * Manages trusted channels, trust scores, and auto-trust progression.
 */

import {
  collection,
  doc,
  getDocs,
  setDoc,
  query,
  where,
  limit as firestoreLimit,
} from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { TrustedChannel, ChannelTrust } from '@/types/geo-content';
import { sanitizeFirestoreDoc } from '@/services/geo-content-service';
import { FIRESTORE_COLLECTIONS } from '@/features/youtube/discoveryV2/constants';
import { INITIAL_TRUSTED_CHANNELS } from '@/features/geo/countryConfig';

export const ChannelRepository = {
  /**
   * Fetch all trusted channels
   */
  async getChannels(countryCode?: string): Promise<TrustedChannel[]> {
    if (!firestore) {
      if (countryCode && countryCode !== 'ALL') {
        return INITIAL_TRUSTED_CHANNELS.filter(
          (c) => (c.country || c.countryCode || 'RW').toUpperCase() === countryCode.toUpperCase()
        );
      }
      return INITIAL_TRUSTED_CHANNELS;
    }

    try {
      const col = collection(firestore, FIRESTORE_COLLECTIONS.TRUSTED_CHANNELS);
      const q = countryCode && countryCode !== 'ALL'
        ? query(col, where('countryCode', '==', countryCode.toUpperCase()), firestoreLimit(100))
        : query(col, firestoreLimit(100));

      const snap = await getDocs(q);
      if (snap.empty) {
        if (countryCode && countryCode !== 'ALL') {
          return INITIAL_TRUSTED_CHANNELS.filter(
            (c) => (c.country || c.countryCode || 'RW').toUpperCase() === countryCode.toUpperCase()
          );
        }
        return INITIAL_TRUSTED_CHANNELS;
      }

      return snap.docs.map((d) => {
        const data = d.data() as TrustedChannel;
        return {
          ...data,
          channelId: data.channelId || d.id,
          channelTrustScore: data.channelTrustScore ?? (data.trust === 'approved' ? 95 : data.trust === 'rejected' ? 20 : 60),
          autoPublishMovies: data.autoPublishMovies ?? true,
          autoPublishSeries: data.autoPublishSeries ?? true,
        };
      });
    } catch (err) {
      console.warn('[ChannelRepository] getChannels error:', err);
      return INITIAL_TRUSTED_CHANNELS;
    }
  },

  /**
   * Save or update a channel
   */
  async saveChannel(channel: Partial<TrustedChannel>): Promise<boolean> {
    if (!firestore || !channel.channelId) return false;

    try {
      const docRef = doc(firestore, FIRESTORE_COLLECTIONS.TRUSTED_CHANNELS, channel.channelId);
      const cleanData = sanitizeFirestoreDoc({
        ...channel,
        lastEvaluatedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      await setDoc(docRef, cleanData, { merge: true });
      return true;
    } catch (err) {
      console.error(`[ChannelRepository] Failed to save channel ${channel.channelId}:`, err);
      return false;
    }
  },

  /**
   * Update channel trust status (Approve, Pending, Reject)
   */
  async updateChannelTrust(channelId: string, trust: ChannelTrust, notes?: string): Promise<boolean> {
    if (!firestore || !channelId) return false;

    try {
      const docRef = doc(firestore, FIRESTORE_COLLECTIONS.TRUSTED_CHANNELS, channelId);
      const trustScore = trust === 'approved' ? 95 : trust === 'rejected' ? 20 : 60;

      await setDoc(
        docRef,
        {
          trust,
          trustStatus: trust,
          channelTrustScore: trustScore,
          autoPublishMovies: trust === 'approved',
          autoPublishSeries: trust === 'approved',
          notes: notes || `Trust updated to ${trust}`,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      return true;
    } catch (err) {
      console.error(`[ChannelRepository] Failed to update trust for ${channelId}:`, err);
      return false;
    }
  },
};

