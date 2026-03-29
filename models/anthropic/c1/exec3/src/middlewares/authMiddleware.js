const jwt = require("jsonwebtoken");

function authMiddleware(req, res, next) {
  // O token deve vir no header: Authorization: Bearer <token>
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      error: "Acesso negado. Token não fornecido.",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Anexa os dados do usuário decodificados à requisição
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({
      error: "Token inválido ou expirado.",
    });
  }
}

module.exports = authMiddleware;