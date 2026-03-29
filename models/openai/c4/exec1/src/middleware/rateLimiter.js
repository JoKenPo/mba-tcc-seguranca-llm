import rateLimit from 'express-rate-limit';

// Limita a 100 requisições por 15 minutos por IP (ajuste conforme necessidade)
export default rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas requisições, tente novamente mais tarde.' }
});