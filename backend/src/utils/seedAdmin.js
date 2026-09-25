// One-off script: creates the first Admin account so the app is usable
// before any users exist. Run with `npm run seed:admin`.
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');

async function run() {
  await connectDB();
  const email = (process.env.SEED_ADMIN_EMAIL || 'admin@ecopoultry.local').toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD || 'ChangeMe123!';

  const existing = await User.findOne({ email });
  if (existing) {
    console.log(`[seed] Admin already exists: ${email}`);
  } else {
    await User.create({ name: 'Admin', email, password, role: 'admin' });
    console.log(`[seed] Created admin: ${email} / ${password}`);
  }
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
