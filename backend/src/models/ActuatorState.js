const mongoose = require('mongoose');

// Append-only log of relay commands. The "current" state of a device is its
// most recent entry (see actuators.controller#getCurrentStates).
const actuatorStateSchema = new mongoose.Schema(
  {
    device: { type: String, enum: ['fan', 'heater'], required: true },
    state: { type: String, enum: ['on', 'off'], required: true },
    reason: { type: String, required: true },
    triggeredBy: { type: String, enum: ['auto', 'manual'], default: 'auto' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

actuatorStateSchema.index({ device: 1, createdAt: -1 });

module.exports = mongoose.model('ActuatorState', actuatorStateSchema);
