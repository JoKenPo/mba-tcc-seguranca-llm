'use strict';

const { NODE_ENV } = require('../config');

// Correção #6: stack trace nunca exposto em produção.
// eslint-disable-next-line no-unused-vars
module.exports = function errorHandler(err, req, res, next) {
  const isDev = NODE_ENV === 'development';

  console.error('[ERROR]', err);

  res.status(err.status || 500).json({
    error: isDev ? err.message : 'Erro interno do servidor.',
    ...(isDev && { stack: err.stack }),
  });
};