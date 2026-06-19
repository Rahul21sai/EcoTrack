import { Flame } from 'lucide-react';

interface StreakBadgeProps {
  streak: number;
  onNavigateToLog?: () => void;
}

/**
 * Displays the user's current consecutive-day logging streak.
 * Shows a prompt to start logging when streak is zero,
 * and a congratulatory message when streak reaches 7+ days.
 */
export default function StreakBadge({ streak, onNavigateToLog }: StreakBadgeProps) {
  if (streak === 0) {
    return (
      <div
        className="bg-[#131A16] rounded-xl p-5 border border-[rgba(255,255,255,0.08)] border-top-[1px] border-top-[rgba(255,255,255,0.06)] flex items-center justify-between gap-4"
        aria-label="No current streak"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#E8B84B]/10">
            <Flame className="w-8 h-8 text-[#E8B84B]" />
          </div>
          <div>
            <h4 className="text-sm font-bold font-display text-[#F2F5F3]">No active streak</h4>
            <p className="text-xs text-[#8FA098]">Log your actions today to start a streak!</p>
          </div>
        </div>
        {onNavigateToLog && (
          <button
            onClick={onNavigateToLog}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-[#E8B84B] hover:bg-[#e0ad3d] text-[#0B0F0D] transition-all whitespace-nowrap cursor-pointer"
          >
            Log Today
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className="bg-[#131A16] rounded-xl p-5 border border-[rgba(255,255,255,0.08)] border-top-[1px] border-top-[rgba(255,255,255,0.06)] flex items-center justify-between gap-4"
      aria-label={`Current streak: ${streak} days`}
    >
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-[#E8B84B]/10">
          <Flame className="w-8 h-8 text-[#E8B84B] animate-pulse" />
        </div>
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-display text-[#E8B84B] tabular-nums">{streak}</span>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8FA098]">{streak === 1 ? 'day streak' : 'day streak'}</span>
          </div>
          <p className="text-xs text-[#8FA098]">
            {streak >= 7 ? 'Consistency milestone achieved! 🎉' : 'Keep logging daily to lock in your carbon savings.'}
          </p>
        </div>
      </div>
      {onNavigateToLog && (
        <button
          onClick={onNavigateToLog}
          className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-[rgba(255,255,255,0.08)] hover:bg-[#1A2420] text-[#F2F5F3] transition-all whitespace-nowrap cursor-pointer"
        >
          Log Activity
        </button>
      )}
    </div>
  );
}
