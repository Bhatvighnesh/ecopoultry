const { computeHenDayPercent } = require('../src/services/productivity.service');

describe('computeHenDayPercent', () => {
  test('computes percent from egg events, flock size, and days elapsed', () => {
    // 90 eggs over 1 day from a flock of 100 => 90%
    expect(computeHenDayPercent(90, 100, 1)).toBeCloseTo(90);
  });

  test('scales correctly over multiple days', () => {
    // 180 eggs over 2 days from a flock of 100 => 90%
    expect(computeHenDayPercent(180, 100, 2)).toBeCloseTo(90);
  });

  test('returns 0 when flock size is missing or zero', () => {
    expect(computeHenDayPercent(50, 0, 1)).toBe(0);
    expect(computeHenDayPercent(50, null, 1)).toBe(0);
  });

  test('returns 0 when days elapsed is zero', () => {
    expect(computeHenDayPercent(50, 100, 0)).toBe(0);
  });

  test('can exceed 100% if egg events outnumber flock-days (data anomaly)', () => {
    expect(computeHenDayPercent(150, 100, 1)).toBeCloseTo(150);
  });
});
