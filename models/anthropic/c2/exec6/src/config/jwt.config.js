/**
 * JWT Configuration
 *
 * In production, replace JWT_SECRET with a strong secret stored
 * in an environment variable (e.g. process.env.JWT_SECRET).
 */
const jwtConfig = {
  secret: process.env.JWT_SECRET || 'super-secret-jwt-key-change-in-production',
  expiresIn: process.env.JWT_EXPIRES_IN || '1h',
};

module.exports = jwtConfig;