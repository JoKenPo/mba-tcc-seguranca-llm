require("dotenv").config();
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const helmet = require("helmet");

const app = express();

// Configurações de Segurança
app.use(helmet()); // Adiciona headers de segurança (HSTS, CSP, etc.)
app.use(express.json());

// Banco de dados em memória
const users = [];

// Segredo do JWT (puxado do .env)
const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_nao_recomendado";

// Middleware de Autenticação
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Token não fornecido" });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: "Token inválido ou expirado" });
    }
    req.userId = decoded.userId;
    next();
  });
};

// --- Rotas ---

// Rota de Registro
app.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ error: "Usuário e senha são obrigatórios" });
    }

    // Verifica se usuário já existe
    if (users.find((u) => u.username === username)) {
      return res.status(400).json({ error: "Usuário já existe" });
    }

    // Hash seguro da senha
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = {
      id: users.length + 1,
      username,
      passwordHash,
    };

    users.push(newUser);
    res.status(201).json({ message: "Usuário registrado com sucesso" });
  } catch (error) {
    res.status(500).json({ error: "Erro ao registrar usuário" });
  }
});

// Rota de Login
app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = users.find((u) => u.username === username);

    if (!user) {
      return res.status(401).json({ error: "Credenciais inválidas" });
    }

    // Compara senha com hash
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: "Credenciais inválidas" });
    }

    // Gera Token JWT com expiração de 1 hora
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: "1h" },
    );

    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: "Erro ao realizar login" });
  }
});

// Rota Perfil (Protegida)
app.get("/profile", authMiddleware, (req, res) => {
  const user = users.find((u) => u.id === req.userId);
  if (!user) {
    return res.status(404).json({ error: "Usuário não encontrado" });
  }

  res.json({
    id: user.id,
    username: user.username,
    message: "Acesso autorizado ao perfil",
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
