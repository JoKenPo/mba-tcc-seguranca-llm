// src/app.js
'use strict';

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');

const { CORS_ORIGIN, IS_PRODUCTION } = require('./config');
const authRoutes = require('./routes/auth');

const app = express();

// ---------------------------------------------------------------------------
// Headers de segurança (helmet)
// ---------------------------------------------------------------------------

/**
 * helmet configura vários headers HTTP de segurança:
 *
 * - Content-Security-Policy: restringe de onde recursos podem ser carregados.
 *   Mesmo sendo uma API (sem HTML), é boa prática definir uma política restritiva.
 * - X-Content-Type-Options: nosniff — impede que o browser "adivinhe" o MIME type.
 * - X-Frame-Options: DENY — impede que a página seja carregada em iframes (clickjacking).
 * - Strict-Transport-Security: força HTTPS em produção.
 * - X-Powered-By: removido — não revele que usa Express.
 */
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'none'"],
        frameAncestors: ["'none'"],
      },
    },
    // HSTS só faz sentido em produção (com HTTPS configurado).
    hsts: IS_PRODUCTION
      ? { maxAge: 31536000, includeSubDomains: true, preload: true }
      : false,
  })
);

// ---------------------------------------------------------------------------
// CORS
// ---------------------------------------------------------------------------

/**
 * Por que restringir o CORS?
 *
 