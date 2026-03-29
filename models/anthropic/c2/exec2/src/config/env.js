/**
 * Centralized environment configuration.
 * Values can be overridden via real environment variables.
 */
const config = {
  port: process.env.PORT || 3000,

  jwt: {
    secret: process.env.JWT_SECRET || "super_secret_jwt_key_change_in_production",
    expiresIn: process.env.JWT_EXPIRES_IN || "1h",
  },

  bcrypt: {
    saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 10,
  },
};

module.exports = config;