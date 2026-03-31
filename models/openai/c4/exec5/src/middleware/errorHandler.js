/**
 * Tratamento centralizado de erros.
 * Em produção (NODE_ENV=production) não expõe stack trace.
 */
export default function errorHandler(err, req, res, _next) {
  console.error(err); // Log interno

  const status = err.status || 500;
  const response = {
    message: err.message || 'Erro interno do servidor',
  };

  if (process.env.NODE_ENV !== 'production') {
    response.stack = err.stack;
  }

  res.status(status).json(response);
}