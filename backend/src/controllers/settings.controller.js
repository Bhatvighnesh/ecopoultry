const { getSettings, updateSettings } = require('../services/settings.service');

async function get(req, res) {
  const settings = await getSettings();
  res.json({ settings });
}

async function update(req, res) {
  const settings = await updateSettings(req.body);
  res.json({ settings });
}

module.exports = { get, update };
