'use strict';

const express    = require('express');
const helmet     = require('helmet');
const cors       = require('cors');
const authRouter    = require('./routes/auth');
const profileRouter = require('./routes/profile');

const app = express();

// ─── Security Headers ────────────────────────────────────────────────────────
// Security fix: helmet sets X-Content-Type-Options, X-Frame-Options,
// Strict-Transport-Security, and more — preventing a class of common attacks.
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'none'"],
      frameAncestors: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: { policy: 'same-origin' },
  crossOriginResourcePolicy: { policy: 'same-origin' },
}));

// ─── CORS ─────────────────────────────────────────────────────────────────────
// Security fix: wildcard CORS (*) allows any origin to call the API.
// Restricting to ALLOWED_ORIGIN prevents unauthorized cross-origin requests.
app.use(cors({
  origin: process.env.ALLOWED_ORIGIN,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false,
}));

// ─── Body Parser ──────────────────────────────────────────────────────────────
// Security fix: without a size limit, an attacker can send a huge JSON payload
// to exhaust memory (DoS). 10 kb is sufficient for auth payloads.
app.use(express.json({ limit: '10kb' }));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/', authRouter);
app.use('/', profileRouter);

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
// Security fix: default Express error handler leaks stack traces to the client.
// We log internally and return a generic message.
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[error]', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;