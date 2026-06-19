/**
 * useRecommendations Hook
 * Memoized recommendation calculation based on user entries.
 */

import { useMemo } from 'react';
import type { LogEntry, Recommendation } from '../types';
import { generateRecommendations } from '../utils/carbonEngine';

/**
 * Hook for computing personalized recommendations.
 * Memoized — only recalculates when entries change.
 *
 * @param entries - Current period's log entries
 * @param history - Previous period's entries for trend analysis
 * @returns Array of recommendations sorted by impact
 */
export function useRecommendations(
  entries: LogEntry[],
  history: LogEntry[] = []
): Recommendation[] {
  return useMemo(
    () => generateRecommendations(entries, history),
    [entries, history]
  );
}
