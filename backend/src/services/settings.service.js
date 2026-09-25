const Settings = require('../models/Settings');

const SINGLETON_KEY = 'singleton';

async function getSettings() {
  let settings = await Settings.findOne({ singletonKey: SINGLETON_KEY });
  if (!settings) {
    settings = await Settings.create({ singletonKey: SINGLETON_KEY });
  }
  return settings;
}

async function updateSettings(patch) {
  const settings = await getSettings();
  Object.assign(settings, patch);
  if (patch.birdWeightGain) {
    settings.birdWeightGain = {
      ...settings.birdWeightGain.toObject(),
      ...patch.birdWeightGain,
      updatedAt: new Date(),
    };
  }
  await settings.save();
  return settings;
}

module.exports = { getSettings, updateSettings };
