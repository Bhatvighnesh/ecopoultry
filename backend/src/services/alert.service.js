const Alert = require('../models/Alert');

/** Creates an alert record and broadcasts it over the shared Socket.IO instance. */
async function raiseAlert(io, { type, severity, message, source, value }) {
  const alert = await Alert.create({ type, severity, message, source, value });
  io.emit('alert:new', alert);
  return alert;
}

module.exports = { raiseAlert };
