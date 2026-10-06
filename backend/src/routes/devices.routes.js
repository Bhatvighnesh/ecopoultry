const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const ctrl = require('../controllers/devices.controller');

router.get('/', requireAuth, ctrl.list);

module.exports = router;
