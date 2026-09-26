const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { requireAuth, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/actuators.controller');

router.get('/', requireAuth, ctrl.getStates);

// Open, no-auth endpoint for ESP32 nodes to poll the fan/heater state and
// drive their relay accordingly - mirrors the sensor ingestion endpoints,
// which are intentionally left open for the same reason (see README).
router.get('/device-state', ctrl.getStates);

router.post(
  '/relay',
  requireAuth,
  requireRole('admin'),
  [
    body('device').isIn(['fan', 'heater']),
    body('state').isIn(['on', 'off']),
    body('reason').optional().isString(),
  ],
  validate,
  ctrl.postCommand
);

module.exports = router;
