/**
 * EcoTrack Authentication Service
 * Handles Firebase Auth with Google Sign-In (free tier).
 * Automatically falls back to a simulated demo-mode auth if credentials are not configured,
 * preventing blank-screen crashes.
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

export const isFirebaseConfigured = !!firebaseConfig.apiKey;

let app: any;
let realAuth: any;
let googleProvider: any;

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

// Demo mode state
let demoUser: DemoUser | null = {
  uid: 'demo_user',
  displayName: 'Demo User',
  email: 'demo@ecotrack.org',
  photoURL: null,
};

const authListeners = new Set<(user: any) => void>();

export async function signIn(): Promise<any> {
  if (isFirebaseConfigured && realAuth) {
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

export async function signOut(): Promise<void> {
  clearAllCache();
  if (isFirebaseConfigured && realAuth) {
    await firebaseSignOut(realAuth);
  } else {
    demoUser = null;
    authListeners.forEach((cb) => cb(null));
  }
}

export function onAuthChange(
  callback: (user: any) => void
): () => void {
  if (isFirebaseConfigured && realAuth) {
    return onAuthStateChanged(realAuth, callback);
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
