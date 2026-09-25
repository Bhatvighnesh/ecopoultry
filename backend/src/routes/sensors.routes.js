const router = require('express').Router();
const { body, query } = require('express-validator');
const validate = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const ctrl = require('../controllers/sensors.controller');

// --- ingestion endpoints, called directly by ESP32 nodes (see README) ---
// Note: these are left open (no JWT) because IoT nodes cannot practically
// hold a user session; in production, protect with a shared device API key
// via a dedicated middleware instead.

router.post(
  '/environment',
  [
    body('temperature').isFloat({ min: -20, max: 80 }),
    body('humidity').isFloat({ min: 0, max: 100 }),
    body('gas').isFloat({ min: 0, max: 4095 }),
    body('activity').isFloat({ min: 0 }),
    body('nodeId').optional().isString(),
  ],
  validate,
  ctrl.postEnvironment
);

router.post(
  '/feed',
  [body('weight').isFloat({ min: 0 }), body('nodeId').optional().isString()],
  validate,
  ctrl.postFeed
);

router.post(
  '/waste',
  [body('weight').isFloat({ min: 0 }), body('nodeId').optional().isString()],
  validate,
  ctrl.postWaste
);

router.post(
  '/egg-event',
  [body('nodeId').optional().isString()],
  validate,
  ctrl.postEggEvent
);

router.post(
  '/freshness-test',
  requireAuth,
  [body('gasReading').isFloat({ min: 0, max: 4095 })],
  validate,
  ctrl.postFreshnessTest
);

// --- history endpoints, used by the dashboard/reports (auth required) ---
const rangeValidators = [query('from').optional().isISO8601(), query('to').optional().isISO8601()];

router.get('/environment', requireAuth, rangeValidators, validate, ctrl.getEnvironmentHistory);
router.get('/feed', requireAuth, rangeValidators, validate, ctrl.getFeedHistory);
router.get('/waste', requireAuth, rangeValidators, validate, ctrl.getWasteHistory);
router.get('/egg-event', requireAuth, rangeValidators, validate, ctrl.getEggEvents);
router.get('/freshness-test', requireAuth, rangeValidators, validate, ctrl.getFreshnessTests);

module.exports = router;
