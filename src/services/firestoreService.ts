/**
 * EcoTrack Firestore Service
 * Auth-scoped CRUD operations for carbon footprint entries.
 * Paginated reads (limit 30), no full collection scans.
 * Falls back to LocalStorage-based database when Firebase is not configured.
 */

import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  doc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  setDoc,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore';
import type {
  DocumentSnapshot,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { auth, isFirebaseConfigured } from './authService';
import type { LogEntry, UserProfile } from '../types';
import { ENTRIES_PER_PAGE } from '../utils/constants';

const db = isFirebaseConfigured ? getFirestore() : null;

// Helper to get local storage keys
const getLocalEntriesKey = (uid: string) => `ecotrack_local_entries_${uid}`;
const getLocalProfileKey = (uid: string) => `ecotrack_local_profile_${uid}`;

// Simulated QueryDocumentSnapshot for local storage pagination compatibility
class MockQueryDocumentSnapshot {
  id: string;
  private _data: any;
  constructor(id: string, data: any) {
    this.id = id;
    this._data = data;
  }
  data() {
    return this._data;
  }
}

/**
 * Save a new log entry to Firestore under the current user's collection,
 * or LocalStorage if Firebase is not configured.
 * @param entry - The log entry data to save
 * @returns The document ID of the saved entry
 * @throws If user is not authenticated
 */
export async function saveEntry(entry: Omit<LogEntry, 'id' | 'userId' | 'createdAt'>): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error('User must be authenticated to save entries');

  if (isFirebaseConfigured && db) {
    const entriesRef = collection(db, 'users', user.uid, 'entries');
    const docRef = await addDoc(entriesRef, {
      ...entry,
      userId: user.uid,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } else {
    // LocalStorage Fallback
    const localKey = getLocalEntriesKey(user.uid);
    const existingStr = localStorage.getItem(localKey);
    const existing: LogEntry[] = existingStr ? JSON.parse(existingStr) : [];
    
    const newId = `local_entry_${Date.now()}`;
    const newEntry: LogEntry = {
      ...entry,
      id: newId,
      userId: user.uid,
      createdAt: new Date().toISOString(),
    };
    
    existing.unshift(newEntry);
    localStorage.setItem(localKey, JSON.stringify(existing));
    return newId;
  }
}

/**
 * Get paginated entries for the current user, ordered by date descending.
 * @param lastDoc - Last document from previous page (for pagination)
 * @returns Object with entries array and last document for next page
 */
export async function getEntries(
  lastDoc?: DocumentSnapshot
): Promise<{ entries: LogEntry[]; lastDocument: QueryDocumentSnapshot | null }> {
  const user = auth.currentUser;
  if (!user) throw new Error('User must be authenticated to read entries');

  if (isFirebaseConfigured && db) {
    const entriesRef = collection(db, 'users', user.uid, 'entries');
    let q = query(
      entriesRef,
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(ENTRIES_PER_PAGE)
    );

    if (lastDoc) {
      q = query(
        entriesRef,
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc'),
        startAfter(lastDoc),
        limit(ENTRIES_PER_PAGE)
      );
    }

    const snapshot = await getDocs(q);
    const entries: LogEntry[] = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    })) as LogEntry[];

    const lastDocument =
      snapshot.docs.length > 0
        ? snapshot.docs[snapshot.docs.length - 1]
        : null;

    return { entries, lastDocument };
  } else {
    // LocalStorage Fallback
    const localKey = getLocalEntriesKey(user.uid);
    const existingStr = localStorage.getItem(localKey);
    const existing: LogEntry[] = existingStr ? JSON.parse(existingStr) : [];
    
    // Sort descending by date/createdAt
    existing.sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });

    let paginated = existing;
    let lastIndex = -1;

    if (lastDoc) {
      const lastId = lastDoc.id;
      lastIndex = existing.findIndex((e) => e.id === lastId);
      if (lastIndex !== -1) {
        paginated = existing.slice(lastIndex + 1);
      }
    }

    const pageSlice = paginated.slice(0, ENTRIES_PER_PAGE);
    
    const lastEntry = pageSlice.length > 0 ? pageSlice[pageSlice.length - 1] : null;
    const lastDocument = lastEntry 
      ? new MockQueryDocumentSnapshot(lastEntry.id!, lastEntry) as unknown as QueryDocumentSnapshot
      : null;

    return { entries: pageSlice, lastDocument };
  }
}

/**
 * Delete a log entry by ID.
 * @param entryId - The Firestore document ID to delete
 */
export async function deleteEntry(entryId: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('User must be authenticated to delete entries');

  if (isFirebaseConfigured && db) {
    const entryRef = doc(db, 'users', user.uid, 'entries', entryId);
    await deleteDoc(entryRef);
  } else {
    // LocalStorage Fallback
    const localKey = getLocalEntriesKey(user.uid);
    const existingStr = localStorage.getItem(localKey);
    if (existingStr) {
      const existing: LogEntry[] = JSON.parse(existingStr);
      const filtered = existing.filter((e) => e.id !== entryId);
      localStorage.setItem(localKey, JSON.stringify(filtered));
    }
  }
}

/**
 * Update an existing log entry.
 * @param entryId - The Firestore document ID to update
 * @param data - Partial entry data to update
 */
export async function updateEntry(
  entryId: string,
  data: Partial<Omit<LogEntry, 'id' | 'userId'>>
): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('User must be authenticated to update entries');

  if (isFirebaseConfigured && db) {
    const entryRef = doc(db, 'users', user.uid, 'entries', entryId);
    await updateDoc(entryRef, data);
  } else {
    // LocalStorage Fallback
    const localKey = getLocalEntriesKey(user.uid);
    const existingStr = localStorage.getItem(localKey);
    if (existingStr) {
      const existing: LogEntry[] = JSON.parse(existingStr);
      const updated = existing.map((e) => {
        if (e.id === entryId) {
          return { ...e, ...data };
        }
        return e;
      });
      localStorage.setItem(localKey, JSON.stringify(updated));
    }
  }
}

/**
 * Get or create user profile.
 * @returns The user profile
 */
export async function getUserProfile(): Promise<UserProfile | null> {
  const user = auth.currentUser;
  if (!user) return null;

  if (isFirebaseConfigured && db) {
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      return userSnap.data() as UserProfile;
    }

    // Create new profile
    const profile: UserProfile = {
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
      country: 'Global',
      createdAt: new Date().toISOString(),
    };
    await setDoc(userRef, profile);
    return profile;
  } else {
    // LocalStorage Fallback
    const localKey = getLocalProfileKey(user.uid);
    const existingStr = localStorage.getItem(localKey);
    if (existingStr) {
      return JSON.parse(existingStr) as UserProfile;
    }

    const profile: UserProfile = {
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
      country: 'Global',
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem(localKey, JSON.stringify(profile));
    return profile;
  }
}

/**
 * Update user profile.
 * @param data - Partial profile data to update
 */
export async function updateUserProfile(
  data: Partial<Omit<UserProfile, 'uid'>>
): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('User must be authenticated to update profile');

  if (isFirebaseConfigured && db) {
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, data);
  } else {
    // LocalStorage Fallback
    const localKey = getLocalProfileKey(user.uid);
    const existingStr = localStorage.getItem(localKey);
    if (existingStr) {
      const existing: UserProfile = JSON.parse(existingStr);
      const updated = { ...existing, ...data };
      localStorage.setItem(localKey, JSON.stringify(updated));
    }
  }
}
