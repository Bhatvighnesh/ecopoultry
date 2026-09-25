const mongoose = require('mongoose');

// Stores every ML classifier call for traceability: inputs, output, confidence,
// and the feature importances used to explain the result on the dashboard.
const productivityPredictionSchema = new mongoose.Schema(
  {
    features: {
      temperature: { type: Number, required: true },
      humidity: { type: Number, required: true },
      gas: { type: Number, required: true },
      activity: { type: Number, required: true },
      feedTrend: { type: Number, required: true }, // recent feed consumption rate, g/hr
    },
    classification: { type: String, enum: ['Healthy', 'Watch', 'Critical'], required: true },
    confidence: { type: Number, required: true, min: 0, max: 1 },
    featureImportances: {
      temperature: Number,
      humidity: Number,
      gas: Number,
      activity: Number,
      feedTrend: Number,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

productivityPredictionSchema.index({ createdAt: -1 });

module.exports = mongoose.model('ProductivityPrediction', productivityPredictionSchema);
