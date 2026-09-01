/** Admin-only Firestore operations for Discovery V2. */
import { collection, deleteDoc, doc, getDocs, limit, orderBy, query, setDoc, where } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { FIRESTORE_COLLECTIONS } from './constants';
import { generateHash } from './utils';
import type { DiscoveryFeedback, DiscoveryRun } from './types';

export async function getRecentDiscoveryRuns(countryCode: string, max = 12): Promise<DiscoveryRun[]> {
  if (!firestore) return [];
  const snapshot = await getDocs(query(collection(firestore, FIRESTORE_COLLECTIONS.DISCOVERY_RUNS), where('countryCodes', 'array-contains', countryCode.toUpperCase()), orderBy('startedAt', 'desc'), limit(max)));
  return snapshot.docs.map(item => item.data() as DiscoveryRun);
}

export async function clearDiscoveryQueryCache(countryCode: string, queryText: string, type: string): Promise<void> {
  if (!firestore) throw new Error('Firestore is unavailable.');
  const queryHash = generateHash(`${countryCode.toUpperCase()}:${type}:${queryText.toLowerCase().trim().replace(/\s+/g, ' ')}`);
  await deleteDoc(doc(firestore, FIRESTORE_COLLECTIONS.DISCOVERY_CACHE, queryHash));
}

/** Feedback never changes global weights automatically; it is retained for review and future evaluations. */
export async function saveDiscoveryFeedback(input: Omit<DiscoveryFeedback, 'feedbackId' | 'createdAt'>): Promise<string> {
  if (!firestore) throw new Error('Firestore is unavailable.');
  const feedbackId = `feedback-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  await setDoc(doc(firestore, FIRESTORE_COLLECTIONS.DISCOVERY_FEEDBACK, feedbackId), { ...input, feedbackId, createdAt:new Date() });
  return feedbackId;
}
