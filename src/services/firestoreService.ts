/**
 * EcoTrack Firestore Service
 * Auth-scoped CRUD operations for carbon footprint entries.
 * Paginated reads (limit 30), no full collection scans.
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
import { auth } from './authService';
import type { LogEntry, UserProfile } from '../types';
import { ENTRIES_PER_PAGE } from '../utils/constants';

const db = getFirestore();

/**
 * Save a new log entry to Firestore under the current user's collection.
 * @param entry - The log entry data to save
 * @returns The document ID of the saved entry
 * @throws If user is not authenticated
 */
export async function saveEntry(entry: Omit<LogEntry, 'id' | 'userId' | 'createdAt'>): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error('User must be authenticated to save entries');

  const entriesRef = collection(db, 'users', user.uid, 'entries');
  const docRef = await addDoc(entriesRef, {
    ...entry,
    userId: user.uid,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
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
}

/**
 * Delete a log entry by ID.
 * @param entryId - The Firestore document ID to delete
 */
export async function deleteEntry(entryId: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('User must be authenticated to delete entries');

  const entryRef = doc(db, 'users', user.uid, 'entries', entryId);
  await deleteDoc(entryRef);
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

  const entryRef = doc(db, 'users', user.uid, 'entries', entryId);
  await updateDoc(entryRef, data);
}

/**
 * Get or create user profile.
 * @returns The user profile
 */
export async function getUserProfile(): Promise<UserProfile | null> {
  const user = auth.currentUser;
  if (!user) return null;

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

  const userRef = doc(db, 'users', user.uid);
  await updateDoc(userRef, data);
}
