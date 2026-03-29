// /home/your-user/simple-auth-api/index.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());

// ---------- Config ----------
const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'sua_chave_secreta_aleatoria'; // em produção use env var

// ---------- In‑memory storage ----------
let users = []; // [{ id, username, passwordHash }]

// ---------- Helpers ----------
function generateToken(user) {
  // payload mínimo: id e username
  return jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, {
    expiresIn: '1h',
  });
}

// Middleware para proteger rotas
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) return res.status(401).json({ error: 'Token não fornecido' });

  jwt.verify(token, JWT_SECRET, (err, payload) => {
    if (err) return res.status(403).json({ error: 'Token inválido ou expirado' });
    req.user = payload; // adiciona payload ao request
    next();
  });
}

// ---------- Rotas ----------
/**
 * @route POST /register
 * @desc  Cadastrar novo usuário
 * @body  { username: string, password: string }
 */
app.post('/register', async (req, res) => {
  const { username, password } = req.body;

  // validações simples
  if (!username || !password) {
    return res.status(400).json({ error: 'username e password são obrigatórios' });
  }

  // verifica se já existe
  const exists = users.find((u) => u.username === username);
  if (exists) {
    return res.status(409).json({ error: 'Usuário já cadastrado' });
  }

  // hash da senha
  const passwordHash = await bcrypt.hash(password, 10);
  const newUser = {
    id: users.length + 1,
    username,
    passwordHash,
  };
  users.push(newUser);

  res.status(201).json({ message: 'Usuário criado com sucesso' });
});

/**
 * @route POST /login
 * @desc  Autenticar usuário e gerar JWT
 * @body  { username: string, password: string }
 */
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  // procura usuário
  const user = users.find((u) => u.username === username);
  if (!user) {
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }

  // compara senha
  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) {
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }

  // gera token
  const token = generateToken(user);
  res.json({ token });
});

/**
 * @route GET /protected
 * @desc  Exemplo de rota protegida
 * @header Authorization: Bearer <token>
 */
app.get('/protected', authenticateToken, (req, res) => {
  res.json({
    message: `Olá ${req.user.username}, você acessou uma rota protegida!`,
    userId: req.user.id,
  });
});

// ---------- Start ----------
app.listen(PORT, () => {
  console.log(`🚀 API rodando em http://localhost:${PORT}`);
});