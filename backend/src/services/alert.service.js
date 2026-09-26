const Alert = require('../models/Alert');
const { sendCriticalWhatsAppAlert } = require('./whatsapp.service');

/** Creates an alert record and broadcasts it over the shared Socket.IO instance. */
async function raiseAlert(io, { type, severity, message, source, value }) {
  const alert = await Alert.create({ type, severity, message, source, value });
  io.emit('alert:new', alert);

  if (severity === 'critical') {
    sendCriticalWhatsAppAlert(`EcoPoultry Alert\n${message}`).catch(() => {});
  }

  return alert;
}

module.exports = { raiseAlert };
