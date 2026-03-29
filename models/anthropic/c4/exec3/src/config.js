'use strict';

// Validação obrigatória no startup — falha rápida antes de aceitar conexões.
// Correção #3 e #10: segredo validado com tamanho mínimo; expiração com default seguro.

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET || JWT_SECRET.length < 32) {
  console.error(
    '[FATAL] JWT_SECRET ausente ou menor que 32 caracteres. ' +
    'Gere um segredo com: node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"'
  );
  process.exit(1);
}

module.exports = {
  PORT: parseInt(process.env.PORT, 10) || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '15m', // Correção #10
  BCRYPT_ROUNDS: 12,                                    // Correção #1
};