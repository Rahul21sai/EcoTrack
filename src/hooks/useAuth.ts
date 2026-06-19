import { useState, useEffect, useCallback } from 'react';
import type { AuthUser } from '../services/authService';
import {
  signIn as authSignIn,
  signOut as authSignOut,
  onAuthChange,
} from '../services/authService';

interface UseAuthReturn {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

/**
 * Hook for managing Firebase authentication state.
 * @returns Auth state and sign-in/sign-out functions
 */
export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthChange((firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signIn = useCallback(async (): Promise<void> => {
    try {
      setError(null);
      setLoading(true);
      await authSignIn();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed');
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async (): Promise<void> => {
    try {
      setError(null);
      await authSignOut();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-out failed');
    }
  }, []);

  return { user, loading, error, signIn, signOut };
}
