import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { findUserById } from '../services/userService.js';

/**
 * Middleware to authenticate requests using JWT Bearer tokens.
 * Attaches the authenticated user to req.user on success.
 */
export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  // Check for Bearer token in Authorization header
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Missing or malformed Authorization header. Expected: Bearer <token>',
    });
  }

  const token = authHeader.slice(7); // Remove "Bearer " prefix

  try {
    const payload = jwt.verify(token, config.jwt.secret, {
      algorithms: ['HS256'], // Explicitly allow only HS256
    });

    // Verify user still exists in storage
    const user = findUserById(payload.sub);
    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User no longer exists',
      });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Token has expired',
      });
    }

    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid token',
      });
    }

    // Unexpected error
    console.error('[Auth Middleware] Unexpected error:', err.message);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Authentication failed unexpectedly',
    });
  }
}

/**
 * Generate a signed JWT for a given user.
 * @param {object} user - Sanitized user object
 * @returns {string} Signed JWT
 */
export function generateToken(user) {
  return jwt.sign(
    {
      sub: user.id,       // Subject: user ID
      email: user.email,  // Additional claim
      name: user.name,
    },
    config.jwt.secret,
    {
      algorithm: 'HS256',
      expiresIn: config.jwt.expiresIn,
      issuer: 'auth-api',
    }
  );
}