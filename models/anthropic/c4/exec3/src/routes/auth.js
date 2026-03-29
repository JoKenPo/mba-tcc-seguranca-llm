'use strict';

const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');

const { JWT_SECRET, JWT_EXPIRES_IN, BCRYPT_ROUNDS } = require('../config');
const userStore = require('../store/users');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// ─── Rate Limiting ────────────────────────────────────────────────────────────
// Correção #4: limita tentativas em rotas sensíveis para dificultar força bruta.

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas tentativas. Tente novamente em 15 minutos.' },
});

// ─── Validadores ─────────────────────────────────────────────────────────────
// Correção #5: validação estrita de entrada com limites de tamanho.

const registerValidators = [
  body('email')
    .isEmail().withMessage('E-mail inválido.')
    .isLength({ max: 254 }).withMessage('E-mail muito longo.')
    .normalizeEmail(),
  body('password')
    .isString()
    .isLength({ min: 8, max: 72 }) // bcrypt trunca em 72 bytes
    .withMessage('Senha deve ter entre 8 e 72 caracteres.'),
];

const loginValidators = [
  body('email').isEmail().normalizeEmail(),
  body('password').isString().isLength({ min: 1, max: 72 }),
];

function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  next();
}

// ─── POST /register ───────────────────────────────────────────────────────────

router.post(
  '/register',
  authLimiter,
  registerValidators,
  handleValidation,
  async (req, res, next) => {
    try {
      // Correção #12: e-mail normalizado para lowercase antes de comparar.
      const email = req.body.email.toLowerCase();
      const { password } = req.body;

      if (userStore.findByEmail(email)) {
        return res.status(409).json({ error: 'E-mail já cadastrado.' });
      }

      // Correção #1: custo 12 para hash mais resistente a força bruta.
      const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

      userStore.create({
        id: uuidv4(),
        email,
        passwordHash,
        createdAt: new Date().toISOString(),
      });

      return res.status(201).json({ message: 'Usuário criado com sucesso.' });
    } catch (err) {
      next(err);
    }
  }
);

// ─── POST /login ──────────────────────────────────────────────────────────────

router.post(
  '/login',
  authLimiter,
  loginValidators,
  handleValidation,
  async (req, res, next) => {
    try {
      const email = req.body.email.toLowerCase();
      const { password } = req.body;

      const user = userStore.findByEmail(email);

      // Correção #8: mensagem de erro unificada — não revela se o e-mail existe.
      // bcrypt.compare é chamado mesmo quando user é null para evitar
      // timing attack por caminho curto (early return).
      const dummyHash =
        '$2b$12$invalidsaltinvalidsaltinvalidsaltinvalidsaltinvalid';
      const passwordMatch = await bcrypt.compare(
        password,
        user ? user.passwordHash : dummyHash
      );

      if (!user || !passwordMatch) {
        return res.status(401).json({ error: 'Credenciais inválidas.' });
      }

      // Correção #2: algoritmo HS256 explícito no sign.
      const token = jwt.sign(
        { sub: user.id, email: user.email },
        JWT_SECRET,
        { algorithm: 'HS256', expiresIn: JWT_EXPIRES_IN }
      );

      return res.status(200).json({ token });
    } catch (err) {
      next(err);
    }
  }
);

// ─── GET /profile ─────────────────────────────────────────────────────────────

router.get('/profile', authMiddleware, (req, res) => {
  // Correção #11: hash da senha jamais incluído na resposta.
  const { passwordHash: _, ...safeUser } = req.user;
  return res.status(200).json(safeUser);
});

module.exports = router;