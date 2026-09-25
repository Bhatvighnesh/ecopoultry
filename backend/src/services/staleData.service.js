// Tracks the last-seen timestamp per sensor node in memory. The dashboard
// polls GET /api/dashboard/summary which reports staleness per node using
// STALE_DATA_MS from the environment (default 20s).

const lastSeen = new Map();

function markSeen(nodeKey) {
  lastSeen.set(nodeKey, Date.now());
}

function getStatus(nodeKey) {
  const staleMs = Number(process.env.STALE_DATA_MS || 20000);
  const ts = lastSeen.get(nodeKey);
  if (!ts) return { seen: false, stale: true, lastSeenAt: null };
  const stale = Date.now() - ts > staleMs;
  return { seen: true, stale, lastSeenAt: new Date(ts) };
}

function getAllStatuses(nodeKeys) {
  return Object.fromEntries(nodeKeys.map((key) => [key, getStatus(key)]));
}

module.exports = { markSeen, getStatus, getAllStatuses };
