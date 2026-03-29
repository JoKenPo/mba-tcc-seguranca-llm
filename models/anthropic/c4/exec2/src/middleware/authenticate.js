'use strict';

const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');

/**
 * CORREÇÃO 2 — Algoritmo JWT explícito na verificação.
 *
 * Problema original: omitir o campo `algorithms` permite o ataque
 * "algorithm confusion" — um atacante poderia forjar tokens usando
 * o algoritmo "none" (sem assinatura) em implementações vulneráveis.
 *
 * Correção: sempre especificar o(s) algoritmo(s) aceitos.
 *
 * CORREÇÃO 3 — Mensagem de erro genérica.
 *
 * Problema original: retornar a mensagem interna do JWT (ex.:
 * "jwt expired", "invalid signature") vaza informações sobre o
 * mecanismo de autenticação.
 *
 * Correção: responder sempre com mensagem genérica; detalhe vai
 * apenas para o log interno.
 */
function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token não fornecido.' });
  }

  const token = authHeader.slice(7); // remove "Bearer "

  try {
    const payload = jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS256'], // CORREÇÃO 2
    });

    req.user = { id: payload.sub, email: payload.email };
    next();
  } catch (err) {
    console.warn('[AUTH] Falha na verificação do token:', err.message); // log interno
    return res.status(401).json({ error: 'Token inválido ou expirado.' }); // CORREÇÃO 3
  }
}

module.exports = authenticate;