/**
 * Barrel export for EcoTrack utility modules.
 *
 * Re-exports all public functions, types, and constants from utility modules
 * to simplify imports across the application.
 *
 * @module utils
 */

export {
  calculateTransportEmission,
  calculateEnergyEmission,
  calculateFoodEmission,
  calculateWasteEmission,
  calculateDailyTotal,
  calculateWeeklyAverage,
  calculateReductionPotential,
  calculateStreak,
  calculateCarbonSaved,
  compareToNationalAverage,
  validateLogEntry,
  categorizeImpact,
  generateRecommendations,
  formatCarbonValue,
  sanitizeNumericInput,
  validateDateNotFuture,
  getCategoryBreakdown,
} from './carbonEngine';

export {
  generateRelatableComparison,
  generateWeeklyInsight,
} from './insights';

export type { WeeklyInsightResult } from './insights';

export {
  getCachedEntries,
  setCachedEntries,
  clearUserCache,
  clearAllCache,
} from './cache';

export {
  stripHTML,
  sanitizeTextInput,
  isCleanOfHTML,
} from './sanitize';

export {
  ValidationError,
  CarbonCalculationError,
  FirestoreServiceError,
} from './errors';

export { getCategoryIcon } from './categoryIcons';

export {
  TRANSPORT_EMISSION_FACTORS,
  ENERGY_EMISSION_FACTORS,
  FOOD_EMISSION_FACTORS,
  WASTE_EMISSION_FACTORS,
  EMISSION_FACTORS,
  NATIONAL_AVERAGES,
  DEFAULT_COUNTRY,
  IMPACT_THRESHOLDS,
  CATEGORIES,
  TRANSPORT_MODE_LABELS,
  ENERGY_TYPE_LABELS,
  MEAL_TYPE_LABELS,
  WASTE_TYPE_LABELS,
  MAX_ENTRIES_PER_DAY,
  SUBMIT_COOLDOWN_MS,
  INPUT_DEBOUNCE_MS,
  ENTRIES_PER_PAGE,
  CACHE_TTL_MS,
  CACHE_KEY_PREFIX,
  TRANSPORT_DOMINANCE_THRESHOLD,
  CAR_USAGE_THRESHOLD,
  MEAT_HEAVY_THRESHOLD,
  STREAK_CONGRATULATION_THRESHOLD,
  COMPARISON_THRESHOLD_PERCENT,
  ENERGY_RECOVERY_FACTOR,
  WASTE_DIVERSION_FACTOR,
  SHORT_TRIP_KM_MAX,
  VEGAN_SUGGESTION_THRESHOLD,
  MAX_INPUT_VALUE,
  TREND_DAYS_LIMIT,
  WEEKLY_INSIGHT_MINIMUM_ENTRIES,
  STEADY_STATE_THRESHOLD_PERCENT,
  RECOMMENDED_SWAPS,
} from './constants';

export type { CategoryMeta } from './constants';
