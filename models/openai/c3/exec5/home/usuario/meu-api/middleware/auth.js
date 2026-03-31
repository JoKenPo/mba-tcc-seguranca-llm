const jwt = require('jsonwebtoken');
const { findById } = require('../models/user');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Middleware que verifica o header Authorization: Bearer <token>
 * Se válido, anexa `req.user` com os dados do usuário.
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  jwt.verify(token, JWT_SECRET, (err, payload) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido ou expirado' });
    }

    // payload contém { sub: userId, iat, exp }
    const user = findById(payload.sub);
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Remove a hash antes de expor ao resto da aplicação
    const { passwordHash, ...safeUser } = user;
    req.user = safeUser;
    next();
  });
}

module.exports = authenticateToken;