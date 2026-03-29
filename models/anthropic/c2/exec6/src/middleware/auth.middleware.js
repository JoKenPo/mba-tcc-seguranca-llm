const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt.config');

/**
 * Authentication Middleware
 *
 * Protects routes by verifying the Bearer JWT token sent in the
 * Authorization header. On success, attaches the decoded payload
 * to `req.user` so downstream handlers can access the user's data.
 *
 * Expected header format:
 *   Authorization: Bearer <token>
 */
function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];

  // ── Check header presence ─────────────────────────────────────────────────
  if (!authHeader) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authorization header is missing',
    });
  }

  // ── Validate "Bearer <token>" format ──────────────────────────────────────
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authorization header must follow the format: Bearer <token>',
    });
  }

  const token = parts[1];

  // ── Verify token signature and expiration ─────────────────────────────────
  try {
    const decoded = jwt.verify(token, jwtConfig.secret);

    // Attach decoded payload to the request for use in route handlers
    req.user = decoded;

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Token has expired. Please log in again',
      });
    }

    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid token',
    });
  }
}

module.exports = authMiddleware;