import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET não definido nas variáveis de ambiente.");
}

/**
 * Middleware que verifica o token JWT enviado no header
 * Authorization: Bearer <token>
 */
export const authenticate = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return res.status(401).json({ error: "Token ausente." });

  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Token mal formatado." });

  jwt.verify(token, JWT_SECRET, (err, payload) => {
    if (err) return res.status(401).json({ error: "Token inválido ou expirado." });
    req.user = payload; // payload contém { id, email, iat, exp }
    next();
  });
};