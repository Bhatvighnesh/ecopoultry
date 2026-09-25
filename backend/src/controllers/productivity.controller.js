const ProductivityPrediction = require('../models/ProductivityPrediction');
const { getSettings } = require('../services/settings.service');
const { getFCRForPeriod, getHenDayForPeriod } = require('../services/productivity.service');
const { parseRange } = require('./sensors.controller');

async function getFCR(req, res) {
  const { from, to } = parseRange(req);
  const settings = await getSettings();
  const result = await getFCRForPeriod(from, to, settings.birdWeightGain.valueKg);
  res.json({ from, to, ...result, weightGainPeriodDays: settings.birdWeightGain.periodDays });
}

async function getHenDay(req, res) {
  const { from, to } = parseRange(req);
  const settings = await getSettings();
  const result = await getHenDayForPeriod(from, to, settings.flockSize);
  res.json({ from, to, flockSize: settings.flockSize, ...result });
}

async function getPredictions(req, res) {
  const { limit = 50 } = req.query;
  const predictions = await ProductivityPrediction.find().sort({ createdAt: -1 }).limit(Number(limit));
  res.json({ predictions });
}

module.exports = { getFCR, getHenDay, getPredictions };
