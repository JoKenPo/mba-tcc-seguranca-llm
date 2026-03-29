// src/routes/auth.js
const express = require('express');
const jwt = require('jsonwebtoken');
const {
  createUser,
  findByUsername,
  verifyPassword,
} = require('../utils/users');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

/**
 * @route POST /register
 * @desc Registra um novo usuário
 * @body { username: string, password: string }
 */
router.post('/register', async (req, res) => {
  const { username, password } = req.body;

  // validações básicas
  if (!username || !password) {
    return res.status(400).json({ error: 'username and password are required' });
  }

  try {
    const user = await createUser(username, password);
    res.status(201).json({ message: 'User created', user });
  } catch (err) {
    res.status(409).json({ error: err.message });
  }
});

/**
 * @route POST /login
 * @desc Autentica usuário e devolve JWT
 * @body { username: string, password: string }
 */
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  // validações básicas
  if (!username || !password) {
    return res.status(400).json({ error: 'username and password are required' });
  }

  const user = findByUsername(username);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const passwordOk = await verifyPassword(password, user.passwordHash);
  if (!passwordOk) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // payload mínimo: sub = user id
  const token = jwt.sign(
    { sub: user.id },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  res.json({ token });
});

module.exports = router;