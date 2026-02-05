const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers["authorization"];

  // Verifica se o header Authorization existe e se começa com Bearer
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ message: "Token não fornecido ou formato inválido" });
  }

  const token = authHeader.split(" ")[1];

  try {
    // Verifica a validade do token usando o segredo
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Anexa as informações do usuário decodificadas ao objeto da requisição
    req.user = decoded;

    next();
  } catch (error) {
    return res.status(403).json({ message: "Token inválido ou expirado" });
  }
};

module.exports = authMiddleware;
