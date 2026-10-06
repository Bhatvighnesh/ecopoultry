const { getSettings, updateSettings } = require('../services/settings.service');
const { recordAudit } = require('../services/audit.service');

async function get(req, res) {
  const settings = await getSettings();
  res.json({ settings });
}

async function update(req, res) {
  const settings = await updateSettings(req.body);
  await recordAudit({ actor: req.user, action: 'settings.update', target: 'settings', details: req.body });
  res.json({ settings });
}

module.exports = { get, update };
