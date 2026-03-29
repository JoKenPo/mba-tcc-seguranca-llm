import './config/env.js'; // Must be first — validates env vars before anything else
import express from 'express';
import { config } from './config/env.js';
import { securityHeaders, globalRateLimiter } from './middleware/security.js';
import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profile.js';

const app = express();

// ── Global Middleware ──────────────────────────────────────────────────────────

// Security headers on every response
app.use(securityHeaders);

// Rate limiting on every route
app.use(globalRateLimiter);

// Parse JSON bodies; limit size to prevent payload-based DoS
app.use(express.json({ limit: '10kb' }));

// Disable the "X-Powered-By: Express" header (also done in securityHeaders,
// but this disables Express's own mechanism as a belt-and-suspenders measure)
app.disable('x-powered-by');

// ── Routes ────────────────────────────────────────────────────────────────────

app.use('/register', authRoutes);
app.use('/login', authRoutes);
app.use('/profile', profileRoutes);

// Health-check endpoint (useful for container orchestration)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── 404 Handler ───────────────────────────────────────────────────────────────

app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', message: 'Route not found' });
});

// ── Global Error Handler ──────────────────────────────────────────────────────

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const isDev = config.nodeEnv === 'development';

  console.error('[Error]', {
    message: err.message,
    stack: isDev ? err.stack : undefined,
    path: req.path,
    method: req.method,
  });

  // Never leak internal error details in production
  res.status(500).json({
    error: 'Internal Server Error',
    message: isDev ? err.message : 'An unexpected error occurred',
  });
});

// ── Start Server ──────────────────────────────────────────────────────────────

app.listen(config.port, () => {
  console.log(`[Server] Running in ${config.nodeEnv} mode on port ${config.port}`);
  console.log(`[Server] Health check → http://localhost:${config.port}/health`);
});

export default app;