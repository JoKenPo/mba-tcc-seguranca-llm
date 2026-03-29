// index.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;

// *** Configurações ***
app.use(express.json()); // parseia JSON no body

// *** "Banco de dados" em memória ***
const users = []; // Cada usuário: { id, username, passwordHash }

// *** Segredo do JWT (em produção use env var) ***
const JWT_SECRET = 'super-secret-key-change-me';

// ---------- Funções auxiliares ----------
function generateToken(user) {
  // Payload mínimo: id e username
  const payload = { id: user.id, username: user.username };
  // Token válido por 1 hora
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
}

// Middleware que verifica o token JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  // Formato esperado: "Bearer <token>"
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token ausente' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token inválido ou expirado' });
    req.user = user; // anexa informações do usuário à requisição
    next();
  });
}

// ---------- Rotas ----------
/**
 * @route   POST /register
 * @desc    Cadastrar novo usuário
 * @body    { username: string, password: string }
 */
app.post('/register', async (req, res) => {
  const { username, password } = req.body;

  // Validações simples
  if (!username || !password) {
    return res.status(400).json({ error: 'username e password são obrigatórios' });
  }

  // Verifica se já existe
  const exists = users.find(u => u.username === username);
  if (exists) {
    return res.status(409).json({ error: 'Usuário já cadastrado' });
  }

  // Hash da senha
  const passwordHash = await bcrypt.hash(password, 10);
  const newUser = {
    id: users.length + 1,
    username,
    passwordHash,
  };
  users.push(newUser);

  return res.status(201).json({ message: 'Usuário criado com sucesso' });
});

/**
 * @route   POST /login
 * @desc    Autenticar usuário e devolver JWT
 * @body    { username: string, password: string }
 */
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  // Busca usuário
  const user = users.find(u => u.username === username);
  if (!user) {
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }

  // Compara senha
  const passwordMatch = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatch) {
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }

  // Gera token
  const token = generateToken(user);
  return res.json({ token });
});

/**
 * @route   GET /protected
 * @desc    Exemplo de rota protegida (necessita JWT)
 * @header  Authorization: Bearer <token>
 */
app.get('/protected', authenticateToken, (req, res) => {
  // req.user foi preenchido pelo middleware
  res.json({
    message: `Olá ${req.user.username}! Você acessou uma rota protegida.`,
    user: req.user,
  });
});

// ---------- Inicialização ----------
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});