/**
 * useEntries Hook
 * Manages carbon footprint log entries with Firestore sync and local cache.
 */

import { useState, useEffect, useCallback } from 'react';
import type { LogEntry } from '../types';
import { saveEntry, getEntries, deleteEntry, updateEntry } from '../services/firestoreService';
import { getCachedEntries, setCachedEntries } from '../utils/cache';
import { useAuth } from './useAuth';

interface UseEntriesReturn {
  entries: LogEntry[];
  loading: boolean;
  error: string | null;
  addEntry: (entry: Omit<LogEntry, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
  removeEntry: (entryId: string) => Promise<void>;
  editEntry: (entryId: string, data: Partial<Omit<LogEntry, 'id' | 'userId'>>) => Promise<void>;
  refreshEntries: () => Promise<void>;
}

/**
 * Hook for managing log entries with optimistic updates and caching.
 * @returns Entries state and CRUD functions
 */
export function useEntries(): UseEntriesReturn {
  const { user } = useAuth();
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEntries = useCallback(async (): Promise<void> => {
    if (!user) {
      setEntries([]);
      setLoading(false);
      return;
    }

    try {
      // Try cache first (offline-first)
      const cached = getCachedEntries(user.uid);
      if (cached) {
        setEntries(cached);
        setLoading(false);
      }

      // Fetch from Firestore in background
      const { entries: freshEntries } = await getEntries();
      setEntries(freshEntries);
      setCachedEntries(user.uid, freshEntries);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load entries');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => {
      if (active) {
        void fetchEntries();
      }
    });
    return () => {
      active = false;
    };
  }, [fetchEntries]);

  const addEntry = useCallback(
    async (entry: Omit<LogEntry, 'id' | 'userId' | 'createdAt'>): Promise<void> => {
      // Optimistic update
      const optimisticEntry: LogEntry = {
        ...entry,
        id: `temp_${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      setEntries((prev) => [optimisticEntry, ...prev]);

      try {
        await saveEntry(entry);
        await fetchEntries(); // Refresh to get real IDs
      } catch (err) {
        // Rollback optimistic update
        setEntries((prev) => prev.filter((e) => e.id !== optimisticEntry.id));
        setError(err instanceof Error ? err.message : 'Failed to save entry');
      }
    },
    [fetchEntries]
  );

  const removeEntry = useCallback(
    async (entryId: string): Promise<void> => {
      // Optimistic removal
      const previousEntries = entries;
      setEntries((prev) => prev.filter((e) => e.id !== entryId));

      try {
        await deleteEntry(entryId);
      } catch (err) {
        // Rollback
        setEntries(previousEntries);
        setError(err instanceof Error ? err.message : 'Failed to delete entry');
      }
    },
    [entries]
  );

  const editEntry = useCallback(
    async (entryId: string, data: Partial<Omit<LogEntry, 'id' | 'userId'>>): Promise<void> => {
      try {
        await updateEntry(entryId, data);
        await fetchEntries();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update entry');
      }
    },
    [fetchEntries]
  );

  return {
    entries,
    loading,
    error,
    addEntry,
    removeEntry,
    editEntry,
    refreshEntries: fetchEntries,
  };
}
