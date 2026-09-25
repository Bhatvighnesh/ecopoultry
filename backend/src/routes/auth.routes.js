const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { requireAuth, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/auth.controller');

router.post(
  '/login',
  [body('email').isEmail(), body('password').isString().notEmpty()],
  validate,
  ctrl.login
);

router.get('/me', requireAuth, ctrl.me);

router.post(
  '/users',
  requireAuth,
  requireRole('admin'),
  [
    body('name').isString().trim().notEmpty(),
    body('email').isEmail(),
    body('password').isString().isLength({ min: 8 }),
    body('role').optional().isIn(['admin', 'farmer']),
  ],
  validate,
  ctrl.createUser
);

module.exports = router;
