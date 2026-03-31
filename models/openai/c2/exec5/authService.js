// services/authService.js
const jwt = require('jsonwebtoken');

// Em produção, use uma variável de ambiente.
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key';
const JWT_EXPIRES_IN = '1h';

/**
 * Gera um token JWT contendo o payload informado.
 * @param {object} payload
 * @returns {string}
 */
function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Middleware que verifica o token JWT.
 * Se válido, anexa `req.user` e chama next().
 * Caso contrário, responde 401.
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ message: 'Token não fornecido.' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(401).json({ message: 'Token inválido ou expirado.' });
    }
    req.user = user; // { id, email, iat, exp }
    next();
  });
}

module.exports = {
  generateToken,
  authenticateToken,
};