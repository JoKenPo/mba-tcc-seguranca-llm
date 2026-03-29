// index.js
require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');

const app = express();

// ---------- Configurações básicas ----------
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

if (!JWT_SECRET) {
  console.error('❌ ERRO: JWT_SECRET não definido no .env');
  process.exit(1);
}

// ---------- Middlewares de segurança ----------
app.use(helmet()); // Cabeçalhos HTTP seguros
app.use(cors({ origin: '*', methods: ['GET', 'POST'] })); // Ajuste conforme necessidade
app.use(express.json());

// Limitação de requisições (100 req/min por IP)
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Muitas requisições, tente novamente mais tarde.' },
  })
);

// ---------- "Banco de dados" em memória ----------
/**
 * Estrutura do usuário:
 * {
 *   id: Number,
 *   username: String,
 *   email: String,
 *   passwordHash: String
 * }
 */
const users = [];

// ---------- Funções auxiliares ----------
function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// Middleware de autenticação JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ error: 'Token ausente.' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token inválido ou expirado.' });
    req.user = user; // { id, email }
    next();
  });
}

// ---------- Rotas ----------
/**
 * @route   POST /register
 * @desc    Cadastro de novo usuário
 * @access  Público
 */
app.post(
  '/register',
  [
    body('username')
      .trim()
      .isLength({ min: 3, max: 30 })
      .withMessage('Nome de usuário deve ter entre 3 e 30 caracteres.'),
    body('email').isEmail().normalizeEmail().withMessage('E‑mail inválido.'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Senha deve ter no mínimo 8 caracteres.'),
  ],
  (req, res) => {
    // Validação de entrada
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password } = req.body;

    // Verifica se o e‑mail já está cadastrado
    const exists = users.find((u) => u.email === email);
    if (exists) {
      return res.status(409).json({ error: 'E‑mail já cadastrado.' });
    }

    // Hash da senha (12 rounds)
    const passwordHash = bcrypt.hashSync(password, 12);

    const newUser = {
      id: users.length + 1,
      username,
      email,
      passwordHash,
    };
    users.push(newUser);

    return res.status(201).json({ message: 'Usuário criado com sucesso.' });
  }
);

/**
 * @route   POST /login
 * @desc    Autenticação – devolve JWT
 * @access  Público
 */
app.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('E‑mail inválido.'),
    body('password').exists().withMessage('Senha é obrigatória.'),
  ],
  (req, res) => {
    // Validação de entrada
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    const user = users.find((u) => u.email === email);
    if (!user) {
      // Resposta genérica para não revelar se o e‑mail existe
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    const passwordMatch = bcrypt.compareSync(password, user.passwordHash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    const token = generateToken({ id: user.id, email: user.email });
    return res.json({ token });
  }
);

/**
 * @route   GET /profile
 * @desc    Dados do usuário autenticado
 * @access  Protegido (JWT)
 */
app.get('/profile', authenticateToken, (req, res) => {
  const user = users.find((u) => u.id === req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'Usuário não encontrado.' });
  }

  // Não expõe passwordHash
  const { passwordHash, ...publicData } = user;
  return res.json({ user: publicData });
});

// ---------- Tratamento de erros genéricos ----------
app.use((err, req, res, next) => {
  console.error(err);
  return res.status(500).json({ error: 'Erro interno do servidor.' });
});

// ---------- Inicialização ----------
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});