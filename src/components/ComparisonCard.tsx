/**
 * ComparisonCard Component
 *
 * Displays a side-by-side comparison of the user's daily carbon output
 * against their country's national average. Shows progress bars and a
 * status badge (Below / Around / Above Average).
 */
import type { ReactElement } from 'react';
import type { ComparisonResult } from '../types';

/** Props for the ComparisonCard component */
interface ComparisonCardProps {
  /** Comparison result computed from the user's daily total */
  comparison: ComparisonResult;
}

const STATUS_CONFIG: Record<string, { badgeClass: string; message: string }> = {
  below: {
    badgeClass: 'bg-[#3DDC97]/10 text-[#3DDC97] border-[#3DDC97]/20',
    message: 'Below Average',
  },
  average: {
    badgeClass: 'bg-[#E8B84B]/10 text-[#E8B84B] border-[#E8B84B]/20',
    message: 'Around Average',
  },
  above: {
    badgeClass: 'bg-[#E8634B]/10 text-[#E8634B] border-[#E8634B]/20',
    message: 'Above Average',
  },
};

/** Default config used when status does not match any key (defensive fallback) */
const DEFAULT_STATUS_CONFIG = STATUS_CONFIG['average']!;

/**
 * Renders the comparison card for the Dashboard.
 */
export default function ComparisonCard({ comparison }: ComparisonCardProps): ReactElement {
  const config = STATUS_CONFIG[comparison.status] ?? DEFAULT_STATUS_CONFIG;
  
  // Calculate relative widths for comparison bars
  const maxVal = Math.max(comparison.userDaily, comparison.nationalAverage) * 1.2 || 1;
  const userPct = Math.min((comparison.userDaily / maxVal) * 100, 100);
  const avgPct = Math.min((comparison.nationalAverage / maxVal) * 100, 100);

  return (
    <div
      className="bg-[#131A16] rounded-xl p-5 border border-[rgba(255,255,255,0.08)] border-top-[1px] border-top-[rgba(255,255,255,0.06)] hover:bg-[#1A2420] hover:border-[rgba(255,255,255,0.14)] transition-all duration-150 ease-in-out"
      aria-label={`Comparison to ${comparison.country} average: ${comparison.status}`}
    >
      <div className="flex items-center justify-between gap-2 flex-wrap mb-4">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#8FA098]">vs {comparison.country} Average</h3>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border uppercase tracking-wider whitespace-nowrap ${config.badgeClass}`}>
          {config.message}
        </span>
      </div>

      {/* Comparison Bars */}
      <div className="space-y-3">
        {/* User bar */}
        <div>
          <div className="flex justify-between text-[10px] uppercase tracking-wider text-[#8FA098] mb-1 font-semibold">
            <span>You</span>
            <span className="font-display text-[#F2F5F3] tabular-nums">{comparison.userDaily.toFixed(1)} kg</span>
          </div>
          <div className="h-1.5 w-full bg-[#0B0F0D] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                comparison.status === 'below' ? 'bg-[#3DDC97]' : 'bg-[#E8634B]'
              }`}
              style={{ width: `${userPct}%` }}
            />
          </div>
        </div>

        {/* Avg bar */}
        <div>
          <div className="flex justify-between text-[10px] uppercase tracking-wider text-[#8FA098] mb-1 font-semibold">
            <span>{comparison.country} Avg</span>
            <span className="font-display text-[#8FA098] tabular-nums">{comparison.nationalAverage.toFixed(1)} kg</span>
          </div>
          <div className="h-1.5 w-full bg-[#0B0F0D] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#5C6962] rounded-full transition-all duration-500"
              style={{ width: `${avgPct}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mt-4 text-xs text-[#8FA098]">
        {comparison.percentageDifference > 0 ? '+' : ''}
        {comparison.percentageDifference.toFixed(1)}% vs national average
      </div>
    </div>
  );
}
