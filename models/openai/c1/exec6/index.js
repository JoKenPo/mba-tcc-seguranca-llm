// index.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;

// ---------------------------------------------------
// Configurações
// ---------------------------------------------------
app.use(express.json()); // parse JSON bodies

// Segredo usado para assinar os tokens JWT.
// Em produção, guarde isso em uma variável de ambiente.
const JWT_SECRET = 's3cr3t_k3y_change_me';

// ---------------------------------------------------
// "Banco de dados" em memória
// ---------------------------------------------------
/**
 * Cada usuário tem a forma:
 * {
 *   id: Number,
 *   name: String,
 *   email: String,
 *   passwordHash: String
 * }
 */
const users = [];
let nextId = 1;

// ---------------------------------------------------
// Middleware de autenticação
// ---------------------------------------------------
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  // O header deve ser: "Bearer <token>"
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Token não fornecido' });

  jwt.verify(token, JWT_SECRET, (err, userPayload) => {
    if (err) return res.status(403).json({ error: 'Token inválido' });
    // Anexa os dados do usuário ao request para uso posterior
    req.user = userPayload;
    next();
  });
}

// ---------------------------------------------------
// Rotas
// ---------------------------------------------------

// 1️⃣ Registro de usuário
app.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  // Validações básicas
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
  }

  // Verifica se o email já está cadastrado
  const exists = users.find(u => u.email === email);
  if (exists) {
    return res.status(409).json({ error: 'Email já cadastrado' });
  }

  // Gera hash da senha
  const passwordHash = await bcrypt.hash(password, 10);

  const newUser = {
    id: nextId++,
    name,
    email,
    passwordHash,
  };
  users.push(newUser);

  // Não devolvemos a senha nem o hash
  const { passwordHash: _, ...userWithoutPassword } = newUser;
  res.status(201).json({ message: 'Usuário criado', user: userWithoutPassword });
});

// 2️⃣ Login
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // Validação simples
  if (!email || !password) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios' });
  }

  const user = users.find(u => u.email === email);
  if (!user) {
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }

  // Cria o token JWT (payload mínimo)
  const payload = { id: user.id, name: user.name, email: user.email };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

  res.json({ message: 'Login bem‑sucedido', token });
});

// 3️⃣ Rota protegida
app.get('/protected', authenticateToken, (req, res) => {
  // O middleware já garantiu que o token é válido e colocou o payload em req.user
  res.json({
    message: 'Acesso autorizado à rota protegida!',
    user: req.user,
  });
});

// ---------------------------------------------------
// Inicia o servidor
// ---------------------------------------------------
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});