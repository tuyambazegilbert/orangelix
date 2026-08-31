import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { firestore } from '@/lib/firebase';

export type SupportThreadType = 'feedback' | 'bug';
export type SupportVisibility = 'public' | 'private';
export type SupportThreadStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface SupportThread {
  id: string;
  type: SupportThreadType;
  subject: string;
  body: string;
  visibility: SupportVisibility;
  status: SupportThreadStatus;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  createdAt: string;
  updatedAt: string;
}

export interface SupportMessage {
  id: string;
  authorId: string;
  authorName: string;
  authorEmail: string;
  body: string;
  isAdmin: boolean;
  createdAt: string;
}

const text = (value: unknown) => (typeof value === 'string' ? value : '');
const mapThread = (id: string, data: Record<string, unknown>): SupportThread => ({
  id,
  type: data.type === 'bug' ? 'bug' : 'feedback',
  subject: text(data.subject),
  body: text(data.body),
  visibility: data.visibility === 'private' ? 'private' : 'public',
  status: ['open', 'in_progress', 'resolved', 'closed'].includes(text(data.status))
    ? (data.status as SupportThreadStatus)
    : 'open',
  ownerId: text(data.ownerId),
  ownerName: text(data.ownerName) || 'OrangeFlix Member',
  ownerEmail: text(data.ownerEmail),
  createdAt: text(data.createdAt),
  updatedAt: text(data.updatedAt),
});

export const SupportService = {
  async listThreads(userId?: string, isAdmin = false): Promise<SupportThread[]> {
    if (!firestore) return [];
    const threads = collection(firestore, 'supportThreads');
    const snapshots = isAdmin
      ? [await getDocs(query(threads, orderBy('updatedAt', 'desc')))]
      : await Promise.all([
          getDocs(query(threads, where('visibility', '==', 'public'))),
          ...(userId ? [getDocs(query(threads, where('ownerId', '==', userId)))] : []),
        ]);
    const unique = new Map<string, SupportThread>();
    snapshots.forEach((snapshot) => snapshot.docs.forEach((item) => unique.set(item.id, mapThread(item.id, item.data() as Record<string, unknown>))));
    return Array.from(unique.values()).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },

  async listMessages(threadId: string): Promise<SupportMessage[]> {
    if (!firestore) return [];
    const snapshot = await getDocs(query(collection(firestore, 'supportThreads', threadId, 'messages'), orderBy('createdAt', 'asc')));
    return snapshot.docs.map((item) => {
      const data = item.data() as Record<string, unknown>;
      return {
        id: item.id,
        authorId: text(data.authorId),
        authorName: text(data.authorName) || 'OrangeFlix Member',
        authorEmail: text(data.authorEmail),
        body: text(data.body),
        isAdmin: data.isAdmin === true,
        createdAt: text(data.createdAt),
      };
    });
  },

  async createThread(input: Omit<SupportThread, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<string> {
    if (!firestore) throw new Error('Support service is unavailable.');
    const now = new Date().toISOString();
    const thread = await addDoc(collection(firestore, 'supportThreads'), {
      ...input,
      status: 'open',
      createdAt: now,
      updatedAt: now,
    });
    await addDoc(collection(firestore, 'supportThreads', thread.id, 'messages'), {
      authorId: input.ownerId,
      authorName: input.ownerName,
      authorEmail: input.ownerEmail,
      body: input.body,
      isAdmin: false,
      createdAt: now,
      createdAtServer: serverTimestamp(),
    });
    return thread.id;
  },

  async addMessage(threadId: string, message: Omit<SupportMessage, 'id' | 'createdAt'>): Promise<void> {
    if (!firestore) throw new Error('Support service is unavailable.');
    const now = new Date().toISOString();
    await addDoc(collection(firestore, 'supportThreads', threadId, 'messages'), {
      ...message,
      createdAt: now,
      createdAtServer: serverTimestamp(),
    });
    await updateDoc(doc(firestore, 'supportThreads', threadId), { updatedAt: now });
  },

  async updateThread(threadId: string, changes: Partial<Pick<SupportThread, 'status' | 'subject' | 'visibility'>>): Promise<void> {
    if (!firestore) throw new Error('Support service is unavailable.');
    await updateDoc(doc(firestore, 'supportThreads', threadId), { ...changes, updatedAt: new Date().toISOString() });
  },

  async deleteThread(threadId: string): Promise<void> {
    if (!firestore) throw new Error('Support service is unavailable.');
    const messages = await getDocs(collection(firestore, 'supportThreads', threadId, 'messages'));
    await Promise.all(messages.docs.map((item) => deleteDoc(item.ref)));
    await deleteDoc(doc(firestore, 'supportThreads', threadId));
  },
};
