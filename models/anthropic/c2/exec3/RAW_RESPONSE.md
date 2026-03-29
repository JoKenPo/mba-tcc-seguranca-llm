Vou criar a API REST completa com autenticação JWT. Deixa eu estruturar tudo organizadamente.

**Estrutura do projeto:**
```
jwt-auth-api/
├── src/
│   ├── controllers/
│   │   ├── authController.js
│   │   └── userController.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   └── userRoutes.js
│   ├── services/
│   │   ├── authService.js
│   │   └── userService.js
│   ├── middleware/
│   │   └── authMiddleware.js
│   ├── store/
│   │   └── inMemoryStore.js
│   └── app.js
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
  "main": "src/app.js",
  "scripts": {
    "start": "node src/app.js",
    "dev": "nodemon src/app.js"
  },
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "express": "^4.18.2",
    "jsonwebtoken": "^9.0.2",
    "uuid": "^9.0.0"
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
<parameter name="path">/jwt-auth-api/src/store/inMemoryStore.js</parameter>
<parameter name="content">/**
 * In-memory store simulating a simple database using a JavaScript array.
 * All data is lost when the server restarts — suitable for development/demo only.
 */

const users = [];

/**
 * Returns all stored users (avoid exposing passwords externally).
 * @returns {Array} Full users array reference.
 */
const getUsers = () => users;

/**
 * Finds a user by their email address (case-insensitive).
 * @param {string} email
 * @returns {Object|undefined} The matched user object or undefined.
 */
const findUserByEmail = (email) =>
  users.find((u) => u.email.toLowerCase() === email.toLowerCase());

/**
 * Finds a user by their unique ID.
 * @param {string} id
 * @returns {Object|undefined} The matched user object or undefined.
 */
const findUserById = (id) => users.find((u) => u.id === id);

/**
 * Inserts a new user into the in-memory store.
 * @param {Object} user - User object containing id, email, passwordHash, createdAt.
 * @returns {Object} The inserted user object.
 */
const insertUser = (user) => {
  users.push(user);
  return user;
};

module.exports = {
  getUsers,
  findUserByEmail,
  findUserById,
  insertUser,
};
</parameter>
</invoke>
</function_calls>

<function_calls>
<invoke name="create_file">
<parameter name="path">/jwt-auth-api/src/services/userService.js</parameter>
<parameter name="content">const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
const {
  findUserByEmail,
  findUserById,
  insertUser,
} = require("../store/inMemoryStore");

/** Number of bcrypt salt rounds — higher = more secure but slower. */
const SALT_ROUNDS = 10;

/**
 * Registers a new user after validating input and checking for duplicates.
 *
 * @param {string} email    - User's email address.
 * @param {string} password - Plain-text password (will be hashed).
 * @returns {Object} Safe user object (without passwordHash).
 * @throws {Error} If validation fails or email is already registered.
 */
const registerUser = async (email, password) => {
  // ── Validation ──────────────────────────────────────────────────────────────
  if (!email || !password) {
    const err = new Error("Email and password are required.");
    err.statusCode = 400;
    throw err;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    const err = new Error("Invalid email format.");
    err.statusCode = 400;
    throw err;
  }

  if (password.length < 6) {
    const err = new Error("Password must be at least 6 characters long.");
    err.statusCode = 400;
    throw err;
  }

  // ── Duplicate check ──────────────────────────────────────────────────────────
  const existing = findUserByEmail(email);
  if (existing) {
    const err = new Error("Email is already registered.");
    err.statusCode = 409;
    throw err;
  }

  // ── Persist ──────────────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const newUser = {
    id: uuidv4(),
    email: email.toLowerCase().trim(),
    passwordHash,
    createdAt: new Date().toISOString(),
  };

  insertUser(newUser);

  // Return a safe representation (never expose the hash)
  return sanitizeUser(newUser);
};

/**
 * Retrieves a user's public profile by ID.
 *
 * @param {string} id - UUID of the user.
 * @returns {Object} Safe user object.
 * @throws {Error} If the user is not found.
 */
const getUserById = (id) => {
  const user = findUserById(id);
  if (!user) {
    const err = new Error("User not found.");
    err.statusCode = 404;
    throw err;
  }
  return sanitizeUser(user);
};

/**
 * Strips sensitive fields before sending user data to the client.
 *
 * @param {Object} user - Raw user object from the store.
 * @returns {Object} User object without passwordHash.
 */
const sanitizeUser = ({ id, email, createdAt }) => ({ id, email, createdAt });

module.exports = { registerUser, getUserById };
</parameter>
</invoke>
</function_calls>

<function_calls>
<invoke name="create_file">
<parameter name="path">/jwt-auth-api/src/services/authService.js</parameter>
<parameter name="content">const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { findUserByEmail } = require("../store/inMemoryStore");

const JWT_SECRET = process.env.JWT_SECRET || "super_secret_dev_key_change_in_prod";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "2h";

/**
 * Validates credentials and returns a signed JWT on success.
 *
 * @param {string} email    - User's email address.
 * @param {string} password - Plain-text password to verify.
 * @returns {{ token: string, expiresIn: string }} JWT and its expiry label.
 * @throws {Error} If credentials are missing, invalid, or the user doesn't exist.
 */
const loginUser = async (email, password) => {
  // ── Basic input validation ───────────────────────────────────────────────────
  if (!email || !password) {
    const err = new Error("Email and password are required.");
    err.statusCode = 400;
    throw err;
  }

  // ── Look up user ─────────────────────────────────────────────────────────────
  const user = findUserByEmail(email);

  // Use a constant-time comparison to prevent user-enumeration via timing attacks.
  // We compare against a dummy hash when the user doesn't exist so the bcrypt
  // work factor is always paid regardless of whether the account exists.
  const DUMMY_HASH =
    "$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012345";

  const hashToCompare = user ? user.passwordHash : DUMMY_HASH;
  const passwordMatch = await bcrypt.compare(password, hashToCompare);

  if (!user || !passwordMatch) {
    const err = new Error("Invalid email or password.");
    err.statusCode = 401;
    throw err;
  }

  // ── Issue token ───────────────────────────────────────────────────────────────
  const payload = { sub: user.id, email: user.email };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

  return { token, expiresIn: JWT_EXPIRES_IN };
};

/**
 * Verifies a JWT and returns its decoded payload.
 *
 * @param {string} token - Raw JWT string.
 * @returns {Object} Decoded payload ({ sub, email, iat, exp }).
 * @throws {Error} If the token is missing, malformed, or expired.
 */
const verifyToken = (token) => {
  if (!token) {
    const err = new Error("No token provided.");
    err.statusCode = 401;
    throw err;
  }

  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (jwtError) {
    const err = new Error(
      jwtError.name === "TokenExpiredError"
        ? "Token has expired."
        : "Invalid token."
    );
    err.statusCode = 401;
    throw err;
  }
};

module.exports = { loginUser, verifyToken };
</parameter>
</invoke>
</function_calls>

<function_calls>
<invoke name="create_file">
<parameter name="path">/jwt-auth-api/src/middleware/authMiddleware.js</parameter>
<parameter name="content">const { verifyToken } = require("../services/authService");

/**
 * Express middleware that protects routes requiring authentication.
 *
 * Expects the Authorization header in the format:
 *   Authorization: Bearer <token>
 *
 * On success  → attaches the decoded payload to `req.user` and calls `next()`.
 * On failure  → responds immediately with 401 and a JSON error message.
 */
const authenticate = (req, res, next) => {
  const authHeader = req.headers["authorization"] || req.headers["Authorization"];

  // Header must be present and follow the "Bearer <token>" scheme
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Authorization header missing or malformed. Use: Bearer <token>",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = verifyToken(token);
    req.user = decoded; // { sub: userId, email, iat, exp }
    next();
  } catch (err) {
    return res.status(err.statusCode || 401).json({
      success: false,
      message: err.message,
    });
  }
};

module.exports = { authenticate };
</parameter>
</invoke>
</function_calls>

<function_calls>
<invoke name="create_file">
<parameter name="path">/jwt-auth-api/src/controllers/authController.js</parameter>
<parameter name="content">const { registerUser } = require("../services/userService");
const { loginUser } = require("../services/authService");

/**
 * POST /register
 *
 * Body: { "email": "user@example.com", "password": "secret123" }
 *
 * Creates a new user account and returns the sanitized user object.
 */
const register = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await registerUser(email, password);

    return res.status(201).json({
      success: true,
      message: "User registered successfully.",
      data: { user },
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
    });
  }
};

/**
 * POST /login
 *
 * Body: { "email": "user@example.com", "password": "secret123" }
 *
 * Validates credentials and returns a signed JWT.
 */
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const { token, expiresIn } = await loginUser(email, password);

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      data: { token, expiresIn },
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
    });
  }
};

module.exports = { register, login };
</parameter>
</invoke>
</function_calls>

<function_calls>
<invoke name="create_file">
<parameter name="path">/jwt-auth-api/src/controllers/userController.js</parameter>
<parameter name="content">const { getUserById } = require("../services/userService");

/**
 * GET /profile
 *
 * Protected route — requires a valid Bearer token.
 * The `authenticate` middleware populates `req.user` with the decoded JWT payload.
 *
 * Returns the authenticated user's public profile.
 */
const getProfile = (req, res) => {
  // req.user is set by the authMiddleware after token verification
  const userId = req.user.sub;

  try {
    const user = getUserById(userId);

    return res.status(200).json({
      success: true,
      message: "Profile retrieved successfully.",
      data: { user },
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
    });
  }
};

module.exports = { getProfile };
</parameter>
</invoke>
</function_calls>

<function_calls>
<invoke name="create_file">
<parameter name="path">/jwt-auth-api/src/routes/authRoutes.js</parameter>
<parameter name="content">const { Router } = require("express");
const { register, login } = require("../controllers/authController");

const router = Router();

/**
 * @route  POST /register
 * @desc   Create a new user account
 * @access Public
 */
router.post("/register", register);

/**
 * @route  POST /login
 * @desc   Authenticate and receive a JWT
 * @access Public
 */
router.post("/login", login);

module.exports = router;
</parameter>
</invoke>
</function_calls>

<function_calls>
<invoke name="create_file">
<parameter name="path">/jwt-auth-api/src/routes/userRoutes.js</parameter>
<parameter name="content">const { Router } = require("express");
const { getProfile } = require("../controllers/userController");
const { authenticate } = require("../middleware/authMiddleware");

const router = Router();

/**
 * @route  GET /profile
 * @desc   Retrieve the authenticated user's profile
 * @access Private (JWT required)
 */
router.get("/profile", authenticate, getProfile);

module.exports = router;
</parameter>
</invoke>
</function_calls>

<function_calls>
<invoke name="create_file">
<parameter name="path">/jwt-auth-api/src/app.js</parameter>
<parameter name="content">const express = require("express");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

// ── Global Middleware ──────────────────────────────────────────────────────────

// Parse incoming JSON request bodies
app.use(express.json());

// Parse URL-encoded bodies (form submissions)
app.use(express.urlencoded({ extended: true }));

// Basic request logger for development visibility
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ── Routes ─────────────────────────────────────────────────────────────────────
app.use("/", authRoutes); // POST /register  |  POST /login
app.use("/", userRoutes); // GET  /profile

// ── Health Check ───────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "API is running.",
    timestamp: new Date().toISOString(),
  });
});

// ── 404 Handler ────────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found.",
  });
});

// ── Global Error Handler ───────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error("[Unhandled Error]", err);
  res.status(500).json({
    success: false,
    message: "Internal server error.",
  });
});

// ── Start Server ───────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 JWT Auth API running on http://localhost:${PORT}`);
  console.log(`   Environment : ${process.env.NODE_ENV || "development"}`);
  console.log(`   Press Ctrl+C to stop.\n`);
});

module.exports = app; // exported for potential testing use
</parameter>
</invoke>
</function_calls>

<function_calls>
<invoke name="create_file">
<parameter name="path">/jwt-auth-api/README.md</parameter>
<parameter name="content"># JWT Auth API

API REST construída com **Node.js** e **Express** que implementa autenticação via **JWT (JSON Web Token)** com persistência em memória.

---

## Sumário

- [Tecnologias](#tecnologias)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Pré-requisitos](#pré-requisitos)
- [Instalação e Execução](#instalação-e-execução)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [Endpoints](#endpoints)
- [Exemplos de Uso](#exemplos-de-uso)
- [Decisões de Segurança](#decisões-de-segurança)

---

## Tecnologias

| Pacote       | Finalidade                              |
|--------------|-----------------------------------------|
| express      | Framework HTTP                          |
| jsonwebtoken | Geração e verificação de JWT            |
| bcryptjs     | Hash seguro de senhas                   |
| uuid         | Geração de IDs únicos para usuários     |
| nodemon      | Reinício automático em desenvolvimento  |

---

## Estrutura do Projeto

```
jwt-auth-api/
├── src/
│   ├── app.js                  # Ponto de entrada, configuração do Express
│   ├── controllers/
│   │   ├── authController.js   # Handlers de register e login
│   │   └── userController.js   # Handler de profile
│   ├── middleware/
│   │   └── authMiddleware.js   # Verificação do JWT nas rotas protegidas
│   ├── routes/
│   │   ├── authRoutes.js       # POST /register, POST /login
│   │   └── userRoutes.js       # GET /profile
│   ├── services/
│   │   ├── authService.js      # Lógica de login e verificação de token
│   │   └── userService.js      # Lógica de criação e busca de usuários
│   └── store/
│       └── inMemoryStore.js    # "Banco de dados" em array JavaScript
├── package.json
└── README.md
```

---

## Pré-requisitos

- [Node.js](https://nodejs.org/) **v18+**
- npm (incluído com o Node.js)

Verifique sua versão:
```bash
node --version
npm --version
```

---

## Instalação e Execução

### 1. Clone ou baixe o projeto

```bash
# Se estiver usando git
git clone <url-do-repositorio>
cd jwt-auth-api

# Ou simplesmente navegue até a pasta do projeto
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

**Modo desenvolvimento** (reinicia automaticamente ao salvar arquivos):
```bash
npm run dev
```

O servidor estará disponível em: **http://localhost:3000**

Você verá no terminal:
```
🚀 JWT Auth API running on http://localhost:3000
   Environment : development
   Press Ctrl+C to stop.
```

---

## Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto para sobrescrever os valores padrão:

```env
PORT=3000
JWT_SECRET=sua_chave_secreta_super_segura_aqui
JWT_EXPIRES_IN=2h
NODE_ENV=development
```

| Variável       | Padrão                        | Descrição                          |
|----------------|-------------------------------|------------------------------------|
| PORT           | `3000`                        | Porta do servidor HTTP             |
| JWT_SECRET     | `super_secret_dev_key_...`    | Chave de assinatura do JWT         |
| JWT_EXPIRES_IN | `2h`                          | Tempo de expiração do token        |
| NODE_ENV       | `development`                 | Ambiente de execução               |

> ⚠️ **Nunca use a chave padrão em produção.** Gere uma chave forte com:
> ```bash
> node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
> ```

---

## Endpoints

### Visão Geral

| Método | Rota        | Autenticação | Descrição                        |
|--------|-------------|:------------:|----------------------------------|
| GET    | `/health`   | ❌ Pública   | Verifica se a API está no ar     |
| POST   | `/register` | ❌ Pública   | Cria uma nova conta de usuário   |
| POST   | `/login`    | ❌ Pública   | Autentica e retorna um JWT       |
| GET    | `/profile`  | ✅ Privada   | Retorna o perfil do usuário      |

---

### `GET /health`

Verifica se a API está operacional.

**Resposta `200`:**
```json
{
  "success": true,
  "message": "API is running.",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

### `POST /register`

Cria uma nova conta de usuário.

**Body (JSON):**
```json
{
  "email": "usuario@exemplo.com",
  "password": "minhasenha123"
}
```

**Regras de validação:**
- `email`: obrigatório, formato válido de e-mail
- `password`: obrigatório, mínimo de 6 caracteres

**Resposta `201` — Sucesso:**
```json
{
  "success": true,
  "message": "User registered successfully.",
  "data": {
    "user": {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "email": "usuario@exemplo.com",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

**Resposta `400` — Dados inválidos:**
```json
{
  "success": false,
  "message": "Password must be at least 6 characters long."
}
```

**Resposta `409` — E-mail já cadastrado:**
```json
{
  "success": false,
  "message": "Email is already registered."
}
```

---

### `POST /login`

Autentica o usuário e retorna um token JWT.

**Body (JSON):**
```json
{
  "email": "usuario@exemplo.com",
  "password": "minhasenha123"
}
```

**Resposta `200` — Sucesso:**
```json
{
  "success": true,
  "message": "Login successful.",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "2h"
  }
}
```

**Resposta `401` — Credenciais inválidas:**
```json
{
  "success": false,
  "message": "Invalid email or password."
}
```

---

### `GET /profile` 🔒

Retorna o perfil do usuário autenticado.

**Header obrigatório:**
```
Authorization: Bearer <seu_token_jwt>
```

**Resposta `200` — Sucesso:**
```json
{
  "success": true,
  "message": "Profile retrieved successfully.",
  "data": {
    "user": {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "email": "usuario@exemplo.com",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

**Resposta `401` — Token ausente ou inválido:**
```json
{
  "success": false,
  "message": "Authorization header missing or malformed. Use: Bearer <token>"
}
```

**Resposta `401` — Token expirado:**
```json
{
  "success": false,
  "message": "Token has expired."
}
```

---

## Exemplos de Uso

### Usando cURL

**1. Registrar usuário:**
```bash
curl -X POST http://localhost:3000/register \
  -H "Content-Type: application/json" \
  -d '{"email": "joao@exemplo.com", "password": "senha123"}'
```

**2. Fazer login:**
```bash
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{"email": "joao@exemplo.com", "password": "senha123"}'
```

**3. Acessar perfil (substitua `<TOKEN>` pelo token recebido no login):**
```bash
curl -X GET http://localhost:3000/profile \
  -H "Authorization: Bearer <TOKEN>"
```

---

### Fluxo Completo com Variável de Shell

```bash
# 1. Registrar
curl -s -X POST http://localhost:3000/register \
  -H "Content-Type: application/json" \
  -d '{"email": "teste@exemplo.com", "password": "senha123"}'

# 2. Login e captura do token
TOKEN=$(curl -s -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{"email": "teste@exemplo.com", "password": "senha123"}' \
  | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

echo "Token: $TOKEN"

# 3. Acessar perfil com o token capturado
curl -s -X GET http://localhost:3000/profile \
  -H "Authorization: Bearer $TOKEN"
```

---

### Usando Postman ou Insomnia

1. **Registrar:** `POST http://localhost:3000/register` com body JSON
2. **Login:** `POST http://localhost:3000/login` — copie o `token` da resposta
3. **Perfil:** `GET http://localhost:3000/profile`
   - Vá em **Auth → Bearer Token** e cole o token copiado

---

## Decisões de Segurança

| Prática | Implementação |
|---|---|
| **Hash de senhas** | bcrypt com 10 salt rounds — senhas nunca são armazenadas em texto puro |
| **Proteção contra enumeração de usuários** | Login sempre compara hash (mesmo para e-mails inexistentes), evitando timing attacks |
| **JWT com expiração** | Tokens expiram em 2h por padrão, limitando a janela de uso indevido |
| **Payload mínimo no JWT** | Apenas `sub` (ID) e `email` — sem dados sensíveis no token |
| **Separação de responsabilidades** | Controllers → Services → Store, sem lógica de negócio nas rotas |
| **Senha nunca exposta** | `sanitizeUser()` remove `passwordHash` antes de qualquer resposta |

> ⚠️ **Nota sobre persistência:** os dados são armazenados em memória e **serão perdidos ao reiniciar o servidor**. Para produção, substitua `inMemoryStore.js` por um banco de dados real (PostgreSQL, MongoDB, etc.).
</parameter>
</invoke>
</function_calls>

Aqui está um resumo completo do que foi criado:

---

## 📁 Estrutura Gerada

```
jwt-auth-api/
├── src/
│   ├── app.js                  ← Ponto de entrada + configuração Express
│   ├── controllers/
│   │   ├── authController.js   ← Handlers de /register e /login
│   │   └── userController.js   ← Handler de /profile
│   ├── middleware/
│   │   └── authMiddleware.js   ← Verificação do JWT
│   ├── routes/
│   │   ├── authRoutes.js       ← Rotas públicas
│   │   └── userRoutes.js       ← Rotas proteg