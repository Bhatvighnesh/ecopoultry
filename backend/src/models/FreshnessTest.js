const mongoose = require('mongoose');

const freshnessTestSchema = new mongoose.Schema(
  {
    gasReading: { type: Number, required: true, min: 0, max: 4095 },
    result: { type: String, enum: ['Fresh', 'Check Before Use', 'Stale'], required: true },
    triggeredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

freshnessTestSchema.index({ createdAt: -1 });

module.exports = mongoose.model('FreshnessTest', freshnessTestSchema);
