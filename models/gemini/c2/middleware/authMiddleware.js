const jwt = require("jsonwebtoken");

const secretKey = "sua_chave_secreta_super_segura"; // Em produção, use variáveis de ambiente

const verifyToken = (req, res, next) => {
  const tokenHeader = req.headers["authorization"];

  if (!tokenHeader) {
    return res.status(403).json({ message: "Nenhum token fornecido." });
  }

  const token = tokenHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    return res.status(403).json({ message: "Formato de token inválido." });
  }

  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) {
      return res.status(500).json({ message: "Falha ao autenticar o token." });
    }

    // Salva o id do usuário para uso em outras rotas
    req.userId = decoded.id;
    next();
  });
};

module.exports = {
  verifyToken,
  secretKey,
};
