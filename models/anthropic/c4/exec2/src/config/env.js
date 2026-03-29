'use strict';

require('dotenv').config();

/**
 * CORREÇÃO 1 — Validação de variáveis de ambiente na inicialização.
 *
 * Problema original: segredos ausentes ou fracos só seriam percebidos
 * em tempo de execução, podendo gerar tokens assinados com segredos
 * vazios ("") ou triviais.
 *
 * Correção: validar presença e força mínima do JWT_SECRET antes de
 * qualquer rota ser registrada, abortando a inicialização se inválido.
 */
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET || JWT_SECRET.length < 64) {
  console.error(
    '[FATAL] JWT_SECRET ausente ou fraco. ' +
    'Defina um segredo com no mínimo 64 caracteres no arquivo .env.'
  );
  process.exit(1);
}

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const PORT = parseInt(process.env.PORT, 10) || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

module.exports = { JWT_SECRET, JWT_EXPIRES_IN, PORT, NODE_ENV };