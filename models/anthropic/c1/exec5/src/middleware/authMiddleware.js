const jwt = require("jsonwebtoken");

// Middleware que valida o token JWT no header Authorization
function authMiddleware(req, res, next) {
  const authHeader = req.headers["authorization"];

  // O header deve vir no formato: "Bearer <token>"
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "Token não fornecido. Use o header: Authorization: Bearer <token>",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Injeta os dados do usuário decodificado na requisição
    req.user = decoded;
    next();
  } catch (err) {
    const message =
      err.name === "TokenExpiredError" ? "Token expirado." : "Token inválido.";

    return res.status(401).json({ error: message });
  }
}

module.exports = authMiddleware;