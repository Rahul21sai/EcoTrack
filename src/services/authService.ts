/**
 * EcoTrack Authentication Service
 *
 * Wraps Firebase Auth with Google Sign-In (OAuth 2.0 popup flow).
 * Automatically falls back to a simulated demo-mode user if Firebase credentials
 * are not configured, preventing blank-screen failures in development or demo deployments.
 *
 * Architecture decision: Demo mode is implemented at this layer, not in components,
 * so components never need to know whether they are talking to real Firebase or a mock.
 *
 * @module authService
 */

import { initializeApp } from 'firebase/app';
import type { FirebaseApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import type { Auth, User } from 'firebase/auth';
import { clearAllCache } from '../utils/cache';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

export const isFirebaseConfigured = !!firebaseConfig.apiKey;

let app: FirebaseApp | undefined;
let realAuth: Auth | null = null;
let googleProvider: GoogleAuthProvider | undefined;

if (isFirebaseConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    realAuth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
  } catch (err) {
    console.error('Firebase initialization failed, falling back to demo mode:', err);
    realAuth = null;
  }
}

// Simulated User type for Demo Mode
export interface DemoUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

export type AuthUser = User | DemoUser;

// Demo mode state
let demoUser: DemoUser | null = {
  uid: 'demo_user',
  displayName: 'Demo User',
  email: 'demo@ecotrack.org',
  photoURL: null,
};

const authListeners = new Set<(user: AuthUser | null) => void>();

/**
 * Initiates Google Sign-In via Firebase Auth popup.
 * Falls back to a demo user object if Firebase is not configured.
 *
 * @returns Promise resolving to the authenticated user (real or demo)
 * @throws {Error} If Firebase is configured but the sign-in popup fails
 *   (e.g., popup blocked, network error, user dismissed dialog)
 */
export async function signIn(): Promise<AuthUser> {
  if (isFirebaseConfigured && realAuth && googleProvider) {
    const result = await signInWithPopup(realAuth, googleProvider);
    return result.user;
  } else {
    demoUser = {
      uid: 'demo_user',
      displayName: 'Demo User',
      email: 'demo@ecotrack.org',
      photoURL: null,
    };
    authListeners.forEach((cb) => cb(demoUser));
    return demoUser;
  }
}

/**
 * Signs the current user out and clears all in-memory and localStorage caches.
 * In demo mode, resets the demo user to null and notifies all listeners.
 *
 * @returns Promise that resolves when sign-out completes
 * @throws {Error} If Firebase sign-out call fails (network error)
 */
export async function signOut(): Promise<void> {
  clearAllCache();
  if (isFirebaseConfigured && realAuth) {
    await firebaseSignOut(realAuth);
  } else {
    demoUser = null;
    authListeners.forEach((cb) => cb(null));
  }
}

/**
 * Subscribes to authentication state changes. The callback is invoked
 * immediately with the current user, then on every subsequent sign-in/sign-out.
 *
 * In Firebase mode, wraps `onAuthStateChanged`.
 * In demo mode, triggers the callback immediately with the demo user and tracks
 * all listeners in a local Set for manual notification.
 *
 * @param callback - Function called with the current user (or null if signed out)
 * @returns Unsubscribe function — call it to stop listening and prevent memory leaks
 */
export function onAuthChange(
  callback: (user: AuthUser | null) => void
): () => void {
  if (isFirebaseConfigured && realAuth) {
    return onAuthStateChanged(realAuth, (u) => callback(u));
  } else {
    authListeners.add(callback);
    // Trigger callback immediately for demo mode
    callback(demoUser);
    return () => {
      authListeners.delete(callback);
    };
  }
}

// Export a proxy auth object for standard property accesses in components/hooks
export const auth = isFirebaseConfigured && realAuth ? realAuth : {
  get currentUser() {
    return demoUser;
  }
};

export type { User };
