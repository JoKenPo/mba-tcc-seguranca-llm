import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { registerSchema, loginSchema } from '../utils/validator.js';
import { users } from '../utils/database.js';

const router = express.Router();
const SALT_ROUNDS = 12;
const { JWT_SECRET, JWT_EXPIRES_IN } = process.env;

/**
 * @route POST /api/register
 * @desc  Registra novo usuário
 */
router.post('/register', async (req, res, next) => {
  try {
    // Validação de payload
    const { error, value } = registerSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const { email, password } = value;

    // Verifica duplicidade
    const exists = users.find((u) => u.email === email);
    if (exists) return res.status(409).json({ error: 'Email já cadastrado' });

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Persistência em memória
    users.push({ email, password: hashedPassword });

    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    next(err);
  }
});

/**
 * @route POST /api/login
 * @desc  Autentica usuário e devolve JWT
 */
router.post('/login', async (req, res, next) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const { email, password } = value;

    const user = users.find((u) => u.email === email);
    if (!user) return res.status(401).json({ error: 'Credenciais inválidas' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Credenciais inválidas' });

    const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    res.json({ token });
  } catch (err) {
    next(err);
  }
});

export default router;