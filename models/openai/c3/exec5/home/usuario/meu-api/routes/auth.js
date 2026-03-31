const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { findByEmail, create } = require('../models/user');
const authenticateToken = require('../middleware/auth');
require('dotenv').config();

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
const SALT_ROUNDS = 12; // número de rounds do bcrypt

/**
 * @route POST /register
 * @desc Cria novo usuário
 * @body { name, email, password }
 */
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  // Validações básicas
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Nome, e‑mail e senha são obrigatórios' });
  }

  if (findByEmail(email)) {
    return res.status(409).json({ error: 'E‑mail já cadastrado' });
  }

  try {
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = create({
      id: uuidv4(),
      name,
      email,
      passwordHash,
    });

    return res.status(201).json({ message: 'Usuário criado', user });
  } catch (err) {
    console.error('Erro ao registrar usuário:', err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * @route POST /login
 * @desc Autentica usuário e devolve JWT
 * @body { email, password }
 */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'E‑mail e senha são obrigatórios' });
  }

  const user = findByEmail(email);
  if (!user) {
    // Não revelar se o e‑mail existe
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }

  try {
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const token = jwt.sign(
      { sub: user.id }, // sub = subject (identificador do usuário)
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.json({ token });
  } catch (err) {
    console.error('Erro ao fazer login:', err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * @route GET /profile
 * @desc Rota protegida – devolve dados do usuário autenticado
 * @header Authorization: Bearer <token>
 */
router.get('/profile', authenticateToken, (req, res) => {
  // `req.user` já foi preenchido pelo middleware
  return res.json({ profile: req.user });
});

module.exports = router;