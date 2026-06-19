/**
 * WeeklyInsightSummary Component
 *
 * Displays a personalized one-sentence insight synthesizing the user's
 * emission trends from the current week vs the previous week.
 *
 * This component directly implements the "Personalized Insights" requirement
 * of the problem statement \u2014 making abstract carbon data actionable and
 * visible at a glance on the Dashboard.
 *
 * Renders a graceful fallback when there is insufficient data.
 */

import { useMemo } from 'react';
import type { ReactElement } from 'react';
import type { LogEntry } from '../types';
import { generateWeeklyInsight } from '../utils/insights';
import { Sparkles, TrendingDown, TrendingUp, Minus } from 'lucide-react';

/** Props for the WeeklyInsightSummary component */
interface WeeklyInsightSummaryProps {
  /** Log entries from the current week */
  entries: LogEntry[];
  /** Log entries from the previous week (for comparison) */
  history: LogEntry[];
}

/**
 * Returns the appropriate trend icon and color based on percentage change.
 *
 * @param pct - Percentage change (negative = improvement, positive = regression)
 * @returns Icon element and Tailwind color class
 */
function getTrendDisplay(pct: number | null): {
  icon: ReactElement;
  color: string;
  label: string;
} {
  if (pct === null) {
    return {
      icon: <Sparkles className="w-4 h-4" />,
      color: 'text-[#3DDC97]',
      label: 'New insight',
    };
  }
  if (Math.abs(pct) < 2) {
    return {
      icon: <Minus className="w-4 h-4" />,
      color: 'text-[#8FA098]',
      label: 'Steady',
    };
  }
  if (pct < 0) {
    return {
      icon: <TrendingDown className="w-4 h-4" />,
      color: 'text-[#3DDC97]',
      label: `\u2193${Math.abs(pct).toFixed(0)}%`,
    };
  }
  return {
    icon: <TrendingUp className="w-4 h-4" />,
    color: 'text-[#E8634B]',
    label: `\u2191${pct.toFixed(0)}%`,
  };
}

/**
 * Renders a personalized weekly insight card on the Dashboard.
 * Uses generateWeeklyInsight() to produce a single actionable sentence
 * derived from the user's actual emission data.
 */
export default function WeeklyInsightSummary({
  entries,
  history,
}: WeeklyInsightSummaryProps): ReactElement {
  const insight = useMemo(
    () => generateWeeklyInsight(entries, history),
    [entries, history]
  );

  const trend = getTrendDisplay(insight.percentageChange);

  return (
    <section
      className="bg-gradient-to-r from-[#0F1F18] to-[#131A16] rounded-xl p-5 border border-[#3DDC97]/20 relative overflow-hidden"
      aria-label="Weekly personalized insight"
      role="region"
    >
      {/* Subtle glow accent */}
      <div
        className="absolute top-0 left-0 w-1 h-full bg-[#3DDC97] rounded-l-xl opacity-80"
        aria-hidden="true"
      />

      <div className="pl-3">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles
              className="w-4 h-4 text-[#3DDC97]"
              aria-hidden="true"
            />
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#3DDC97]">
              Weekly Insight
            </span>
          </div>

          {/* Trend badge */}
          {insight.hasSufficientData && (
            <span
              className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] ${trend.color}`}
              aria-label={`Trend: ${trend.label}`}
            >
              {trend.icon}
              <span>{trend.label}</span>
            </span>
          )}
        </div>

        {/* Insight text */}
        <p
          className={`text-sm leading-relaxed font-medium ${
            insight.hasSufficientData
              ? 'text-[#D4E8DA]'
              : 'text-[#8FA098] italic'
          }`}
        >
          {insight.insight}
        </p>
      </div>
    </section>
  );
}
