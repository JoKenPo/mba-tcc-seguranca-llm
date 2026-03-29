'use strict';

const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { NODE_ENV } = require('./config/env');

const authRoutes = require('./routes/auth');

const app = express();

// ---------------------------------------------------------------------------
// CORREÇÃO 11 — Headers de segurança com Helmet.
//
// Problema original: sem Helmet, a API expõe headers padrão do Express
// como "X-Powered-By: Express", que revelam a stack tecnológica, e
// não define políticas de segurança como CSP, HSTS etc.
//
// Correção: aplicar Helmet com configuração explícita.
// ---------------------------------------------------------------------------
app.use(
  helmet({
    contentSecurityPolicy: true,
    crossOriginEmbedderPolicy: true,
    crossOriginOpenerPolicy: true,
    crossOriginResourcePolicy: { policy: 'same-origin' },
    dnsPrefetchControl: { allow: false },
    frameguard: { action: 'deny' },
    hidePoweredBy: true,        // remove X-Powered-By
    hsts: {
      maxAge: 31536000,         // 1 ano
      includeSubDomains: true,
      preload: true,
    },
    ieNoOpen: true,
    noSniff: true,              // X-Content-Type-Options: nosniff
    referrerPolicy: { policy: 'no-referrer' },
    xssFilter: true,
  })
);

// ---------------------------------------------------------------------------
// CORREÇÃO 12 — Rate limiting para prevenir força bruta e DoS.
//
// Problema original: sem rate limiting, endpoints de login e registro
// ficam expostos a ataques de força bruta e enumeração.
//
// Correção: limitar requisições por IP com janelas de tempo distintas
// para rotas sensíveis (auth) e demais rotas.
// ---------------------------------------------------------------------------
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 20,                   // máx. 20 tentativas por IP na janela
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas tentativas. Tente novamente em 15 minutos.' },
  /**
   * CORREÇÃO 13 — Não vazar detalhes do rate limit em produção.
   * Em produção, skipSuccessfulRequests evita contar logins bem-sucedidos
   * no limite, mas mantém a proteção contra tentativas falhas.
   */
  skipSuccessfulRequests: NODE_ENV === 'production',
});

const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas requisições. Tente novamente em instantes.' },
});

app.use(generalLimiter);
app.use('/login', authLimiter);
app.use('/register', authLimiter);

// ---------------------------------------------------------------------------
// CORREÇÃO 14 — Limite de tamanho do body para prevenir DoS.
//
// Problema original: sem limite, um atacante pode enviar payloads
// gigantes para esgotar memória/CPU do servidor.
//
// Correção: limitar o body a 10kb (mais que suficiente para esta API).
// ---------------------------------------------------------------------------
app.use(express.json({ limit: '10kb' }));

// ---------------------------------------------------------------------------
// CORREÇÃO 15 — Rejeitar Content-Type inesperado.
//
// Problema original: aceitar qualquer Content-Type pode levar a
// parsing inesperado ou ataques de type confusion.
//
// Correção: middleware que rejeita requisições POST/PUT/PATCH sem
// Content-Type: application/json.
// ---------------------------------------------------------------------------
app.use((req, res, next) => {
  const methodsWithBody = ['POST', 'PUT', 'PATCH'];
  if (methodsWithBody.includes(req.method)) {
    const contentType = req.headers['content-type'] || '';
    if (!contentType.includes('application/json')) {
      return res.status(415).json({ error: 'Content-Type deve ser application/json.' });
    }
  }
  next();
});

// Rotas
app.use('/', authRoutes);

// ---------------------------------------------------------------------------
// CORREÇÃO 16 — Handler de rotas não encontradas.
//
// Problema original: sem handler 404, o Express retorna sua página
// HTML padrão, que expõe informações da stack.
// ---------------------------------------------------------------------------
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada.' });
});

// ---------------------------------------------------------------------------
// CORREÇÃO 17 — Handler de erros global sem vazar stack trace.
//
// Problema original: erros não tratados podem expor stack traces
// com caminhos de arquivo, versões de dependências etc.
//
// Correção: capturar todos os erros e retornar mensagem genérica.
// O stack trace vai apenas para o log interno.
// ---------------------------------------------------------------------------
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[ERROR]', err);
  res.status(500).json({ error: 'Erro interno do servidor.' });
});

module.exports = app;