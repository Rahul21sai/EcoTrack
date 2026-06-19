/**
 * EcoTrack Carbon Engine Tests
 *
 * Comprehensive test suite for all 17 pure functions in the carbon calculation
 * engine. Target: 25+ test cases covering normal, edge, and error scenarios.
 *
 * Test framework: Vitest (the TypeScript/React ecosystem equivalent of JUnit)
 */

import { describe, it, expect } from 'vitest';
import {
  calculateTransportEmission,
  calculateEnergyEmission,
  calculateFoodEmission,
  calculateWasteEmission,
  calculateDailyTotal,
  calculateWeeklyAverage,
  compareToNationalAverage,
  validateLogEntry,
  categorizeImpact,
  generateRecommendations,
  calculateReductionPotential,
  calculateStreak,
  calculateCarbonSaved,
  formatCarbonValue,
  sanitizeNumericInput,
  validateDateNotFuture,
  getCategoryBreakdown,
} from '../utils/carbonEngine';

// ── Transport Emission Calculation ───────────────────────────────────────────

describe('Transport Emission Calculation', () => {
  it('calculates correct emission for petrol car', () => {
    expect(calculateTransportEmission('car_petrol', 100)).toBeCloseTo(19.2, 1);
  });

  it('returns zero emission for bicycle', () => {
    expect(calculateTransportEmission('bicycle', 50)).toBe(0);
  });

  it('returns zero for zero distance', () => {
    expect(calculateTransportEmission('car_petrol', 0)).toBe(0);
  });

  it('throws for negative distance', () => {
    expect(() => calculateTransportEmission('car_petrol', -10)).toThrow();
  });

  it('electric car emits less than petrol car for same distance', () => {
    const petrol = calculateTransportEmission('car_petrol', 100);
    const electric = calculateTransportEmission('car_electric', 100);
    expect(electric).toBeLessThan(petrol);
  });

  it('calculates correct emission for diesel car', () => {
    expect(calculateTransportEmission('car_diesel', 100)).toBeCloseTo(17.1, 1);
  });

  it('walking produces zero emissions', () => {
    expect(calculateTransportEmission('walk', 10)).toBe(0);
  });
});

// ── Energy Emission Calculation ──────────────────────────────────────────────

describe('Energy Emission Calculation', () => {
  it('calculates correct emission for electricity', () => {
    expect(calculateEnergyEmission('electricity', 10)).toBeCloseTo(4.75, 2);
  });

  it('calculates correct emission for natural gas', () => {
    expect(calculateEnergyEmission('natural_gas', 10)).toBeCloseTo(2.02, 2);
  });

  it('returns zero for zero usage', () => {
    expect(calculateEnergyEmission('electricity', 0)).toBe(0);
  });

  it('throws for negative energy usage', () => {
    expect(() => calculateEnergyEmission('electricity', -5)).toThrow();
  });
});

// ── Food Emission Calculation ────────────────────────────────────────────────

describe('Food Emission Calculation', () => {
  it('vegan meal has lowest emission of all meal types', () => {
    const vegan = calculateFoodEmission('vegan', 1);
    const meat = calculateFoodEmission('meat_heavy', 1);
    expect(vegan).toBeLessThan(meat);
  });

  it('scales linearly with meal count', () => {
    const one = calculateFoodEmission('vegetarian', 1);
    const three = calculateFoodEmission('vegetarian', 3);
    expect(three).toBeCloseTo(one * 3, 2);
  });

  it('meat_heavy is the highest emission meal type', () => {
    const heavy = calculateFoodEmission('meat_heavy', 1);
    const light = calculateFoodEmission('meat_light', 1);
    const veg = calculateFoodEmission('vegetarian', 1);
    const vegan = calculateFoodEmission('vegan', 1);
    expect(heavy).toBeGreaterThan(light);
    expect(light).toBeGreaterThan(veg);
    expect(veg).toBeGreaterThan(vegan);
  });
});

// ── Waste Emission Calculation ───────────────────────────────────────────────

describe('Waste Emission Calculation', () => {
  it('recycled waste emits less than landfill waste', () => {
    const landfill = calculateWasteEmission('landfill', 5);
    const recycled = calculateWasteEmission('recycled', 5);
    expect(recycled).toBeLessThan(landfill);
  });

  it('composted waste emits least of all waste types', () => {
    const composted = calculateWasteEmission('composted', 5);
    const recycled = calculateWasteEmission('recycled', 5);
    expect(composted).toBeLessThan(recycled);
  });

  it('throws for negative waste weight', () => {
    expect(() => calculateWasteEmission('landfill', -1)).toThrow();
  });
});

// ── Daily Total Calculation ──────────────────────────────────────────────────

describe('Daily Total Calculation', () => {
  it('sums all entries correctly', () => {
    const entries = [
      { category: 'transport', mode: 'car_petrol', value: 10, unit: 'km' },
      { category: 'energy', mode: 'electricity', value: 5, unit: 'kwh' },
    ];
    const total = calculateDailyTotal(entries);
    expect(total).toBeGreaterThan(0);
    // 10 * 0.192 + 5 * 0.475 = 1.92 + 2.375 = 4.295
    expect(total).toBeCloseTo(4.295, 2);
  });

  it('returns zero for empty entries array', () => {
    expect(calculateDailyTotal([])).toBe(0);
  });
});

// ── Weekly Average Calculation ───────────────────────────────────────────────

describe('Weekly Average Calculation', () => {
  it('calculates correct average', () => {
    expect(calculateWeeklyAverage([10, 20, 30])).toBe(20);
  });

  it('returns zero for empty array', () => {
    expect(calculateWeeklyAverage([])).toBe(0);
  });

  it('handles single value', () => {
    expect(calculateWeeklyAverage([15])).toBe(15);
  });
});

// ── National Average Comparison ──────────────────────────────────────────────

describe('National Average Comparison', () => {
  it('flags above-average usage correctly', () => {
    const result = compareToNationalAverage(50, 'USA');
    expect(result.status).toBe('above');
  });

  it('flags below-average usage correctly', () => {
    const result = compareToNationalAverage(2, 'USA');
    expect(result.status).toBe('below');
  });

  it('uses Global average for unknown country', () => {
    const result = compareToNationalAverage(5, 'Atlantis');
    expect(result.country).toBe('Global');
  });

  it('includes percentage difference', () => {
    const result = compareToNationalAverage(50, 'USA');
    expect(result.percentageDifference).toBeGreaterThan(0);
  });
});

// ── Log Entry Validation ─────────────────────────────────────────────────────

describe('Log Entry Validation', () => {
  it('rejects entry with negative value', () => {
    const result = validateLogEntry({
      category: 'transport',
      mode: 'car_petrol',
      value: -5,
      unit: 'km',
      date: '2026-01-01',
    });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('rejects entry with missing category', () => {
    const result = validateLogEntry({
      category: '',
      mode: 'car_petrol',
      value: 5,
      unit: 'km',
      date: '2026-01-01',
    });
    expect(result.valid).toBe(false);
  });

  it('accepts valid entry', () => {
    const result = validateLogEntry({
      category: 'transport',
      mode: 'car_petrol',
      value: 5,
      unit: 'km',
      date: '2026-01-01',
    });
    expect(result.valid).toBe(true);
  });

  it('rejects future-dated entry', () => {
    const result = validateLogEntry({
      category: 'transport',
      mode: 'car_petrol',
      value: 5,
      unit: 'km',
      date: '2099-01-01',
    });
    expect(result.valid).toBe(false);
  });

  it('rejects value >= 100000', () => {
    const result = validateLogEntry({
      category: 'transport',
      mode: 'car_petrol',
      value: 100000,
      unit: 'km',
      date: '2026-01-01',
    });
    expect(result.valid).toBe(false);
  });
});

// ── Impact Categorization ────────────────────────────────────────────────────

describe('Impact Categorization', () => {
  it('categorizes low daily total as low', () => {
    expect(categorizeImpact(3)).toBe('low');
  });

  it('categorizes moderate daily total as moderate', () => {
    expect(categorizeImpact(12)).toBe('moderate');
  });

  it('categorizes high daily total as high', () => {
    expect(categorizeImpact(25)).toBe('high');
  });

  it('categorizes very high daily total as very-high', () => {
    expect(categorizeImpact(50)).toBe('very-high');
  });
});

// ── Recommendation Engine ────────────────────────────────────────────────────

describe('Recommendation Engine', () => {
  it('suggests public transport when car usage dominates', () => {
    const entries = Array(5).fill({
      category: 'transport',
      mode: 'car_petrol',
      value: 20,
      unit: 'km',
    });
    const recs = generateRecommendations(entries, []);
    expect(recs.some((r) => r.category === 'transport')).toBe(true);
  });

  it('returns recommendations sorted by savings descending', () => {
    const entries = [
      { category: 'transport', mode: 'car_petrol', value: 50, unit: 'km' },
      { category: 'food', mode: 'meat_heavy', value: 6, unit: 'meal' },
    ];
    const recs = generateRecommendations(entries, []);
    for (let i = 0; i < recs.length - 1; i++) {
      expect(recs[i].estimatedSavingsKg).toBeGreaterThanOrEqual(
        recs[i + 1].estimatedSavingsKg
      );
    }
  });

  it('returns empty array for empty entries', () => {
    expect(generateRecommendations([], [])).toEqual([]);
  });

  it('suggests diet change for heavy meat consumption', () => {
    const entries = [
      { category: 'food', mode: 'meat_heavy', value: 6, unit: 'meal' },
    ];
    const recs = generateRecommendations(entries, []);
    expect(recs.some((r) => r.category === 'food')).toBe(true);
  });

  it('suggests recycling when landfill dominates', () => {
    const entries = [
      { category: 'waste', mode: 'landfill', value: 10, unit: 'kg' },
      { category: 'waste', mode: 'recycled', value: 2, unit: 'kg' },
    ];
    const recs = generateRecommendations(entries, []);
    expect(recs.some((r) => r.category === 'waste')).toBe(true);
  });

  it('includes estimatedSavingsKg in every recommendation', () => {
    const entries = Array(5).fill({
      category: 'transport',
      mode: 'car_petrol',
      value: 20,
      unit: 'km',
    });
    const recs = generateRecommendations(entries, []);
    recs.forEach((r) => {
      expect(r.estimatedSavingsKg).toBeGreaterThan(0);
    });
  });
});

// ── Reduction Potential ──────────────────────────────────────────────────────

describe('Reduction Potential', () => {
  it('returns savings capped at current emissions in category', () => {
    const entries = [
      { category: 'transport', mode: 'car_petrol', value: 5, unit: 'km' },
    ];
    const rec = {
      title: 'Test',
      description: 'Test',
      estimatedSavingsKg: 100,
      difficulty: 'easy' as const,
      category: 'transport' as const,
    };
    const potential = calculateReductionPotential(entries, rec);
    // 5km * 0.192 = 0.96, so potential should be capped at 0.96
    expect(potential).toBeCloseTo(0.96, 2);
  });
});

// ── Streak Calculation ───────────────────────────────────────────────────────

describe('Streak Calculation', () => {
  it('calculates consecutive day streak correctly', () => {
    expect(
      calculateStreak(['2026-01-01', '2026-01-02', '2026-01-03'])
    ).toBe(3);
  });

  it('breaks streak on gap day', () => {
    expect(calculateStreak(['2026-01-01', '2026-01-03'])).toBe(1);
  });

  it('returns zero for empty log dates', () => {
    expect(calculateStreak([])).toBe(0);
  });

  it('handles duplicate dates', () => {
    expect(
      calculateStreak(['2026-01-01', '2026-01-01', '2026-01-02'])
    ).toBe(2);
  });
});

// ── Carbon Saved Calculation ─────────────────────────────────────────────────

describe('Carbon Saved Calculation', () => {
  it('returns positive value when current is lower than baseline', () => {
    expect(calculateCarbonSaved(50, 30)).toBe(20);
  });

  it('returns zero when current exceeds baseline (no negative savings)', () => {
    expect(calculateCarbonSaved(30, 50)).toBe(0);
  });

  it('returns zero when baseline equals current', () => {
    expect(calculateCarbonSaved(30, 30)).toBe(0);
  });
});

// ── Carbon Value Formatting ──────────────────────────────────────────────────

describe('Carbon Value Formatting', () => {
  it('formats values under 1000kg in kg', () => {
    expect(formatCarbonValue(2.4)).toBe('2.4 kg CO2e');
  });

  it('formats values over 1000kg in tonnes', () => {
    expect(formatCarbonValue(1500)).toBe('1.5 t CO2e');
  });

  it('formats exactly 1000kg as tonnes', () => {
    expect(formatCarbonValue(1000)).toBe('1.0 t CO2e');
  });

  it('formats zero correctly', () => {
    expect(formatCarbonValue(0)).toBe('0 kg CO2e');
  });
});

// ── Numeric Input Sanitization ───────────────────────────────────────────────

describe('Numeric Input Sanitization', () => {
  it('parses valid numeric string', () => {
    expect(sanitizeNumericInput('42.5')).toBe(42.5);
  });

  it('returns null for non-numeric string', () => {
    expect(sanitizeNumericInput('abc')).toBeNull();
  });

  it('strips script injection attempts', () => {
    expect(sanitizeNumericInput('<script>5</script>')).toBeNull();
  });

  it('returns null for negative numbers', () => {
    expect(sanitizeNumericInput('-5')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(sanitizeNumericInput('')).toBeNull();
  });

  it('handles whitespace-padded numbers', () => {
    expect(sanitizeNumericInput('  10  ')).toBe(10);
  });
});

// ── Date Validation ──────────────────────────────────────────────────────────

describe('Date Validation', () => {
  it('rejects future dates', () => {
    expect(validateDateNotFuture('2099-01-01')).toBe(false);
  });

  it('accepts past dates', () => {
    expect(validateDateNotFuture('2026-01-01')).toBe(true);
  });

  it('rejects invalid date strings', () => {
    expect(validateDateNotFuture('not-a-date')).toBe(false);
  });
});

// ── Category Breakdown ───────────────────────────────────────────────────────

describe('Category Breakdown', () => {
  it('groups entries by category correctly', () => {
    const entries = [
      { category: 'transport', mode: 'car_petrol', value: 10, unit: 'km' },
      { category: 'transport', mode: 'bus', value: 5, unit: 'km' },
      { category: 'food', mode: 'vegan', value: 1, unit: 'meal' },
    ];
    const breakdown = getCategoryBreakdown(entries);
    expect(breakdown.transport).toBeGreaterThan(0);
    expect(breakdown.food).toBeGreaterThan(0);
    expect(breakdown.energy).toBe(0);
    expect(breakdown.waste).toBe(0);
  });

  it('returns all zeros for empty entries', () => {
    const breakdown = getCategoryBreakdown([]);
    expect(breakdown.transport).toBe(0);
    expect(breakdown.energy).toBe(0);
    expect(breakdown.food).toBe(0);
    expect(breakdown.waste).toBe(0);
  });
});
