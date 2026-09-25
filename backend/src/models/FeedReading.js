const mongoose = require('mongoose');

const feedReadingSchema = new mongoose.Schema(
  {
    weight: { type: Number, required: true, min: 0 }, // grams, feed tray load cell
    nodeId: { type: String, default: 'feed-tray-1' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

feedReadingSchema.index({ createdAt: -1 });

module.exports = mongoose.model('FeedReading', feedReadingSchema);
