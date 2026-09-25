const { validationResult } = require('express-validator');

/** Runs after an array of express-validator checks; short-circuits with 400 on failure. */
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
  }
  next();
}

module.exports = validate;
