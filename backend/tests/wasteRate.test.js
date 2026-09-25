const {
  sumPositiveDeltas,
  sumNegativeDeltas,
  computeWasteRate,
} = require('../src/services/waste.service');

function readings(weights) {
  return weights.map((weight) => ({ weight }));
}

describe('sumPositiveDeltas', () => {
  test('sums only rises, ignoring a tray-emptying drop', () => {
    // 100 -> 150 (+50) -> 180 (+30) -> 20 (emptied, ignored) -> 60 (+40)
    const total = sumPositiveDeltas(readings([100, 150, 180, 20, 60]));
    expect(total).toBe(120);
  });

  test('returns 0 for a single reading', () => {
    expect(sumPositiveDeltas(readings([100]))).toBe(0);
  });
});

describe('sumNegativeDeltas', () => {
  test('sums only drops, ignoring a refill jump', () => {
    // 500 -> 450 (-50 consumed) -> 400 (-50 consumed) -> 1000 (refill, ignored) -> 950 (-50 consumed)
    const total = sumNegativeDeltas(readings([500, 450, 400, 1000, 950]));
    expect(total).toBe(150);
  });
});

describe('computeWasteRate', () => {
  test('extrapolates measured grams/hour to kg/day and applies fixed conversion constants', () => {
    // 100g accumulated over 2 hours => 50 g/hr => 1.2 kg/day
    const result = computeWasteRate(readings([0, 60, 100]), 2);
    expect(result.gramsPerHour).toBeCloseTo(50);
    expect(result.kgPerDay).toBeCloseTo(1.2);
    expect(result.biogasM3PerDay).toBeCloseTo(1.2 * 0.03);
    expect(result.fertilizerKgPerDay).toBeCloseTo(1.2 * 0.45);
  });

  test('returns all zeros when fewer than two readings are available', () => {
    const result = computeWasteRate(readings([100]), 2);
    expect(result).toEqual({ gramsPerHour: 0, kgPerDay: 0, biogasM3PerDay: 0, fertilizerKgPerDay: 0 });
  });

  test('returns all zeros when the window is zero hours', () => {
    const result = computeWasteRate(readings([0, 60]), 0);
    expect(result).toEqual({ gramsPerHour: 0, kgPerDay: 0, biogasM3PerDay: 0, fertilizerKgPerDay: 0 });
  });
});
