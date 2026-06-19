import { useCallback } from 'react';
import { Car, Zap, Utensils, Trash2, History, Trash } from 'lucide-react';
import type { LogEntry } from '../types';
import { formatCarbonValue, calculateDailyTotal } from '../utils/carbonEngine';

interface HistoryLogProps {
  entries: LogEntry[];
  onDelete: (entryId: string) => Promise<void>;
}

export default function HistoryLog({ entries, onDelete }: HistoryLogProps) {
  const handleDelete = useCallback(
    (entryId: string | undefined) => {
      if (!entryId) return;
      void onDelete(entryId);
    },
    [onDelete]
  );

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'transport':
        return <Car className="w-4 h-4 text-[#3D8BFF]" />;
      case 'energy':
        return <Zap className="w-4 h-4 text-[#E8B84B]" />;
      case 'food':
        return <Utensils className="w-4 h-4 text-[#3DDC97]" />;
      case 'waste':
        return <Trash2 className="w-4 h-4 text-[#8FA098]" />;
      default:
        return null;
    }
  };

  if (entries.length === 0) {
    return (
      <div className="bg-[#131A16] rounded-xl p-8 border border-[rgba(255,255,255,0.08)] border-top-[1px] border-top-[rgba(255,255,255,0.06)] text-center flex flex-col items-center justify-center min-h-[200px]">
        <History className="w-8 h-8 text-[#5C6962] mb-3" />
        <h4 className="text-sm font-bold font-display text-[#F2F5F3] mb-1">No entries yet</h4>
        <p className="text-xs text-[#8FA098] max-w-[240px] leading-relaxed">
          Start logging your activities to populate your carbon footprint history.
        </p>
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
      <h3 className="text-xs font-semibold uppercase tracking-wider text-[#8FA098] flex items-center gap-2">
        <History className="w-3.5 h-3.5 text-[#3DDC97]" /> History Log
      </h3>
      <div className="space-y-3">
        {sortedDates.map((date) => (
          <div key={date} className="bg-[#131A16] rounded-xl border border-[rgba(255,255,255,0.08)] border-top-[1px] border-top-[rgba(255,255,255,0.06)] overflow-hidden">
            <div className="bg-[#1A2420] px-4 py-2.5 flex justify-between items-center border-b border-[rgba(255,255,255,0.08)]">
              <span className="text-xs font-bold font-display text-[#F2F5F3]">{date}</span>
              <span className="text-xs font-bold font-display text-[#3DDC97] tabular-nums">
                Total: {formatCarbonValue(calculateDailyTotal(groupedEntries[date]))}
              </span>
            </div>
            <div className="divide-y divide-[rgba(255,255,255,0.06)]">
              {groupedEntries[date].map((entry) => (
                <div
                  key={entry.id || `${entry.category}-${entry.value}`}
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
                    aria-label={`Delete entry: ${entry.mode}`}
                  >
                    <Trash className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
