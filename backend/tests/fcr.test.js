const { computeFCR } = require('../src/services/productivity.service');

describe('computeFCR', () => {
  test('classifies Efficient below 1.8', () => {
    const { fcr, classification } = computeFCR(1.5, 1);
    expect(fcr).toBeCloseTo(1.5);
    expect(classification).toBe('Efficient');
  });

  test('classifies Average between 1.8 and 2.2 inclusive', () => {
    expect(computeFCR(1.8, 1).classification).toBe('Average');
    expect(computeFCR(2.2, 1).classification).toBe('Average');
  });

  test('classifies Needs Attention above 2.2', () => {
    const { classification } = computeFCR(2.21, 1);
    expect(classification).toBe('Needs Attention');
  });

  test('computes ratio correctly', () => {
    const { fcr } = computeFCR(9, 5);
    expect(fcr).toBeCloseTo(1.8);
  });

  test('returns null when weight gain is zero or missing', () => {
    expect(computeFCR(5, 0)).toBeNull();
    expect(computeFCR(5, null)).toBeNull();
  });
});
