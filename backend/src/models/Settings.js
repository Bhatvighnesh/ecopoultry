const mongoose = require('mongoose');

// Singleton document (there is always exactly one Settings row, enforced in
// settings.service by always upserting the same fixed _id).
const settingsSchema = new mongoose.Schema(
  {
    singletonKey: { type: String, default: 'singleton', unique: true },

    flockSize: { type: Number, required: true, default: 100, min: 1 },

    envThresholds: {
      tempWarning: { type: Number, default: 32 },
      tempCritical: { type: Number, default: 36 },
      humidityWarning: { type: Number, default: 70 },
      humidityCritical: { type: Number, default: 80 },
      gasWarning: { type: Number, default: 1500 },
      gasCritical: { type: Number, default: 2500 },
    },

    // Ammonia-based waste buildup zones, read from the same coop MQ135 sensor.
    wasteAmmoniaThresholds: {
      moderate: { type: Number, default: 1200 }, // below this => Low
      high: { type: Number, default: 2200 }, // below this => Moderate, at/above => High
    },

    // Egg freshness classification thresholds (dedicated MQ135 sensor reading).
    freshnessGasThresholds: {
      fresh: { type: Number, default: 800 }, // below this => Fresh
      checkBeforeUse: { type: Number, default: 1600 }, // below this => Check Before Use, at/above => Stale
    },

    // Updated occasionally by the admin after manually weighing a bird sample.
    birdWeightGain: {
      valueKg: { type: Number, default: 0.5 },
      periodDays: { type: Number, default: 7 }, // the period over which this gain was measured
      updatedAt: { type: Date, default: Date.now },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Settings', settingsSchema);
