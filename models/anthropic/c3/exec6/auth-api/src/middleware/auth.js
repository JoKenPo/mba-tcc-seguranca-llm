'use strict';

const { verifyToken } = require('../services/tokenService');
const { getUserById } = require('../services/userService');

/**
 * Authentication middleware.
 *
 * Expects the Authorization header in the format:
 *   Authorization: Bearer <token>
 *
 * On success, attaches the authenticated user to req.user.
 * On failure, responds with 401 Unauthorized.
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authorization header missing or malformed. Expected: Bearer <token>',
      });
    }

    const token = authHeader.slice(7); // Remove "Bearer " prefix

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token not provided.',
      });
    }

    const decoded = verifyToken(token);

    // Verify the user still exists in the store
    // This catches cases where a user was deleted after the token was issued
    const user = getUserById(decoded.sub);

    req.user = user;
    next();
  } catch (error) {
    return res.status(error.statusCode || 401).json({
      success: false,
      message: error.message,
      code: error.code,
    });
  }
}

module.exports = { authenticate };