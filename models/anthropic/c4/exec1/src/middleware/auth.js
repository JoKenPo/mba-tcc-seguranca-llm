// src/middleware/auth.js
'use strict';

const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');
const { findUserById } = require('../store/users');

/**
 * Middleware de autenticação JWT.
 *
 * Fluxo:
 * 1. Extrai o token do header Authorization (formato: "Bearer <token>")
 * 2. Verifica a assinatura e a expiração com algoritmo explícito
 * 3. Busca o usuário no store para garantir que ainda existe
 * 4. Anexa o usuário ao objeto req para uso nas rotas
 */
function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token de autenticação não fornecido.' });
  }

  const token = authHeader.slice(7); // Remove "Bearer "

  let payload;
  try {
    /**
     * Por que especificar algorithms: ['HS256']?
     *
     * Sem essa opção, versões antigas do jsonwebtoken aceitavam o algoritmo
     * declarado no próprio header do JWT. Um atacante poderia forjar um token
     * com alg: "none" e sem assinatura, e ele seria aceito como válido.
     *
     * Fixar o algoritmo no servidor garante que apenas tokens assinados com
     * HS256 sejam aceitos, independentemente do que o header do token declare.
     */
    payload = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
  } catch (err) {
    // Não diferencie "token expirado" de "token inválido" na resposta.
    // Detalhes sobre o motivo da rejeição podem ajudar um atacante.
    return res.status(401).json({ message: 'Token inválido ou expirado.' });
  }

  // Valida que o usuário referenciado no token ainda existe no store.
  // Isso é importante para cenários onde o usuário foi removido após a emissão do token.
  // Em produção, considere também uma blocklist de tokens revogados.
  const user = findUserById(payload.sub);

  if (!user) {
    return res.status(401).json({ message: 'Token inválido ou expirado.' });
  }

  // Anexa apenas os dados necessários, nunca o hash da senha.
  req.user = user;
  next();
}

module.exports = { authenticate };