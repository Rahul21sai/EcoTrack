/**
 * EcoTrack Input Sanitization Utilities
 *
 * Defense-in-depth sanitization for user inputs. These functions run client-side
 * as a UX layer; real security is enforced by Firestore Security Rules.
 *
 * @module sanitize
 */

/**
 * Strip all HTML tags from a string to prevent XSS injection.
 *
 * @param input - Raw string that may contain HTML
 * @returns Sanitized string with all HTML tags removed
 *
 * @example
 * stripHTML('<script>alert(1)</script>Hello')  // → 'alert(1)Hello'
 * stripHTML('Normal text')                      // → 'Normal text'
 */
export function stripHTML(input: string): string {
  return input.replace(/<[^>]*>/gi, '');
}

/**
 * Sanitize a string for safe display — strips HTML and trims whitespace.
 *
 * @param input - Raw user input string
 * @returns Sanitized, trimmed string
 */
export function sanitizeTextInput(input: string): string {
  return stripHTML(input).trim();
}

/**
 * Validate that a string contains no HTML tags.
 *
 * @param input - String to check
 * @returns true if the string is free of HTML tags
 */
export function isCleanOfHTML(input: string): boolean {
  return !/<[^>]*>/i.test(input);
}
