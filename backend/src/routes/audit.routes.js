const router = require('express').Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/audit.controller');

router.get('/', requireAuth, requireRole('admin'), ctrl.list);

module.exports = router;
