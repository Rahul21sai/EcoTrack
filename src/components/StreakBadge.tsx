interface StreakBadgeProps {
  streak: number;
}

/**
 * Displays the user's current consecutive-day logging streak.
 * Shows a prompt to start logging when streak is zero,
 * and a congratulatory message when streak reaches 7+ days.
 */
export default function StreakBadge({ streak }: StreakBadgeProps) {
  if (streak === 0) {
    return (
      <div
        className="bg-gray-900 rounded-xl p-4 border border-gray-800 text-center"
        aria-label="No current streak"
      >
        <p className="text-gray-500 text-sm">🔥 Start your streak by logging today!</p>
      </div>
    );
  }

  return (
    <div
      className="bg-gradient-to-r from-orange-900/30 to-amber-900/30 rounded-xl p-4 border border-orange-700/50 text-center"
      aria-label={`Current streak: ${streak} days`}
    >
      <div className="text-3xl mb-1">🔥</div>
      <p className="text-2xl font-bold text-orange-400">{streak}</p>
      <p className="text-sm text-gray-400">
        {streak === 1 ? 'day streak' : 'day streak'}
      </p>
      {streak >= 7 && (
        <p className="text-xs text-emerald-400 mt-1">Amazing consistency! 🎉</p>
      )}
    </div>
  );
}
