/**
 * Posts calm, always-within-normal-range environment readings to the LIVE
 * coop node (no demo- prefix) - a fallback so the Dashboard has steady data
 * to show while the real ESP32 isn't connected yet. Unlike simulate-sensors.js,
 * this never spikes into warning/critical range: it's meant to look like a
 * quiet, healthy coop, not to demonstrate the alert/fan response.
 *
 * Stop this before relying on the real ESP32 - both post to the same live
 * node ID ("coop-1" by default) and would otherwise fight each other.
 *
 * Usage: node scripts/simulate-live-calm.js [--url http://localhost:5000]
 */
require('dotenv').config();
const axios = require('axios');

const BASE_URL = process.argv.includes('--url')
  ? process.argv[process.argv.indexOf('--url') + 1]
  : process.env.SIMULATOR_TARGET_URL || 'http://localhost:5000';

function rand(min, max) {
  return min + Math.random() * (max - min);
}

// Small random-walk step instead of a fresh random value each tick, so
// readings drift smoothly (e.g. 29.0 -> 29.1) rather than jumping around.
function step(value, min, max, maxDelta) {
  const next = value + (Math.random() * 2 - 1) * maxDelta;
  return Math.min(max, Math.max(min, next));
}

// Comfortably inside the default Settings thresholds (tempCritical 36,
// gasCritical 2500, humidityCritical 80) so status always comes back "safe".
let temperature = rand(29, 30);
let humidity = rand(50, 65);
let gas = rand(500, 1100);
let activity = rand(5, 15);

async function postCalmEnvironment() {
  temperature = step(temperature, 28.5, 30.5, 0.15);
  humidity = step(humidity, 50, 65, 0.3);
  gas = step(gas, 500, 1100, 15);
  activity = step(activity, 5, 15, 0.5);

  const payload = { temperature, humidity, gas, activity };
  try {
    const { data } = await axios.post(`${BASE_URL}/api/sensors/environment`, payload);
    console.log(
      `[live-calm] temp=${payload.temperature.toFixed(1)} hum=${payload.humidity.toFixed(1)} gas=${payload.gas.toFixed(0)} -> ${data.status}`
    );
  } catch (err) {
    console.error('[live-calm] failed:', err.message);
  }
}

console.log(`[live-calm] posting steady, safe-range readings to ${BASE_URL} every 5s (Ctrl+C to stop)`);
postCalmEnvironment();
setInterval(postCalmEnvironment, 5000);
