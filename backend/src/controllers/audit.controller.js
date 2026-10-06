const AuditLog = require('../models/AuditLog');

async function list(req, res) {
  const limit = Math.min(Number(req.query.limit) || 100, 500);
  const entries = await AuditLog.find().sort({ createdAt: -1 }).limit(limit);
  res.json({ entries });
}

module.exports = { list };
