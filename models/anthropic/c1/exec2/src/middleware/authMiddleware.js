const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  // Espera o header: Authorization: Bearer <token>
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: "Token não fornecido" });
  }

  const parts = authHeader.split(" ");

  // Verifica o formato "Bearer <token>"
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return res
      .status(401)
      .json({ error: "Formato do token inválido. Use: Bearer <token>" });
  }

  const token = parts[1];

  try {
    // Verifica e decodifica o token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Injeta os dados do usuário na requisição
    req.user = decoded;
    return next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expirado" });
    }
    return res.status(401).json({ error: "Token inválido" });
  }
};

module.exports = authMiddleware;