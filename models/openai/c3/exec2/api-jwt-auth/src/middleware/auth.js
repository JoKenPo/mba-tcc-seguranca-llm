// src/middleware/auth.js
const jwt = require('jsonwebtoken');
const { findById } = require('../utils/users');

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Middleware que verifica o header Authorization: Bearer <token>.
 * Se válido, anexa `req.user` com os dados do usuário.
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ error: 'Token missing' });
  }

  jwt.verify(token, JWT_SECRET, (err, payload) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }

    // payload contém { sub: userId, iat, exp }
    const user = findById(payload.sub);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Anexamos ao request (sem passwordHash)
    const { passwordHash, ...safeUser } = user;
    req.user = safeUser;
    next();
  });
}

module.exports = authenticateToken;