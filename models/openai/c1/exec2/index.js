// index.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());

// ---------- Configurações ----------
const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'sua_chave_secreta_aleatoria'; // em produção use env var

// ---------- "Banco de dados" em memória ----------
/**
 * Cada usuário tem a forma:
 * {
 *   id: Number,
 *   username: String,
 *   passwordHash: String
 * }
 */
const users = [];
let nextUserId = 1;

// ---------- Middleware de autenticação ----------
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  // Header esperado: "Bearer <token>"
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token ausente' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token inválido' });
    req.user = user; // payload do token
    next();
  });
}

// ---------- Rotas ----------

// 1️⃣ Cadastro
app.post('/register', async (req, res) => {
  const { username, password } = req.body;

  // validações básicas
  if (!username || !password) {
    return res.status(400).json({ error: 'username e password são obrigatórios' });
  }

  // verifica se o usuário já existe
  const exists = users.find(u => u.username === username);
  if (exists) {
    return res.status(409).json({ error: 'Usuário já cadastrado' });
  }

  // hash da senha
  const passwordHash = await bcrypt.hash(password, 10);

  const newUser = {
    id: nextUserId++,
    username,
    passwordHash,
  };
  users.push(newUser);

  return res.status(201).json({ message: 'Usuário criado com sucesso' });
});

// 2️⃣ Login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  // validações básicas
  if (!username || !password) {
    return res.status(400).json({ error: 'username e password são obrigatórios' });
  }

  const user = users.find(u => u.username === username);
  if (!user) {
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }

  const passwordMatch = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatch) {
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }

  // gera JWT (payload simples)
  const token = jwt.sign(
    { id: user.id, username: user.username },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  return res.json({ token });
});

// 3️⃣ Rota protegida
app.get('/protected', authenticateToken, (req, res) => {
  // req.user vem do middleware
  res.json({
    message: `Olá, ${req.user.username}! Você acessou uma rota protegida.`,
    user: req.user,
  });
});

// ---------- Início do servidor ----------
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});