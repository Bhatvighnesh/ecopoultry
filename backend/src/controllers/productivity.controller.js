const ProductivityPrediction = require('../models/ProductivityPrediction');
const { getSettings } = require('../services/settings.service');
const { getFCRForPeriod, getHenDayForPeriod } = require('../services/productivity.service');
const { nodeIdFilter } = require('../services/source');
const { parseRange } = require('./sensors.controller');

function requestedSource(req) {
  return req.query.source === 'demo' || req.query.source === 'live' ? req.query.source : null;
}

async function getFCR(req, res) {
  const { from, to } = parseRange(req);
  const settings = await getSettings();
  const source = requestedSource(req);
  const filter = source ? nodeIdFilter(source) : {};
  const result = await getFCRForPeriod(from, to, settings.birdWeightGain.valueKg, filter);
  res.json({ from, to, ...result, weightGainPeriodDays: settings.birdWeightGain.periodDays });
}

async function getHenDay(req, res) {
  const { from, to } = parseRange(req);
  const settings = await getSettings();
  const source = requestedSource(req);
  const filter = source ? nodeIdFilter(source) : {};
  const result = await getHenDayForPeriod(from, to, settings.flockSize, filter);
  res.json({ from, to, flockSize: settings.flockSize, ...result });
}

async function getPredictions(req, res) {
  const { limit = 50 } = req.query;
  const source = requestedSource(req);
  const filter = source ? { source } : {};
  const predictions = await ProductivityPrediction.find(filter).sort({ createdAt: -1 }).limit(Number(limit));
  res.json({ predictions });
}

module.exports = { getFCR, getHenDay, getPredictions };
