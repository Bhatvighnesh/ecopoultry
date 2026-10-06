const EnvironmentReading = require('../models/EnvironmentReading');
const FeedReading = require('../models/FeedReading');
const WasteReading = require('../models/WasteReading');
const EggEvent = require('../models/EggEvent');

// Egg events are fired per egg, so silence is normal - those nodes are shown as event-driven, not offline.
const NODE_SOURCES = [
  { model: EnvironmentReading, kind: 'Coop environment node', sensors: 'DHT11, MQ135, PIR', eventDriven: false },
  { model: FeedReading, kind: 'Feed tray node', sensors: 'Load cell', eventDriven: false },
  { model: WasteReading, kind: 'Waste tray node', sensors: 'Load cell', eventDriven: false },
  { model: EggEvent, kind: 'Egg collection sensor', sensors: 'IR break-beam', eventDriven: true },
];

async function list(req, res) {
  const staleMs = Number(process.env.STALE_DATA_MS) || 20000;
  const now = Date.now();

  const groups = await Promise.all(
    NODE_SOURCES.map(async ({ model, kind, sensors, eventDriven }) => {
      const rows = await model.aggregate([
        { $group: { _id: '$nodeId', lastSeenAt: { $max: '$createdAt' }, readingCount: { $sum: 1 } } },
      ]);
      return rows.map((row) => ({
        deviceId: row._id,
        kind,
        sensors,
        lastSeenAt: row.lastSeenAt,
        readingCount: row.readingCount,
        eventDriven,
        online: eventDriven ? null : now - new Date(row.lastSeenAt).getTime() < staleMs,
      }));
    })
  );

  res.json({ devices: groups.flat() });
}

module.exports = { list };
