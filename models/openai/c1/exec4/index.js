// index.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());

// ---------- Configurações ----------
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey'; // em produção use env vars
const JWT_EXPIRES_IN = '1h';

// ---------- "Banco de dados" em memória ----------
/**
 * Cada usuário tem a forma:
 * {
 *   id: Number,
 *   name: String,
 *   email: String,
 *   passwordHash: String
 * }
 */
const users = [];
let nextId = 1;

// ---------- Helpers ----------
function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Token ausente' });

  const token = authHeader.split(' ')[1]; // Bearer <token>
  if (!token) return res.status(401).json({ error: 'Token mal formatado' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // adiciona payload ao request
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
}

// ---------- Rotas ----------
/**
 * @route POST /register
 * @desc  Cadastrar novo usuário
 * @body  { name, email, password }
 */
app.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  // validações básicas
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
  }

  // verifica se já existe
  const exists = users.find(u => u.email === email);
  if (exists) {
    return res.status(409).json({ error: 'Email já cadastrado' });
  }

  // hash da senha
  const passwordHash = await bcrypt.hash(password, 10);

  const newUser = {
    id: nextId++,
    name,
    email,
    passwordHash,
  };
  users.push(newUser);

  // não devolvemos a senha nem o hash
  const { passwordHash: _, ...userWithoutPassword } = newUser;
  res.status(201).json(userWithoutPassword);
});

/**
 * @route POST /login
 * @desc  Autenticar usuário e gerar JWT
 * @body  { email, password }
 */
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // validações básicas
  if (!email || !password) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios' });
  }

  const user = users.find(u => u.email === email);
  if (!user) {
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }

  const passwordMatch = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatch) {
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }

  // payload pode conter o que for necessário na aplicação
  const token = generateToken({ id: user.id, email: user.email, name: user.name });
  res.json({ token });
});

/**
 * @route GET /protected
 * @desc  Exemplo de rota protegida – requer JWT válido
 * @header Authorization: Bearer <token>
 */
app.get('/protected', authMiddleware, (req, res) => {
  // req.user contém o payload que foi colocado no token
  res.json({
    message: `Olá ${req.user.name}, você acessou uma rota protegida!`,
    user: req.user,
  });
});

// ---------- Inicialização ----------
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});