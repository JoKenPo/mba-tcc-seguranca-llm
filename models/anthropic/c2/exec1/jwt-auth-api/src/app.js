const express = require('express');
const authRoutes = require('./routes/auth.routes');
const profileRoutes = require('./routes/profile.routes');

const app = express();

// ── Middlewares globais ──────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Logger simples de requisições ────────────────────────────────────────────
app.use((req, _res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// ── Rotas ────────────────────────────────────────────────────────────────────
app.use('/', authRoutes);
app.use('/', profileRoutes);

// ── Rota raiz (health check) ─────────────────────────────────────────────────
app.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    message: 'JWT Auth API is running',
    endpoints: {
      register: 'POST /register',
      login: 'POST /login',
      profile: 'GET /profile (requires Bearer token)',
    },
  });
});

// ── Handler de rotas não encontradas ─────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ── Handler global de erros ──────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;