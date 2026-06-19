/**
 * EcoTrack Authentication Service
 * Handles Firebase Auth with Google Sign-In (free tier).
 * No password storage = no password leak risk.
 */

import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import type { User } from 'firebase/auth';
import { clearAllCache } from '../utils/cache';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

/**
 * Sign in with Google popup.
 * @returns The signed-in Firebase User
 */
export async function signIn(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

/**
 * Sign out and clear all in-memory and cached state.
 */
export async function signOut(): Promise<void> {
  clearAllCache();
  await firebaseSignOut(auth);
}

/**
 * Subscribe to auth state changes.
 * @param callback - Called with User or null on auth state change
 * @returns Unsubscribe function
 */
export function onAuthChange(
  callback: (user: User | null) => void
): () => void {
  return onAuthStateChanged(auth, callback);
}

export { auth };
export type { User };
