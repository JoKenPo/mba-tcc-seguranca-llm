'use strict';

const rateLimit = require('express-rate-limit');

/**
 * Limites diferenciados por rota:
 *
 * /login e /register: mais restritivos para dificultar brute force e enumeração.
 * /profile e /refresh: mais permissivos pois requerem token válido.
 *
 * Em produção, use um store distribuído (Redis) para que o limite
 * funcione corretamente com múltiplas instâncias.
 */

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // 10 tentativas por IP por janela
  standardHeaders: 'draft-7', // Retorna RateLimit-* headers (RFC padrão)
  legacyHeaders: false, // Desativa X-RateLimit-* headers legados
  message: {
    error: 'Muitas tentativas. Tente novamente em 15 minutos.',
  },
  // Não vazar informações sobre o rate limit em erros internos
  skipFailedRequests: false,
  skipSuccessfulRequests: false,
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    error: 'Muitas requisições. Tente novamente em 15 minutos.',
  },
});

module.exports = { authLimiter, generalLimiter };