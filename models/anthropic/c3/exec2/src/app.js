import './config/env.js'; // Must be first — validates env vars on startup
import express from 'express';
import { config } from './config/env.js';
import { helmetMiddleware, globalRateLimiter } from './middleware/security.js';
import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profile.js';

const app = express();

// ─── Security Middleware ───────────────────────────────────────────────────────
app.use(helmetMiddleware);
app.use(globalRateLimiter);

// Disable X-Powered-By header to avoid fingerprinting
app.disable('x-powered-by');

// ─── Body Parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' })); // Limit body size to prevent DoS
app.use(express.urlencoded({ extended: false, limit: '10kb' }));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/', authRoutes);
app.use('/', profileRoutes);

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    environment: config.nodeEnv,
    timestamp: new Date().toISOString(),
  });
});

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} does not exist`,
  });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  console.error('[Unhandled Error]', err);

  // Never expose stack traces in production
  const response = {
    error: 'Internal Server Error',
    message: config.isProduction ? 'An unexpected error occurred' : err.message,
  };

  if (!config.isProduction) {
    response.stack = err.stack;
  }

  res.status(err.status || 500).json(response);
});

// ─── Start Server ─────────────────────────────────────────────────────────────
app.listen(config.port, () => {
  console.log(`✅ Server running on http://localhost:${config.port}`);
  console.log(`🌍 Environment: ${config.nodeEnv}`);
  console.log(`🔒 JWT expiration: ${config.jwt.expiresIn}`);
});

export default app;