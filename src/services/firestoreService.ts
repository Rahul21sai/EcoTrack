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
import { FirestoreServiceError } from '../utils/errors';

const db = isFirebaseConfigured ? getFirestore() : null;

// Helper to get local storage keys
const getLocalEntriesKey = (uid: string) => `ecotrack_local_entries_${uid}`;
const getLocalProfileKey = (uid: string) => `ecotrack_local_profile_${uid}`;

/**
 * Mock Firestore document snapshot used for LocalStorage pagination compatibility.
 * Mimics the QueryDocumentSnapshot interface with just enough to support cursor-based pagination.
 */
class MockQueryDocumentSnapshot {
  /** Document ID */
  readonly id: string;
  private readonly _data: LogEntry;

  constructor(id: string, data: LogEntry) {
    this.id = id;
    this._data = data;
  }

  /** Returns the document data as a LogEntry */
  data(): LogEntry {
    return this._data;
  }
}

/**
 * Save a new log entry to Firestore under the current user's collection,
 * or LocalStorage if Firebase is not configured.
 *
 * Uses server timestamps on Firestore writes so entries are ordered by
 * actual server time, preventing client-clock skew issues.
 *
 * @param entry - The log entry data to save (without id, userId, or createdAt)
 * @returns Promise resolving to the Firestore document ID of the saved entry
 * @throws {FirestoreServiceError} If user is not authenticated
 * @throws {FirestoreServiceError} If the Firestore write fails
 */
export async function saveEntry(entry: Omit<LogEntry, 'id' | 'userId' | 'createdAt'>): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new FirestoreServiceError('User must be authenticated to save entries', 'unauthenticated');

  try {
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
      const existing: LogEntry[] = existingStr ? (JSON.parse(existingStr) as LogEntry[]) : [];

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
  } catch (error) {
    if (error instanceof FirestoreServiceError) throw error;
    throw new FirestoreServiceError(
      `Failed to save entry: ${error instanceof Error ? error.message : 'unknown error'}`,
      'write-failed'
    );
  }
}

/**
 * Get paginated entries for the current user, ordered by creation date descending.
 *
 * Uses Firestore cursor-based pagination (startAfter) for O(1) page loads.
 * Falls back to manual slicing of a localStorage array in demo mode.
 *
 * @param lastDoc - Last document from the previous page, used for cursor-based pagination
 * @returns Promise resolving to entries array and optional cursor for the next page
 * @throws {FirestoreServiceError} If user is not authenticated
 * @throws {FirestoreServiceError} If the Firestore query fails
 */
export async function getEntries(
  lastDoc?: DocumentSnapshot
): Promise<{ entries: LogEntry[]; lastDocument: QueryDocumentSnapshot | null }> {
  const user = auth.currentUser;
  if (!user) throw new FirestoreServiceError('User must be authenticated to read entries', 'unauthenticated');

  try {
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

      // Non-null assertion safe: we check length > 0 before accessing the last element
      const lastDocument =
        snapshot.docs.length > 0
          ? snapshot.docs[snapshot.docs.length - 1]!
          : null;

      return { entries, lastDocument };
    } else {
      // LocalStorage Fallback
      const localKey = getLocalEntriesKey(user.uid);
      const existingStr = localStorage.getItem(localKey);
      const existing: LogEntry[] = existingStr ? (JSON.parse(existingStr) as LogEntry[]) : [];

      // Sort descending by date/createdAt
      existing.sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTime - aTime;
      });

      let paginated = existing;

      if (lastDoc) {
        const lastId = lastDoc.id;
        const lastIndex = existing.findIndex((e) => e.id === lastId);
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
  } catch (error) {
    if (error instanceof FirestoreServiceError) throw error;
    throw new FirestoreServiceError(
      `Failed to fetch entries: ${error instanceof Error ? error.message : 'unknown error'}`,
      'read-failed'
    );
  }
}

/**
 * Delete a log entry by its document ID.
 *
 * Performs a hard delete from Firestore (not soft delete). Callers should
 * implement optimistic UI updates before calling this function.
 *
 * @param entryId - The Firestore document ID to delete
 * @returns Promise that resolves when the entry is deleted
 * @throws {FirestoreServiceError} If user is not authenticated
 * @throws {FirestoreServiceError} If the Firestore delete operation fails
 */
export async function deleteEntry(entryId: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new FirestoreServiceError('User must be authenticated to delete entries', 'unauthenticated');

  try {
    if (isFirebaseConfigured && db) {
      const entryRef = doc(db, 'users', user.uid, 'entries', entryId);
      await deleteDoc(entryRef);
    } else {
      // LocalStorage Fallback
      const localKey = getLocalEntriesKey(user.uid);
      const existingStr = localStorage.getItem(localKey);
      if (existingStr) {
        const existing: LogEntry[] = JSON.parse(existingStr) as LogEntry[];
        const filtered = existing.filter((e) => e.id !== entryId);
        localStorage.setItem(localKey, JSON.stringify(filtered));
      }
    }
  } catch (error) {
    if (error instanceof FirestoreServiceError) throw error;
    throw new FirestoreServiceError(
      `Failed to delete entry: ${error instanceof Error ? error.message : 'unknown error'}`,
      'delete-failed'
    );
  }
}

/**
 * Update an existing log entry with partial data.
 *
 * Uses Firestore's `updateDoc` for atomic partial updates — only provided
 * fields are overwritten; other fields are preserved.
 *
 * @param entryId - The Firestore document ID to update
 * @param data - Partial entry data to merge into the existing document
 * @returns Promise that resolves when the entry is updated
 * @throws {FirestoreServiceError} If user is not authenticated
 * @throws {FirestoreServiceError} If the Firestore update fails
 */
export async function updateEntry(
  entryId: string,
  data: Partial<Omit<LogEntry, 'id' | 'userId'>>
): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new FirestoreServiceError('User must be authenticated to update entries', 'unauthenticated');

  try {
    if (isFirebaseConfigured && db) {
      const entryRef = doc(db, 'users', user.uid, 'entries', entryId);
      await updateDoc(entryRef, data);
    } else {
      // LocalStorage Fallback
      const localKey = getLocalEntriesKey(user.uid);
      const existingStr = localStorage.getItem(localKey);
      if (existingStr) {
        const existing: LogEntry[] = JSON.parse(existingStr) as LogEntry[];
        const updated = existing.map((e) => {
          if (e.id === entryId) {
            return { ...e, ...data };
          }
          return e;
        });
        localStorage.setItem(localKey, JSON.stringify(updated));
      }
    }
  } catch (error) {
    if (error instanceof FirestoreServiceError) throw error;
    throw new FirestoreServiceError(
      `Failed to update entry: ${error instanceof Error ? error.message : 'unknown error'}`,
      'update-failed'
    );
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
 * Update user profile with partial data.
 *
 * @param data - Partial profile fields to update (uid is always preserved)
 * @returns Promise that resolves when the profile is updated
 * @throws {FirestoreServiceError} If user is not authenticated
 */
export async function updateUserProfile(
  data: Partial<Omit<UserProfile, 'uid'>>
): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new FirestoreServiceError('User must be authenticated to update profile', 'unauthenticated');

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
