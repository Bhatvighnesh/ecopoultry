const EnvironmentReading = require('../models/EnvironmentReading');
const ProductivityPrediction = require('../models/ProductivityPrediction');
const { getSettings } = require('../services/settings.service');
const { classifyAmmoniaZone } = require('../services/threshold.service');
const { getLiveWasteRate } = require('../services/waste.service');
const { getHenDayForPeriod } = require('../services/productivity.service');
const { getAllCurrentStates } = require('../services/actuator.service');
const { getAllStatuses } = require('../services/staleData.service');
const { nodeIdFilter } = require('../services/source');

// Anything older than this is treated as "no device connected" and not shown as current.
const CURRENT_WINDOW_MS = 10 * 60 * 1000;

/** One aggregated snapshot for the live dashboard. Everything here is derived
 * from continuously-arriving sensor data - nothing is user-entered. */
async function getSummary(req, res) {
  const settings = await getSettings();
  const source = req.query.source === 'demo' ? 'demo' : 'live';
  const filter = nodeIdFilter(source);
  const since = new Date(Date.now() - CURRENT_WINDOW_MS);

  const [latestEnv, latestPrediction, wasteRate, actuatorStates] = await Promise.all([
    EnvironmentReading.findOne({ ...filter, createdAt: { $gte: since } }).sort({ createdAt: -1 }).lean(),
    ProductivityPrediction.findOne({ source, createdAt: { $gte: since } }).sort({ createdAt: -1 }).lean(),
    getLiveWasteRate(2, filter),
    getAllCurrentStates(),
  ]);

  const ammoniaZone = latestEnv
    ? classifyAmmoniaZone(latestEnv.gas, settings.wasteAmmoniaThresholds)
    : null;

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const henDay = await getHenDayForPeriod(startOfToday, new Date(), settings.flockSize, filter);

  const staleness = getAllStatuses(['environment', 'feed', 'waste', 'egg']);

  res.json({
    environment: latestEnv,
    ammoniaZone,
    wasteRate,
    henDay,
    actuatorStates,
    productivity: latestPrediction,
    staleness,
    settings: {
      flockSize: settings.flockSize,
      envThresholds: settings.envThresholds,
      wasteAmmoniaThresholds: settings.wasteAmmoniaThresholds,
      freshnessGasThresholds: settings.freshnessGasThresholds,
      birdWeightGain: settings.birdWeightGain,
    },
  });
}

module.exports = { getSummary };
