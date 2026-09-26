// CORS_ORIGIN supports a single origin (unchanged behavior) or a comma-separated
// list, so both the deployed frontend and a local dev server can be allowed at once.
function getCorsOrigin() {
  const raw = process.env.CORS_ORIGIN;
  if (!raw) return '*';

  const origins = raw.split(',').map((o) => o.trim()).filter(Boolean);
  if (origins.length <= 1) return origins[0] || '*';

  return (origin, callback) => {
    if (!origin || origins.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  };
}

module.exports = { getCorsOrigin };
