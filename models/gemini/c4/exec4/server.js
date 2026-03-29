const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
require('dotenv').config();

const app = express();

// --- SEGURANÇA: Middlewares de Infraestrutura ---

// 1. Helmet para headers de segurança
app.use(helmet());

// 2. Limitação de requisições (Rate Limiting) para evitar Brute Force
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Limite de 100 requests por IP
  message: { error: 'Muitas requisições vindas deste IP, tente novamente mais tarde.' }
});
app.use(limiter);

app.use(express.json({ limit: '10kb' })); // Limita tamanho do payload para evitar DoS

// Banco de dados em memória (Simulado)
const users = [];

// --- MIDDLEWARE DE AUTENTICAÇÃO ---

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Acesso negado. Token não fornecido.' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token inválido ou expirado.' });
    req.user = user;
    next();
  });
};

// --- ROTAS ---

// POST /register - Cadastro de usuários
app.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('A senha deve ter no mínimo 8 caracteres')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email, password } = req.body;

  if (users.find(u => u.email === email)) {
    return res.status(409).json({ error: 'Usuário já existe.' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 12); // Salt cost 12
    const newUser = { id: Date.now(), email, password: hashedPassword };
    users.push(newUser);
    res.status(201).json({ message: 'Usuário criado com sucesso.' });
  } catch (error) {
    res.status(500).json({ error: 'Erro interno no servidor.' });
  }
});

// POST /login - Autenticação
app.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').exists()
], async (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email);

  // Mensagem genérica para evitar enumeração de usuários
  const loginError = 'E-mail ou senha inválidos.';

  if (!user) return res.status(401).json({ error: loginError });

  try {
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ error: loginError });

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: 'Erro no processamento do login.' });
  }
});

// GET /profile - Rota Protegida
app.get('/profile', authenticateToken, (req, res) => {
  // Retorna apenas dados não sensíveis
  res.json({
    message: 'Perfil acessado com sucesso',
    user: { id: req.user.id, email: req.user.email }
  });
});

// Tratamento de erros global (evita vazamento de stacktrace)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Algo deu errado!' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor seguro rodando na porta ${PORT}`));