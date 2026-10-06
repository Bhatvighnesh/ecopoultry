/**
 * Sensor simulator - stands in for the ESP32 nodes described in the README
 * so the system can be demoed/tested before real hardware is wired up.
 * Posts to the same ingestion endpoints at the same cadence real nodes would.
 *
 * Usage: node scripts/simulate-sensors.js [--url http://localhost:5000]
 */
require('dotenv').config();
const axios = require('axios');

const BASE_URL = process.argv.includes('--url')
  ? process.argv[process.argv.indexOf('--url') + 1]
  : process.env.SIMULATOR_TARGET_URL || 'http://localhost:5000';

// Skip fake environment readings when real hardware (e.g. an ESP32 coop node)
// is already posting temp/humidity/gas - avoids fighting over the fan relay
// and mixing fake spikes into a real live chart.
const SKIP_ENV = process.argv.includes('--no-env');

let feedWeight = 5000; // grams in the tray
let wasteWeight = 500; // grams accumulated
let tick = 0;

function rand(min, max) {
  return min + Math.random() * (max - min);
}

async function postEnvironment() {
  // Spike gas/temperature every 15s (every 3rd 5s tick) to demonstrate the closed-loop alert + fan response.
  const spike = tick % 3 === 0;
  const payload = {
    temperature: spike ? rand(37, 41) : rand(24, 31),
    humidity: rand(45, 70),
    gas: spike ? rand(2400, 3200) : rand(400, 1300),
    activity: rand(2, 20),
    nodeId: 'demo-coop-1',
  };
  try {
    const { data } = await axios.post(`${BASE_URL}/api/sensors/environment`, payload);
    console.log(`[env] temp=${payload.temperature.toFixed(1)} gas=${payload.gas.toFixed(0)} -> ${data.status}`);
  } catch (err) {
    console.error('[env] failed:', err.message);
  }
}

// Scaled for a ~100-bird flock: ~120-150 g/bird/day feed intake and
// ~150-200 g/bird/day waste output, spread across 5s ticks.
async function postFeed() {
  feedWeight -= rand(0, 0.9); // ~0.45g/tick avg * 17280 ticks/day ~= 7.8kg/day
  if (feedWeight < 500) feedWeight = 5000; // refill
  try {
    await axios.post(`${BASE_URL}/api/sensors/feed`, { weight: Math.max(feedWeight, 0), nodeId: 'demo-feed-1' });
  } catch (err) {
    console.error('[feed] failed:', err.message);
  }
}

async function postWaste() {
  wasteWeight += rand(0, 1.2); // ~0.6g/tick avg * 17280 ticks/day ~= 10.4kg/day
  if (wasteWeight > 4000) wasteWeight = 200; // tray emptied
  try {
    await axios.post(`${BASE_URL}/api/sensors/waste`, { weight: wasteWeight, nodeId: 'demo-waste-1' });
  } catch (err) {
    console.error('[waste] failed:', err.message);
  }
}

async function maybePostEgg() {
  if (Math.random() < 0.15) {
    try {
      await axios.post(`${BASE_URL}/api/sensors/egg-event`, { nodeId: 'demo-egg-1' });
      console.log('[egg] event fired');
    } catch (err) {
      console.error('[egg] failed:', err.message);
    }
  }
}

async function loop() {
  tick += 1;
  const tasks = [postFeed(), postWaste(), maybePostEgg()];
  if (!SKIP_ENV) tasks.push(postEnvironment());
  await Promise.all(tasks);
}

console.log(
  `[simulator] posting to ${BASE_URL} every 5s${SKIP_ENV ? ' (env skipped - real hardware owns it)' : ''} (Ctrl+C to stop)`
);
loop();
setInterval(loop, 5000);
