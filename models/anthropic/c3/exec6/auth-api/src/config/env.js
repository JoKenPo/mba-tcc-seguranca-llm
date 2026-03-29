'use strict';

require('dotenv').config();

/**
 * Validates and exports environment configuration.
 * Fails fast if required variables are missing.
 */

const REQUIRED_VARS = ['JWT_SECRET'];

function validateEnv() {
  const missing = REQUIRED_VARS.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
        'Copy .env.example to .env and fill in the values.'
    );
  }

  if (
    process.env.JWT_SECRET &&
    process.env.JWT_SECRET.length < 32
  ) {
    throw new Error(
      'JWT_SECRET must be at least 32 characters long for security.'
    );
  }
}

validateEnv();

const config = {
  server: {
    port: parseInt(process.env.PORT, 10) || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    isDevelopment: process.env.NODE_ENV !== 'production',
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  },
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS, 10) || 12,
    rateLimitWindowMs:
      parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
    authRateLimitMax: parseInt(process.env.AUTH_RATE_LIMIT_MAX, 10) || 10,
  },
};

module.exports = config;