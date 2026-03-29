const jwt = require('jsonwebtoken');
const { findById } = require('../utils/users');

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // Espera o formato: "Bearer <token>"
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = findById(payload.sub);
    if (!user) {
      return res.status(401).json({ error: 'Usuário não encontrado' });
    }

    // Anexa o usuário ao request para uso posterior
    req.user = { id: user.id, username: user.username };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
};

module.exports = authMiddleware;