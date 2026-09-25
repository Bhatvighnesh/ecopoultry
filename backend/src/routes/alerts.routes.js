const router = require('express').Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/alerts.controller');

router.get('/', requireAuth, ctrl.list);
router.patch('/:id/acknowledge', requireAuth, requireRole('admin'), ctrl.acknowledge);

module.exports = router;
