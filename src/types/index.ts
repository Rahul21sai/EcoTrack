/**
 * EcoTrack Type Definitions
 *
 * Central type definitions for the Carbon Footprint Awareness Platform.
 * All types are exported for use across the application.
 */

// ── Transport Modes ──────────────────────────────────────────────────────────

/** Available transport modes with associated emission factors */
export type TransportMode =
  | 'car_petrol'
  | 'car_diesel'
  | 'car_electric'
  | 'bus'
  | 'train'
  | 'flight_short'
  | 'flight_long'
  | 'bicycle'
  | 'walk';

// ── Energy Types ─────────────────────────────────────────────────────────────

/** Available energy source types */
export type EnergyType = 'electricity' | 'natural_gas';

// ── Meal Types ───────────────────────────────────────────────────────────────

/** Available meal types by carbon impact */
export type MealType = 'meat_heavy' | 'meat_light' | 'vegetarian' | 'vegan';

// ── Waste Types ──────────────────────────────────────────────────────────────

/** Available waste disposal methods */
export type WasteType = 'landfill' | 'recycled' | 'composted';

// ── Emission Categories ──────────────────────────────────────────────────────

/** Top-level emission categories */
export type EmissionCategory = 'transport' | 'energy' | 'food' | 'waste';

// ── Combined Mode Type ───────────────────────────────────────────────────────

/** Union of all sub-category modes */
export type EntryMode = TransportMode | EnergyType | MealType | WasteType;

// ── Impact Level ─────────────────────────────────────────────────────────────

/** Categorized impact level based on total emissions */
export type ImpactLevel = 'low' | 'moderate' | 'high' | 'very-high';

// ── Difficulty Level ─────────────────────────────────────────────────────────

/** Difficulty level for recommendations */
export type DifficultyLevel = 'easy' | 'moderate' | 'challenging';

// ── Log Entry ────────────────────────────────────────────────────────────────

/** A single carbon footprint log entry */
export interface LogEntry {
  /** Unique identifier (Firestore document ID) */
  id?: string;
  /** Top-level emission category */
  category: EmissionCategory | string;
  /** Specific mode within the category */
  mode: EntryMode | string;
  /** Numeric value (km, kWh, meals, kg depending on category) */
  value: number;
  /** Unit of measurement */
  unit: string;
  /** ISO 8601 date string (YYYY-MM-DD) */
  date?: string;
  /** Timestamp when entry was created */
  createdAt?: string;
  /** Firebase user ID who owns this entry */
  userId?: string;
}

// ── Validation ───────────────────────────────────────────────────────────────

/** Result of validating a log entry */
export interface ValidationResult {
  /** Whether the entry is valid */
  valid: boolean;
  /** List of validation error messages */
  errors: string[];
}

// ── Comparison ───────────────────────────────────────────────────────────────

/** Status of comparison to national average */
export type ComparisonStatus = 'above' | 'below' | 'average';

/** Result of comparing user emissions to national average */
export interface ComparisonResult {
  /** Whether user is above, below, or at the national average */
  status: ComparisonStatus;
  /** User's daily emission in kg CO2e */
  userDaily: number;
  /** National average daily emission in kg CO2e */
  nationalAverage: number;
  /** Percentage difference from national average */
  percentageDifference: number;
  /** Country used for comparison */
  country: string;
}

// ── Recommendation ───────────────────────────────────────────────────────────

/** A personalized carbon reduction recommendation */
export interface Recommendation {
  /** Short title for the recommendation */
  title: string;
  /** Detailed description with context */
  description: string;
  /** Estimated CO2e savings in kg if followed */
  estimatedSavingsKg: number;
  /** How difficult the recommendation is to follow */
  difficulty: DifficultyLevel;
  /** Which emission category this recommendation targets */
  category: EmissionCategory;
}

// ── Category Breakdown ───────────────────────────────────────────────────────

/** Emission totals broken down by category */
export interface CategoryBreakdown {
  /** Total transport emissions in kg CO2e */
  transport: number;
  /** Total energy emissions in kg CO2e */
  energy: number;
  /** Total food emissions in kg CO2e */
  food: number;
  /** Total waste emissions in kg CO2e */
  waste: number;
}

// ── User Profile ─────────────────────────────────────────────────────────────

/** User profile stored in Firestore */
export interface UserProfile {
  /** Firebase user ID */
  uid: string;
  /** Display name from Google account */
  displayName: string | null;
  /** Email from Google account */
  email: string | null;
  /** Profile photo URL from Google account */
  photoURL: string | null;
  /** Country for national average comparison */
  country: string;
  /** Timestamp when profile was created */
  createdAt: string;
}

// ── National Average Data ────────────────────────────────────────────────────

/** National average emission data for a country */
export interface NationalAverageData {
  /** Country name */
  country: string;
  /** Daily average per capita emission in kg CO2e */
  dailyAverageKg: number;
  /** Source citation for the data */
  source: string;
}

// ── Chart Data ───────────────────────────────────────────────────────────────

/** Data point for trend charts */
export interface TrendDataPoint {
  /** Date label (e.g., "Mon", "2024-01-15") */
  date: string;
  /** Total emissions for that period in kg CO2e */
  total: number;
}

// ── Cache Types ──────────────────────────────────────────────────────────────

/** Cached data wrapper with timestamp for invalidation */
export interface CachedData<T> {
  /** The cached data */
  data: T;
  /** Timestamp when data was cached (ISO 8601) */
  cachedAt: string;
  /** Time-to-live in milliseconds */
  ttl: number;
}
