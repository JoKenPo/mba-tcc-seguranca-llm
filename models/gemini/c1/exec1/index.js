const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const app = express();
const PORT = 3000;
const SECRET_KEY = "supersecretkey"; // Em produção, use variáveis de ambiente!

app.use(express.json());

// "Banco de dados" em memória
const users = [];

// Rota de Cadastro (Register)
app.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Username e password são obrigatórios." });
    }

    const userExists = users.find((user) => user.username === username);
    if (userExists) {
      return res.status(400).json({ message: "Usuário já existe." });
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      id: users.length + 1,
      username,
      password: hashedPassword,
    };

    users.push(newUser);

    res.status(201).json({ message: "Usuário criado com sucesso!" });
  } catch (error) {
    res.status(500).json({ message: "Erro ao registrar usuário." });
  }
});

// Rota de Login
app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = users.find((u) => u.username === username);
    if (!user) {
      return res.status(400).json({ message: "Usuário ou senha inválidos." });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Usuário ou senha inválidos." });
    }

    // Gerar Token JWT
    const token = jwt.sign(
      { id: user.id, username: user.username },
      SECRET_KEY,
      { expiresIn: "1h" },
    );

    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: "Erro ao fazer login." });
  }
});

// Middleware de Autenticação
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  // Formato esperado: "Bearer TOKEN"
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res
      .status(401)
      .json({ message: "Acesso negado. Token não fornecido." });
  }

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Token inválido." });
    }
    req.user = user;
    next();
  });
};

// Rota Protegida
app.get("/protected", authenticateToken, (req, res) => {
  res.json({
    message: "Você acessou uma rota protegida!",
    user: req.user,
  });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
