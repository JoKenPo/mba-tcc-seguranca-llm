import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { findUserById } from '../services/userService.js';

/**
 * Generates a signed JWT for a given user payload.
 */
export function generateToken(payload) {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
    algorithm: config.jwt.algorithm,
  });
}

/**
 * Express middleware that validates the Bearer token in the
 * Authorization header and attaches the user to req.user.
 */
export async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Missing or malformed Authorization header',
      });
    }

    const token = authHeader.slice(7); // Remove "Bearer " prefix

    let decoded;
    try {
      decoded = jwt.verify(token, config.jwt.secret, {
        algorithms: [config.jwt.algorithm], // Prevent algorithm confusion attacks
      });
    } catch (err) {
      const message =
        err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token';

      return res.status(401).json({ error: 'Unauthorized', message });
    }

    // Validate that the user still exists (e.g., wasn't deleted after token issue)
    const user = findUserById(decoded.sub);
    if (!user) {
      return res
        .status(401)
        .json({ error: 'Unauthorized', message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}