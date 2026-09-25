const EnvironmentReading = require('../models/EnvironmentReading');
const WasteReading = require('../models/WasteReading');
const FreshnessTest = require('../models/FreshnessTest');
const Alert = require('../models/Alert');
const ProductivityPrediction = require('../models/ProductivityPrediction');

const { getSettings } = require('../services/settings.service');
const { computeWasteRate } = require('../services/waste.service');
const { getFCRForPeriod, getHenDayForPeriod } = require('../services/productivity.service');
const { toCsvSection } = require('../utils/csv');

/** Exportable CSV summarizing a date range across every subsystem. */
async function exportCsv(req, res) {
  const to = req.query.to ? new Date(req.query.to) : new Date();
  const from = req.query.from
    ? new Date(req.query.from)
    : new Date(to.getTime() - 7 * 24 * 60 * 60 * 1000);

  const settings = await getSettings();
  const range = { createdAt: { $gte: from, $lte: to } };

  const [envReadings, wasteReadings, freshnessTests, alerts, predictions] = await Promise.all([
    EnvironmentReading.find(range).sort({ createdAt: 1 }).lean(),
    WasteReading.find(range).sort({ createdAt: 1 }).lean(),
    FreshnessTest.find(range).sort({ createdAt: 1 }).lean(),
    Alert.find(range).sort({ createdAt: 1 }).lean(),
    ProductivityPrediction.find(range).sort({ createdAt: 1 }).lean(),
  ]);

  const windowHours = Math.max((to - from) / (1000 * 60 * 60), 1 / 60);
  const wasteRate = computeWasteRate(wasteReadings, windowHours);
  const fcr = await getFCRForPeriod(from, to, settings.birdWeightGain.valueKg);
  const henDay = await getHenDayForPeriod(from, to, settings.flockSize);

  let csv = `EcoPoultry Report: ${from.toISOString()} to ${to.toISOString()}\n\n`;

  csv += toCsvSection(
    'Environmental Readings',
    ['createdAt', 'temperature', 'humidity', 'gas', 'activity', 'status'],
    envReadings
  );
  csv += '\n';

  csv += `# Waste / Biogas / Fertilizer Summary\n`;
  csv += `metric,value\n`;
  csv += `waste_kg_per_day,${wasteRate.kgPerDay}\n`;
  csv += `biogas_m3_per_day,${wasteRate.biogasM3PerDay}\n`;
  csv += `fertilizer_kg_per_day,${wasteRate.fertilizerKgPerDay}\n\n`;

  csv += `# Feed Conversion Ratio (FCR)\n`;
  csv += `metric,value\n`;
  csv += `feed_consumed_kg,${fcr.feedConsumedKg}\n`;
  csv += `weight_gain_kg,${fcr.weightGainKg}\n`;
  csv += `fcr,${fcr.fcr ?? ''}\n`;
  csv += `fcr_classification,${fcr.classification ?? ''}\n\n`;

  csv += `# Hen-Day Production\n`;
  csv += `metric,value\n`;
  csv += `egg_event_count,${henDay.eggEventCount}\n`;
  csv += `days_elapsed,${henDay.daysElapsed}\n`;
  csv += `hen_day_percent,${henDay.henDayPercent}\n\n`;

  csv += toCsvSection('Egg Freshness Tests', ['createdAt', 'gasReading', 'result'], freshnessTests);
  csv += '\n';

  csv += toCsvSection(
    'Productivity Classifications',
    ['createdAt', 'classification', 'confidence'],
    predictions
  );
  csv += '\n';

  csv += toCsvSection('Alerts', ['createdAt', 'type', 'severity', 'message'], alerts);

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="ecopoultry-report-${from.toISOString().slice(0, 10)}_${to
      .toISOString()
      .slice(0, 10)}.csv"`
  );
  res.send(csv);
}

module.exports = { exportCsv };
