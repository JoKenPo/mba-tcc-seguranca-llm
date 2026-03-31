// index.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());

// ---------- Configurações ----------
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey'; // em produção use .env
const JWT_EXPIRES_IN = '1h';

// ---------- "Banco de dados" em memória ----------
/**
 * Cada usuário tem:
 * {
 *   id: Number,
 *   username: String,
 *   passwordHash: String
 * }
 */
const users = [];

// ---------- Helpers ----------
function generateToken(user) {
  const payload = { id: user.id, username: user.username };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) return res.status(401).json({ message: 'Token ausente' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Token inválido' });
    req.user = user; // adiciona info do usuário à requisição
    next();
  });
}

// ---------- Rotas ----------
/**
 * @route POST /register
 * @desc  Cadastrar novo usuário
 * @body  { username, password }
 */
app.post('/register', async (req, res) => {
  const { username, password } = req.body;

  // validações básicas
  if (!username || !password) {
    return res.status(400).json({ message: 'username e password são obrigatórios' });
  }

  // verifica se já existe
  const exists = users.find(u => u.username === username);
  if (exists) {
    return res.status(409).json({ message: 'Usuário já cadastrado' });
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
 * @body  { username, password }
 */
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  // procura usuário
  const user = users.find(u => u.username === username);
  if (!user) {
    return res.status(401).json({ message: 'Credenciais inválidas' });
  }

  // compara senha
  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) {
    return res.status(401).json({ message: 'Credenciais inválidas' });
  }

  // gera token
  const token = generateToken(user);
  res.json({ token });
});

/**
 * @route GET /protected
 * @desc  Exemplo de rota protegida (requer JWT)
 */
app.get('/protected', authenticateToken, (req, res) => {
  res.json({
    message: `Olá ${req.user.username}, você acessou uma rota protegida!`,
    user: req.user,
  });
});

// ---------- Início ----------
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});