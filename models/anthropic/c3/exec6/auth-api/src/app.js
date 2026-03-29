'use strict';

// Config must be loaded first to validate environment variables
const config = require('./config/env');

const express = require('express');
const { helmetMiddleware, generalRateLimit } = require('./middleware/security');
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');

const app = express();

// ─── Security Middleware ────────────────────────────────────────────────────
app.use(helmetMiddleware);
app.use(generalRateLimit);

// Disable X-Powered-By to avoid leaking server info
app.disable('x-powered-by');

// ─── Body Parsing ───────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' })); // Limit payload size to prevent DoS
app.use(express.urlencoded({ extended: false, limit: '10kb' }));

// ─── Routes ─────────────────────────────────────────────────────────────────
app.use('/', authRoutes);
app.use('/', profileRoutes);

// ─── Health Check ────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: config.server.nodeEnv,
  });
});

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found.`,
  });
});

// ─── Global Error Handler ────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const isDev = config.server.isDevelopment;

  console.error(`[${new Date().toISOString()}] Error:`, err.message);

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal server error.',
    // Only expose stack traces in development
    ...(isDev && { stack: err.stack }),
  });
});

// ─── Server Bootstrap ────────────────────────────────────────────────────────
if (require.main === module) {
  const { port } = config.server;

  app.listen(port, () => {
    console.log(`
╔══════════════════════════════════════════╗
║           Auth API is running            ║
╠══════════════════════════════════════════╣
║  URL:  http://localhost:${port}             ║
║  ENV:  ${config.server.nodeEnv.padEnd(34)}║
╚══════════════════════════════════════════╝

Available routes:
  POST   /register  → Create account
  POST   /login     → Authenticate
  GET    /profile   → Protected profile (requires Bearer token)
  GET    /health    → Health check
    `);
  });
}

module.exports = app;