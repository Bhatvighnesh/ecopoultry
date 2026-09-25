const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { requireAuth, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/settings.controller');

router.get('/', requireAuth, ctrl.get); // read-only for farmers

router.put(
  '/',
  requireAuth,
  requireRole('admin'),
  [
    body('flockSize').optional().isInt({ min: 1 }),
    body('envThresholds.tempWarning').optional().isFloat(),
    body('envThresholds.tempCritical').optional().isFloat(),
    body('envThresholds.humidityWarning').optional().isFloat(),
    body('envThresholds.humidityCritical').optional().isFloat(),
    body('envThresholds.gasWarning').optional().isFloat(),
    body('envThresholds.gasCritical').optional().isFloat(),
    body('wasteAmmoniaThresholds.moderate').optional().isFloat(),
    body('wasteAmmoniaThresholds.high').optional().isFloat(),
    body('freshnessGasThresholds.fresh').optional().isFloat(),
    body('freshnessGasThresholds.checkBeforeUse').optional().isFloat(),
    body('birdWeightGain.valueKg').optional().isFloat({ min: 0 }),
    body('birdWeightGain.periodDays').optional().isInt({ min: 1 }),
  ],
  validate,
  ctrl.update
);

module.exports = router;
