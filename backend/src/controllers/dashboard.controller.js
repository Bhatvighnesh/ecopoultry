const EnvironmentReading = require('../models/EnvironmentReading');
const ProductivityPrediction = require('../models/ProductivityPrediction');
const { getSettings } = require('../services/settings.service');
const { classifyAmmoniaZone } = require('../services/threshold.service');
const { getLiveWasteRate } = require('../services/waste.service');
const { getHenDayForPeriod } = require('../services/productivity.service');
const { getAllCurrentStates } = require('../services/actuator.service');
const { getAllStatuses } = require('../services/staleData.service');

/** One aggregated snapshot for the live dashboard. Everything here is derived
 * from continuously-arriving sensor data - nothing is user-entered. */
async function getSummary(req, res) {
  const settings = await getSettings();

  const [latestEnv, latestPrediction, wasteRate, actuatorStates] = await Promise.all([
    EnvironmentReading.findOne().sort({ createdAt: -1 }).lean(),
    ProductivityPrediction.findOne().sort({ createdAt: -1 }).lean(),
    getLiveWasteRate(),
    getAllCurrentStates(),
  ]);

  const ammoniaZone = latestEnv
    ? classifyAmmoniaZone(latestEnv.gas, settings.wasteAmmoniaThresholds)
    : null;

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const henDay = await getHenDayForPeriod(startOfToday, new Date(), settings.flockSize);

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
