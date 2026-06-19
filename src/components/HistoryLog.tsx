import { useCallback } from 'react';
import type { LogEntry } from '../types';
import { formatCarbonValue, calculateDailyTotal } from '../utils/carbonEngine';

interface HistoryLogProps {
  entries: LogEntry[];
  onDelete: (entryId: string) => Promise<void>;
}

const CATEGORY_ICONS: Record<string, string> = {
  transport: '🚗',
  energy: '⚡',
  food: '🍽️',
  waste: '🗑️',
};

export default function HistoryLog({ entries, onDelete }: HistoryLogProps) {
  const handleDelete = useCallback(
    (entryId: string | undefined) => {
      if (!entryId) return;
      void onDelete(entryId);
    },
    [onDelete]
  );

  if (entries.length === 0) {
    return (
      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 text-center">
        <p className="text-gray-500">No entries logged yet. Start tracking your carbon footprint!</p>
      </div>
    );
  }

  // Group entries by date
  const groupedEntries: Record<string, LogEntry[]> = {};
  for (const entry of entries) {
    const dateKey = entry.date || 'Unknown';
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
      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
        <span>📋</span> History
      </h3>
      {sortedDates.map((date) => (
        <div key={date} className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          <div className="bg-gray-800/50 px-4 py-2 flex justify-between items-center">
            <span className="text-sm font-medium text-gray-300">{date}</span>
            <span className="text-sm text-emerald-400">
              {formatCarbonValue(calculateDailyTotal(groupedEntries[date]))}
            </span>
          </div>
          <div className="divide-y divide-gray-800">
            {groupedEntries[date].map((entry) => (
              <div
                key={entry.id || `${entry.category}-${entry.value}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-gray-800/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span>{CATEGORY_ICONS[entry.category] || '📌'}</span>
                  <div>
                    <p className="text-white text-sm font-medium capitalize">
                      {entry.mode?.replace(/_/g, ' ')}
                    </p>
                    <p className="text-gray-500 text-xs">
                      {entry.value} {entry.unit}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(entry.id)}
                  className="text-gray-600 hover:text-red-400 transition-colors p-1"
                  aria-label={`Delete entry: ${entry.mode}`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
