'use strict';

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

// ─── Headers de Segurança ────────────────────────────────────────────────────
// helmet configura automaticamente: X-Frame-Options, X-Content-Type-Options,
// Strict-Transport-Security, X-XSS-Protection, Referrer-Policy, etc.
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'none'"],
        frameAncestors: ["'none'"], // Equivalente a X-Frame-Options: DENY
      },
    },
    // HSTS: força HTTPS por 1 ano (ativar apenas em produção com HTTPS real)
    hsts: process.env.NODE_ENV === 'production'
      ? { maxAge: 31536000, includeSubDomains: true, preload: true }
      : false,
  })
);

// ─── CORS ────────────────────────────────────────────────────────────────────
// Nunca usar '*' em APIs autenticadas.
// A origem é lida de variável de ambiente para flexibilidade entre ambientes.
const corsOptions = {
  origin: (origin, callback) => {
    const allowed = process.env.ALLOWED_ORIGIN;

    // Permite requisições sem origin (ex: curl, Postman) apenas em desenvolvimento
    if (!origin && process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }

    if (origin === allowed) {
      return callback(null, true);
    }

    callback(new Error('Origem não permitida pelo CORS'));
  },
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  // Não expor headers desnecessários
  exposedHeaders: [],
  // Não permitir cookies cross-origin (não usamos cookies aqui)
  credentials: false,
};

app.use(cors(corsOptions));

// ─── Body Parser ─────────────────────────────────────────────────────────────
// Limite de 10kb previne ataques de DoS por payload gigante
app.use(express.json({ limit: '10kb' }));

// ─── Rotas ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);

// Rota catch-all: evita vazar informações sobre rotas inexistentes
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Recurso não encontrado' });
});

// ─── Handler de Erros Centralizado ───────────────────────────────────────────
// Deve ser o último middleware registrado
app.use(errorHandler);

module.exports = app;