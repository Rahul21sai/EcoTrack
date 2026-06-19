/**
 * EcoTrack Local Cache Layer
 *
 * Provides offline-first reading capability using LocalStorage.
 * Entries are cached after Firestore reads and served from cache when
 * offline or during loading states. Cache invalidation is time-based (TTL).
 *
 * @module cache
 */

import type { CachedData, LogEntry } from '../types';
import { CACHE_KEY_PREFIX, CACHE_TTL_MS } from './constants';

/**
 * Retrieve cached entries for a given user from LocalStorage.
 * Returns null if cache is missing, expired, or corrupted.
 *
 * @param userId - Firebase user ID
 * @returns Array of cached log entries, or null if cache miss
 */
export function getCachedEntries(userId: string): LogEntry[] | null {
  try {
    const key = `${CACHE_KEY_PREFIX}${userId}_entries`;
    const raw = localStorage.getItem(key);
    if (!raw) {
      return null;
    }

    const cached: CachedData<LogEntry[]> = JSON.parse(raw);
    const now = Date.now();
    const cachedTime = new Date(cached.cachedAt).getTime();

    // Check TTL — return null if cache is stale
    if (now - cachedTime > (cached.ttl || CACHE_TTL_MS)) {
      localStorage.removeItem(key);
      return null;
    }

    return cached.data;
  } catch {
    // Corrupted cache — clear and return null
    return null;
  }
}

/**
 * Store entries in LocalStorage cache for offline-first reads.
 *
 * @param userId - Firebase user ID
 * @param entries - Array of log entries to cache
 */
export function setCachedEntries(userId: string, entries: LogEntry[]): void {
  try {
    const key = `${CACHE_KEY_PREFIX}${userId}_entries`;
    const cached: CachedData<LogEntry[]> = {
      data: entries,
      cachedAt: new Date().toISOString(),
      ttl: CACHE_TTL_MS,
    };
    localStorage.setItem(key, JSON.stringify(cached));
  } catch {
    // localStorage may be full or unavailable — silently fail
  }
}

/**
 * Clear all cached data for a given user.
 * Called on sign-out to ensure no stale data persists.
 *
 * @param userId - Firebase user ID
 */
export function clearUserCache(userId: string): void {
  try {
    const key = `${CACHE_KEY_PREFIX}${userId}_entries`;
    localStorage.removeItem(key);
  } catch {
    // Silently fail
  }
}

/**
 * Clear all EcoTrack cache data from LocalStorage.
 * Used during sign-out for complete state cleanup.
 */
export function clearAllCache(): void {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_KEY_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  } catch {
    // Silently fail
  }
}
