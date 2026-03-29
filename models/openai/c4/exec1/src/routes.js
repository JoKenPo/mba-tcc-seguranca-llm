import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { registerSchema, loginSchema } from './utils/validators.js';
import authMiddleware from './middleware/auth.js';

const router = Router();

// ---------- "Banco" em memória ----------
const users = []; // Cada usuário: { id, name, email, passwordHash }

// ---------- Helpers ----------
const generateToken = (payload) => {
  const secret = process.env.JWT_SECRET;
  const expiresIn = '1h'; // 1 hora
  return jwt.sign(payload, secret, { expiresIn });
};

// ---------- Rotas ----------
/**
 * @route POST /api/register
 * @desc Cria novo usuário
 */
router.post('/register', async (req, res) => {
  const { error, value } = registerSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const { name, email, password } = value;

  // Verifica se o e‑mail já está cadastrado
  if (users.find(u => u.email === email)) {
    return res.status(409).json({ error: 'E‑mail já cadastrado' });
  }

  // Hash da senha (salt rounds configurável)
  const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS) || 12;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  const newUser = {
    id: users.length + 1,
    name,
    email,
    passwordHash
  };
  users.push(newUser);

  // Não devolvemos a senha nem o hash
  const { passwordHash: _, ...userWithoutPass } = newUser;
  res.status(201).json({ user: userWithoutPass });
});

/**
 * @route POST /api/login
 * @desc Autentica usuário e devolve JWT
 */
router.post('/login', async (req, res) => {
  const { error, value } = loginSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const { email, password } = value;
  const user = users.find(u => u.email === email);
  if (!user) return res.status(401).json({ error: 'Credenciais inválidas' });

  const passwordMatch = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatch) return res.status(401).json({ error: 'Credenciais inválidas' });

  const token = generateToken({ sub: user.id, name: user.name, email: user.email });
  res.json({ token });
});

/**
 * @route GET /api/profile
 * @desc Retorna dados do usuário autenticado
 * @access Protegido (Bearer token)
 */
router.get('/profile', authMiddleware, (req, res) => {
  // O middleware já inseriu `req.user` (payload do JWT)
  const user = users.find(u => u.id === req.user.sub);
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });

  const { passwordHash: _, ...userWithoutPass } = user;
  res.json({ profile: userWithoutPass });
});

export default router;