const Alert = require('../models/Alert');

async function list(req, res) {
  const { limit = 100, acknowledged } = req.query;
  const filter = {};
  if (acknowledged !== undefined) filter.acknowledged = acknowledged === 'true';
  const alerts = await Alert.find(filter).sort({ createdAt: -1 }).limit(Number(limit));
  res.json({ alerts });
}

async function acknowledge(req, res) {
  const alert = await Alert.findByIdAndUpdate(req.params.id, { acknowledged: true }, { new: true });
  if (!alert) return res.status(404).json({ message: 'Alert not found' });
  res.json({ alert });
}

module.exports = { list, acknowledge };
