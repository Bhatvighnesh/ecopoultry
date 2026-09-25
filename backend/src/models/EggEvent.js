const mongoose = require('mongoose');

const eggEventSchema = new mongoose.Schema(
  {
    nodeId: { type: String, default: 'egg-sensor-1' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

eggEventSchema.index({ createdAt: -1 });

module.exports = mongoose.model('EggEvent', eggEventSchema);
