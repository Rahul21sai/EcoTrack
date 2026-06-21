/**
 * HistoryLog Component
 *
 * Displays the user's carbon footprint log entries grouped by date,
 * with category filtering for focused analysis. Supports deleting individual
 * entries with optimistic updates.
 *
 * The category filter directly supports the "Track" pillar of the problem
 * statement by letting users see exactly how much each category contributes
 * over time, rather than viewing all activities as an undifferentiated list.
 */

import { useCallback, useState } from 'react';
import type { ReactElement } from 'react';
import { History, Trash } from 'lucide-react';
import type { LogEntry, EmissionCategory } from '../types';
import { formatCarbonValue, calculateDailyTotal } from '../utils/carbonEngine';
import { getCategoryIcon } from '../utils/categoryIcons';

/** Props for the HistoryLog component */
interface HistoryLogProps {
  /** All log entries to display */
  entries: LogEntry[];
  /** Callback to delete a single entry by its ID */
  onDelete: (entryId: string) => Promise<void>;
}

/** Filter categories for the history view */
type HistoryFilter = 'all' | EmissionCategory;

/** Shape of a filter pill option */
interface FilterOption {
  /** Unique filter identifier */
  id: HistoryFilter;
  /** Display label for the pill */
  label: string;
  /** Emoji icon shown next to the label */
  icon: string;
}

/** Available filter options for the history view */
const FILTER_OPTIONS: FilterOption[] = [
  { id: 'all', label: 'All', icon: '🌍' },
  { id: 'transport', label: 'Transport', icon: '🚗' },
  { id: 'energy', label: 'Energy', icon: '⚡' },
  { id: 'food', label: 'Food', icon: '🍽️' },
  { id: 'waste', label: 'Waste', icon: '🗑️' },
];

/**
 * Renders the full history log with category filter pills and date grouping.
 */
export default function HistoryLog({ entries, onDelete }: HistoryLogProps): ReactElement {
  const [activeFilter, setActiveFilter] = useState<HistoryFilter>('all');

  const handleDelete = useCallback(
    (entryId: string | undefined): void => {
      if (!entryId) return;
      void onDelete(entryId);
    },
    [onDelete]
  );

  const filteredEntries = activeFilter === 'all'
    ? entries
    : entries.filter((e) => e.category === activeFilter);

  if (entries.length === 0) {
    return (
      <div className="bg-[#131A16] rounded-xl p-8 border border-[rgba(255,255,255,0.08)] text-center flex flex-col items-center justify-center min-h-[200px]">
        <History className="w-8 h-8 text-[#5C6962] mb-3" aria-hidden="true" />
        <h4 className="text-sm font-bold font-display text-[#F2F5F3] mb-1">No entries yet</h4>
        <p className="text-xs text-[#8FA098] max-w-[240px] leading-relaxed">
          Start logging your activities to populate your carbon footprint history.
        </p>
      </div>
    );
  }

  // Group filtered entries by date
  const groupedEntries: Record<string, LogEntry[]> = {};
  for (const entry of filteredEntries) {
    const dateKey = entry.date ?? 'Unknown';
    if (!groupedEntries[dateKey]) {
      groupedEntries[dateKey] = [];
    }
    groupedEntries[dateKey].push(entry);
  }

  const sortedDates = Object.keys(groupedEntries).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#8FA098] flex items-center gap-2">
          <History className="w-3.5 h-3.5 text-[#3DDC97]" aria-hidden="true" />
          History Log
        </h3>

        {/* Category filter pills */}
        <div
          role="group"
          aria-label="Filter entries by category"
          className="flex items-center gap-2 flex-wrap"
        >
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setActiveFilter(opt.id)}
              aria-pressed={activeFilter === opt.id}
              aria-label={`Filter by ${opt.label}`}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider transition-all border ${
                activeFilter === opt.id
                  ? 'bg-[#3DDC97]/15 text-[#3DDC97] border-[#3DDC97]/40'
                  : 'bg-transparent text-[#8FA098] border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.2)] hover:text-[#F2F5F3]'
              }`}
            >
              <span aria-hidden="true">{opt.icon}</span>
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* No results for selected filter */}
      {sortedDates.length === 0 ? (
        <div className="bg-[#131A16] rounded-xl p-6 border border-[rgba(255,255,255,0.08)] text-center">
          <p className="text-xs text-[#8FA098]">
            No {activeFilter} entries logged yet.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedDates.map((date) => (
            <div
              key={date}
              className="bg-[#131A16] rounded-xl border border-[rgba(255,255,255,0.08)] overflow-hidden"
            >
              <div className="bg-[#1A2420] px-4 py-2.5 flex justify-between items-center border-b border-[rgba(255,255,255,0.08)]">
                <span className="text-xs font-bold font-display text-[#F2F5F3]">{date}</span>
                <span className="text-xs font-bold font-display text-[#3DDC97] tabular-nums">
                  Total: {formatCarbonValue(calculateDailyTotal(groupedEntries[date] ?? []))}
                </span>
              </div>
              <div className="divide-y divide-[rgba(255,255,255,0.06)]">
                {(groupedEntries[date] ?? []).map((entry) => (
                  <div
                    key={entry.id ?? `${entry.category}-${entry.value}`}
                    className="flex items-center justify-between px-4 py-3 hover:bg-[#1A2420]/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)]">
                        {getCategoryIcon(entry.category)}
                      </div>
                      <div>
                        <p className="text-[#F2F5F3] text-xs font-semibold capitalize">
                          {entry.mode?.replace(/_/g, ' ')}
                        </p>
                        <p className="text-[#8FA098] text-[10px] tabular-nums mt-0.5">
                          {entry.value} {entry.unit}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(entry.id)}
                      className="text-[#8FA098] hover:text-[#E8634B] transition-colors p-1.5 hover:bg-[rgba(255,255,255,0.03)] rounded-lg"
                      aria-label={`Delete entry: ${entry.mode?.replace(/_/g, ' ')}`}
                    >
                      <Trash className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
