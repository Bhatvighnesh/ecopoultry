const mongoose = require('mongoose');

const environmentReadingSchema = new mongoose.Schema(
  {
    temperature: { type: Number, required: true }, // deg C, DHT11
    humidity: { type: Number, required: true }, // % RH, DHT11
    gas: { type: Number, required: true, min: 0, max: 4095 }, // MQ135 raw ADC
    activity: { type: Number, required: true, min: 0 }, // PIR count/min
    status: { type: String, enum: ['safe', 'warning', 'critical'], required: true },
    nodeId: { type: String, default: 'coop-1' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

environmentReadingSchema.index({ createdAt: -1 });

module.exports = mongoose.model('EnvironmentReading', environmentReadingSchema);
