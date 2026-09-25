const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const ctrl = require('../controllers/dashboard.controller');

router.get('/summary', requireAuth, ctrl.getSummary);

module.exports = router;
