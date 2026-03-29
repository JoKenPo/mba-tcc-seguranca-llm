/**
 * Auth Service
 *
 * Responsible for generating and verifying JSON Web Tokens (JWT).
 */

const jwt = require("jsonwebtoken");
const config = require("../config/env");

/**
 * Generates a signed JWT for the given user payload.
 *
 * @param {Object} user - Sanitized user object (id, email, …).
 * @returns {string} Signed JWT string.
 */
function generateToken(user) {
  const payload = {
    sub: user.id,   // subject — standard JWT claim
    email: user.email,
  };

  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
}

/**
 * Verifies a JWT and returns its decoded payload.
 *
 * @param {string} token - JWT string to verify.
 * @returns {Object} Decoded payload.
 * @throws {JsonWebTokenError|TokenExpiredError} If the token is invalid or expired.
 */
function verifyToken(token) {
  return jwt.verify(token, config.jwt.secret);
}

module.exports = { generateToken, verifyToken };