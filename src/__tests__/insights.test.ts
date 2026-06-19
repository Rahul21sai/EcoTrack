/**
 * EcoTrack Insights Engine Tests
 *
 * Unit tests for the generateRelatableComparison and generateWeeklyInsight
 * pure functions in src/utils/insights.ts.
 *
 * Tests cover:
 *   - generateRelatableComparison: 7 range cases + edge cases
 *   - generateWeeklyInsight: improvement, regression, steady, no-data,
 *     no-history, and minimum-data cases
 *
 * All tests are deterministic and have zero side effects.
 */

import { describe, it, expect } from 'vitest';
import {
  generateRelatableComparison,
  generateWeeklyInsight,
} from '../utils/insights';
import type { LogEntry } from '../types';

// ── generateRelatableComparison ───────────────────────────────────────────────

describe('generateRelatableComparison', () => {
  it('returns zero-emission string for 0 kg', () => {
    const result = generateRelatableComparison(0);
    expect(result).toContain('zero-emission');
  });

  it('returns zero-emission string for negative kg', () => {
    const result = generateRelatableComparison(-5);
    expect(result).toContain('zero-emission');
  });

  it('returns phone charges for very small amounts (< 0.5 kg)', () => {
    const result = generateRelatableComparison(0.1);
    expect(result).toContain('phone');
  });

  it('returns kettle boils for small amounts (0.5–1 kg)', () => {
    const result = generateRelatableComparison(0.8);
    expect(result).toContain('kettle');
  });

  it('returns beef burger comparison for medium-small amounts (1–8 kg)', () => {
    const result = generateRelatableComparison(5);
    expect(result).toContain('beef burger');
  });

  it('returns car driving comparison for medium amounts (8–50 kg)', () => {
    const result = generateRelatableComparison(19.2);
    expect(result).toContain('petrol car');
  });

  it('returns flight comparison for large amounts (50–300 kg)', () => {
    const result = generateRelatableComparison(100);
    expect(result).toContain('flight');
  });

  it('returns tree absorption comparison for very large amounts (> 300 kg)', () => {
    const result = generateRelatableComparison(500);
    expect(result).toContain('tree');
  });

  it('returns a non-empty string for any positive input', () => {
    [0.001, 0.3, 2, 15, 80, 350, 1000].forEach((kg) => {
      expect(generateRelatableComparison(kg).length).toBeGreaterThan(0);
    });
  });
});

// ── generateWeeklyInsight ─────────────────────────────────────────────────────

/** Helper: build a LogEntry with required fields */
function makeEntry(
  category: LogEntry['category'],
  mode: string,
  value: number,
  date: string
): LogEntry {
  return { category, mode, value, unit: 'km', date };
}

const TRANSPORT_ENTRIES: LogEntry[] = [
  makeEntry('transport', 'car_petrol', 20, '2026-06-15'),
  makeEntry('transport', 'car_petrol', 20, '2026-06-16'),
  makeEntry('transport', 'car_petrol', 20, '2026-06-17'),
];

const FOOD_ENTRIES: LogEntry[] = [
  makeEntry('food', 'meat_heavy', 3, '2026-06-15'),
  makeEntry('food', 'meat_heavy', 3, '2026-06-16'),
  makeEntry('food', 'meat_heavy', 3, '2026-06-17'),
];

describe('generateWeeklyInsight', () => {
  it('returns insufficient data when fewer than 3 entries exist', () => {
    const result = generateWeeklyInsight([], []);
    expect(result.hasSufficientData).toBe(false);
    expect(result.insight).toContain('3');
    expect(result.primaryCategory).toBeNull();
    expect(result.percentageChange).toBeNull();
  });

  it('returns insufficient data for 2 entries (below threshold)', () => {
    const result = generateWeeklyInsight(
      [TRANSPORT_ENTRIES[0]!, TRANSPORT_ENTRIES[1]!],
      []
    );
    expect(result.hasSufficientData).toBe(false);
  });

  it('returns insight with no comparison when history is empty', () => {
    const result = generateWeeklyInsight(TRANSPORT_ENTRIES, []);
    expect(result.hasSufficientData).toBe(true);
    expect(result.insight.length).toBeGreaterThan(10);
    expect(result.percentageChange).toBeNull();
    expect(result.primaryCategory).not.toBeNull();
  });

  it('detects improvement when current emissions are lower than history', () => {
    // History: heavy transport. Current: much lighter (food only, low emissions)
    const lightCurrentEntries: LogEntry[] = [
      makeEntry('food', 'vegan', 1, '2026-06-15'),
      makeEntry('food', 'vegan', 1, '2026-06-16'),
      makeEntry('food', 'vegan', 1, '2026-06-17'),
    ];
    const result = generateWeeklyInsight(lightCurrentEntries, TRANSPORT_ENTRIES);
    expect(result.hasSufficientData).toBe(true);
    expect(result.percentageChange).not.toBeNull();
    // Current emissions should be much less than history → negative % change
    expect(result.percentageChange!).toBeLessThan(0);
    expect(result.insight.toLowerCase()).toMatch(/drop|progress|great/i);
  });

  it('detects regression when current emissions are higher than history', () => {
    // History: vegan (low). Current: heavy meat + transport (high)
    const lightHistory: LogEntry[] = [
      makeEntry('food', 'vegan', 1, '2026-06-08'),
      makeEntry('food', 'vegan', 1, '2026-06-09'),
      makeEntry('food', 'vegan', 1, '2026-06-10'),
    ];
    const heavyCurrent = [...TRANSPORT_ENTRIES, ...FOOD_ENTRIES];
    const result = generateWeeklyInsight(heavyCurrent, lightHistory);
    expect(result.hasSufficientData).toBe(true);
    expect(result.percentageChange!).toBeGreaterThan(0);
    expect(result.insight.toLowerCase()).toMatch(/rose|increased|\+/i);
  });

  it('detects steady state when changes are small (< 2%)', () => {
    // Same entries as history → 0% change
    const result = generateWeeklyInsight(TRANSPORT_ENTRIES, TRANSPORT_ENTRIES);
    expect(result.hasSufficientData).toBe(true);
    expect(result.percentageChange).not.toBeNull();
    expect(Math.abs(result.percentageChange!)).toBeLessThan(2);
    expect(result.insight.toLowerCase()).toMatch(/steady|consistent|same/i);
  });

  it('always returns a non-empty insight string for valid data', () => {
    const result = generateWeeklyInsight(TRANSPORT_ENTRIES, FOOD_ENTRIES);
    expect(typeof result.insight).toBe('string');
    expect(result.insight.length).toBeGreaterThan(20);
  });

  it('identifies the primary category of change', () => {
    // Current has only transport, history has only food → transport changed most
    const result = generateWeeklyInsight(TRANSPORT_ENTRIES, FOOD_ENTRIES);
    expect(result.primaryCategory).not.toBeNull();
    expect(['transport', 'food', 'energy', 'waste']).toContain(
      result.primaryCategory
    );
  });
});
