'use strict';

const jwt = require('jsonwebtoken');

/**
 * Verifies the JWT sent in the Authorization header.
 *
 * Security fixes applied:
 * 1. Algorithm explicitly set to HS256 — prevents the "alg: none" attack
 *    where a crafted token with no signature is accepted.
 * 2. Header format is checked before calling jwt.verify() — avoids passing
 *    garbage to the library.
 * 3. Generic 401 message — does not reveal whether the token is missing,
 *    expired, or malformed (reduces information leakage).
 * 4. Only the decoded payload is attached to req.user — the raw token
 *    is not forwarded to route handlers.
 */

const BEARER_PREFIX = 'Bearer ';

function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (
    typeof authHeader !== 'string' ||
    !authHeader.startsWith(BEARER_PREFIX)
  ) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.slice(BEARER_PREFIX.length).trim();

  // Basic structural guard — JWTs always have exactly two dots
  if (!token || token.split('.').length !== 3) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256'], // Explicit allowlist — rejects 'none' and RS*/ES*
    });

    // Attach only the safe subset of the payload
    req.user = {
      id:    payload.sub,
      email: payload.email,
    };

    next();
  } catch (err) {
    // Log the real reason server-side; return generic message to client
    console.warn('[auth] Token verification failed:', err.message);
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

module.exports = { authenticate };