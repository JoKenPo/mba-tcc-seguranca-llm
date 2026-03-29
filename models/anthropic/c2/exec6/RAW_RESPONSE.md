Vou criar a API REST completa com autenticação JWT. Deixa eu estruturar tudo organizadamente.

**Estrutura de pastas que vou criar:**
```
/
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

**Criando os arquivos:**

<function_calls>
<invoke name="create_file">
<parameter name="path">/package.json</parameter>
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
<parameter name="path">/server.js</parameter>
<parameter name="content">const app = require('./src/app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════╗
║         JWT Auth API is running!         ║
╠══════════════════════════════════════════╣
║  Server  : http://localhost:${PORT}         ║
║                                          ║
║  Endpoints:                              ║
║  POST /register  → Create account        ║
║  POST /login     → Get JWT token         ║
║  GET  /profile   → Protected route       ║
╚══════════════════════════════════════════╝
  `);
});
</parameter>
</invoke>
</function_calls>

<function_calls>
<invoke name="create_file">
<parameter name="path">/src/app.js</parameter>
<parameter name="content">const express = require('express');
const authRoutes = require('./routes/auth.routes');
const profileRoutes = require('./routes/profile.routes');

const app = express();

// ─── Global Middlewares ───────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Request Logger ───────────────────────────────────────────────────────────
app.use((req, _res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use(authRoutes);
app.use(profileRoutes);

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    message: 'JWT Auth API is running',
    version: '1.0.0',
    endpoints: {
      register: 'POST /register',
      login: 'POST /login',
      profile: 'GET /profile (requires Bearer token)',
    },
  });
});

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} does not exist`,
  });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('[Error]', err.message);
  res.status(err.status || 500).json({
    error: err.name || 'Internal Server Error',
    message: err.message || 'An unexpected error occurred',
  });
});

module.exports = app;
</parameter>
</invoke>
</function_calls>

<function_calls>
<invoke name="create_file">
<parameter name="path">/src/config/jwt.config.js</parameter>
<parameter name="content">/**
 * JWT Configuration
 *
 * In production, replace JWT_SECRET with a strong secret stored
 * in an environment variable (e.g. process.env.JWT_SECRET).
 */
const jwtConfig = {
  secret: process.env.JWT_SECRET || 'super-secret-jwt-key-change-in-production',
  expiresIn: process.env.JWT_EXPIRES_IN || '1h',
};

module.exports = jwtConfig;
</parameter>
</invoke>
</function_calls>

<function_calls>
<invoke name="create_file">
<parameter name="path">/src/database/inMemoryDb.js</parameter>
<parameter name="content">/**
 * In-Memory Database
 *
 * Simulates a database using a plain JavaScript array.
 * All data is lost when the server restarts — replace with
 * a real database (PostgreSQL, MongoDB, etc.) for production use.
 */

/** @type {Array<{ id: string, email: string, password: string, createdAt: string }>} */
const users = [];

const db = {
  /**
   * Returns all stored users.
   * @returns {Array} users array
   */
  getUsers() {
    return users;
  },

  /**
   * Finds a user by their email address.
   * @param {string} email
   * @returns {object|undefined}
   */
  findUserByEmail(email) {
    return users.find((user) => user.email === email);
  },

  /**
   * Finds a user by their unique ID.
   * @param {string} id
   * @returns {object|undefined}
   */
  findUserById(id) {
    return users.find((user) => user.id === id);
  },

  /**
   * Inserts a new user into the in-memory store.
   * @param {{ id: string, email: string, password: string, createdAt: string }} user
   * @returns {object} the inserted user
   */
  insertUser(user) {
    users.push(user);
    return user;
  },
};

module.exports = db;
</parameter>
</invoke>
</function_calls>

<function_calls>
<invoke name="create_file">
<parameter name="path">/src/services/auth.service.js</parameter>
<parameter name="content">const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../database/inMemoryDb');
const jwtConfig = require('../config/jwt.config');

const SALT_ROUNDS = 10;

const authService = {
  /**
   * Registers a new user after validating input and checking for duplicates.
   *
   * @param {string} email    - User's email address
   * @param {string} password - Plain-text password (will be hashed)
   * @returns {{ id: string, email: string, createdAt: string }} Safe user object (no password)
   * @throws {Error} If email is already registered or input is invalid
   */
  async register(email, password) {
    // ── Validation ────────────────────────────────────────────────────────────
    if (!email || !password) {
      const err = new Error('Email and password are required');
      err.status = 400;
      throw err;
    }

    if (!isValidEmail(email)) {
      const err = new Error('Invalid email format');
      err.status = 400;
      throw err;
    }

    if (password.length < 6) {
      const err = new Error('Password must be at least 6 characters long');
      err.status = 400;
      throw err;
    }

    // ── Duplicate check ───────────────────────────────────────────────────────
    const existingUser = db.findUserByEmail(email.toLowerCase());
    if (existingUser) {
      const err = new Error('Email is already registered');
      err.status = 409;
      throw err;
    }

    // ── Hash password & persist ───────────────────────────────────────────────
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const newUser = {
      id: uuidv4(),
      email: email.toLowerCase(),
      password: hashedPassword,
      createdAt: new Date().toISOString(),
    };

    db.insertUser(newUser);

    // Return safe user object (never expose the hashed password)
    return sanitizeUser(newUser);
  },

  /**
   * Validates credentials and returns a signed JWT on success.
   *
   * @param {string} email
   * @param {string} password
   * @returns {{ token: string, user: object }} JWT token and safe user data
   * @throws {Error} If credentials are invalid
   */
  async login(email, password) {
    // ── Validation ────────────────────────────────────────────────────────────
    if (!email || !password) {
      const err = new Error('Email and password are required');
      err.status = 400;
      throw err;
    }

    // ── Look up user ──────────────────────────────────────────────────────────
    const user = db.findUserByEmail(email.toLowerCase());
    if (!user) {
      const err = new Error('Invalid email or password');
      err.status = 401;
      throw err;
    }

    // ── Verify password ───────────────────────────────────────────────────────
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      const err = new Error('Invalid email or password');
      err.status = 401;
      throw err;
    }

    // ── Sign JWT ──────────────────────────────────────────────────────────────
    const payload = { sub: user.id, email: user.email };
    const token = jwt.sign(payload, jwtConfig.secret, {
      expiresIn: jwtConfig.expiresIn,
    });

    return { token, user: sanitizeUser(user) };
  },

  /**
   * Retrieves a user's public profile by ID.
   *
   * @param {string} userId
   * @returns {{ id: string, email: string, createdAt: string }}
   * @throws {Error} If user is not found
   */
  getProfile(userId) {
    const user = db.findUserById(userId);
    if (!user) {
      const err = new Error('User not found');
      err.status = 404;
      throw err;
    }
    return sanitizeUser(user);
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Removes sensitive fields from a user object before sending it to the client.
 * @param {object} user
 * @returns {{ id: string, email: string, createdAt: string }}
 */
function sanitizeUser({ id, email, createdAt }) {
  return { id, email, createdAt };
}

/**
 * Basic email format validation using a regular expression.
 * @param {string} email
 * @returns {boolean}
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

module.exports = authService;
</parameter>
</invoke>
</function_calls>

<function_calls>
<invoke name="create_file">
<parameter name="path">/src/middleware/auth.middleware.js</parameter>
<parameter name="content">const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt.config');

/**
 * Authentication Middleware
 *
 * Protects routes by verifying the Bearer JWT token sent in the
 * Authorization header. On success, attaches the decoded payload
 * to `req.user` so downstream handlers can access the user's data.
 *
 * Expected header format:
 *   Authorization: Bearer <token>
 */
function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];

  // ── Check header presence ─────────────────────────────────────────────────
  if (!authHeader) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authorization header is missing',
    });
  }

  // ── Validate "Bearer <token>" format ──────────────────────────────────────
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authorization header must follow the format: Bearer <token>',
    });
  }

  const token = parts[1];

  // ── Verify token signature and expiration ─────────────────────────────────
  try {
    const decoded = jwt.verify(token, jwtConfig.secret);

    // Attach decoded payload to the request for use in route handlers
    req.user = decoded;

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Token has expired. Please log in again',
      });
    }

    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid token',
    });
  }
}

module.exports = authMiddleware;
</parameter>
</invoke>
</function_calls>

<function_calls>
<invoke name="create_file">
<parameter name="path">/src/controllers/auth.controller.js</parameter>
<parameter name="content">const authService = require('../services/auth.service');

const authController = {
  /**
   * POST /register
   *
   * Creates a new user account.
   *
   * Request body:
   *   { "email": "user@example.com", "password": "secret123" }
   *
   * Responses:
   *   201 – User created successfully
   *   400 – Validation error
   *   409 – Email already registered
   */
  async register(req, res, next) {
    try {
      const { email, password } = req.body;

      const user = await authService.register(email, password);

      return res.status(201).json({
        message: 'User registered successfully',
        user,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /login
   *
   * Authenticates a user and returns a signed JWT.
   *
   * Request body:
   *   { "email": "user@example.com", "password": "secret123" }
   *
   * Responses:
   *   200 – Login successful, returns token
   *   400 – Missing fields
   *   401 – Invalid credentials
   */
  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      const { token, user } = await authService.login(email, password);

      return res.status(200).json({
        message: 'Login successful',
        token,
        user,
      });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = authController;
</parameter>
</invoke>
</function_calls>

<function_calls>
<invoke name="create_file">
<parameter name="path">/src/controllers/profile.controller.js</parameter>
<parameter name="content">const authService = require('../services/auth.service');

const profileController = {
  /**
   * GET /profile
   *
   * Returns the authenticated user's profile data.
   * Requires a valid Bearer token in the Authorization header.
   *
   * The user ID is extracted from the JWT payload attached
   * to `req.user` by the auth middleware.
   *
   * Responses:
   *   200 – Profile data returned
   *   401 – Missing or invalid token
   *   404 – User not found
   */
  getProfile(req, res, next) {
    try {
      // req.user is set by authMiddleware after token verification
      const userId = req.user.sub;

      const user = authService.getProfile(userId);

      return res.status(200).json({
        message: 'Profile retrieved successfully',
        user,
      });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = profileController;
</parameter>
</invoke>
</function_calls>

<function_calls>
<invoke name="create_file">
<parameter name="path">/src/routes/auth.routes.js</parameter>
<parameter name="content">const { Router } = require('express');
const authController = require('../controllers/auth.controller');

const router = Router();

/**
 * @route  POST /register
 * @desc   Register a new user
 * @access Public
 */
router.post('/register', authController.register);

/**
 * @route  POST /login
 * @desc   Authenticate user and return JWT
 * @access Public
 */
router.post('/login', authController.login);

module.exports = router;
</parameter>
</invoke>
</function_calls>

<function_calls>
<invoke name="create_file">
<parameter name="path">/src/routes/profile.routes.js</parameter>
<parameter name="content">const { Router } = require('express');
const profileController = require('../controllers/profile.controller');
const authMiddleware = require('../middleware/auth.middleware');

const router = Router();

/**
 * @route  GET /profile
 * @desc   Get authenticated user's profile
 * @access Private (requires Bearer token)
 */
router.get('/profile', authMiddleware, profileController.getProfile);

module.exports = router;
</parameter>
</invoke>
</function_calls>

<function_calls>
<invoke name="create_file">
<parameter name="path">/README.md</parameter>
<parameter name="content"># JWT Auth API

A REST API built with **Node.js** and **Express** featuring user registration, login with JWT authentication, and a protected profile endpoint. Data is stored in memory (JavaScript array) — no database setup required.

---

## Project Structure

```
jwt-auth-api/
├── src/
│   ├── config/
│   │   └── jwt.config.js        # JWT secret and expiration settings
│   ├── controllers/
│   │   ├── auth.controller.js   # Handles register and login requests
│   │   └── profile.controller.js# Handles profile requests
│   ├── database/
│   │   └── inMemoryDb.js        # In-memory user store (JavaScript array)
│   ├── middleware/
│   │   └── auth.middleware.js   # JWT verification middleware
│   ├── routes/
│   │   ├── auth.routes.js       # Public routes: /register, /login
│   │   └── profile.routes.js    # Protected route: /profile
│   ├── services/
│   │   └── auth.service.js      # Business logic: register, login, getProfile
│   └── app.js                   # Express app setup
├── server.js                    # Entry point
├── package.json
└── README.md
```

---

## Prerequisites

- [Node.js](https://nodejs.org/) **v18+**
- npm (comes with Node.js)

---

## Getting Started

### 1. Clone or download the project

```bash
git clone <repository-url>
cd jwt-auth-api
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the server

```bash
# Production mode
npm start

# Development mode (auto-restart on file changes)
npm run dev
```

The server will start on **http://localhost:3000**

---

## Environment Variables (Optional)

You can customize the server by setting these environment variables before starting:

| Variable        | Default                                      | Description                  |
|-----------------|----------------------------------------------|------------------------------|
| `PORT`          | `3000`                                       | Port the server listens on   |
| `JWT_SECRET`    | `super-secret-jwt-key-change-in-production`  | Secret key for signing JWTs  |
| `JWT_EXPIRES_IN`| `1h`                                         | Token expiration time        |

**Example:**
```bash
PORT=8080 JWT_SECRET=my-strong-secret JWT_EXPIRES_IN=2h npm start
```

---

## API Reference

### Base URL
```
http://localhost:3000
```

---

### `POST /register` — Create a new account

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "secret123"
}
```

**Success Response — `201 Created`:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "a1b2c3d4-...",
    "email": "user@example.com",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Responses:**

| Status | Reason                        |
|--------|-------------------------------|
| `400`  | Missing fields / invalid email / password too short (< 6 chars) |
| `409`  | Email already registered      |

---

### `POST /login` — Authenticate and get a token

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "secret123"
}
```

**Success Response — `200 OK`:**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "a1b2c3d4-...",
    "email": "user@example.com",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Responses:**

| Status | Reason                        |
|--------|-------------------------------|
| `400`  | Missing email or password     |
| `401`  | Invalid email or password     |

---

### `GET /profile` — Get authenticated user's profile

> **Requires authentication.** Include the JWT token in the `Authorization` header.

**Request Header:**
```
Authorization: Bearer <your-jwt-token>
```

**Success Response — `200 OK`:**
```json
{
  "message": "Profile retrieved successfully",
  "user": {
    "id": "a1b2c3d4-...",
    "email": "user@example.com",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Responses:**

| Status | Reason                                  |
|--------|-----------------------------------------|
| `401`  | Missing, malformed, or expired token    |
| `404`  | User not found                          |

---

## Testing with cURL

### 1. Register a user
```bash
curl -X POST http://localhost:3000/register \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "secret123"}'
```

### 2. Login and save the token
```bash
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "secret123"}'
```

Copy the `token` value from the response.

### 3. Access the protected profile
```bash
curl -X GET http://localhost:3000/profile \
  -H "Authorization: Bearer <paste-your-token-here>"
```

---

## Testing with Postman

1. **Register:** `POST http://localhost:3000/register` with JSON body
2. **Login:** `POST http://localhost:3000/login` — copy the `token` from the response
3. **Profile:** `GET http://localhost:3000/profile`
   - Go to the **Authorization** tab
   - Select **Bearer Token**
   - Paste the token

---

## Validation Rules

| Field      | Rules                                         |
|------------|-----------------------------------------------|
| `email`    | Required, must be a valid email format        |
| `password` | Required, minimum 6 characters                |

---

## Security Notes

> ⚠️ This project uses **in-memory storage** and a **hardcoded JWT secret** for simplicity. Before deploying to production:

- Store `JWT_SECRET` in an environment variable (use a strong, random string)
- Replace the in-memory array with a real database (PostgreSQL, MongoDB, etc.)
- Add rate limiting to prevent brute-force attacks
- Use HTTPS in production
- Consider adding refresh token support

---

## Dependencies

| Package      | Purpose                              |
|--------------|--------------------------------------|
| `express`    | Web framework                        |
| `jsonwebtoken` | JWT creation and verification      |
| `bcryptjs`   | Password hashing                     |
| `uuid`       | Unique ID generation                 |
| `nodemon`    | Auto-restart during development      |
</parameter>
</invoke>
</function_calls>

Aqui está um resumo completo de tudo que foi criado:

---

## 📁 Estrutura Final

```
jwt-auth-api/
├── src/
│   ├── config/
│   │   └── jwt.config.js         # Configurações do JWT
│   ├── controllers/
│   │   ├── auth.controller.js    # Lógica HTTP de register/login
│   │   └── profile.controller.js # Lógica HTTP do profile
│   ├── database/
│   │   └── inMemoryDb.js         # "Banco de dados" em array JS
│   ├── middleware/
│   │   └── auth.middleware.js    # Verificação do token JWT
│   ├── routes/
│   │   ├── auth.routes.js        # Rotas públicas
│   │   └── profile.routes.js     # Rotas protegidas
│   ├── services/
│   │   └── auth.service.js       # Regras de negócio
│   └── app.js                    # Configuração do Express
├── server.js                     # Ponto de entrada
├── package.json
└── README.md
```

---

## 🚀 Como executar

```bash
npm install
npm run dev   # desenvolvimento (nodemon)
npm start     # produção
```

---

## 🔑 Decisões de arquitetura

| Camada | Responsabilidade |
|---|---|
| **Routes** | Apenas mapeia URL + método HTTP → controller |
| **Controllers** | Extrai dados do `req`, chama o service, formata o `res` |
| **Services** | Toda a lógica de negócio (validação, hash, JWT) |
| **Middleware** | Intercepta requisições para verificar o token |
| **Database** | Abstrai o acesso ao array em memória |

**Fluxo de autenticação:**
1. `POST /login` → service valida credenciais → assina JWT com `bcryptjs` + `jsonwebtoken`
2. `GET /profile` → `authMiddleware` verifica o Bearer token → decodifica o `userId` → controller busca o perfil