'use strict';

const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');
const userStore = require('../store/users');

// Correção #2: algoritmo fixado explicitamente para evitar ataque "alg: none"
// e confusão entre HS256 e RS256.
module.exports = function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token ausente ou malformado.' });
  }

  const token = authHeader.slice(7); // Remove "Bearer "

  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido ou expirado.' });
  }

  const user = userStore.findById(payload.sub);
  if (!user) {
    return res.status(401).json({ error: 'Usuário não encontrado.' });
  }

  req.user = user;
  next();
};