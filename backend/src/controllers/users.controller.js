const User = require('../models/User');
const { sanitize } = require('./auth.controller');
const { recordAudit } = require('../services/audit.service');

async function listUsers(req, res) {
  const users = await User.find().sort({ createdAt: -1 });
  res.json({ users: users.map(sanitize) });
}

async function setActive(req, res) {
  const { id } = req.params;
  const { active } = req.body;
  const user = await User.findByIdAndUpdate(id, { active }, { new: true });
  if (!user) return res.status(404).json({ message: 'User not found' });
  await recordAudit({
    actor: req.user,
    action: active ? 'user.enable' : 'user.disable',
    target: user.email,
    details: { active },
  });
  res.json({ user: sanitize(user) });
}

module.exports = { listUsers, setActive };
