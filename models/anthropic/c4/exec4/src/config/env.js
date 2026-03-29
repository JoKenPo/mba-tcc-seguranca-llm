'use strict';

/**
 * Validates required environment variables at startup.
 * The process exits immediately if any critical value is missing or insecure.
 * This prevents the application from running in an unsafe state.
 *
 * Security fix: a missing or weak JWT_SECRET would allow attackers to forge tokens.
 */

const REQUIRED = ['JWT_SECRET', 'ALLOWED_ORIGIN'];
const MIN_SECRET_LENGTH = 32;

for (const key of REQUIRED) {
  if (!process.env[key]) {
    console.error(`[config] FATAL: Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

if (process.env.JWT_SECRET.length < MIN_SECRET_LENGTH) {
  console.error(
    `[config] FATAL: JWT_SECRET must be at least ${MIN_SECRET_LENGTH} characters. ` +
    `Generate one with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
  );
  process.exit(1);
}

if (!process.env.JWT_EXPIRES_IN) {
  process.env.JWT_EXPIRES_IN = '15m';
}

if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'production'; // Fail-safe default
}