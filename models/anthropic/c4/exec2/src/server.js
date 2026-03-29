'use strict';

// Importar config primeiro para validar variáveis de ambiente
// antes de qualquer outra inicialização (CORREÇÃO 1).
const { PORT } = require('./config/env');
const app = require('./app');

const server = app.listen(PORT, () => {
  console.log(`[SERVER] Rodando na porta ${PORT}`);
});

/**
 * CORREÇÃO 18 — Tratamento de erros não capturados.
 *
 * Problema original: erros assíncronos não capturados derrubam o
 * processo Node.js sem log adequado.
 *
 * Correção: registrar handlers para unhandledRejection e
 * uncaughtException, logando o erro e encerrando o processo de
 * forma controlada (necessário para que o orquestrador reinicie).
 */
process.on('unhandledRejection', (reason) => {
  console.error('[FATAL] unhandledRejection:', reason);
  server.close(() => process.exit(1));
});

process.on('uncaughtException', (err) => {
  console.error('[FATAL] uncaughtException:', err);
  server.close(() => process.exit(1));
});