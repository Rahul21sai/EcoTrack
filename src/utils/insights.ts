/**
 * EcoTrack Insight Generation Engine
 *
 * Pure, deterministic functions for generating human-readable insights
 * from raw carbon emission data. These functions bridge the gap between
 * raw kg CO2e numbers and the "Understand" pillar of the problem statement:
 * helping users grasp WHY their numbers matter and how they compare to
 * real-world actions they intuitively understand.
 *
 * All functions are pure (no side effects), fully unit-testable, and
 * have zero imports from React, Firebase, or any UI library.
 *
 * @module insights
 */

import type { LogEntry } from '../types';
import { getCategoryBreakdown, calculateDailyTotal } from './carbonEngine';
import {
  TRANSPORT_EMISSION_FACTORS,
  WEEKLY_INSIGHT_MINIMUM_ENTRIES,
  STEADY_STATE_THRESHOLD_PERCENT,
} from './constants';

// ── Relatable Comparisons ─────────────────────────────────────────────────────

/**
 * Emission reference points for relatable comparisons.
 * Values are in kg CO2e. Sources: DEFRA 2023, EPA, Our World in Data.
 */
const COMPARISON_REFERENCES = {
  /** Average petrol car: 0.192 kg CO2e/km → 100km = 19.2 kg CO2e */
  CAR_100KM: 19.2,
  /** Charging a smartphone once: ~0.008 kg CO2e */
  PHONE_CHARGE: 0.008,
  /** One short-haul flight (London–Paris): ~0.26 kg CO2e/km × 340km ≈ 88 kg */
  SHORT_HAUL_FLIGHT: 88,
  /** Boiling a kettle: ~0.026 kg CO2e */
  KETTLE_BOIL: 0.026,
  /** One beef burger: ~4.0 kg CO2e */
  BEEF_BURGER: 4.0,
  /** Streaming video for 1 hour: ~0.036 kg CO2e */
  VIDEO_STREAM_HOUR: 0.036,
  /** One tree absorbs ~21 kg CO2e per year */
  TREE_YEAR: 21,
} as const;

/**
 * Generates a relatable real-world comparison for a carbon emission value.
 *
 * Converts an abstract kg CO2e number into a human-understandable comparison
 * that directly supports the "Understand" pillar of the problem statement.
 * Uses deterministic bracket logic for predictable, unit-testable output.
 *
 * @param kg - Emission value in kg CO2e, must be \u2265 0
 * @returns A human-readable comparison string (e.g., "\u2248 driving 50 km in a petrol car")
 *
 * @example
 * generateRelatableComparison(0)     // \u2192 "\u2248 a zero-emission activity \ud83c\udf31"
 * generateRelatableComparison(0.1)   // \u2192 "\u2248 charging your phone 12 times"
 * generateRelatableComparison(5)     // \u2192 "\u2248 1 beef burger meal"
 * generateRelatableComparison(19.2)  // \u2192 "\u2248 driving 100 km in a petrol car"
 * generateRelatableComparison(200)   // \u2192 "\u2248 2 short-haul flights"
 */
export function generateRelatableComparison(kg: number): string {
  if (kg <= 0) {
    return '\u2248 a zero-emission activity \ud83c\udf31';
  }

  // Very small: phone charges (< 0.5 kg)
  if (kg < 0.5) {
    const charges = Math.round(kg / COMPARISON_REFERENCES.PHONE_CHARGE);
    return `\u2248 charging your phone ${charges} time${charges !== 1 ? 's' : ''}`;
  }

  // Small: kettle boils (0.5\u20131 kg)
  if (kg < 1) {
    const kettles = Math.round(kg / COMPARISON_REFERENCES.KETTLE_BOIL);
    return `\u2248 boiling a kettle ${kettles} time${kettles !== 1 ? 's' : ''}`;
  }

  // Medium-small: beef burgers (1\u20138 kg)
  if (kg < 8) {
    const burgers = (kg / COMPARISON_REFERENCES.BEEF_BURGER).toFixed(1);
    return `\u2248 ${burgers} beef burger meal${parseFloat(burgers) !== 1 ? 's' : ''}`;
  }

  // Medium: car driving in km (8\u201350 kg)
  if (kg < 50) {
    const km = Math.round(kg / TRANSPORT_EMISSION_FACTORS.car_petrol);
    return `\u2248 driving ${km} km in a petrol car`;
  }

  // Large: fraction of a short-haul flight (50\u2013300 kg)
  if (kg < 300) {
    const flights = (kg / COMPARISON_REFERENCES.SHORT_HAUL_FLIGHT).toFixed(1);
    return `\u2248 ${flights} short-haul flight${parseFloat(flights) !== 1 ? 's' : ''}`;
  }

  // Very large: trees needed to offset per year (>300 kg)
  const trees = Math.round(kg / COMPARISON_REFERENCES.TREE_YEAR);
  return `\u2248 what ${trees} tree${trees !== 1 ? 's' : ''} absorb${trees === 1 ? 's' : ''} in a year`;
}

// ── Weekly Insight Summary ────────────────────────────────────────────────────

/** Result type for the weekly insight function */
export interface WeeklyInsightResult {
  /** Whether there is sufficient data for a meaningful insight */
  hasSufficientData: boolean;
  /** The one-sentence personalized insight string */
  insight: string;
  /** Which category changed most significantly this week */
  primaryCategory: string | null;
  /** Percentage change in total emissions vs last period (positive = increase) */
  percentageChange: number | null;
}

/**
 * Generates a personalized one-sentence weekly insight by comparing the
 * user's current period emissions to a historical period.
 *
 * This is the key "Personalized Insights" feature of the problem statement,
 * synthesizing raw data into a single actionable sentence that tells the user
 * what changed, by how much, and what to do about it.
 *
 * Requires at least 3 entries in the current period for a meaningful output.
 * Falls back to an encouraging prompt if data is insufficient.
 *
 * @param current - Log entries from the current period (this week)
 * @param history - Log entries from the comparison period (last week)
 * @returns Structured insight result with the insight string and metadata
 *
 * @example
 * // Transport down, food up:
 * generateWeeklyInsight(currentEntries, lastWeekEntries)
 * // \u2192 { insight: "Transport \u2193 12% but Food \u2191 8% \u2014 try one more vegetarian meal...", ... }
 *
 * // Not enough data:
 * generateWeeklyInsight([], [])
 * // \u2192 { hasSufficientData: false, insight: "Log at least 3 activities...", ... }
 */
export function generateWeeklyInsight(
  current: LogEntry[],
  history: LogEntry[]
): WeeklyInsightResult {
  if (current.length < WEEKLY_INSIGHT_MINIMUM_ENTRIES) {
    return {
      hasSufficientData: false,
      insight: `Log at least ${WEEKLY_INSIGHT_MINIMUM_ENTRIES} activities this week to unlock your personalized weekly insight.`,
      primaryCategory: null,
      percentageChange: null,
    };
  }

  const currentBreakdown = getCategoryBreakdown(current);
  const currentTotal = calculateDailyTotal(current);

  // No history to compare against
  if (history.length === 0) {
    const topCategory = getTopCategory(currentBreakdown);
    const comparison = generateRelatableComparison(currentTotal);
    return {
      hasSufficientData: true,
      insight: `This week your biggest emission source is ${topCategory} (${comparison} total). Keep logging to unlock trend comparisons next week!`,
      primaryCategory: topCategory,
      percentageChange: null,
    };
  }

  const historyBreakdown = getCategoryBreakdown(history);
  const historyTotal = calculateDailyTotal(history);

  // Calculate total change
  const totalChange =
    historyTotal > 0
      ? ((currentTotal - historyTotal) / historyTotal) * 100
      : 0;

  // Find the category with the biggest absolute change
  const categories: Array<keyof typeof currentBreakdown> = [
    'transport',
    'energy',
    'food',
    'waste',
  ];

  let biggestChangeCategory: string = 'transport';
  let biggestChangeAbs = 0;

  for (const cat of categories) {
    const prev = historyBreakdown[cat];
    const curr = currentBreakdown[cat];
    const change = Math.abs(curr - prev);
    if (change > biggestChangeAbs) {
      biggestChangeAbs = change;
      biggestChangeCategory = cat;
    }
  }

  const catCurrent = currentBreakdown[biggestChangeCategory as keyof typeof currentBreakdown];
  const catHistory = historyBreakdown[biggestChangeCategory as keyof typeof historyBreakdown];
  const catChange =
    catHistory > 0 ? ((catCurrent - catHistory) / catHistory) * 100 : 0;

  const catLabel =
    biggestChangeCategory.charAt(0).toUpperCase() +
    biggestChangeCategory.slice(1);

  // Generate the insight sentence
  let insight: string;

  if (Math.abs(totalChange) < STEADY_STATE_THRESHOLD_PERCENT) {
    // No significant change
    insight = `Your emissions stayed steady this week (${Math.abs(totalChange).toFixed(0)}% change). ${catLabel} remains your top category \u2014 small consistent actions compound over time.`;
  } else if (totalChange < 0) {
    // Improvement
    const saved = (historyTotal - currentTotal).toFixed(1);
    insight = `Great progress! Your total emissions dropped ${Math.abs(totalChange).toFixed(0)}% this week, saving ~${saved} kg CO2e. ${catLabel} led the improvement${getFollowUpTip(biggestChangeCategory, catChange)}.`;
  } else {
    // Regression
    const increase = (currentTotal - historyTotal).toFixed(1);
    insight = `Your emissions rose ${totalChange.toFixed(0)}% this week (+${increase} kg CO2e), mainly from ${catLabel}${getFollowUpTip(biggestChangeCategory, catChange)}.`;
  }

  return {
    hasSufficientData: true,
    insight,
    primaryCategory: biggestChangeCategory,
    percentageChange: Math.round(totalChange * 10) / 10,
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Returns the category name with the highest emissions from a breakdown object.
 *
 * @param breakdown - Category emissions breakdown
 * @returns The category name with the highest emissions total
 */
function getTopCategory(breakdown: {
  transport: number;
  energy: number;
  food: number;
  waste: number;
}): string {
  const entries = Object.entries(breakdown) as Array<[string, number]>;
  const top = entries.reduce(
    (best, curr) => (curr[1] > best[1] ? curr : best),
    entries[0] ?? ['transport', 0]
  );
  return top[0].charAt(0).toUpperCase() + top[0].slice(1);
}

/**
 * Returns a concise actionable follow-up tip for a given category and change direction.
 *
 * @param category - The emission category to generate a tip for
 * @param changePercent - The percentage change (positive = increase, negative = decrease)
 * @returns A short follow-up string to append to the insight sentence
 */
function getFollowUpTip(category: string, changePercent: number): string {
  if (changePercent >= 0) {
    // Regression tips
    const tips: Record<string, string> = {
      transport: ' \u2014 try swapping one car trip for public transport',
      energy: ' \u2014 check for devices left on standby overnight',
      food: ' \u2014 try one more vegetarian meal to offset it',
      waste: ' \u2014 sorting more recyclables could help',
    };
    return tips[category] ?? '';
  }
  // Improvement: positive reinforcement
  return ' \u2014 keep it up!';
}
