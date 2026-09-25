const router = require('express').Router();
const { query } = require('express-validator');
const validate = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const ctrl = require('../controllers/reports.controller');

router.get(
  '/export.csv',
  requireAuth,
  [query('from').optional().isISO8601(), query('to').optional().isISO8601()],
  validate,
  ctrl.exportCsv
);

module.exports = router;
