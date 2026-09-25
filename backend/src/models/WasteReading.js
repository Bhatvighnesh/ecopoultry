const mongoose = require('mongoose');

const wasteReadingSchema = new mongoose.Schema(
  {
    weight: { type: Number, required: true, min: 0 }, // grams, waste tray load cell
    nodeId: { type: String, default: 'waste-tray-1' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

wasteReadingSchema.index({ createdAt: -1 });

module.exports = mongoose.model('WasteReading', wasteReadingSchema);
