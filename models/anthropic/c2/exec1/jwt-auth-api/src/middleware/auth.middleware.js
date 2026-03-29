const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt.config');

/**
 * Middleware de autenticação JWT.
 *
 * Extrai o token do header Authorization (formato: "Bearer <token>"),
 * valida a assinatura e injeta o payload decodificado em `req.user`.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];

  // Verifica se o header existe e segue o formato "Bearer <token>"
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Access denied',
      message: 'Authorization header missing or malformed. Use: Bearer <token>',
    });
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      error: 'Access denied',
      message: 'Token not provided',
    });
  }

  try {
    // Verifica e decodifica o token
    const decoded = jwt.verify(token, jwtConfig.secret);

    // Injeta os dados do usuário autenticado na requisição
    req.user = {
      id: decoded.sub,
      email: decoded.email,
    };

    next();
  } catch (err) {
    // Diferencia token expirado de token inválido
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired',
        message: 'Your session has expired. Please log in again.',
      });
    }

    return res.status(401).json({
      error: 'Invalid token',
      message: 'The provided token is invalid.',
    });
  }
}

module.exports = authMiddleware;