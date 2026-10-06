const AuditLog = require('../models/AuditLog');

async function recordAudit({ actor, action, target = '', details = {} }) {
  return AuditLog.create({ actorId: actor._id, actorEmail: actor.email, action, target, details });
}

module.exports = { recordAudit };
