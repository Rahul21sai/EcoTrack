/**
 * EcoTrack Carbon Calculation Engine
 *
 * Pure, deterministic functions for calculating carbon emissions, validating
 * input, generating recommendations, and formatting output. Every function
 * is side-effect-free and fully unit-testable.
 *
 * Emission factors sourced from:
 *   - UK DEFRA Greenhouse Gas Reporting Conversion Factors (2023)
 *   - US EPA Emission Factors Hub & eGRID
 *   - ICAO Carbon Emissions Calculator
 *   - Poore & Nemecek (2018), Science 360(6392)
 *   - US EPA WARM Model
 *
 * @module carbonEngine
 */

import type {
  TransportMode,
  EnergyType,
  MealType,
  WasteType,
  LogEntry,
  ValidationResult,
  ComparisonResult,
  Recommendation,
  ImpactLevel,
  CategoryBreakdown,
} from '../types';

import {
  TRANSPORT_EMISSION_FACTORS,
  ENERGY_EMISSION_FACTORS,
  FOOD_EMISSION_FACTORS,
  WASTE_EMISSION_FACTORS,
  NATIONAL_AVERAGES,
  IMPACT_THRESHOLDS,
  TRANSPORT_DOMINANCE_THRESHOLD,
  CAR_USAGE_THRESHOLD,
  MEAT_HEAVY_THRESHOLD,
  DEFAULT_COUNTRY,
} from './constants';

// ── Transport ────────────────────────────────────────────────────────────────

/**
 * Calculate CO2e emissions for a transport journey.
 *
 * @param mode - The transport mode (e.g., 'car_petrol', 'bus', 'bicycle')
 * @param km - Distance traveled in kilometers
 * @returns Emissions in kg CO2e
 * @throws {Error} If km is negative
 *
 * @example
 * calculateTransportEmission('car_petrol', 100) // → 19.2 kg CO2e
 * calculateTransportEmission('bicycle', 50)     // → 0 kg CO2e
 *
 * Factor source: DEFRA 2023 — Table: Passenger vehicles, by fuel & size
 */
export function calculateTransportEmission(
  mode: TransportMode,
  km: number
): number {
  if (km < 0) {
    throw new Error('Distance cannot be negative');
  }
  const factor = TRANSPORT_EMISSION_FACTORS[mode];
  return factor * km;
}

// ── Energy ───────────────────────────────────────────────────────────────────

/**
 * Calculate CO2e emissions for energy consumption.
 *
 * @param type - The energy source type ('electricity' or 'natural_gas')
 * @param kwh - Energy consumed in kilowatt-hours
 * @returns Emissions in kg CO2e
 * @throws {Error} If kwh is negative
 *
 * @example
 * calculateEnergyEmission('electricity', 10) // → 4.75 kg CO2e
 *
 * Factor source: EPA eGRID (electricity), DEFRA 2023 (natural gas)
 */
export function calculateEnergyEmission(type: EnergyType, kwh: number): number {
  if (kwh < 0) {
    throw new Error('Energy consumption cannot be negative');
  }
  const factor = ENERGY_EMISSION_FACTORS[type];
  return factor * kwh;
}

// ── Food ─────────────────────────────────────────────────────────────────────

/**
 * Calculate CO2e emissions for food consumption.
 *
 * @param mealType - The meal type ('meat_heavy', 'vegetarian', etc.)
 * @param count - Number of meals consumed
 * @returns Emissions in kg CO2e
 * @throws {Error} If count is negative
 *
 * @example
 * calculateFoodEmission('meat_heavy', 1) // → 7.2 kg CO2e
 * calculateFoodEmission('vegan', 3)      // → 4.5 kg CO2e
 *
 * Factor source: Poore & Nemecek (2018), Science 360(6392)
 */
export function calculateFoodEmission(
  mealType: MealType,
  count: number
): number {
  if (count < 0) {
    throw new Error('Meal count cannot be negative');
  }
  const factor = FOOD_EMISSION_FACTORS[mealType];
  return factor * count;
}

// ── Waste ────────────────────────────────────────────────────────────────────

/**
 * Calculate CO2e emissions for waste disposal.
 *
 * @param type - The waste disposal method ('landfill', 'recycled', 'composted')
 * @param kg - Weight of waste in kilograms
 * @returns Emissions in kg CO2e
 * @throws {Error} If kg is negative
 *
 * @example
 * calculateWasteEmission('landfill', 5) // → 2.9 kg CO2e
 *
 * Factor source: US EPA WARM Model
 */
export function calculateWasteEmission(type: WasteType, kg: number): number {
  if (kg < 0) {
    throw new Error('Waste weight cannot be negative');
  }
  const factor = WASTE_EMISSION_FACTORS[type];
  return factor * kg;
}

// ── Aggregation ──────────────────────────────────────────────────────────────

/**
 * Calculate the total CO2e emissions for a set of log entries.
 * Dispatches to the appropriate category calculator for each entry.
 *
 * @param entries - Array of log entries for a single day
 * @returns Total emissions in kg CO2e
 *
 * @example
 * calculateDailyTotal([
 *   { category: 'transport', mode: 'car_petrol', value: 10, unit: 'km' },
 *   { category: 'energy', mode: 'electricity', value: 5, unit: 'kwh' },
 * ]) // → 4.295 kg CO2e
 */
export function calculateDailyTotal(entries: LogEntry[]): number {
  return entries.reduce((total, entry) => {
    return total + calculateEntryEmission(entry);
  }, 0);
}

/**
 * Calculate emission for a single log entry by dispatching to the
 * appropriate category-specific calculator.
 *
 * @param entry - A single log entry
 * @returns Emissions in kg CO2e, or 0 if category is unrecognized
 */
function calculateEntryEmission(entry: LogEntry): number {
  switch (entry.category) {
    case 'transport':
      return calculateTransportEmission(
        entry.mode as TransportMode,
        entry.value
      );
    case 'energy':
      return calculateEnergyEmission(entry.mode as EnergyType, entry.value);
    case 'food':
      return calculateFoodEmission(entry.mode as MealType, entry.value);
    case 'waste':
      return calculateWasteEmission(entry.mode as WasteType, entry.value);
    default:
      return 0;
  }
}

/**
 * Calculate the average daily CO2e emissions over a set of daily totals.
 *
 * @param dailyTotals - Array of daily emission totals in kg CO2e
 * @returns Average daily emissions in kg CO2e, or 0 for empty arrays
 *
 * @example
 * calculateWeeklyAverage([10, 20, 30]) // → 20
 */
export function calculateWeeklyAverage(dailyTotals: number[]): number {
  if (dailyTotals.length === 0) {
    return 0;
  }
  const sum = dailyTotals.reduce((acc, val) => acc + val, 0);
  return sum / dailyTotals.length;
}

// ── Comparison ───────────────────────────────────────────────────────────────

/**
 * Compare a user's daily emissions to their country's national average.
 *
 * @param userDaily - User's daily emission total in kg CO2e
 * @param country - Country code (e.g., 'USA', 'UK', 'India')
 * @returns Comparison result with status, values, and percentage difference
 *
 * @example
 * compareToNationalAverage(50, 'USA')
 * // → { status: 'above', userDaily: 50, nationalAverage: 44.0, ... }
 *
 * Data source: Global Carbon Project 2023, per-capita annual ÷ 365
 */
export function compareToNationalAverage(
  userDaily: number,
  country: string
): ComparisonResult {
  const avgData = NATIONAL_AVERAGES[country] || NATIONAL_AVERAGES[DEFAULT_COUNTRY];
  const nationalAverage = avgData.dailyAverageKg;
  const difference = userDaily - nationalAverage;
  const percentageDifference =
    nationalAverage > 0 ? (difference / nationalAverage) * 100 : 0;

  let status: 'above' | 'below' | 'average';
  if (difference > nationalAverage * 0.05) {
    status = 'above';
  } else if (difference < -nationalAverage * 0.05) {
    status = 'below';
  } else {
    status = 'average';
  }

  return {
    status,
    userDaily,
    nationalAverage,
    percentageDifference,
    country: avgData.country,
  };
}

// ── Validation ───────────────────────────────────────────────────────────────

/**
 * Validate a log entry for completeness, type safety, and business rules.
 * This provides client-side validation; Firestore Security Rules provide
 * server-side defense-in-depth validation independently.
 *
 * @param entry - The log entry to validate
 * @returns Validation result with boolean status and array of error messages
 *
 * @example
 * validateLogEntry({ category: 'transport', mode: 'car_petrol', value: -5, unit: 'km', date: '2026-01-01' })
 * // → { valid: false, errors: ['Value must be non-negative'] }
 */
export function validateLogEntry(entry: LogEntry): ValidationResult {
  const errors: string[] = [];

  // Category is required and must be one of the known categories
  const validCategories = ['transport', 'energy', 'food', 'waste'];
  if (!entry.category || !validCategories.includes(entry.category)) {
    errors.push('Category is required and must be transport, energy, food, or waste');
  }

  // Mode is required
  if (!entry.mode) {
    errors.push('Mode is required');
  }

  // Value must be a non-negative number
  if (typeof entry.value !== 'number' || isNaN(entry.value)) {
    errors.push('Value must be a valid number');
  } else if (entry.value < 0) {
    errors.push('Value must be non-negative');
  } else if (entry.value >= 100000) {
    errors.push('Value must be less than 100,000');
  }

  // Unit is required
  if (!entry.unit) {
    errors.push('Unit is required');
  }

  // Date validation — must not be in the future
  if (entry.date) {
    if (!validateDateNotFuture(entry.date)) {
      errors.push('Date cannot be in the future');
    }
  }

  // Validate mode matches category
  if (entry.category && entry.mode) {
    const validModes: Record<string, string[]> = {
      transport: [
        'car_petrol', 'car_diesel', 'car_electric',
        'bus', 'train', 'flight_short', 'flight_long',
        'bicycle', 'walk',
      ],
      energy: ['electricity', 'natural_gas'],
      food: ['meat_heavy', 'meat_light', 'vegetarian', 'vegan'],
      waste: ['landfill', 'recycled', 'composted'],
    };
    const modesForCategory = validModes[entry.category];
    if (modesForCategory && !modesForCategory.includes(entry.mode)) {
      errors.push(`Invalid mode '${entry.mode}' for category '${entry.category}'`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ── Impact Categorization ────────────────────────────────────────────────────

/**
 * Categorize a daily emission total into an impact level.
 *
 * Thresholds (kg CO2e per day):
 *   ≤ 8   → 'low'       (below global daily average)
 *   ≤ 16  → 'moderate'  (around global average)
 *   ≤ 30  → 'high'      (significantly above average)
 *   > 30  → 'very-high' (urgent reduction needed)
 *
 * @param totalKg - Total daily emissions in kg CO2e
 * @returns Impact level string
 */
export function categorizeImpact(totalKg: number): ImpactLevel {
  if (totalKg <= IMPACT_THRESHOLDS.LOW_MAX) {
    return 'low';
  }
  if (totalKg <= IMPACT_THRESHOLDS.MODERATE_MAX) {
    return 'moderate';
  }
  if (totalKg <= IMPACT_THRESHOLDS.HIGH_MAX) {
    return 'high';
  }
  return 'very-high';
}

// ── Recommendation Engine ────────────────────────────────────────────────────

/**
 * Generate personalized, actionable carbon reduction recommendations
 * based on the user's logged entries and historical data.
 *
 * This is a RULE-BASED engine — deterministic, explainable, zero-latency,
 * zero API cost, and fully unit-testable. Each recommendation includes an
 * estimated CO2e savings value calculated from the user's actual data.
 *
 * Design decision: A rule-based engine was chosen over an LLM API because:
 *   1. Explainability — each recommendation can be traced to a specific rule
 *   2. Zero latency — no network call needed
 *   3. Zero cost — no API key or billing required
 *   4. Security — no user data sent to third-party services
 *   5. Testability — deterministic output for given input
 *
 * @param entries - Current period's log entries
 * @param history - Previous entries for trend analysis
 * @returns Array of recommendations sorted by estimated savings (highest first)
 */
export function generateRecommendations(
  entries: LogEntry[],
  history: LogEntry[]
): Recommendation[] {
  if (entries.length === 0) {
    return [];
  }

  const recommendations: Recommendation[] = [];
  const breakdown = getCategoryBreakdown(entries);
  const total = breakdown.transport + breakdown.energy + breakdown.food + breakdown.waste;

  if (total === 0) {
    return [];
  }

  // ── Rule 1: Transport dominates + frequent car use ──
  const transportPct = breakdown.transport / total;
  const carEntries = entries.filter(
    (e) =>
      e.category === 'transport' &&
      (e.mode === 'car_petrol' || e.mode === 'car_diesel')
  );

  if (
    transportPct > TRANSPORT_DOMINANCE_THRESHOLD &&
    carEntries.length >= CAR_USAGE_THRESHOLD
  ) {
    const avgCarKm =
      carEntries.reduce((sum, e) => sum + e.value, 0) / carEntries.length;
    const carEmissionPerTrip = calculateTransportEmission(
      'car_petrol',
      avgCarKm
    );
    const busEmissionPerTrip = calculateTransportEmission('bus', avgCarKm);
    const savingsPerTrip = carEmissionPerTrip - busEmissionPerTrip;
    const estimatedSavingsKg = savingsPerTrip * 2; // Suggest swapping 2 trips

    recommendations.push({
      title: 'Try public transport twice this week',
      description: `Your transport emissions make up ${Math.round(transportPct * 100)}% of your total. Swapping 2 car trips (avg ${avgCarKm.toFixed(1)}km) to bus would save approximately ${estimatedSavingsKg.toFixed(1)} kg CO2e.`,
      estimatedSavingsKg,
      difficulty: 'easy',
      category: 'transport',
    });
  }

  // ── Rule 2: Heavy meat consumption ──
  const meatHeavyEntries = entries.filter(
    (e) => e.category === 'food' && e.mode === 'meat_heavy'
  );
  const totalMeatHeavyMeals = meatHeavyEntries.reduce(
    (sum, e) => sum + e.value,
    0
  );

  if (totalMeatHeavyMeals >= MEAT_HEAVY_THRESHOLD) {
    const savingsPerSwap =
      calculateFoodEmission('meat_heavy', 1) -
      calculateFoodEmission('vegetarian', 1);
    const estimatedSavingsKg = savingsPerSwap * 2; // Swap 2 meals

    recommendations.push({
      title: 'Swap 2 meat meals for vegetarian this week',
      description: `You logged ${totalMeatHeavyMeals} heavy meat meals. Each swap from meat to vegetarian saves ${savingsPerSwap.toFixed(1)} kg CO2e. That's because beef production requires ~20x more land and generates ~6x more greenhouse gases than plant-based alternatives.`,
      estimatedSavingsKg,
      difficulty: 'moderate',
      category: 'food',
    });
  }

  // ── Rule 3: Energy trending upward ──
  if (history.length > 0) {
    const historyEnergy = history
      .filter((e) => e.category === 'energy')
      .reduce((sum, e) => sum + calculateEntryEmission(e), 0);
    const currentEnergy = entries
      .filter((e) => e.category === 'energy')
      .reduce((sum, e) => sum + calculateEntryEmission(e), 0);

    if (currentEnergy > historyEnergy && historyEnergy > 0) {
      const increase = currentEnergy - historyEnergy;
      recommendations.push({
        title: 'Check for always-on devices',
        description: `Your electricity use rose ${increase.toFixed(1)} kg CO2e vs last period. Common culprits: space heaters left on, old refrigerators, standby electronics. Unplugging idle devices can cut standby power by 5-10%.`,
        estimatedSavingsKg: increase * 0.3, // Estimate 30% recoverable
        difficulty: 'easy',
        category: 'energy',
      });
    }
  }

  // ── Rule 4: Landfill > Recycled ──
  const landfillEntries = entries.filter(
    (e) => e.category === 'waste' && e.mode === 'landfill'
  );
  const recycledEntries = entries.filter(
    (e) => e.category === 'waste' && e.mode === 'recycled'
  );
  const totalLandfill = landfillEntries.reduce((sum, e) => sum + e.value, 0);
  const totalRecycled = recycledEntries.reduce((sum, e) => sum + e.value, 0);

  if (totalLandfill > totalRecycled && totalLandfill > 0) {
    const potentialDivertKg = totalLandfill * 0.5; // Divert half
    const savingsPerKg =
      calculateWasteEmission('landfill', 1) -
      calculateWasteEmission('recycled', 1);
    const estimatedSavingsKg = savingsPerKg * potentialDivertKg;

    recommendations.push({
      title: 'Increase your recycling rate',
      description: `You're sending ${totalLandfill.toFixed(1)} kg to landfill but only recycling ${totalRecycled.toFixed(1)} kg. Landfill waste generates methane — a greenhouse gas 80x more potent than CO2 over 20 years. Try sorting recyclables into separate bins.`,
      estimatedSavingsKg,
      difficulty: 'easy',
      category: 'waste',
    });
  }

  // ── Rule 5: General transport — consider cycling/walking for short trips ──
  const shortCarTrips = carEntries.filter((e) => e.value <= 5); // ≤ 5km
  if (shortCarTrips.length >= 2) {
    const totalShortKm = shortCarTrips.reduce((sum, e) => sum + e.value, 0);
    const estimatedSavingsKg = calculateTransportEmission('car_petrol', totalShortKm);

    recommendations.push({
      title: 'Walk or cycle for short trips',
      description: `You made ${shortCarTrips.length} car trips under 5km. Walking or cycling these ${totalShortKm.toFixed(1)}km would eliminate ${estimatedSavingsKg.toFixed(1)} kg CO2e entirely — plus you'd get health benefits!`,
      estimatedSavingsKg,
      difficulty: 'moderate',
      category: 'transport',
    });
  }

  // ── Rule 6: Food — try vegan meals ──
  const meatLightEntries = entries.filter(
    (e) => e.category === 'food' && e.mode === 'meat_light'
  );
  const totalMeatLightMeals = meatLightEntries.reduce(
    (sum, e) => sum + e.value,
    0
  );
  if (totalMeatLightMeals >= 3 && totalMeatHeavyMeals < MEAT_HEAVY_THRESHOLD) {
    const savingsPerSwap =
      calculateFoodEmission('meat_light', 1) -
      calculateFoodEmission('vegan', 1);
    const estimatedSavingsKg = savingsPerSwap * 2;

    recommendations.push({
      title: 'Try a couple of vegan meals this week',
      description: `You logged ${totalMeatLightMeals} light meat meals. Swapping 2 for vegan options would save ${estimatedSavingsKg.toFixed(1)} kg CO2e. Plant-based proteins (lentils, beans, tofu) have a fraction of the carbon footprint of even poultry.`,
      estimatedSavingsKg,
      difficulty: 'easy',
      category: 'food',
    });
  }

  // Sort by estimated savings descending (highest impact first)
  recommendations.sort((a, b) => b.estimatedSavingsKg - a.estimatedSavingsKg);

  return recommendations;
}

// ── Reduction Potential ──────────────────────────────────────────────────────

/**
 * Calculate the CO2e reduction potential if a recommendation is followed.
 *
 * @param current - Current log entries
 * @param recommendation - The recommendation being evaluated
 * @returns Estimated reduction in kg CO2e
 */
export function calculateReductionPotential(
  current: LogEntry[],
  recommendation: Recommendation
): number {
  const categoryEntries = current.filter(
    (e) => e.category === recommendation.category
  );
  const currentEmissions = categoryEntries.reduce(
    (sum, e) => sum + calculateEntryEmission(e),
    0
  );

  // The reduction potential is the minimum of the estimated savings and
  // the current emissions in that category (can't save more than you emit)
  return Math.min(recommendation.estimatedSavingsKg, currentEmissions);
}

// ── Streak ───────────────────────────────────────────────────────────────────

/**
 * Calculate the current consecutive-day logging streak.
 * Counts backwards from the most recent date to find unbroken runs.
 *
 * @param logDates - Array of ISO date strings (YYYY-MM-DD) when entries were logged
 * @returns Number of consecutive days logged (0 if empty)
 *
 * @example
 * calculateStreak(['2026-01-01', '2026-01-02', '2026-01-03']) // → 3
 * calculateStreak(['2026-01-01', '2026-01-03'])                // → 1
 */
export function calculateStreak(logDates: string[]): number {
  if (logDates.length === 0) {
    return 0;
  }

  // Deduplicate and sort dates descending
  const uniqueDates = [...new Set(logDates)].sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  let streak = 1;
  for (let i = 0; i < uniqueDates.length - 1; i++) {
    const currentDate = new Date(uniqueDates[i]);
    const nextDate = new Date(uniqueDates[i + 1]);
    const diffMs = currentDate.getTime() - nextDate.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

// ── Carbon Saved ─────────────────────────────────────────────────────────────

/**
 * Calculate the carbon saved compared to a baseline.
 * Returns 0 if current emissions exceed the baseline (no negative savings).
 *
 * @param baseline - Baseline emission level in kg CO2e
 * @param current - Current emission level in kg CO2e
 * @returns Carbon saved in kg CO2e (always ≥ 0)
 *
 * @example
 * calculateCarbonSaved(50, 30) // → 20
 * calculateCarbonSaved(30, 50) // → 0 (no negative savings)
 */
export function calculateCarbonSaved(
  baseline: number,
  current: number
): number {
  return Math.max(0, baseline - current);
}

// ── Formatting ───────────────────────────────────────────────────────────────

/**
 * Format a carbon emission value for display.
 * Values under 1000 kg are shown in kg; values ≥ 1000 kg are shown in tonnes.
 *
 * @param kg - Emission value in kg CO2e
 * @returns Formatted string with unit (e.g., "2.4 kg CO2e" or "1.5 t CO2e")
 *
 * @example
 * formatCarbonValue(2.4)   // → "2.4 kg CO2e"
 * formatCarbonValue(1500)  // → "1.5 t CO2e"
 */
export function formatCarbonValue(kg: number): string {
  if (kg >= 1000) {
    return `${(kg / 1000).toFixed(1)} t CO2e`;
  }
  return `${Number(kg.toFixed(1))} kg CO2e`;
}

// ── Input Sanitization ───────────────────────────────────────────────────────

/**
 * Sanitize and parse a numeric input string. Rejects non-numeric values,
 * HTML/script injection attempts, and negative numbers.
 *
 * This is a defense-in-depth measure — Firestore Security Rules also validate
 * data types and bounds server-side.
 *
 * @param value - Raw string input from the user
 * @returns Parsed non-negative number, or null if invalid/malicious
 *
 * @example
 * sanitizeNumericInput('42.5')                      // → 42.5
 * sanitizeNumericInput('abc')                        // → null
 * sanitizeNumericInput('<script>5</script>')         // → null
 * sanitizeNumericInput('-5')                         // → null
 */
export function sanitizeNumericInput(value: string): number | null {
  // Reject strings containing HTML tags (injection attempt)
  if (/<[^>]*>/i.test(value)) {
    return null;
  }

  // Trim whitespace
  const trimmed = value.trim();

  // Reject empty strings
  if (trimmed === '') {
    return null;
  }

  // Reject negative numbers
  if (trimmed.startsWith('-')) {
    return null;
  }

  // Parse as float
  const parsed = parseFloat(trimmed);

  // Reject NaN and Infinity
  if (isNaN(parsed) || !isFinite(parsed)) {
    return null;
  }

  return parsed;
}

// ── Date Validation ──────────────────────────────────────────────────────────

/**
 * Validate that a date string is not in the future.
 *
 * @param date - ISO 8601 date string (YYYY-MM-DD)
 * @returns true if the date is today or in the past, false if in the future
 *
 * @example
 * validateDateNotFuture('2026-01-01') // → true (if today is ≥ 2026-01-01)
 * validateDateNotFuture('2099-01-01') // → false
 */
export function validateDateNotFuture(date: string): boolean {
  const inputDate = new Date(date);

  // Invalid date string
  if (isNaN(inputDate.getTime())) {
    return false;
  }

  const today = new Date();
  // Compare date parts only (ignore time)
  today.setHours(23, 59, 59, 999);

  return inputDate <= today;
}

// ── Category Breakdown ───────────────────────────────────────────────────────

/**
 * Group log entries by category and calculate total emissions for each.
 *
 * @param entries - Array of log entries
 * @returns Object with emission totals for each category in kg CO2e
 *
 * @example
 * getCategoryBreakdown([
 *   { category: 'transport', mode: 'car_petrol', value: 10, unit: 'km' },
 *   { category: 'food', mode: 'vegan', value: 1, unit: 'meal' },
 * ])
 * // → { transport: 1.92, energy: 0, food: 1.5, waste: 0 }
 */
export function getCategoryBreakdown(entries: LogEntry[]): CategoryBreakdown {
  const breakdown: CategoryBreakdown = {
    transport: 0,
    energy: 0,
    food: 0,
    waste: 0,
  };

  for (const entry of entries) {
    const emission = calculateEntryEmission(entry);
    if (entry.category in breakdown) {
      breakdown[entry.category as keyof CategoryBreakdown] += emission;
    }
  }

  return breakdown;
}
