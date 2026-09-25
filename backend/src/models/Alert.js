const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['environment', 'productivity'], required: true },
    severity: { type: String, enum: ['warning', 'critical'], required: true },
    message: { type: String, required: true },
    source: { type: String, required: true }, // e.g. 'temperature', 'gas', 'ml-classifier'
    value: { type: Number },
    acknowledged: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

alertSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Alert', alertSchema);
