const EnvironmentReading = require('../models/EnvironmentReading');
const FeedReading = require('../models/FeedReading');
const WasteReading = require('../models/WasteReading');
const EggEvent = require('../models/EggEvent');
const FreshnessTest = require('../models/FreshnessTest');
const ProductivityPrediction = require('../models/ProductivityPrediction');

const { getSettings } = require('../services/settings.service');
const {
  classifyEnvironmentStatus,
  classifyAmmoniaZone,
  classifyFreshness,
} = require('../services/threshold.service');
const { getLiveWasteRate } = require('../services/waste.service');
const { getRecentFeedTrend, getHenDayForPeriod } = require('../services/productivity.service');
const { predictProductivity } = require('../services/ml.service');
const { raiseAlert } = require('../services/alert.service');
const { commandActuator } = require('../services/actuator.service');
const { markSeen } = require('../services/staleData.service');
const { sourceOf, nodeIdFilter } = require('../services/source');
const { getIO } = require('../sockets');

async function postEnvironment(req, res) {
  const { temperature, humidity, gas, activity, nodeId } = req.body;
  const nodeIdValue = nodeId || 'coop-1';
  const source = sourceOf(nodeIdValue);
  const settings = await getSettings();
  const status = classifyEnvironmentStatus({ temperature, humidity, gas }, settings.envThresholds);

  const reading = await EnvironmentReading.create({
    temperature,
    humidity,
    gas,
    activity,
    status,
    nodeId: nodeIdValue,
  });
  markSeen('environment');

  const io = getIO();
  const ammoniaZone = classifyAmmoniaZone(gas, settings.wasteAmmoniaThresholds);
  io.emit('environment:new', { reading, ammoniaZone });

  // Closed-loop actuator response: fan turns on for critical temp/gas, off otherwise.
  const fanShouldBeOn = status === 'critical';
  await commandActuator(io, {
    device: 'fan',
    state: fanShouldBeOn ? 'on' : 'off',
    reason: fanShouldBeOn
      ? `auto: environment critical (temp=${temperature}, gas=${gas})`
      : 'auto: environment back within safe/warning range',
    triggeredBy: 'auto',
  });

  if (status === 'critical') {
    await raiseAlert(io, {
      type: 'environment',
      severity: 'critical',
      message: `Critical environment reading (temp=${temperature}C, humidity=${humidity}%, gas=${gas})`,
      source: 'environment',
      value: gas,
    });
  }

  res.status(201).json({ reading, status, ammoniaZone });

  classifyEnvironment({ io, source, base: { temperature, humidity, gas, activity } }).catch((err) =>
    console.error('[ml] classification failed:', err.message)
  );
}

async function classifyEnvironment({ io, source, base }) {
  const feedTrend = await getRecentFeedTrend(1, nodeIdFilter(source));
  const features = { ...base, feedTrend };
  const prediction = await predictProductivity(features);
  if (!prediction) return;

  const saved = await ProductivityPrediction.create({
    source,
    features,
    classification: prediction.classification,
    confidence: prediction.confidence,
    featureImportances: prediction.featureImportances,
  });
  io.emit('productivity:new', saved);

  if (prediction.classification === 'Critical') {
    await raiseAlert(io, {
      type: 'productivity',
      severity: 'critical',
      message: `ML classifier flagged flock status as Critical (confidence ${(prediction.confidence * 100).toFixed(0)}%)`,
      source: 'ml-classifier',
    });
  }
}

async function postFeed(req, res) {
  const { weight, nodeId } = req.body;
  const reading = await FeedReading.create({ weight, nodeId: nodeId || 'feed-tray-1' });
  markSeen('feed');
  getIO().emit('feed:new', reading);
  res.status(201).json({ reading });
}

async function postWaste(req, res) {
  const { weight, nodeId } = req.body;
  const nodeIdValue = nodeId || 'waste-tray-1';
  const reading = await WasteReading.create({ weight, nodeId: nodeIdValue });
  markSeen('waste');
  const rate = await getLiveWasteRate(2, nodeIdFilter(sourceOf(nodeIdValue)));
  getIO().emit('waste:update', { reading, rate });
  res.status(201).json({ reading, rate });
}

async function postEggEvent(req, res) {
  const { nodeId } = req.body;
  const nodeIdValue = nodeId || 'egg-sensor-1';
  const event = await EggEvent.create({ nodeId: nodeIdValue });
  markSeen('egg');

  const settings = await getSettings();
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const henDay = await getHenDayForPeriod(
    startOfToday,
    new Date(),
    settings.flockSize,
    nodeIdFilter(sourceOf(nodeIdValue))
  );

  getIO().emit('egg:new', { event, henDay });
  res.status(201).json({ event, henDay });
}

async function postFreshnessTest(req, res) {
  const { gasReading } = req.body;
  const settings = await getSettings();
  const result = classifyFreshness(gasReading, settings.freshnessGasThresholds);

  const test = await FreshnessTest.create({
    gasReading,
    result,
    triggeredBy: req.user ? req.user._id : null,
  });
  getIO().emit('freshness:new', test);
  res.status(201).json({ test });
}

// ---- history endpoints (used for charts / reports) ----

function parseRange(req) {
  const to = req.query.to ? new Date(req.query.to) : new Date();
  const from = req.query.from
    ? new Date(req.query.from)
    : new Date(to.getTime() - 24 * 60 * 60 * 1000);
  return { from, to };
}

async function getEnvironmentHistory(req, res) {
  const { from, to } = parseRange(req);
  const readings = await EnvironmentReading.find({ createdAt: { $gte: from, $lte: to } })
    .sort({ createdAt: 1 })
    .limit(2000);
  res.json({ readings });
}

async function getFeedHistory(req, res) {
  const { from, to } = parseRange(req);
  const readings = await FeedReading.find({ createdAt: { $gte: from, $lte: to } })
    .sort({ createdAt: 1 })
    .limit(2000);
  res.json({ readings });
}

async function getWasteHistory(req, res) {
  const { from, to } = parseRange(req);
  const readings = await WasteReading.find({ createdAt: { $gte: from, $lte: to } })
    .sort({ createdAt: 1 })
    .limit(2000);
  res.json({ readings });
}

async function getEggEvents(req, res) {
  const { from, to } = parseRange(req);
  const events = await EggEvent.find({ createdAt: { $gte: from, $lte: to } }).sort({ createdAt: 1 });
  res.json({ events });
}

async function getFreshnessTests(req, res) {
  const { from, to } = parseRange(req);
  const tests = await FreshnessTest.find({ createdAt: { $gte: from, $lte: to } }).sort({
    createdAt: -1,
  });
  res.json({ tests });
}

module.exports = {
  postEnvironment,
  postFeed,
  postWaste,
  postEggEvent,
  postFreshnessTest,
  getEnvironmentHistory,
  getFeedHistory,
  getWasteHistory,
  getEggEvents,
  getFreshnessTests,
  parseRange,
};
