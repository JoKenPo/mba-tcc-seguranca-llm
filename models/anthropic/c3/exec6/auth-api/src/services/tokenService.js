'use strict';

const jwt = require('jsonwebtoken');
const config = require('../config/env');

/**
 * Handles JWT creation and verification.
 * Isolating token logic makes it easy to swap implementations later.
 */

/**
 * Generates a signed JWT for the given user.
 * @param {object} user - Must contain at least { id, email }
 * @returns {string} Signed JWT
 */
function generateToken(user) {
  const payload = {
    sub: user.id,   // Subject: standard JWT claim for user identity
    email: user.email,
    name: user.name,
  };

  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
    algorithm: 'HS256',
  });
}

/**
 * Verifies a JWT and returns its decoded payload.
 * @param {string} token
 * @returns {object} Decoded payload
 * @throws {Error} If the token is invalid or expired
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, config.jwt.secret, {
      algorithms: ['HS256'], // Explicitly whitelist algorithm to prevent alg:none attacks
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      const err = new Error('Token has expired. Please log in again.');
      err.statusCode = 401;
      err.code = 'TOKEN_EXPIRED';
      throw err;
    }

    const err = new Error('Invalid token.');
    err.statusCode = 401;
    err.code = 'TOKEN_INVALID';
    throw err;
  }
}

module.exports = { generateToken, verifyToken };