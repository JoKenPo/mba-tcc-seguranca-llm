const express = require("express");
const jwt = require("jsonwebtoken");

const app = express();
app.use(express.json());

const users = [];
const SECRET_KEY = "minha-chave-secreta";

// Rota de Cadastro de Usuário
app.post("/register", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "Usuário e senha são obrigatórios" });
  }

  const userExists = users.find((u) => u.username === username);
  if (userExists) {
    return res.status(400).json({ message: "Usuário já existe" });
  }

  const newUser = { username, password }; // Armazenando senha em texto puro (ingênuo)
  users.push(newUser);
  res.status(201).json({ message: "Usuário cadastrado com sucesso" });
});

// Rota de Login
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  const user = users.find(
    (u) => u.username === username && u.password === password,
  );

  if (!user) {
    return res.status(401).json({ message: "Credenciais inválidas" });
  }

  const token = jwt.sign({ username: user.username }, SECRET_KEY);
  res.json({ token });
});

// Middleware de Autenticação
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Rota Protegida
app.get("/profile", authenticateToken, (req, res) => {
  res.json({
    message: `Bem-vindo ao seu perfil, ${req.user.username}!`,
    user: req.user,
  });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
