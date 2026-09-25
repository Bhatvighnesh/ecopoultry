const ActuatorState = require('../models/ActuatorState');

async function getCurrentState(device) {
  const latest = await ActuatorState.findOne({ device }).sort({ createdAt: -1 }).lean();
  return latest ? latest.state : 'off';
}

async function getAllCurrentStates() {
  const devices = ['fan', 'heater'];
  const states = await Promise.all(devices.map((d) => getCurrentState(d)));
  return Object.fromEntries(devices.map((d, i) => [d, states[i]]));
}

/**
 * Commands a relay. Only writes/broadcasts when the state actually changes,
 * so the closed-loop trigger in sensors.controller can be called on every
 * reading without flooding the log or the socket.
 */
async function commandActuator(io, { device, state, reason, triggeredBy = 'auto' }) {
  const current = await getCurrentState(device);
  if (current === state) return null;

  const entry = await ActuatorState.create({ device, state, reason, triggeredBy });
  io.emit('actuator:update', entry);
  return entry;
}

module.exports = { getCurrentState, getAllCurrentStates, commandActuator };
