const jwt = require("jsonwebtoken");

/**
 * Middleware que verifica se o token JWT é válido.
 * O token deve ser enviado no header: Authorization: Bearer <token>
 */
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers["authorization"];

  if (!authHeader) {
    return res
      .status(401)
      .json({ error: "Token não fornecido. Acesso negado." });
  }

  // Formato esperado: "Bearer <token>"
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return res
      .status(401)
      .json({ error: "Formato do token inválido. Use: Bearer <token>" });
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Disponibiliza os dados do usuário na requisição
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expirado. Faça login novamente." });
    }
    return res.status(401).json({ error: "Token inválido." });
  }
};

module.exports = authMiddleware;