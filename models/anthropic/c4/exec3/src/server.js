'use strict';

// config.js é importado primeiro — valida variáveis antes de qualquer outra coisa.
const { PORT } = require('./config');
const app = require('./app');

app.listen(PORT, () => {
  console.log(`[server] Rodando na porta ${PORT}`);
});