const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { requireAuth, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/users.controller');

router.use(requireAuth, requireRole('admin'));

router.get('/', ctrl.listUsers);
router.patch('/:id/active', [body('active').isBoolean()], validate, ctrl.setActive);

module.exports = router;
