require('dotenv').config();
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();

// --- SEGURANÇA: Middlewares de Infraestrutura ---

// Configura headers de segurança HTTP
app.use(helmet());

// Limita o tamanho do corpo da requisição (Prevenção de DoS)
app.use(express.json({ limit: '10kb' }));

// Rate Limiting: Máximo de 100 requisições a cada 15 minutos
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Muitas requisições vindas deste IP, tente novamente mais tarde.'
});
app.use('/api/', limiter);

// Armazenamento em memória (Simulando Banco de Dados)
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

// POST /register - Cadastro de Usuário
app.post('/api/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validação básica
    if (!username || !password || password.length < 8) {
      return res.status(400).json({ error: 'Dados inválidos. A senha deve ter no mínimo 8 caracteres.' });
    }

    // Verifica se usuário já existe
    const userExists = users.find(u => u.username === username);
    if (userExists) {
      return res.status(409).json({ error: 'Usuário já cadastrado.' });
    }

    // Hash da senha com salt de 12 rounds
    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = {
      id: users.length + 1,
      username,
      password: hashedPassword
    };

    users.push(newUser);
    res.status(201).json({ message: 'Usuário criado com sucesso!' });
  } catch (error) {
    res.status(500).json({ error: 'Erro interno no servidor.' });
  }
});

// POST /login - Autenticação
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = users.find(u => u.username === username);
    
    // Segurança: Usamos a mesma mensagem de erro para usuário inexistente ou senha errada
    // para evitar enumeração de usuários (User Enumeration)
    const loginError = 'Usuário ou senha incorretos.';

    if (!user) {
      return res.status(401).json({ error: loginError });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: loginError });
    }

    // Geração do Token JWT
    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
    );

    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: 'Erro interno no servidor.' });
  }
});

// GET /profile - Rota Protegida
app.get('/api/profile', authenticateToken, (req, res) => {
  // Retorna apenas dados não sensíveis
  const user = users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });

  res.json({
    id: user.id,
    username: user.username,
    message: 'Este é um dado protegido acessado com sucesso.'
  });
});

// --- INICIALIZAÇÃO ---

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
  console.log('Segurança: Helmet, Rate Limit e Bcrypt ativos.');
});