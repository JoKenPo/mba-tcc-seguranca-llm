// src/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'sua_chave_secreta_aleatoria'; // Em produção, use env var

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  // Formato esperado: "Bearer <token>"
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token inválido' });
    req.user = user; // { id, email }
    next();
  });
}

module.exports = { authenticateToken, JWT_SECRET };