import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import authMiddleware from '../middleware/auth.js';
import { validateRegister, validateLogin } from '../utils/validators.js';

const router = Router();

// Armazenamento em memória (não persistente)
const users = []; // Cada usuário: { id, email, passwordHash }

/**
 * @route   POST /register
 * @desc    Cria novo usuário
 */
router.post(
  '/register',
  validateRegister,
  async (req, res, next) => {
    try {
      // Validação de campos
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      // Verifica duplicidade
      const exists = users.find((u) => u.email === email);
      if (exists) {
        return res.status(409).json({ message: 'Email já cadastrado' });
      }

      // Hash da senha
      const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10);
      const passwordHash = await bcrypt.hash(password, saltRounds);

      const newUser = {
        id: users.length + 1,
        email,
        passwordHash,
      };
      users.push(newUser);

      // Não retornamos a senha nem o hash
      return res.status(201).json({ id: newUser.id, email: newUser.email });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * @route   POST /login
 * @desc    Autentica usuário e devolve JWT
 */
router.post(
  '/login',
  validateLogin,
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;
      const user = users.find((u) => u.email === email);
      if (!user) {
        // Não revelamos se o email existe ou não
        return res.status(401).json({ message: 'Credenciais inválidas' });
      }

      const match = await bcrypt.compare(password, user.passwordHash);
      if (!match) {
        return res.status(401).json({ message: 'Credenciais inválidas' });
      }

      const payload = { sub: user.id, email: user.email };
      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
        algorithm: 'HS256',
      });

      return res.json({ token });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * @route   GET /profile
 * @desc    Retorna dados do usuário autenticado
 * @access  Protegido (Bearer token)
 */
router.get('/profile', authMiddleware, (req, res) => {
  // O middleware já adicionou `req.user`
  const user = users.find((u) => u.id === req.user.sub);
  if (!user) {
    return res.status(404).json({ message: 'Usuário não encontrado' });
  }

  return res.json({ id: user.id, email: user.email });
});

export default router;