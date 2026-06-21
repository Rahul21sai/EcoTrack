/**
 * Barrel export for EcoTrack services.
 *
 * @module services
 */

export {
  signIn,
  signOut,
  onAuthChange,
  isFirebaseConfigured,
  auth,
} from './authService';

export type { User, AuthUser, DemoUser } from './authService';

export {
  saveEntry,
  getEntries,
  deleteEntry,
  updateEntry,
  getUserProfile,
  updateUserProfile,
} from './firestoreService';
