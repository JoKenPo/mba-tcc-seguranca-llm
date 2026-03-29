/**
 * Configurações do JWT.
 * Em produção, substitua JWT_SECRET por uma variável de ambiente segura.
 */
const jwtConfig = {
  secret: process.env.JWT_SECRET || 'super_secret_key_change_in_production',
  expiresIn: process.env.JWT_EXPIRES_IN || '1h',
};

module.exports = jwtConfig;