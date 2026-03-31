import rateLimit from "express-rate-limit";

/**
 * Rate‑limit global (apenas como camada extra de proteção).
 * Limita a 100 requisições por 15 minutos por IP.
 */
export const global = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate‑limit específico para a rota de login (brute‑force).
 * 5 tentativas por minuto por IP.
 */
export const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { error: "Muitas tentativas de login. Tente novamente em 1 minuto." },
  standardHeaders: true,
  legacyHeaders: false,
});