/**
 * EcoTrack Constants
 *
 * Central configuration for emission factors, national averages, and category metadata.
 * All emission factors are sourced from publicly available data and cited below.
 */

import type {
  TransportMode,
  EnergyType,
  MealType,
  WasteType,
  EmissionCategory,
  NationalAverageData,
} from '../types';

// ── Transport Emission Factors (kg CO2e per km) ─────────────────────────────
// Sources:
//   - UK DEFRA Greenhouse Gas Reporting Conversion Factors (2023)
//   - US EPA Emission Factors Hub
//   - ICAO Carbon Emissions Calculator methodology
// ─────────────────────────────────────────────────────────────────────────────

export const TRANSPORT_EMISSION_FACTORS: Record<TransportMode, number> = {
  car_petrol: 0.192, // Average petrol car, ~1.4L engine, single occupancy
  car_diesel: 0.171, // Average diesel car, single occupancy
  car_electric: 0.053, // BEV using grid-average electricity
  bus: 0.105, // Urban bus, average occupancy
  train: 0.041, // National rail, average occupancy
  flight_short: 0.255, // Short-haul flight < 1500km, economy class
  flight_long: 0.15, // Long-haul flight > 1500km, economy class, per km
  bicycle: 0, // Zero direct emissions
  walk: 0, // Zero direct emissions
} as const;

// ── Energy Emission Factors (kg CO2e per kWh) ───────────────────────────────
// Sources:
//   - US EPA eGRID (grid-average electricity)
//   - UK DEFRA natural gas conversion factor
// ─────────────────────────────────────────────────────────────────────────────

export const ENERGY_EMISSION_FACTORS: Record<EnergyType, number> = {
  electricity: 0.475, // Grid average — configurable by region
  natural_gas: 0.202, // Natural gas combustion
} as const;

// ── Food Emission Factors (kg CO2e per meal) ────────────────────────────────
// Sources:
//   - Poore & Nemecek (2018), "Reducing food's environmental impacts through
//     producers and consumers", Science 360(6392)
//   - Our World in Data food carbon footprint estimates
// ─────────────────────────────────────────────────────────────────────────────

export const FOOD_EMISSION_FACTORS: Record<MealType, number> = {
  meat_heavy: 7.2, // Beef/lamb-dominant meal
  meat_light: 3.8, // Poultry/pork-dominant meal
  vegetarian: 2.0, // Dairy/eggs, no meat
  vegan: 1.5, // Plant-based only
} as const;

// ── Waste Emission Factors (kg CO2e per kg waste) ───────────────────────────
// Sources:
//   - US EPA WARM Model (Waste Reduction Model)
//   - DEFRA waste emission factors
// ─────────────────────────────────────────────────────────────────────────────

export const WASTE_EMISSION_FACTORS: Record<WasteType, number> = {
  landfill: 0.58, // Mixed waste to landfill (methane generation)
  recycled: 0.21, // Mixed recyclables (processing emissions)
  composted: 0.06, // Organic waste composting
} as const;

// ── Combined Emission Factors Lookup ─────────────────────────────────────────

export const EMISSION_FACTORS = {
  transport: TRANSPORT_EMISSION_FACTORS,
  energy: ENERGY_EMISSION_FACTORS,
  food: FOOD_EMISSION_FACTORS,
  waste: WASTE_EMISSION_FACTORS,
} as const;

// ── National Averages (kg CO2e per person per day) ──────────────────────────
// Sources:
//   - Global Carbon Project (2023)
//   - World Bank CO2 emissions per capita, divided by 365
//   - Our World in Data per-capita emissions
// ─────────────────────────────────────────────────────────────────────────────

export const NATIONAL_AVERAGES: Record<string, NationalAverageData> = {
  USA: {
    country: 'USA',
    dailyAverageKg: 44.0, // ~16.1 tonnes/year ÷ 365
    source: 'Global Carbon Project 2023',
  },
  UK: {
    country: 'UK',
    dailyAverageKg: 14.0, // ~5.1 tonnes/year ÷ 365
    source: 'Global Carbon Project 2023',
  },
  India: {
    country: 'India',
    dailyAverageKg: 5.5, // ~2.0 tonnes/year ÷ 365
    source: 'Global Carbon Project 2023',
  },
  Germany: {
    country: 'Germany',
    dailyAverageKg: 21.4, // ~7.8 tonnes/year ÷ 365
    source: 'Global Carbon Project 2023',
  },
  China: {
    country: 'China',
    dailyAverageKg: 21.1, // ~7.7 tonnes/year ÷ 365
    source: 'Global Carbon Project 2023',
  },
  Australia: {
    country: 'Australia',
    dailyAverageKg: 41.1, // ~15.0 tonnes/year ÷ 365
    source: 'Global Carbon Project 2023',
  },
  Canada: {
    country: 'Canada',
    dailyAverageKg: 39.2, // ~14.3 tonnes/year ÷ 365
    source: 'Global Carbon Project 2023',
  },
  Global: {
    country: 'Global',
    dailyAverageKg: 12.3, // ~4.5 tonnes/year ÷ 365
    source: 'Global Carbon Project 2023',
  },
} as const;

// ── Default Country ──────────────────────────────────────────────────────────

export const DEFAULT_COUNTRY = 'Global';

// ── Impact Thresholds (kg CO2e per day) ──────────────────────────────────────
// Used by categorizeImpact() to classify daily emission totals.
// Based on per-capita daily averages: global avg ≈ 12.3 kg/day.
// ─────────────────────────────────────────────────────────────────────────────

export const IMPACT_THRESHOLDS = {
  LOW_MAX: 8, // ≤ 8 kg → 'low' (below global average)
  MODERATE_MAX: 16, // ≤ 16 kg → 'moderate' (around global average)
  HIGH_MAX: 30, // ≤ 30 kg → 'high' (above global average)
  // > 30 kg → 'very-high'
} as const;

// ── Category Metadata ────────────────────────────────────────────────────────

export interface CategoryMeta {
  /** Category identifier */
  id: EmissionCategory;
  /** Human-readable label */
  label: string;
  /** Description of this category */
  description: string;
  /** Unit of measurement for user input */
  unit: string;
  /** Emoji icon for visual representation */
  icon: string;
  /** Hex color for charts */
  color: string;
}

export const CATEGORIES: CategoryMeta[] = [
  {
    id: 'transport',
    label: 'Transport',
    description: 'Emissions from travel and commuting',
    unit: 'km',
    icon: '🚗',
    color: '#3B82F6', // Blue
  },
  {
    id: 'energy',
    label: 'Energy',
    description: 'Emissions from home electricity and gas usage',
    unit: 'kWh',
    icon: '⚡',
    color: '#F59E0B', // Amber
  },
  {
    id: 'food',
    label: 'Food',
    description: 'Emissions from food consumption',
    unit: 'meals',
    icon: '🍽️',
    color: '#10B981', // Emerald
  },
  {
    id: 'waste',
    label: 'Waste',
    description: 'Emissions from waste disposal',
    unit: 'kg',
    icon: '🗑️',
    color: '#EF4444', // Red
  },
] as const;

// ── Mode Labels (human-readable) ─────────────────────────────────────────────

export const TRANSPORT_MODE_LABELS: Record<TransportMode, string> = {
  car_petrol: 'Car (Petrol)',
  car_diesel: 'Car (Diesel)',
  car_electric: 'Car (Electric)',
  bus: 'Bus',
  train: 'Train',
  flight_short: 'Flight (Short-haul)',
  flight_long: 'Flight (Long-haul)',
  bicycle: 'Bicycle',
  walk: 'Walk',
};

export const ENERGY_TYPE_LABELS: Record<EnergyType, string> = {
  electricity: 'Electricity',
  natural_gas: 'Natural Gas',
};

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  meat_heavy: 'Heavy Meat Meal',
  meat_light: 'Light Meat Meal',
  vegetarian: 'Vegetarian Meal',
  vegan: 'Vegan Meal',
};

export const WASTE_TYPE_LABELS: Record<WasteType, string> = {
  landfill: 'Landfill',
  recycled: 'Recycled',
  composted: 'Composted',
};

// ── Rate Limiting Constants ──────────────────────────────────────────────────

/** Maximum number of log entries a user can submit per day (abuse prevention) */
export const MAX_ENTRIES_PER_DAY = 50;

/** Cooldown period in milliseconds after submitting a log entry */
export const SUBMIT_COOLDOWN_MS = 2000;

/** Debounce delay for input validation in milliseconds */
export const INPUT_DEBOUNCE_MS = 300;

// ── Pagination ───────────────────────────────────────────────────────────────

/** Number of entries to fetch per Firestore query page */
export const ENTRIES_PER_PAGE = 30;

// ── Cache ────────────────────────────────────────────────────────────────────

/** Cache time-to-live in milliseconds (5 minutes) */
export const CACHE_TTL_MS = 5 * 60 * 1000;

/** LocalStorage key prefix for cached entries */
export const CACHE_KEY_PREFIX = 'ecotrack_cache_';

// ── Recommendation Thresholds ────────────────────────────────────────────────

/** Minimum percentage of total emissions for transport to trigger recommendation */
export const TRANSPORT_DOMINANCE_THRESHOLD = 0.4;

/** Minimum car uses per week to trigger public transport recommendation */
export const CAR_USAGE_THRESHOLD = 3;

/** Minimum meat-heavy meals per week to trigger diet recommendation */
export const MEAT_HEAVY_THRESHOLD = 5;

/** Streak length required to trigger congratulation */
export const STREAK_CONGRATULATION_THRESHOLD = 7;
