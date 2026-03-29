'use strict';

/**
 * Valida variáveis de ambiente críticas na inicialização.
 * Falha rápido (fail-fast) se algo estiver errado,
 * evitando que a aplicação suba em estado inseguro.
 */
function validateEnv() {
  const errors = [];

  // Variáveis obrigatórias
  const required = ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'NODE_ENV', 'ALLOWED_ORIGIN'];
  for (const key of required) {
    if (!process.env[key]) {
      errors.push(`Variável de ambiente obrigatória ausente: ${key}`);
    }
  }

  // Valida entropia mínima dos segredos JWT
  // 64 bytes hex = 128 caracteres; exigimos pelo menos 64 para garantir 256 bits de entropia
  const JWT_SECRET = process.env.JWT_SECRET || '';
  const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || '';

  if (JWT_SECRET.length < 64) {
    errors.push('JWT_SECRET deve ter pelo menos 64 caracteres. Gere com: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"');
  }

  if (JWT_REFRESH_SECRET.length < 64) {
    errors.push('JWT_REFRESH_SECRET deve ter pelo menos 64 caracteres.');
  }

  // Segredos não podem ser iguais
  if (JWT_SECRET && JWT_REFRESH_SECRET && JWT_SECRET === JWT_REFRESH_SECRET) {
    errors.push('JWT_SECRET e JWT_REFRESH_SECRET não podem ser iguais.');
  }

  // Aviso em desenvolvimento (não bloqueia)
  if (process.env.NODE_ENV === 'development') {
    console.warn('[config] AVISO: Rodando em modo development. Não use em produção.');
  }

  if (errors.length > 0) {
    console.error('[config] Erros de configuração encontrados:');
    errors.forEach((e) => console.error(`  - ${e}`));
    process.exit(1); // Fail-fast: não sobe com configuração inválida
  }
}

module.exports = { validateEnv };