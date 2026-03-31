// src/routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// "Banco de dados" em memória
const users = []; // Cada usuário: { id, email, passwordHash, name }

// Helper para gerar JWT
function generateToken(user) {
  const payload = {
    sub: user.id,
    email: user.email,
    name: user.name,
  };

  const options = {
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  };

  return jwt.sign(payload, process.env.JWT_SECRET, options);
}

/**
 * @route   POST /api/register
 * @desc    Cria novo usuário
 * @access  Público
 */
router.post('/register', async (req, res) => {
  const { email, password, name } = req.body;

  // Validações básicas
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'email, password e name são obrigatórios' });
  }

  // Verifica se já existe
  const exists = users.find(u => u.email === email);
  if (exists) {
    return res.status(409).json({ error: 'Usuário já cadastrado' });
  }

  // Hash da senha
  const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS) || 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  const newUser = {
    id: users.length + 1, // simples auto‑incremento
    email,
    name,
    passwordHash,
  };

  users.push(newUser);

  // Opcional: já retorna o token após registro
  const token = generateToken(newUser);

  res.status(201).json({
    message: 'Usuário criado com sucesso',
    token,
  });
});

/**
 * @route   POST /api/login
 * @desc    Autentica usuário e devolve JWT
 * @access  Público
 */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'email e password são obrigatórios' });
  }

  const user = users.find(u => u.email === email);
  if (!user) {
    // Não revela se o e‑mail existe ou não
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) {
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }

  const token = generateToken(user);
  res.json({ token });
});

/**
 * @route   GET /api/profile
 * @desc    Retorna dados do usuário autenticado
 * @access  Protegido (Bearer token)
 */
router.get('/profile', authMiddleware, (req, res) => {
  // req.user vem do middleware
  const user = users.find(u => u.id === req.user.sub);
  if (!user) {
    return res.status(404).json({ error: 'Usuário não encontrado' });
  }

  // Não devolve a hash da senha
  const { passwordHash, ...publicData } = user;
  res.json({ profile: publicData });
});

module.exports = router;