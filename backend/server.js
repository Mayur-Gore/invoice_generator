require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const dbOperations = require('./db/operations');

// Route handlers
const authRoutes = require('./routes/authRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB eagerly on startup
connectDB();

// Configure CORS for separated frontend (Vercel) and local development
const allowedOrigins = [
  // Always allow any Vercel preview/production deployment
  /^https:\/\/[a-z0-9-]+(\.vercel\.app)$/i,
  // Always allow localhost dev servers
  /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i,
];

// Also allow any extra origins specified via FRONTEND_URL env var (comma-separated)
const extraOrigins = (process.env.FRONTEND_URL || '')
  .split(',')
  .map((o) => o.trim().replace(/\/+$/, ''))
  .filter((o) => o && !o.includes('your-frontend.vercel.app'));

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (curl, Postman, server-to-server)
      if (!origin) return callback(null, true);
      const clean = origin.replace(/\/+$/, '');
      // Check regex patterns
      if (allowedOrigins.some((p) => p.test(clean))) return callback(null, true);
      // Check exact string matches from env var
      if (extraOrigins.includes(clean)) return callback(null, true);
      return callback(new Error('Not allowed by CORS: ' + origin));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Ensure MongoDB connection is ready before handling API routes
app.use('/api', async (req, res, next) => {
  try {
    await connectDB();
  } catch (err) {
    console.error('MongoDB middleware error:', err.message);
  }
  next();
});

// Health check endpoints for Render
app.get('/', (req, res) => {
  res.json({
    success: true,
    service: 'Techwave Invoice & Quotation API',
    dbConnected: dbOperations.isConnected()
  });
});

app.get('/health', async (req, res) => {
  await connectDB();
  res.json({
    success: true,
    status: 'ok',
    dbConnected: dbOperations.isConnected()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/invoices', invoiceRoutes);

// 404 JSON fallback
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`🚀 Techwave Invoice API running on port ${PORT}`);
    console.log(`🩺 Health check: http://localhost:${PORT}/health`);
    console.log(`======================================================\n`);
  });
}

module.exports = app;
