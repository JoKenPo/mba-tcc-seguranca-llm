'use strict';

const express = require('express');
const helmet = require('helmet');
const authRoutes = require('./routes/auth');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Correção #7: helmet com CSP explícito.
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'none'"],
        frameAncestors: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: true,
    crossOriginOpenerPolicy: { policy: 'same-origin' },
    crossOriginResourcePolicy: { policy: 'same-origin' },
  })
);

// Correção #9: limite de 10 KB no body para evitar DoS por payload gigante.
app.use(express.json({ limit: '10kb' }));

// Rotas
app.use(authRoutes);

// Handler global de erros — deve ser o último middleware.
app.use(errorHandler);

module.exports = app;