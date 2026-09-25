const { getAllCurrentStates, commandActuator } = require('../services/actuator.service');
const { getIO } = require('../sockets');

async function getStates(req, res) {
  const states = await getAllCurrentStates();
  res.json({ states });
}

/** Manual override endpoint, used by Admin from the dashboard. */
async function postCommand(req, res) {
  const { device, state, reason } = req.body;
  const entry = await commandActuator(getIO(), {
    device,
    state,
    reason: reason || `manual override by ${req.user.email}`,
    triggeredBy: 'manual',
  });
  res.status(201).json({ entry: entry || { message: 'No change - device already in requested state' } });
}

module.exports = { getStates, postCommand };
