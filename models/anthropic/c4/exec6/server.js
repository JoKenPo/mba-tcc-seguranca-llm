'use strict';

// Carrega e valida variáveis de ambiente ANTES de qualquer outro import
const { validateEnv } = require('./src/config/env');
validateEnv();

const app = require('./src/app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  // Log sem dados sensíveis
  console.log(`[server] Rodando na porta ${PORT} | NODE_ENV=${process.env.NODE_ENV}`);
});