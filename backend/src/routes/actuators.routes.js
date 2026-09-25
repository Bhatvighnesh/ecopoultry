const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { requireAuth, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/actuators.controller');

router.get('/', requireAuth, ctrl.getStates);

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
