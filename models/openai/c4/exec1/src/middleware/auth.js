import jwt from 'jsonwebtoken';

/**
 * Middleware que valida o token JWT enviado no header:
 *   Authorization: Bearer <token>
 * Se válido, anexa o payload decodificado em `req.user`.
 */
export default function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token ausente ou mal formatado' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const secret = process.env.JWT_SECRET;
    const payload = jwt.verify(token, secret);
    req.user = payload; // ex.: { sub, name, email, iat, exp }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
}