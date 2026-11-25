require('dotenv').config();
const dns = require('dns');
const mongoose = require('mongoose');

// Fix for Node.js "querySrv ECONNREFUSED" on Windows / ISP networks:
// Only override DNS servers locally on Windows so serverless environments use native DNS.
if (process.platform === 'win32') {
  try {
    dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
  } catch (e) {
    console.warn('Note: Unable to override DNS servers:', e.message);
  }
}

// Cache connection promise across serverless invocations (Vercel warm starts)
let cached = global.__mongooseCache;
if (!cached) {
  cached = global.__mongooseCache = { conn: null, promise: null };
}

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb+srv://goremayur408_db_user:<db_password>@cluster0.xztxgey.mongodb.net/techwave_invoice?retryWrites=true&w=majority';

  if (!uri || uri.includes('<db_password>')) {
    console.log('------------------------------------------------------------------');
    console.log('⚠️  [MongoDB Config Notice]');
    console.log('   MONGODB_URI is not configured (still has <db_password> placeholder).');
    console.log('   Set MONGODB_URI in .env (local) or Vercel Environment Variables.');
    console.log('------------------------------------------------------------------');
    return false;
  }

  if (mongoose.connection.readyState === 1 && cached.conn) {
    return true;
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(uri, {
        serverSelectionTimeoutMS: 10000
      })
      .then((conn) => {
        console.log(`✅ [MongoDB Connected] Host: ${conn.connection.host} | Database: ${conn.connection.name}`);
        cached.conn = conn;
        return conn;
      })
      .catch((error) => {
        cached.promise = null;
        cached.conn = null;
        console.error('❌ [MongoDB Connection Error]:', error.message);
        return null;
      });
  }

  const conn = await cached.promise;
  return Boolean(conn && mongoose.connection.readyState === 1);
};

module.exports = connectDB;
