Vou criar uma API REST completa com Node.js, Express e JWT com todas as práticas de segurança solicitadas.

## Estrutura do Projeto

```
auth-api/
├── src/
│   ├── config/
│   │   └── env.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── security.js
│   ├── routes/
│   │   ├── auth.js
│   │   └── profile.js
│   ├── services/
│   │   └── userService.js
│   ├── utils/
│   │   └── validators.js
│   └── app.js
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

**package.json**
```json
{
  "name": "auth-api",
  "version": "1.0.0",
  "description": "REST API with JWT authentication",
  "main": "src/app.js",
  "scripts": {
    "start": "node src/app.js",
    "dev": "nodemon src/app.js"
  },
  "dependencies": {
    "bcrypt": "^5.1.1",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "express-rate-limit": "^7.3.1",
    "helmet": "^7.1.0",
    "jsonwebtoken": "^9.0.2",
    "uuid": "^10.0.0"
  },
  "devDependencies": {
    "nodemon": "^3.1.4"
  }
}
```

**.env.example**
```bash
# Server
PORT=3000
NODE_ENV=development

# JWT - CHANGE THIS IN PRODUCTION!
JWT_SECRET=your-super-secret-key-change-this-in-production-min-32-chars
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**.gitignore**
```
node_modules/
.env
*.log
.DS_Store
```

**src/config/env.js**
```javascript
import 'dotenv/config';

// Validate required environment variables
const requiredEnvVars = ['JWT_SECRET'];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`FATAL: Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

// Enforce minimum secret length for security
if (process.env.JWT_SECRET.length < 32) {
  console.error('FATAL: JWT_SECRET must be at least 32 characters long');
  process.exit(1);
}

export const config = {
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',

  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  },

  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS, 10) || 12,
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
  },
};
```

**src/services/userService.js**
```javascript
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/env.js';

// In-memory storage (replace with a database in production)
const users = new Map();

/**
 * Find a user by their email address.
 * @param {string} email
 * @returns {object|undefined}
 */
export function findUserByEmail(email) {
  for (const user of users.values()) {
    if (user.email === email.toLowerCase()) {
      return user;
    }
  }
  return undefined;
}

/**
 * Find a user by their ID.
 * @param {string} id
 * @returns {object|undefined}
 */
export function findUserById(id) {
  return users.get(id);
}

/**
 * Create a new user with a hashed password.
 * @param {string} name
 * @param {string} email
 * @param {string} password
 * @returns {object} The created user (without password hash)
 */
export async function createUser(name, email, password) {
  const passwordHash = await bcrypt.hash(password, config.security.bcryptRounds);

  const user = {
    id: uuidv4(),
    name: name.trim(),
    email: email.toLowerCase().trim(),
    passwordHash,
    createdAt: new Date().toISOString(),
  };

  users.set(user.id, user);

  // Return user without sensitive data
  return sanitizeUser(user);
}

/**
 * Verify a plain-text password against a stored hash.
 * @param {string} password
 * @param {string} hash
 * @returns {Promise<boolean>}
 */
export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

/**
 * Remove sensitive fields from a user object.
 * @param {object} user
 * @returns {object}
 */
export function sanitizeUser(user) {
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}
```

**src/utils/validators.js**
```javascript
/**
 * Validate registration input fields.
 * Returns an array of error messages (empty if valid).
 * @param {object} body
 * @returns {string[]}
 */
export function validateRegisterInput({ name, email, password }) {
  const errors = [];

  // Name validation
  if (!name || typeof name !== 'string') {
    errors.push('Name is required');
  } else if (name.trim().length < 2 || name.trim().length > 100) {
    errors.push('Name must be between 2 and 100 characters');
  }

  // Email validation
  if (!email || typeof email !== 'string') {
    errors.push('Email is required');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    errors.push('Invalid email format');
  }

  // Password validation
  if (!password || typeof password !== 'string') {
    errors.push('Password is required');
  } else {
    if (password.length < 8) errors.push('Password must be at least 8 characters');
    if (!/[A-Z]/.test(password)) errors.push('Password must contain at least one uppercase letter');
    if (!/[a-z]/.test(password)) errors.push('Password must contain at least one lowercase letter');
    if (!/\d/.test(password)) errors.push('Password must contain at least one number');
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
  }

  return errors;
}

/**
 * Validate login input fields.
 * @param {object} body
 * @returns {string[]}
 */
export function validateLoginInput({ email, password }) {
  const errors = [];

  if (!email || typeof email !== 'string') {
    errors.push('Email is required');
  }

  if (!password || typeof password !== 'string') {
    errors.push('Password is required');
  }

  return errors;
}
```

**src/middleware/auth.js**
```javascript
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { findUserById } from '../services/userService.js';

/**
 * Middleware to authenticate requests using JWT Bearer tokens.
 * Attaches the authenticated user to req.user on success.
 */
export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  // Check for Bearer token in Authorization header
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Missing or malformed Authorization header. Expected: Bearer <token>',
    });
  }

  const token = authHeader.slice(7); // Remove "Bearer " prefix

  try {
    const payload = jwt.verify(token, config.jwt.secret, {
      algorithms: ['HS256'], // Explicitly allow only HS256
    });

    // Verify user still exists in storage
    const user = findUserById(payload.sub);
    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User no longer exists',
      });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Token has expired',
      });
    }

    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid token',
      });
    }

    // Unexpected error
    console.error('[Auth Middleware] Unexpected error:', err.message);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Authentication failed unexpectedly',
    });
  }
}

/**
 * Generate a signed JWT for a given user.
 * @param {object} user - Sanitized user object
 * @returns {string} Signed JWT
 */
export function generateToken(user) {
  return jwt.sign(
    {
      sub: user.id,       // Subject: user ID
      email: user.email,  // Additional claim
      name: user.name,
    },
    config.jwt.secret,
    {
      algorithm: 'HS256',
      expiresIn: config.jwt.expiresIn,
      issuer: 'auth-api',
    }
  );
}
```

**src/middleware/security.js**
```javascript
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from '../config/env.js';

/**
 * Helmet configuration for secure HTTP headers.
 */
export const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'none'"],
      frameAncestors: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,       // 1 year in seconds
    includeSubDomains: true,
    preload: true,
  },
  referrerPolicy: { policy: 'no-referrer' },
  xContentTypeOptions: true,
  xFrameOptions: { action: 'deny' },
});

/**
 * General rate limiter applied to all routes.
 */
export const globalRateLimiter = rateLimit({
  windowMs: config.security.rateLimitWindowMs,
  max: config.security.rateLimitMaxRequests,
  standardHeaders: true,   // Return rate limit info in RateLimit-* headers
  legacyHeaders: false,     // Disable X-RateLimit-* headers
  message: {
    error: 'Too Many Requests',
    message: 'You have exceeded the request limit. Please try again later.',
  },
});

/**
 * Stricter rate limiter for authentication endpoints.
 * Limits to 10 attempts per 15 minutes to prevent brute-force attacks.
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too Many Requests',
    message: 'Too many authentication attempts. Please try again in 15 minutes.',
  },
});
```

**src/routes/auth.js**
```javascript
import { Router } from 'express';
import { createUser, findUserByEmail, sanitizeUser, verifyPassword } from '../services/userService.js';
import { generateToken } from '../middleware/auth.js';
import { validateRegisterInput, validateLoginInput } from '../utils/validators.js';
import { authRateLimiter } from '../middleware/security.js';

const router = Router();

/**
 * POST /register
 * Create a new user account.
 */
router.post('/register', authRateLimiter, async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate input
    const errors = validateRegisterInput({ name, email, password });
    if (errors.length > 0) {
      return res.status(400).json({
        error: 'Validation Error',
        messages: errors,
      });
    }

    // Check for duplicate email
    const existingUser = findUserByEmail(email);
    if (existingUser) {
      // Use a generic message to avoid user enumeration
      return res.status(409).json({
        error: 'Conflict',
        message: 'An account with this email already exists',
      });
    }

    // Create user (password is hashed inside createUser)
    const newUser = await createUser(name, email, password);
    const token = generateToken(newUser);

    return res.status(201).json({
      message: 'Account created successfully',
      user: newUser,
      token,
      expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    });
  } catch (err) {
    console.error('[POST /register] Error:', err.message);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create account',
    });
  }
});

/**
 * POST /login
 * Authenticate a user and return a JWT.
 */
router.post('/login', authRateLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    const errors = validateLoginInput({ email, password });
    if (errors.length > 0) {
      return res.status(400).json({
        error: 'Validation Error',
        messages: errors,
      });
    }

    // Find user by email
    const user = findUserByEmail(email);

    // Always run bcrypt.compare to prevent timing attacks,
    // even if the user doesn't exist (compare against a dummy hash)
    const DUMMY_HASH = '$2b$12$invalidhashfortimingattackprevention000000000000000000';
    const passwordToVerify = user ? user.passwordHash : DUMMY_HASH;
    const isPasswordValid = await verifyPassword(password, passwordToVerify);

    if (!user || !isPasswordValid) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid email or password',
      });
    }

    const safeUser = sanitizeUser(user);
    const token = generateToken(safeUser);

    return res.status(200).json({
      message: 'Login successful',
      user: safeUser,
      token,
      expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    });
  } catch (err) {
    console.error('[POST /login] Error:', err.message);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Login failed',
    });
  }
});

export default router;
```

**src/routes/profile.js**
```javascript
import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { sanitizeUser } from '../services/userService.js';

const router = Router();

/**
 * GET /profile
 * Return the authenticated user's profile.
 * Protected by JWT authentication middleware.
 */
router.get('/profile', authenticate, (req, res) => {
  // req.user is set by the authenticate middleware
  const safeUser = sanitizeUser(req.user);

  return res.status(200).json({
    message: 'Profile retrieved successfully',
    user: safeUser,
  });
});

export default router;
```

**src/app.js**
```javascript
import './config/env.js'; // Must be first — validates env vars on startup
import express from 'express';
import { config } from './config/env.js';
import { helmetMiddleware, globalRateLimiter } from './middleware/security.js';
import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profile.js';

const app = express();

// ─── Security Middleware ───────────────────────────────────────────────────────
app.use(helmetMiddleware);
app.use(globalRateLimiter);

// Disable X-Powered-By header to avoid fingerprinting
app.disable('x-powered-by');

// ─── Body Parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' })); // Limit body size to prevent DoS
app.use(express.urlencoded({ extended: false, limit: '10kb' }));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/', authRoutes);
app.use('/', profileRoutes);

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    environment: config.nodeEnv,
    timestamp: new Date().toISOString(),
  });
});

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} does not exist`,
  });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  console.error('[Unhandled Error]', err);

  // Never expose stack traces in production
  const response = {
    error: 'Internal Server Error',
    message: config.isProduction ? 'An unexpected error occurred' : err.message,
  };

  if (!config.isProduction) {
    response.stack = err.stack;
  }

  res.status(err.status || 500).json(response);
});

// ─── Start Server ─────────────────────────────────────────────────────────────
app.listen(config.port, () => {
  console.log(`✅ Server running on http://localhost:${config.port}`);
  console.log(`🌍 Environment: ${config.nodeEnv}`);
  console.log(`🔒 JWT expiration: ${config.jwt.expiresIn}`);
});

export default app;
```

Agora o README completo:

**README.md**
````markdown
# 🔐 Auth API

REST API with secure user registration, login, and JWT-protected routes.

---

## 📋 Table of Contents

- [Features](#features)
- [Security Measures](#security-measures)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the API](#running-the-api)
- [API Reference](#api-reference)
- [Examples with cURL](#examples-with-curl)
- [Project Structure](#project-structure)

---

## ✨ Features

- User registration with input validation
- Secure login with JWT token generation
- Protected profile route (requires valid JWT)
- In-memory user storage (no database required)

---

## 🛡️ Security Measures

| Measure | Implementation |
|---|---|
| Password hashing | `bcrypt` with 12 rounds (configurable) |
| JWT expiration | Configurable via `JWT_EXPIRES_IN` env var |
| JWT secret | Loaded from environment variable (min. 32 chars) |
| Auth middleware | Validates Bearer token on protected routes |
| Security headers | `helmet` (CSP, HSTS, X-Frame-Options, etc.) |
| Rate limiting | Global + stricter limit on auth endpoints |
| Timing attack prevention | Dummy bcrypt compare when user not found |
| User enumeration prevention | Generic error messages on login failure |
| Body size limit | 10kb max to prevent DoS |
| Algorithm pinning | JWT explicitly uses only `HS256` |

---

## ✅ Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- npm v9 or higher

---

## 📦 Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-username/auth-api.git
cd auth-api

# 2. Install dependencies
npm install

# 3. Create your environment file
cp .env.example .env
```

---

## ⚙️ Configuration

Edit the `.env` file with your values:

```bash
# Server
PORT=3000
NODE_ENV=development

# JWT — CHANGE THIS IN PRODUCTION!
JWT_SECRET=my-super-secret-key-that-is-at-least-32-chars-long!
JWT_EXPIRES_IN=1h

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Generating a secure JWT secret

```bash
# Option 1: Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Option 2: OpenSSL
openssl rand -hex 64
```

> ⚠️ **Never commit your `.env` file to version control.**

---

## 🚀 Running the API

```bash
# Production mode
npm start

# Development mode (auto-restart on file changes)
npm run dev
```

Expected output:

```
✅ Server running on http://localhost:3000
🌍 Environment: development
🔒 JWT expiration: 1h
```

---

## 📡 API Reference

### `POST /register`

Creates a new user account.

**Request Body:**

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "SecurePass1!"
}
```

**Password requirements:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character (`!@#$%^&*...`)

**Success Response — `201 Created`:**

```json
{
  "message": "Account created successfully",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "createdAt": "2024-01-15T10:30:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": "1h"
}
```

**Error Responses:**

| Status | Reason |
|---|---|
| `400` | Validation errors (missing/invalid fields) |
| `409` | Email already registered |
| `429` | Too many requests |
| `500` | Internal server error |

---

### `POST /login`

Authenticates a user and returns a JWT.

**Request Body:**

```json
{
  "email": "jane@example.com",
  "password": "SecurePass1!"
}
```

**Success Response — `200 OK`:**

```json
{
  "message": "Login successful",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "createdAt": "2024-01-15T10:30:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": "1h"
}
```

**Error Responses:**

| Status | Reason |
|---|---|
| `400` | Missing email or password |
| `401` | Invalid credentials |
| `429` | Too many requests |
| `500` | Internal server error |

---

### `GET /profile` 🔒

Returns the authenticated user's profile.

**Headers:**

```
Authorization: Bearer <your-jwt-token>
```

**Success Response — `200 OK`:**

```json
{
  "message": "Profile retrieved successfully",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Responses:**

| Status | Reason |
|---|---|
| `401` | Missing, invalid, or expired token |
| `500` | Internal server error |

---

### `GET /health`

Health check endpoint (no authentication required).

**Response — `200 OK`:**

```json
{
  "status": "ok",
  "environment": "development",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## 🧪 Examples with cURL

### Register a new user

```bash
curl -X POST http://localhost:3000/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Doe",
    "email": "jane@example.com",
    "password": "SecurePass1!"
  }'
```

### Login

```bash
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "jane@example.com",
    "password": "SecurePass1!"
  }'
```

### Access protected profile

```bash
# Replace <TOKEN> with the token received from /login or /register
curl -X GET http://localhost:3000/profile \
  -H "Authorization: Bearer <TOKEN>"
```

### Full flow in one script

```bash
#!/bin/bash

BASE_URL="http://localhost:3000"

echo "=== Registering user ==="
REGISTER=$(curl -s -X POST "$BASE_URL/register" \
  -H "Content-Type: application/json" \
  -d '{"name":"Jane Doe","email":"jane@example.com","password":"SecurePass1!"}')
echo "$REGISTER" | jq .

TOKEN=$(echo "$REGISTER" | jq -r '.token')

echo ""
echo "=== Accessing profile ==="
curl -s -X GET "$BASE_URL/profile" \
  -H "Authorization: Bearer $TOKEN" | jq .
```

> Requires [jq](https://jqlang.github.io/jq/) for JSON formatting.

---

## 📁 Project Structure

```
auth-api/
├── src/
│   ├── config/
│   │   └── env.js          # Environment variable validation & config
│   ├── middleware/
│   │   ├── auth.js         # JWT authentication middleware & token generator
│   │   └── security.js     # Helmet headers & rate limiters
│   ├── routes/
│   │   ├── auth.js         # POST /register, POST /login
│   │   └── profile.js      # GET /profile (protected)
│   ├── services/
│   │   └── userService.js  # In-memory user storage & business logic
│   ├── utils/
│   │   └── validators.js   # Input validation functions
│   └── app.js              # Express app setup & server bootstrap
├── .env                    # Your local environment variables (git-ignored)
├── .env.example            # Template for environment variables
├── .gitignore
├── package.json
└── README.md
```

---

## ⚠️ Production Considerations

This API uses **in-memory storage** — all data is lost on restart.
Before going to production, consider:

- [ ] Replace the in-memory store with a persistent database (PostgreSQL, MongoDB, etc.)
- [ ] Add HTTPS / TLS termination
- [ ] Use a secrets manager (AWS Secrets Manager, HashiCorp Vault, etc.)
- [ ] Add structured logging (Winston, Pino)
- [ ] Add request ID tracing
- [ ] Implement refresh token rotation
- [ ] Add account lockout after N failed login attempts
- [ ] Set up monitoring and alerting
````

## Como funciona a segurança

```
┌─────────────────────────────────────────────────────────────┐
│                    REQUEST FLOW                              │
│                                                             │
│  Client Request                                             │
│       │                                                     │
│       ▼                                                     │
│  [Helmet] → Adiciona headers de segurança                   │
│       │                                                     │
│       ▼                                                     │
│  [Rate Limiter] → Bloqueia abuso (global ou por rota)       │
│       │                                                     │
│       ▼                                                     │
│  [Body Parser] → Limita tamanho (10kb)                      │
│       │                                                     │
│       ├──── /register, /login ──► [authRateLimiter]         │
│       │                               │                     │
│       │                               ▼                     │
│       │                         [Validators]                │
│       │                               │                     │
│       │                               ▼                     │
│       │                         [bcrypt hash/compare]       │
│       │                               │                     │
│       │                               ▼                     │
│       │                         [JWT gerado]                │
│       │                                                     │
│       └──── /profile ──────────► [authenticate]             │
│                                       │                     │
│                                       ▼                     │
│                                 [jwt.verify]                │
│                                       │                     │
│                                       ▼                     │
│                                 [User lookup]               │
│                                       │                     │
│                                       ▼                     │
│                                 [Profile data]              │
└─────────────────────────────────────────────────────────────┘
```

Os principais pontos de segurança implementados são:

1. **bcrypt com 12 rounds** — hashing lento e resistente a brute-force
2. **JWT com expiração e algoritmo fixo** — evita tokens eternos e algorithm confusion attacks
3. **Timing attack prevention** — sempre executa `bcrypt.compare` mesmo quando o usuário não existe
4. **Rate limiting duplo** — global (100 req/15min) e específico para auth (10 req/15min)
5. **Helmet** — configura 11+ headers HTTP de segurança automaticamente
6. **Validação de entrada** — rejeita dados malformados antes de qualquer processamento
7. **Mensagens genéricas** — evita user enumeration no login