// /home/user/api/routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');

const userStore = require('../models/userStore');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

// ---------- Helper: gerar JWT ----------
function generateToken(userId) {
  const payload = {
    sub: userId, // subject = id do usuário
    iat: Math.floor(Date.now() / 1000)
  };
  const options = {
    expiresIn: process.env.JWT_EXPIRES_IN || '1h'
  };
  return jwt.sign(payload, process.env.JWT_SECRET, options);
}

// ---------- POST /register ----------
router.post(
  '/register',
  [
    body('name')
      .trim()
      .isLength({ min: 2 })
      .withMessage('Nome deve ter ao menos 2 caracteres.'),
    body('email')
      .trim()
      .isEmail()
      .withMessage('E‑mail inválido.')
      .normalizeEmail(),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Senha deve ter ao menos 8 caracteres.')
      .matches(/[a-z]/i)
      .withMessage('Senha deve conter letras.')
      .matches(/[0-9]/)
      .withMessage('Senha deve conter números.')
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, email, password } = req.body;

      // Verifica se já existe
      if (userStore.findByEmail(email)) {
        return res.status(409).json({ error: 'E‑mail já cadastrado.' });
      }

      const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      const user = userStore.create({ name, email, passwordHash });

      // Não devolvemos a hash nem o token aqui (pode ser opcional)
      res.status(201).json({ id: user.id, name: user.name, email: user.email });
    } catch (err) {
      next(err);
    }
  }
);

// ---------- POST /login ----------
router.post(
  '/login',
  [
    body('email')
      .trim()
      .isEmail()
      .withMessage('E‑mail inválido.')
      .normalizeEmail(),
    body('password')
      .exists()
      .withMessage('Senha é obrigatória.')
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;
      const user = userStore.findByEmail(email);

      if (!user) {
        // Não revelar se o e‑mail existe
        return res.status(401).json({ error: 'Credenciais inválidas.' });
      }

      const passwordMatch = await bcrypt.compare(password, user.passwordHash);
      if (!passwordMatch) {
        return res.status(401).json({ error: 'Credenciais inválidas.' });
      }

      const token = generateToken(user.id);
      res.json({ token });
    } catch (err) {
      next(err);
    }
  }
);

// ---------- GET /profile (autenticado) ----------
router.get('/profile', authenticateToken, (req, res) => {
  const user = userStore.findById(req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'Usuário não encontrado.' });
  }
  // Nunca enviamos a hash da senha
  const { passwordHash, ...publicData } = user;
  res.json(publicData);
});

module.exports = router;