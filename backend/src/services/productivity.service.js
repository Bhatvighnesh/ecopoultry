const EggEvent = require('../models/EggEvent');
const FeedReading = require('../models/FeedReading');
const { getFeedConsumedKg } = require('./waste.service');
const { classifyFCR } = require('./threshold.service');

/** FCR = feed consumed (kg, auto-summed) / weight gain (kg, periodic admin entry). */
function computeFCR(feedConsumedKg, weightGainKg) {
  if (!weightGainKg || weightGainKg <= 0) return null;
  const fcr = feedConsumedKg / weightGainKg;
  return { fcr: Number(fcr.toFixed(3)), classification: classifyFCR(fcr) };
}

/** Hen-Day % = egg events / (flock size x days elapsed) x 100. */
function computeHenDayPercent(eggEventCount, flockSize, daysElapsed) {
  if (!flockSize || flockSize <= 0 || !daysElapsed || daysElapsed <= 0) return 0;
  const percent = (eggEventCount / (flockSize * daysElapsed)) * 100;
  return Number(percent.toFixed(2));
}

async function getFCRForPeriod(from, to, weightGainKg) {
  const feedConsumedKg = await getFeedConsumedKg(from, to);
  const result = computeFCR(feedConsumedKg, weightGainKg);
  return { feedConsumedKg: Number(feedConsumedKg.toFixed(3)), weightGainKg, ...result };
}

async function getHenDayForPeriod(from, to, flockSize, filter = {}) {
  const eggEventCount = await EggEvent.countDocuments({ createdAt: { $gte: from, $lte: to }, ...filter });
  const daysElapsed = Math.max((to - from) / (1000 * 60 * 60 * 24), 1 / 24);
  const henDayPercent = computeHenDayPercent(eggEventCount, flockSize, daysElapsed);
  return { eggEventCount, daysElapsed: Number(daysElapsed.toFixed(3)), henDayPercent };
}

/**
 * Feature fed to the ML classifier: recent feed consumption rate (g/hr) over
 * a short trailing window. A falling rate signals declining intake.
 */
async function getRecentFeedTrend(windowHours = 1, filter = {}) {
  const since = new Date(Date.now() - windowHours * 60 * 60 * 1000);
  const readings = await FeedReading.find({ createdAt: { $gte: since }, ...filter })
    .sort({ createdAt: 1 })
    .lean();
  if (readings.length < 2) return 0;
  const grams = require('./waste.service').sumNegativeDeltas(readings);
  const actualHours = (readings[readings.length - 1].createdAt - readings[0].createdAt) / (1000 * 60 * 60);
  return Number((grams / (actualHours || windowHours)).toFixed(2));
}

module.exports = {
  computeFCR,
  computeHenDayPercent,
  getFCRForPeriod,
  getHenDayForPeriod,
  getRecentFeedTrend,
};
