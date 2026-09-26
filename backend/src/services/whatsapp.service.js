const twilio = require('twilio');

let client = null;
let lastSentAt = 0;
// Avoid spamming WhatsApp on a sustained critical streak - environment readings
// come in every 5s, but the same condition doesn't need a fresh message each time.
const COOLDOWN_MS = 2 * 60 * 1000;

function getClient() {
  if (client) return client;
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN } = process.env;
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) return null;
  client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  return client;
}

/** Sends a WhatsApp message for a critical alert. No-op if Twilio isn't configured. */
async function sendCriticalWhatsAppAlert(message) {
  const { TWILIO_WHATSAPP_FROM, TWILIO_WHATSAPP_TO } = process.env;
  const twilioClient = getClient();
  if (!twilioClient || !TWILIO_WHATSAPP_FROM || !TWILIO_WHATSAPP_TO) return;

  const now = Date.now();
  if (now - lastSentAt < COOLDOWN_MS) return;
  lastSentAt = now;

  try {
    await twilioClient.messages.create({
      from: TWILIO_WHATSAPP_FROM,
      to: TWILIO_WHATSAPP_TO,
      body: message,
    });
  } catch (err) {
    console.error('[whatsapp] failed to send alert:', err.message);
  }
}

module.exports = { sendCriticalWhatsAppAlert };
