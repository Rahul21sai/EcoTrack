/**
 * EcoTrack Custom Error Classes
 *
 * Typed error hierarchy for structured, testable error handling across
 * the application. Using typed errors instead of raw `Error` enables:
 *   1. Catch-and-identify patterns (`instanceof ValidationError`)
 *   2. Typed metadata (field name, error code) attached to errors
 *   3. Deterministic unit testing of error paths
 *   4. Clear separation between validation, calculation, and persistence failures
 *
 * @module errors
 */

// ── Validation Error ──────────────────────────────────────────────────────────

/**
 * Thrown when a log entry or user input fails client-side validation rules.
 * Carries an optional `field` name to identify which input is invalid.
 *
 * @example
 * throw new ValidationError('Value must be non-negative', 'value');
 */
export class ValidationError extends Error {
  /** The form field or property name that failed validation, if applicable */
  public readonly field?: string;

  constructor(message: string, field?: string) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
    // Restore prototype chain (required when extending built-in classes in TS)
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

// ── Carbon Calculation Error ──────────────────────────────────────────────────

/**
 * Thrown when a carbon emission calculation receives an invalid input,
 * such as a negative distance or unrecognized emission mode.
 *
 * Kept separate from ValidationError so callers can distinguish between
 * user input errors (ValidationError) and programmatic/logic errors
 * (CarbonCalculationError).
 *
 * @example
 * throw new CarbonCalculationError('Distance cannot be negative');
 */
export class CarbonCalculationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CarbonCalculationError';
    Object.setPrototypeOf(this, CarbonCalculationError.prototype);
  }
}

// ── Firestore Service Error ───────────────────────────────────────────────────

/**
 * Thrown when a Firestore or LocalStorage persistence operation fails.
 * Wraps raw Firebase errors so they never leak directly to the UI layer.
 * Carries an optional `code` for programmatic error-type detection.
 *
 * @example
 * throw new FirestoreServiceError('User must be authenticated to save entries', 'unauthenticated');
 */
export class FirestoreServiceError extends Error {
  /** Short machine-readable error code (e.g. 'unauthenticated', 'not-found') */
  public readonly code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = 'FirestoreServiceError';
    this.code = code;
    Object.setPrototypeOf(this, FirestoreServiceError.prototype);
  }
}
