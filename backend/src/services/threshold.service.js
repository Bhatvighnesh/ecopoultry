// Pure classification functions - Admin-configurable thresholds are passed in,
// nothing here is hardcoded, so unit tests can exercise them without a DB.

function classifyEnvironmentStatus({ temperature, humidity, gas }, thresholds) {
  const { tempWarning, tempCritical, humidityWarning, humidityCritical, gasWarning, gasCritical } =
    thresholds;

  const isCritical =
    temperature >= tempCritical || humidity >= humidityCritical || gas >= gasCritical;
  if (isCritical) return 'critical';

  const isWarning =
    temperature >= tempWarning || humidity >= humidityWarning || gas >= gasWarning;
  if (isWarning) return 'warning';

  return 'safe';
}

function classifyAmmoniaZone(gas, thresholds) {
  const { moderate, high } = thresholds;
  if (gas >= high) return 'High';
  if (gas >= moderate) return 'Moderate';
  return 'Low';
}

function classifyFreshness(gas, thresholds) {
  const { fresh, checkBeforeUse } = thresholds;
  if (gas < fresh) return 'Fresh';
  if (gas < checkBeforeUse) return 'Check Before Use';
  return 'Stale';
}

function classifyFCR(fcr) {
  if (fcr < 1.8) return 'Efficient';
  if (fcr <= 2.2) return 'Average';
  return 'Needs Attention';
}

module.exports = {
  classifyEnvironmentStatus,
  classifyAmmoniaZone,
  classifyFreshness,
  classifyFCR,
};
