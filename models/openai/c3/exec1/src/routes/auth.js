// /home/your‑user/auth‑api/src/routes/auth.js
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userStore = require('../store/userStore');
const authMiddleware = require('../middleware/auth');
const { isValidEmail, isStrongPassword } = require('../utils/validators');

const router = express.Router();

/**
 * POST /api/register
 * Corpo: { name, email, password }
 */
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // ---- Validações básicas ----
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password are required' });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Invalid e‑mail format' });
    }
    if (!isStrongPassword(password)) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    if (userStore.findByEmail(email)) {
      return res.status(409).json({ error: 'E‑mail already registered' });
    }

    // ---- Hash da senha ----
    const saltRounds = 12; // custo razoável
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // ---- Cria usuário ----
    const newUser = userStore.create({ name, email, passwordHash });

    // Não devolvemos a senha!
    res.status(201).json({ message: 'User created', user: newUser });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/login
 * Corpo: { email, password }
 */
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'E‑mail and password are required' });
    }

    const user = userStore.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // ---- Gera JWT ----
    const payload = {
      sub: user.id,
      name: user.name,
      email: user.email
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '1h'
    });

    res.json({ token });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/profile
 * Rota protegida – requer Authorization: Bearer <token>
 */
router.get('/profile', authMiddleware, (req, res) => {
  // req.user foi preenchido pelo middleware
  res.json({ profile: req.user });
});

module.exports = router;