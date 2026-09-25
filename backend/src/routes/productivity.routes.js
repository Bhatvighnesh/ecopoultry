const router = require('express').Router();
const { query } = require('express-validator');
const validate = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const ctrl = require('../controllers/productivity.controller');

const rangeValidators = [query('from').optional().isISO8601(), query('to').optional().isISO8601()];

router.get('/fcr', requireAuth, rangeValidators, validate, ctrl.getFCR);
router.get('/henday', requireAuth, rangeValidators, validate, ctrl.getHenDay);
router.get('/predictions', requireAuth, ctrl.getPredictions);

module.exports = router;
