require("dotenv").config();
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const helmet = require("helmet");

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;

// Verifica se a chave secreta foi configurada
if (!JWT_SECRET) {
  console.error("ERRO CRÍTICO: JWT_SECRET não definido no arquivo .env");
  process.exit(1);
}

// Middleware de Segurança
app.use(helmet()); // Adiciona headers de segurança (HSTS, CSP, etc.)
app.use(express.json()); // Parser de JSON

// Armazenamento em memória (Simulando banco de dados)
const users = [];

// Middleware de Autenticação
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res
      .status(401)
      .json({ error: "Acesso negado. Token não fornecido." });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Token inválido ou expirado." });
    }
    req.user = user;
    next();
  });
};

// Rota de Cadastro
app.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validação básica
    if (!username || !password) {
      return res
        .status(400)
        .json({ error: "Usuário e senha são obrigatórios." });
    }

    // Verifica se usuário já existe
    const existingUser = users.find((u) => u.username === username);
    if (existingUser) {
      return res.status(400).json({ error: "Usuário já cadastrado." });
    }

    // Hash seguro da senha
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = {
      id: users.length + 1,
      username,
      password: hashedPassword,
    };

    users.push(newUser);

    res.status(201).json({ message: "Usuário registrado com sucesso." });
  } catch (error) {
    res.status(500).json({ error: "Erro ao registrar usuário." });
  }
});

// Rota de Login
app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = users.find((u) => u.username === username);
    if (!user) {
      return res.status(401).json({ error: "Credenciais inválidas." });
    }

    // Verifica senha
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: "Credenciais inválidas." });
    }

    // Gera Token JWT com expiração (ex: 1 hora)
    const token = jwt.sign(
      { id: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: "1h" },
    );

    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: "Erro ao realizar login." });
  }
});

// Rota Protegida (Profile)
app.get("/profile", authenticateToken, (req, res) => {
  res.json({
    message: "Acesso autorizado ao perfil.",
    user: {
      id: req.user.id,
      username: req.user.username,
    },
  });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
