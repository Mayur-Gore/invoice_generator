/**
 * Helper script to insert or update user credentials in MongoDB.
 * Stores ID and Password in plain text as requested:
 * "dont add any incepretion we'll add the id and pass by our self into the database directly"
 * 
 * Usage:
 *   node seedUser.js <id> <password>
 * Example:
 *   node seedUser.js admin password123
 */

require('dotenv').config();
const dns = require('dns');
const mongoose = require('mongoose');
const User = require('./models/User');

// Configure public DNS to prevent querySrv ECONNREFUSED
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (e) {}

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri || uri.includes('<db_password>')) {
    console.log('❌ Error: MONGODB_URI in .env still has <db_password>.');
    console.log('Please replace <db_password> in .env with your actual password before running this script.');
    process.exit(1);
  }

  const loginId = process.argv[2] || 'admin';
  const loginPass = process.argv[3] || 'admin123';

  console.log(`Connecting to MongoDB Atlas...`);
  await mongoose.connect(uri);
  console.log('✓ Connected to MongoDB');

  const existing = await User.findOne({
    $or: [{ username: loginId }, { id: loginId }]
  });

  if (existing) {
    existing.password = loginPass;
    existing.pass = loginPass;
    await existing.save();
    console.log(`✓ Updated existing user '${loginId}' with password '${loginPass}' (plain text).`);
  } else {
    const user = new User({
      username: loginId,
      id: loginId,
      password: loginPass,
      pass: loginPass,
      name: 'Administrator',
      role: 'admin'
    });
    await user.save();
    console.log(`✓ Created new user '${loginId}' with password '${loginPass}' (plain text).`);
  }

  await mongoose.disconnect();
  console.log('Done!');
}

seed().catch((err) => {
  console.error('Error seeding user:', err.message);
  process.exit(1);
});
