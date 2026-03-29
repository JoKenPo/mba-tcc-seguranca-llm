// src/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'sua_chave_secreta_aleatoria'; // Deve ser a mesma usada no authController

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  // O token deve vir no formato: "Bearer <token>"
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res
      .status(401)
      .json({ message: 'Token não fornecido' });
  }

  jwt.verify(token, JWT_SECRET, (err, payload) => {
    if (err) {
      return res
        .status(403)
        .json({ message: 'Token inválido ou expirado' });
    }
    // payload contém { id, email, iat, exp }
    req.user = payload;
    next();
  });
}

module.exports = {
  authenticateToken,
};