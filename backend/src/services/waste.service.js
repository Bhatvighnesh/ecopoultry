const WasteReading = require('../models/WasteReading');
const FeedReading = require('../models/FeedReading');

const GRAMS_PER_KG = 1000;
const BIOGAS_M3_PER_KG_WASTE = 0.03; // documented fixed conversion constant
const FERTILIZER_KG_PER_KG_WASTE = 0.45; // documented fixed conversion constant

/**
 * Sums only the positive deltas between consecutive readings (weight rises =
 * waste accumulating). A negative delta means the tray was emptied and is
 * excluded so an emptying event doesn't cancel out real accumulation.
 */
function sumPositiveDeltas(readingsAscending) {
  let total = 0;
  for (let i = 1; i < readingsAscending.length; i += 1) {
    const delta = readingsAscending[i].weight - readingsAscending[i - 1].weight;
    if (delta > 0) total += delta;
  }
  return total;
}

/**
 * Sums only the negative deltas (weight drops = feed consumed). A positive
 * delta means the tray was refilled and is excluded.
 */
function sumNegativeDeltas(readingsAscending) {
  let total = 0;
  for (let i = 1; i < readingsAscending.length; i += 1) {
    const delta = readingsAscending[i].weight - readingsAscending[i - 1].weight;
    if (delta < 0) total += Math.abs(delta);
  }
  return total;
}

/**
 * Computes the measured waste accumulation rate from raw load-cell readings.
 * Returns grams/hour plus the kg/day extrapolation and the biogas/fertilizer
 * projections derived from fixed, documented constants (see README).
 */
function computeWasteRate(readingsAscending, windowHours) {
  if (readingsAscending.length < 2 || windowHours <= 0) {
    return { gramsPerHour: 0, kgPerDay: 0, biogasM3PerDay: 0, fertilizerKgPerDay: 0 };
  }
  const totalGrams = sumPositiveDeltas(readingsAscending);
  const gramsPerHour = totalGrams / windowHours;
  const kgPerDay = (gramsPerHour * 24) / GRAMS_PER_KG;
  const biogasM3PerDay = kgPerDay * BIOGAS_M3_PER_KG_WASTE;
  const fertilizerKgPerDay = kgPerDay * FERTILIZER_KG_PER_KG_WASTE;
  return {
    gramsPerHour: Number(gramsPerHour.toFixed(2)),
    kgPerDay: Number(kgPerDay.toFixed(3)),
    biogasM3PerDay: Number(biogasM3PerDay.toFixed(4)),
    fertilizerKgPerDay: Number(fertilizerKgPerDay.toFixed(3)),
  };
}

/** Live waste rate over a short recent window (default: last 2 hours). */
async function getLiveWasteRate(windowHours = 2, filter = {}) {
  const since = new Date(Date.now() - windowHours * 60 * 60 * 1000);
  const readings = await WasteReading.find({ createdAt: { $gte: since }, ...filter })
    .sort({ createdAt: 1 })
    .lean();
  const actualHours =
    readings.length >= 2
      ? (readings[readings.length - 1].createdAt - readings[0].createdAt) / (1000 * 60 * 60)
      : 0;
  return computeWasteRate(readings, actualHours || windowHours);
}

/** Total feed consumed (kg) between two dates, auto-summed from tray drops. */
async function getFeedConsumedKg(from, to, filter = {}) {
  const readings = await FeedReading.find({ createdAt: { $gte: from, $lte: to }, ...filter })
    .sort({ createdAt: 1 })
    .lean();
  const grams = sumNegativeDeltas(readings);
  return grams / GRAMS_PER_KG;
}

module.exports = {
  sumPositiveDeltas,
  sumNegativeDeltas,
  computeWasteRate,
  getLiveWasteRate,
  getFeedConsumedKg,
  BIOGAS_M3_PER_KG_WASTE,
  FERTILIZER_KG_PER_KG_WASTE,
};
