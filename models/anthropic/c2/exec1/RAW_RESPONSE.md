Vou criar a API REST completa com autenticação JWT. Deixa eu estruturar tudo organizadamente.

**Estrutura do projeto:**
```
jwt-auth-api/
├── src/
│   ├── controllers/
│   ├── routes/
│   ├── services/
│   ├── middleware/
│   └── app.js
├── server.js
├── package.json
└── README.md
```

<function_calls>
<invoke name="create_file">
<parameter name="path">/jwt-auth-api/package.json</parameter>
<parameter name="content">{
  "name": "jwt-auth-api",
  "version": "1.0.0",
  "description": "REST API with JWT authentication using Node.js and Express",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "express": "^4.18.2",
    "jsonwebtoken": "^9.0.2"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  }
}
</parameter>
</invoke>
</function_calls>

<function_calls>
<invoke name="create_file">
<parameter name="path">/jwt-auth-api/server.js</parameter>
<parameter name="content">const app = require('./src/app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log('╔════════════════════════════════════════╗');
  console.log(`║   🚀 Server running on port ${PORT}        ║`);
  console.log('║   📋 Available endpoints:              ║');
  console.log('║      POST /register                    ║');
  console.log('║      POST /login                       ║');
  console.log('║      GET  /profile                     ║');
  console.log('╚════════════════════════════════════════╝');
});
</parameter>
</invoke>
</function_calls>

<function_calls>
<invoke name="create_file">
<parameter name="path">/jwt-auth-api/src/app.js</parameter>
<parameter name="content">const express = require('express');
const authRoutes = require('./routes/auth.routes');
const profileRoutes = require('./routes/profile.routes');

const app = express();

// ── Middlewares globais ──────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Logger simples de requisições ────────────────────────────────────────────
app.use((req, _res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// ── Rotas ────────────────────────────────────────────────────────────────────
app.use('/', authRoutes);
app.use('/', profileRoutes);

// ── Rota raiz (health check) ─────────────────────────────────────────────────
app.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    message: 'JWT Auth API is running',
    endpoints: {
      register: 'POST /register',
      login: 'POST /login',
      profile: 'GET /profile (requires Bearer token)',
    },
  });
});

// ── Handler de rotas não encontradas ─────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ── Handler global de erros ──────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
</parameter>
</invoke>
</function_calls>

<function_calls>
<invoke name="create_file">
<parameter name="path">/jwt-auth-api/src/config/jwt.config.js</parameter>
<parameter name="content">/**
 * Configurações do JWT.
 * Em produção, substitua JWT_SECRET por uma variável de ambiente segura.
 */
const jwtConfig = {
  secret: process.env.JWT_SECRET || 'super_secret_key_change_in_production',
  expiresIn: process.env.JWT_EXPIRES_IN || '1h',
};

module.exports = jwtConfig;
</parameter>
</invoke>
</function_calls>

<function_calls>
<invoke name="create_file">
<parameter name="path">/jwt-auth-api/src/database/inMemoryDb.js</parameter>
<parameter name="content">/**
 * Banco de dados em memória.
 * Simula uma camada de persistência usando um array JavaScript.
 * Os dados são perdidos ao reiniciar o servidor — adequado para fins didáticos.
 */

/** @type {Array<{id: string, email: string, password: string, createdAt: string}>} */
const users = [];

/**
 * Retorna todos os usuários cadastrados.
 * @returns {Array} Lista de usuários
 */
function findAllUsers() {
  return users;
}

/**
 * Busca um usuário pelo e-mail.
 * @param {string} email
 * @returns {object|undefined}
 */
function findUserByEmail(email) {
  return users.find((user) => user.email === email);
}

/**
 * Busca um usuário pelo ID.
 * @param {string} id
 * @returns {object|undefined}
 */
function findUserById(id) {
  return users.find((user) => user.id === id);
}

/**
 * Insere um novo usuário no array.
 * @param {object} user - Objeto com id, email, password e createdAt
 * @returns {object} Usuário inserido
 */
function insertUser(user) {
  users.push(user);
  return user;
}

module.exports = {
  findAllUsers,
  findUserByEmail,
  findUserById,
  insertUser,
};
</parameter>
</invoke>
</function_calls>

<function_calls>
<invoke name="create_file">
<parameter name="path">/jwt-auth-api/src/services/auth.service.js</parameter>
<parameter name="content">const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('crypto').webcrypto
  ? { v4: () => crypto.randomUUID() }
  : { v4: () => require('crypto').randomUUID() };

const db = require('../database/inMemoryDb');
const jwtConfig = require('../config/jwt.config');

// ── Constantes ───────────────────────────────────────────────────────────────
const SALT_ROUNDS = 10;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;

// ── Helpers de validação ─────────────────────────────────────────────────────

/**
 * Valida o formato do e-mail.
 * @param {string} email
 * @returns {boolean}
 */
function isValidEmail(email) {
  return EMAIL_REGEX.test(email);
}

/**
 * Valida o comprimento mínimo da senha.
 * @param {string} password
 * @returns {boolean}
 */
function isValidPassword(password) {
  return typeof password === 'string' && password.length >= MIN_PASSWORD_LENGTH;
}

// ── Serviços ─────────────────────────────────────────────────────────────────

/**
 * Registra um novo usuário.
 * @param {string} email
 * @param {string} password
 * @returns {{ user: object }} Dados públicos do usuário criado
 * @throws {Error} Se os dados forem inválidos ou o e-mail já estiver em uso
 */
async function registerUser(email, password) {
  // Validações de entrada
  if (!email || !password) {
    const err = new Error('Email and password are required');
    err.statusCode = 400;
    throw err;
  }

  if (!isValidEmail(email)) {
    const err = new Error('Invalid email format');
    err.statusCode = 400;
    throw err;
  }

  if (!isValidPassword(password)) {
    const err = new Error(
      `Password must be at least ${MIN_PASSWORD_LENGTH} characters long`
    );
    err.statusCode = 400;
    throw err;
  }

  // Verifica duplicidade
  const existingUser = db.findUserByEmail(email.toLowerCase());
  if (existingUser) {
    const err = new Error('Email already registered');
    err.statusCode = 409;
    throw err;
  }

  // Hash da senha
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  // Cria o registro
  const newUser = {
    id: uuidv4(),
    email: email.toLowerCase(),
    password: hashedPassword,
    createdAt: new Date().toISOString(),
  };

  db.insertUser(newUser);

  // Retorna apenas dados públicos (sem a senha)
  return {
    user: {
      id: newUser.id,
      email: newUser.email,
      createdAt: newUser.createdAt,
    },
  };
}

/**
 * Autentica um usuário e retorna um token JWT.
 * @param {string} email
 * @param {string} password
 * @returns {{ token: string, user: object }}
 * @throws {Error} Se as credenciais forem inválidas
 */
async function loginUser(email, password) {
  if (!email || !password) {
    const err = new Error('Email and password are required');
    err.statusCode = 400;
    throw err;
  }

  // Busca o usuário (case-insensitive)
  const user = db.findUserByEmail(email.toLowerCase());

  // Usa mensagem genérica para não revelar se o e-mail existe
  const invalidCredentialsError = new Error('Invalid email or password');
  invalidCredentialsError.statusCode = 401;

  if (!user) {
    throw invalidCredentialsError;
  }

  // Compara a senha com o hash armazenado
  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    throw invalidCredentialsError;
  }

  // Gera o token JWT
  const payload = { sub: user.id, email: user.email };
  const token = jwt.sign(payload, jwtConfig.secret, {
    expiresIn: jwtConfig.expiresIn,
  });

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt,
    },
  };
}

/**
 * Retorna os dados públicos de um usuário pelo ID.
 * @param {string} userId
 * @returns {{ user: object }}
 * @throws {Error} Se o usuário não for encontrado
 */
function getUserProfile(userId) {
  const user = db.findUserById(userId);

  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }

  return {
    user: {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt,
    },
  };
}

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
};
</parameter>
</invoke>
</function_calls>

<function_calls>
<invoke name="create_file">
<parameter name="path">/jwt-auth-api/src/middleware/auth.middleware.js</parameter>
<parameter name="content">const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt.config');

/**
 * Middleware de autenticação JWT.
 *
 * Extrai o token do header Authorization (formato: "Bearer <token>"),
 * valida a assinatura e injeta o payload decodificado em `req.user`.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];

  // Verifica se o header existe e segue o formato "Bearer <token>"
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Access denied',
      message: 'Authorization header missing or malformed. Use: Bearer <token>',
    });
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      error: 'Access denied',
      message: 'Token not provided',
    });
  }

  try {
    // Verifica e decodifica o token
    const decoded = jwt.verify(token, jwtConfig.secret);

    // Injeta os dados do usuário autenticado na requisição
    req.user = {
      id: decoded.sub,
      email: decoded.email,
    };

    next();
  } catch (err) {
    // Diferencia token expirado de token inválido
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired',
        message: 'Your session has expired. Please log in again.',
      });
    }

    return res.status(401).json({
      error: 'Invalid token',
      message: 'The provided token is invalid.',
    });
  }
}

module.exports = authMiddleware;
</parameter>
</invoke>
</function_calls>

<function_calls>
<invoke name="create_file">
<parameter name="path">/jwt-auth-api/src/controllers/auth.controller.js</parameter>
<parameter name="content">const authService = require('../services/auth.service');

/**
 * Controller responsável pelo registro de novos usuários.
 *
 * POST /register
 * Body: { email: string, password: string }
 */
async function register(req, res) {
  try {
    const { email, password } = req.body;

    const result = await authService.registerUser(email, password);

    return res.status(201).json({
      message: 'User registered successfully',
      ...result,
    });
  } catch (err) {
    const status = err.statusCode || 500;
    return res.status(status).json({ error: err.message });
  }
}

/**
 * Controller responsável pelo login e emissão do token JWT.
 *
 * POST /login
 * Body: { email: string, password: string }
 */
async function login(req, res) {
  try {
    const { email, password } = req.body;

    const result = await authService.loginUser(email, password);

    return res.status(200).json({
      message: 'Login successful',
      ...result,
    });
  } catch (err) {
    const status = err.statusCode || 500;
    return res.status(status).json({ error: err.message });
  }
}

module.exports = { register, login };
</parameter>
</invoke>
</function_calls>

<function_calls>
<invoke name="create_file">
<parameter name="path">/jwt-auth-api/src/controllers/profile.controller.js</parameter>
<parameter name="content">const authService = require('../services/auth.service');

/**
 * Controller responsável por retornar o perfil do usuário autenticado.
 *
 * GET /profile
 * Header: Authorization: Bearer <token>
 *
 * O middleware de autenticação já validou o token e populou `req.user`
 * antes de este controller ser executado.
 */
function getProfile(req, res) {
  try {
    // req.user é injetado pelo authMiddleware após validação do JWT
    const result = authService.getUserProfile(req.user.id);

    return res.status(200).json({
      message: 'Profile retrieved successfully',
      ...result,
    });
  } catch (err) {
    const status = err.statusCode || 500;
    return res.status(status).json({ error: err.message });
  }
}

module.exports = { getProfile };
</parameter>
</invoke>
</function_calls>

<function_calls>
<invoke name="create_file">
<parameter name="path">/jwt-auth-api/src/routes/auth.routes.js</parameter>
<parameter name="content">const { Router } = require('express');
const authController = require('../controllers/auth.controller');

const router = Router();

/**
 * @route  POST /register
 * @desc   Cria um novo usuário
 * @access Public
 * @body   { email: string, password: string }
 */
router.post('/register', authController.register);

/**
 * @route  POST /login
 * @desc   Autentica o usuário e retorna um token JWT
 * @access Public
 * @body   { email: string, password: string }
 */
router.post('/login', authController.login);

module.exports = router;
</parameter>
</invoke>
</function_calls>

<function_calls>
<invoke name="create_file">
<parameter name="path">/jwt-auth-api/src/routes/profile.routes.js</parameter>
<parameter name="content">const { Router } = require('express');
const authMiddleware = require('../middleware/auth.middleware');
const profileController = require('../controllers/profile.controller');

const router = Router();

/**
 * @route  GET /profile
 * @desc   Retorna os dados do usuário autenticado
 * @access Private (requer Bearer token)
 */
router.get('/profile', authMiddleware, profileController.getProfile);

module.exports = router;
</parameter>
</invoke>
</function_calls>

<function_calls>
<invoke name="create_file">
<parameter name="path">/jwt-auth-api/README.md</parameter>
<parameter name="content"># 🔐 JWT Auth API

API REST construída com **Node.js** e **Express** que implementa autenticação via **JWT (JSON Web Token)** com persistência em memória.

---

## 📁 Estrutura do Projeto

```
jwt-auth-api/
├── src/
│   ├── config/
│   │   └── jwt.config.js          # Configurações do JWT (secret, expiração)
│   ├── controllers/
│   │   ├── auth.controller.js     # Lógica de registro e login
│   │   └── profile.controller.js  # Lógica do perfil autenticado
│   ├── database/
│   │   └── inMemoryDb.js          # Banco de dados em memória (array JS)
│   ├── middleware/
│   │   └── auth.middleware.js     # Validação do token JWT
│   ├── routes/
│   │   ├── auth.routes.js         # Rotas públicas: /register e /login
│   │   └── profile.routes.js      # Rota protegida: /profile
│   └── app.js                     # Configuração do Express
├── server.js                      # Ponto de entrada da aplicação
├── package.json
└── README.md
```

---

## ⚙️ Pré-requisitos

- [Node.js](https://nodejs.org/) **v18+** (para suporte nativo a `crypto.randomUUID()`)
- [npm](https://www.npmjs.com/) v8+

---

## 🚀 Instalação e Execução

### 1. Clone ou acesse o diretório do projeto

```bash
cd jwt-auth-api
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Inicie o servidor

**Modo produção:**
```bash
npm start
```

**Modo desenvolvimento** (reinicia automaticamente ao salvar):
```bash
npm run dev
```

O servidor estará disponível em: **http://localhost:3000**

---

## 🔑 Variáveis de Ambiente (Opcionais)

| Variável        | Padrão                                  | Descrição                        |
|-----------------|-----------------------------------------|----------------------------------|
| `PORT`          | `3000`                                  | Porta do servidor                |
| `JWT_SECRET`    | `super_secret_key_change_in_production` | Chave secreta para assinar o JWT |
| `JWT_EXPIRES_IN`| `1h`                                    | Tempo de expiração do token      |

**Exemplo com variáveis customizadas:**
```bash
PORT=8080 JWT_SECRET=minha_chave_secreta JWT_EXPIRES_IN=2h npm start
```

---

## 📡 Endpoints

### `POST /register` — Criar usuário

**Body (JSON):**
```json
{
  "email": "usuario@exemplo.com",
  "password": "senha123"
}
```

**Resposta de sucesso `201`:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "a1b2c3d4-...",
    "email": "usuario@exemplo.com",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Possíveis erros:**

| Status | Mensagem                                          |
|--------|---------------------------------------------------|
| `400`  | `Email and password are required`                 |
| `400`  | `Invalid email format`                            |
| `400`  | `Password must be at least 6 characters long`     |
| `409`  | `Email already registered`                        |

---

### `POST /login` — Autenticar usuário

**Body (JSON):**
```json
{
  "email": "usuario@exemplo.com",
  "password": "senha123"
}
```

**Resposta de sucesso `200`:**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "a1b2c3d4-...",
    "email": "usuario@exemplo.com",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Possíveis erros:**

| Status | Mensagem                          |
|--------|-----------------------------------|
| `400`  | `Email and password are required` |
| `401`  | `Invalid email or password`       |

---

### `GET /profile` — Perfil do usuário autenticado

**Header obrigatório:**
```
Authorization: Bearer <token_obtido_no_login>
```

**Resposta de sucesso `200`:**
```json
{
  "message": "Profile retrieved successfully",
  "user": {
    "id": "a1b2c3d4-...",
    "email": "usuario@exemplo.com",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Possíveis erros:**

| Status | Mensagem                                                                 |
|--------|--------------------------------------------------------------------------|
| `401`  | `Authorization header missing or malformed. Use: Bearer <token>`         |
| `401`  | `Your session has expired. Please log in again.`                         |
| `401`  | `The provided token is invalid.`                                         |
| `404`  | `User not found`                                                         |

---

## 🧪 Testando com cURL

### 1. Registrar um usuário
```bash
curl -X POST http://localhost:3000/register \
  -H "Content-Type: application/json" \
  -d '{"email": "joao@exemplo.com", "password": "senha123"}'
```

### 2. Fazer login e capturar o token
```bash
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{"email": "joao@exemplo.com", "password": "senha123"}'
```

### 3. Acessar o perfil com o token
```bash
curl -X GET http://localhost:3000/profile \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

---

## 🧪 Testando com Postman ou Insomnia

1. **Importe** as requisições manualmente ou use a coleção abaixo.
2. Após o login, copie o valor de `token` da resposta.
3. Na requisição `GET /profile`, adicione o header:
   - **Key:** `Authorization`
   - **Value:** `Bearer <token_copiado>`

---

## 🔄 Fluxo Completo

```
┌─────────────┐     POST /register      ┌─────────────┐
│   Cliente   │ ──────────────────────► │   Servidor  │
│             │ ◄────────────────────── │             │
│             │   201 + dados do user   │             │
│             │                         │             │
│             │     POST /login         │             │
│             │ ──────────────────────► │             │
│             │ ◄────────────────────── │             │
│             │   200 + JWT token       │             │
│             │                         │             │
│             │  GET /profile           │             │
│             │  Authorization: Bearer  │             │
│             │ ──────────────────────► │ [Middleware]│
│             │ ◄────────────────────── │  valida JWT │
│             │   200 + perfil          │             │
└─────────────┘                         └─────────────┘
```

---

## 🛡️ Decisões de Segurança

| Prática                  | Implementação                                              |
|--------------------------|------------------------------------------------------------|
| Hash de senhas           | `bcryptjs` com 10 salt rounds                              |
| Token JWT                | Assinado com `HS256`, expira em 1h por padrão              |
| Mensagem de erro genérica| Login retorna `Invalid email or password` (sem revelar qual campo está errado) |
| Senha nunca exposta      | Respostas da API nunca incluem o campo `password`          |
| E-mail normalizado       | Armazenado e comparado em lowercase                        |

---

## ⚠️ Limitações (Ambiente de Desenvolvimento)

- Os dados são **perdidos ao reiniciar** o servidor (armazenamento em memória).
- Para produção, substitua `inMemoryDb.js` por um banco de dados real (PostgreSQL, MongoDB, etc.).
- Troque `JWT_SECRET` por uma chave forte e segura via variável de ambiente.
</parameter>
</invoke>
</function_calls>

Agora vamos verificar se tudo está correto e consistente:
<function_calls>
<invoke name="read_file">
<parameter name="path">/jwt-auth-api/src/services/auth.service.js</parameter>
</invoke>
</function_calls>

O import do `uuidv4` ficou desnecessariamente complexo. Vou simplificar usando `crypto.randomUUID()` diretamente:
<function_calls>
<invoke name="create_file">
<parameter name="path">/jwt-auth-api/src/services/auth.service.js</parameter>
<parameter name="content">const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { randomUUID } = require('crypto'); // Disponível nativamente no Node.js v14.17+

const db = require('../database/inMemoryDb');
const jwtConfig = require('../config/jwt.config');

// ── Constantes ───────────────────────────────────────────────────────────────
const SALT_ROUNDS = 10;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;

// ── Helpers de validação ─────────────────────────────────────────────────────

/**
 * Valida o formato do e-mail.
 * @param {string} email
 * @returns {boolean}
 */
function isValidEmail(email) {
  return EMAIL_REGEX.test(email);
}

/**
 * Valida o comprimento mínimo da senha.
 * @param {string} password
 * @returns {boolean}
 */
function isValidPassword(password) {
  return typeof password === 'string' && password.length >= MIN_PASSWORD_LENGTH;
}

// ── Serviços ─────────────────────────────────────────────────────────────────

/**
 * Registra um novo usuário.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ user: object }>} Dados públicos do usuário criado
 * @throws {Error} Se os dados forem inválidos ou o e-mail já estiver em uso
 */
async function registerUser(email, password) {
  // Validações de entrada
  if (!email || !password) {
    const err = new Error('Email and password are required');
    err.statusCode = 400;
    throw err;
  }

  if (!isValidEmail(email)) {
    const err = new Error('Invalid email format');
    err.statusCode = 400;
    throw err;
  }

  if (!isValidPassword(password)) {
    const err = new Error(
      `Password must be at least ${MIN_PASSWORD_LENGTH} characters long`
    );
    err.statusCode = 400;
    throw err;
  }

  // Verifica duplicidade (case-insensitive)
  const existingUser = db.findUserByEmail