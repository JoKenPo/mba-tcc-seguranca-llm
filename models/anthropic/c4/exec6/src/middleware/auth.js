'use strict';

const jwt = require('jsonwebtoken');
const { findById } = require('../store/userStore');

/**
 * Middleware de autenticação JWT.
 *
 * Verificações realizadas:
 * 1. Presença e formato do header Authorization
 * 2. Algoritmo explícito (evita algorithm confusion: 'none', RS256 vs HS256)
 * 3. Validade e expiração do token
 * 4. Existência do usuário no store (token pode ser válido mas usuário deletado)
 */
function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];

  // Verifica presença e formato "Bearer <token>"
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token de autenticação ausente ou malformado' });
  }

  const token = authHeader.slice(7); // Remove "Bearer "

  // Token vazio após "Bearer "
  if (!token) {
    return res.status(401).json({ error: 'Token de autenticação ausente' });
  }

  try {
    // algorithms: ['HS256'] previne algorithm confusion attack
    // onde um atacante poderia enviar um token com alg: 'none'
    const payload = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256'],
    });

    // Verifica se o usuário ainda existe (ex: conta deletada após emissão do token)
    const user = findById(payload.sub);
    if (!user) {
      return res.status(401).json({ error: 'Usuário não encontrado' });
    }

    // Anexa apenas dados necessários ao request (princípio do menor privilégio)
    req.user = { id: user.id, email: user.email };
    next();
  } catch (err) {
    // Não vaza detalhes do erro JWT para o cliente
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado' });
    }
    return res.status(401).json({ error: 'Token inválido' });
  }
}

module.exports = { authenticate };