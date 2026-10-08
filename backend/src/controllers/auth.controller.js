const jwt = require('jsonwebtoken');
const User = require('../models/User');

function signToken(user) {
  return jwt.sign({ sub: user._id.toString(), role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

function sanitize(user) {
  return { id: user._id, name: user.name, email: user.email, role: user.role, active: user.active };
}

async function login(req, res) {
  const { email, password } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user || !user.active || !(await user.comparePassword(password))) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }
  const token = signToken(user);
  res.json({ token, user: sanitize(user) });
}

async function me(req, res) {
  res.json({ user: sanitize(req.user) });
}

/** Admin-only: create a Farmer (or Admin) account. */
async function createUser(req, res) {
  const { name, email, password, role } = req.body;
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) return res.status(409).json({ message: 'Email already in use' });

  const user = await User.create({ name, email, password, role: role || 'farmer' });
  res.status(201).json({ user: sanitize(user) });
}

module.exports = { login, me, createUser, sanitize };
