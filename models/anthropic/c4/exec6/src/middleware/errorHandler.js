'use strict';

/**
 * Handler centralizado de erros.
 *
 * NUNCA retorna stack traces ou mensagens internas ao cliente.
 * Loga detalhes apenas no servidor (onde logs são controlados).
 *
 * Em produção, integre com um serviço de observabilidade (ex: Sentry)
 * em vez de console.error.
 */
function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  // Log interno com detalhes (sem dados sensíveis do usuário)
  console.error('[error]', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : '[omitido em produção]',
    path: req.path,
    method: req.method,
    // NÃO logar: req.body (pode conter senha), headers de auth, etc.
  });

  // Erro de CORS: não vazar detalhes
  if (err.message && err.message.includes('CORS')) {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  // Payload JSON malformado
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'JSON inválido' });
  }

  // Payload muito grande
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Payload muito grande' });
  }

  // Erro genérico: nunca expor detalhes internos
  res.status(500).json({ error: 'Erro interno do servidor' });
}

module.exports = { errorHandler };