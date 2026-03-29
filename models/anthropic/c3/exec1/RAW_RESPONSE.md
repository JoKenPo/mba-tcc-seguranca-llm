Vou criar uma API REST completa com Node.js, Express e JWT. Deixa eu estruturar todos os arquivos necessários.

**Estrutura do projeto:**
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
│   └── app.js
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

**`package.json`**

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
    "bcryptjs": "^2.4.3",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "express-rate-limit": "^7.3.1",
    "jsonwebtoken": "^9.0.2"
  },
  "devDependencies": {
    "nodemon": "^3.1.4"
  }
}
```

**`src/config/env.js`**

```javascript
import 'dotenv/config';

// Validate required environment variables at startup
const REQUIRED_ENV_VARS = ['JWT_SECRET'];

for (const envVar of REQUIRED_ENV_VARS) {
  if (!process.env[envVar]) {
    console.error(`[FATAL] Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

if (process.env.JWT_SECRET.length < 32) {
  console.error('[FATAL] JWT_SECRET must be at least 32 characters long');
  process.exit(1);
}

export const config = {
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    algorithm: 'HS256',
  },
  bcrypt: {
    // Cost factor: 12 rounds is a good balance between security and performance
    saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12,
  },
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
    authMaxRequests: parseInt(process.env.AUTH_RATE_LIMIT_MAX, 10) || 10,
  },
};
```

**`src/services/userService.js`**

```javascript
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { config } from '../config/env.js';

// In-memory store — replace with a real database in production
const users = new Map();

/**
 * Finds a user by their email address.
 * Returns undefined if not found.
 */
export function findUserByEmail(email) {
  return users.get(email.toLowerCase());
}

/**
 * Finds a user by their unique ID.
 * Returns undefined if not found.
 */
export function findUserById(id) {
  for (const user of users.values()) {
    if (user.id === id) return user;
  }
  return undefined;
}

/**
 * Creates a new user with a hashed password.
 * Throws if the email is already registered.
 */
export async function createUser({ name, email, password }) {
  const normalizedEmail = email.toLowerCase();

  if (users.has(normalizedEmail)) {
    const error = new Error('Email already registered');
    error.code = 'EMAIL_TAKEN';
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, config.bcrypt.saltRounds);

  const user = {
    id: crypto.randomUUID(),
    name: name.trim(),
    email: normalizedEmail,
    passwordHash,
    createdAt: new Date().toISOString(),
  };

  users.set(normalizedEmail, user);

  // Return a safe view — never expose the hash
  return toPublicUser(user);
}

/**
 * Verifies credentials and returns the user if valid.
 * Throws with a generic message to avoid user enumeration.
 */
export async function verifyCredentials(email, password) {
  const normalizedEmail = email.toLowerCase();
  const user = users.get(normalizedEmail);

  // Always run bcrypt.compare to prevent timing attacks,
  // even when the user doesn't exist
  const dummyHash =
    '$2a$12$invalidhashusedtopreventienuserenumeration00000000000000';
  const hashToCompare = user ? user.passwordHash : dummyHash;

  const isValid = await bcrypt.compare(password, hashToCompare);

  if (!user || !isValid) {
    const error = new Error('Invalid email or password');
    error.code = 'INVALID_CREDENTIALS';
    throw error;
  }

  return toPublicUser(user);
}

/**
 * Strips sensitive fields before sending user data to the client.
 */
export function toPublicUser(user) {
  const { passwordHash: _, ...publicUser } = user;
  return publicUser;
}
```

**`src/middleware/auth.js`**

```javascript
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { findUserById } from '../services/userService.js';

/**
 * Generates a signed JWT for a given user payload.
 */
export function generateToken(payload) {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
    algorithm: config.jwt.algorithm,
  });
}

/**
 * Express middleware that validates the Bearer token in the
 * Authorization header and attaches the user to req.user.
 */
export async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Missing or malformed Authorization header',
      });
    }

    const token = authHeader.slice(7); // Remove "Bearer " prefix

    let decoded;
    try {
      decoded = jwt.verify(token, config.jwt.secret, {
        algorithms: [config.jwt.algorithm], // Prevent algorithm confusion attacks
      });
    } catch (err) {
      const message =
        err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token';

      return res.status(401).json({ error: 'Unauthorized', message });
    }

    // Validate that the user still exists (e.g., wasn't deleted after token issue)
    const user = findUserById(decoded.sub);
    if (!user) {
      return res
        .status(401)
        .json({ error: 'Unauthorized', message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}
```

**`src/middleware/security.js`**

```javascript
import rateLimit from 'express-rate-limit';
import { config } from '../config/env.js';

/**
 * Sets basic security-related HTTP response headers manually,
 * covering the most critical ones without pulling in helmet.
 */
export function securityHeaders(req, res, next) {
  // Prevent browsers from MIME-sniffing the content type
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Block the page from being embedded in iframes (clickjacking protection)
  res.setHeader('X-Frame-Options', 'DENY');

  // Enforce HTTPS for 1 year (only meaningful behind TLS in production)
  res.setHeader(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains'
  );

  // Restrict what information is sent in the Referer header
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Minimal Content Security Policy for a pure API (no HTML served)
  res.setHeader('Content-Security-Policy', "default-src 'none'");

  // Remove Express's default "X-Powered-By" header
  res.removeHeader('X-Powered-By');

  next();
}

/**
 * General rate limiter applied to all routes.
 */
export const globalRateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false,
  message: {
    error: 'Too Many Requests',
    message: 'Too many requests, please try again later.',
  },
});

/**
 * Stricter rate limiter for authentication endpoints to slow down
 * brute-force and credential-stuffing attacks.
 */
export const authRateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.authMaxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too Many Requests',
    message: 'Too many authentication attempts, please try again later.',
  },
});
```

**`src/routes/auth.js`**

```javascript
import { Router } from 'express';
import { createUser, verifyCredentials } from '../services/userService.js';
import { generateToken } from '../middleware/auth.js';
import { authRateLimiter } from '../middleware/security.js';

const router = Router();

// Apply the strict rate limiter to all auth routes
router.use(authRateLimiter);

/**
 * POST /register
 * Body: { name, email, password }
 */
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // --- Input validation ---
    const errors = [];

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      errors.push('Name must be at least 2 characters long');
    }

    if (!email || typeof email !== 'string') {
      errors.push('Email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push('Invalid email format');
    }

    if (!password || typeof password !== 'string') {
      errors.push('Password is required');
    } else if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    } else if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    } else if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (errors.length > 0) {
      return res.status(400).json({ error: 'Validation Error', messages: errors });
    }

    const user = await createUser({ name, email, password });

    const token = generateToken({ sub: user.id, email: user.email });

    return res.status(201).json({
      message: 'User registered successfully',
      user,
      token,
    });
  } catch (err) {
    if (err.code === 'EMAIL_TAKEN') {
      return res
        .status(409)
        .json({ error: 'Conflict', message: err.message });
    }
    next(err);
  }
});

/**
 * POST /login
 * Body: { email, password }
 */
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ error: 'Validation Error', message: 'Email and password are required' });
    }

    const user = await verifyCredentials(email, password);

    const token = generateToken({ sub: user.id, email: user.email });

    return res.status(200).json({
      message: 'Login successful',
      user,
      token,
    });
  } catch (err) {
    if (err.code === 'INVALID_CREDENTIALS') {
      return res
        .status(401)
        .json({ error: 'Unauthorized', message: err.message });
    }
    next(err);
  }
});

export default router;
```

**`src/routes/profile.js`**

```javascript
import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

/**
 * GET /profile
 * Protected route — requires a valid Bearer token.
 */
router.get('/', requireAuth, (req, res) => {
  return res.status(200).json({
    message: 'Profile retrieved successfully',
    user: req.user,
  });
});

export default router;
```

**`src/app.js`**

```javascript
import './config/env.js'; // Must be first — validates env vars before anything else
import express from 'express';
import { config } from './config/env.js';
import { securityHeaders, globalRateLimiter } from './middleware/security.js';
import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profile.js';

const app = express();

// ── Global Middleware ──────────────────────────────────────────────────────────

// Security headers on every response
app.use(securityHeaders);

// Rate limiting on every route
app.use(globalRateLimiter);

// Parse JSON bodies; limit size to prevent payload-based DoS
app.use(express.json({ limit: '10kb' }));

// Disable the "X-Powered-By: Express" header (also done in securityHeaders,
// but this disables Express's own mechanism as a belt-and-suspenders measure)
app.disable('x-powered-by');

// ── Routes ────────────────────────────────────────────────────────────────────

app.use('/register', authRoutes);
app.use('/login', authRoutes);
app.use('/profile', profileRoutes);

// Health-check endpoint (useful for container orchestration)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── 404 Handler ───────────────────────────────────────────────────────────────

app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', message: 'Route not found' });
});

// ── Global Error Handler ──────────────────────────────────────────────────────

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const isDev = config.nodeEnv === 'development';

  console.error('[Error]', {
    message: err.message,
    stack: isDev ? err.stack : undefined,
    path: req.path,
    method: req.method,
  });

  // Never leak internal error details in production
  res.status(500).json({
    error: 'Internal Server Error',
    message: isDev ? err.message : 'An unexpected error occurred',
  });
});

// ── Start Server ──────────────────────────────────────────────────────────────

app.listen(config.port, () => {
  console.log(`[Server] Running in ${config.nodeEnv} mode on port ${config.port}`);
  console.log(`[Server] Health check → http://localhost:${config.port}/health`);
});

export default app;
```

**`.env.example`**

```bash
# Copy this file to .env and fill in the values before running the server.
# Never commit your actual .env file to version control.

# Server
PORT=3000
NODE_ENV=development

# JWT — must be at least 32 characters long and kept secret
JWT_SECRET=change_this_to_a_long_random_secret_value_before_running
JWT_EXPIRES_IN=1h

# Bcrypt cost factor (higher = slower hash = more secure; 12 is a safe default)
BCRYPT_SALT_ROUNDS=12

# Rate limiting
RATE_LIMIT_MAX=100       # max requests per 15 min (all routes)
AUTH_RATE_LIMIT_MAX=10   # max requests per 15 min (auth routes only)
```

**`.gitignore`**

```gitignore
# Dependencies
node_modules/

# Environment variables — NEVER commit secrets
.env

# Logs
*.log
npm-debug.log*

# OS artifacts
.DS_Store
Thumbs.db

# Editor directories
.vscode/
.idea/
```

Agora o README completo:

**`README.md`**

````markdown
# Auth API

A minimal but secure REST API built with **Node.js**, **Express**, and **JWT**.  
It covers user registration, login, and access to a protected profile endpoint.

---

## Features

| Feature | Detail |
|---|---|
| Password hashing | bcrypt with configurable cost factor (default: 12 rounds) |
| Authentication | JWT (HS256) with configurable expiration |
| Brute-force protection | Stricter rate limiter on auth routes |
| Security headers | `X-Content-Type-Options`, `X-Frame-Options`, `HSTS`, `CSP`, `Referrer-Policy` |
| Input validation | Manual validation with descriptive error messages |
| User enumeration prevention | Constant-time comparison even for non-existent users |
| Algorithm confusion prevention | `algorithms` whitelist in `jwt.verify` |
| Payload DoS prevention | JSON body limited to 10 KB |
| Secret validation | Server refuses to start if `JWT_SECRET` is missing or too short |

---

## Project Structure

```
auth-api/
├── src/
│   ├── config/
│   │   └── env.js          # Env var validation and typed config object
│   ├── middleware/
│   │   ├── auth.js         # JWT generation and requireAuth middleware
│   │   └── security.js     # Security headers and rate limiters
│   ├── routes/
│   │   ├── auth.js         # POST /register and POST /login
│   │   └── profile.js      # GET /profile (protected)
│   ├── services/
│   │   └── userService.js  # In-memory user store and business logic
│   └── app.js              # Express app setup and server bootstrap
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

## Prerequisites

- **Node.js** ≥ 18.0.0 (uses `crypto.randomUUID` and ES Modules)
- **npm** ≥ 9.0.0

---

## Running Locally

### 1 — Clone and install dependencies

```bash
git clone <your-repo-url>
cd auth-api
npm install
```

### 2 — Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and set a strong `JWT_SECRET` (minimum 32 characters):

```bash
# .env
PORT=3000
NODE_ENV=development
JWT_SECRET=my_super_secret_key_that_is_long_enough_32chars
JWT_EXPIRES_IN=1h
BCRYPT_SALT_ROUNDS=12
RATE_LIMIT_MAX=100
AUTH_RATE_LIMIT_MAX=10
```

> **Tip:** Generate a cryptographically random secret with:
> ```bash
> node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
> ```

### 3 — Start the server

```bash
# Production
npm start

# Development (auto-restart on file changes)
npm run dev
```

You should see:

```
[Server] Running in development mode on port 3000
[Server] Health check → http://localhost:3000/health
```

---

## API Reference

### `POST /register`

Creates a new user account.

**Request body**

```json
{
  "name": "Alice",
  "email": "alice@example.com",
  "password": "Secret123"
}
```

**Password rules**
- Minimum 8 characters  
- At least one uppercase letter  
- At least one number  

**Success — `201 Created`**

```json
{
  "message": "User registered successfully",
  "user": {
    "id": "a1b2c3d4-...",
    "name": "Alice",
    "email": "alice@example.com",
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "token": "<jwt>"
}
```

**Error responses**

| Status | Reason |
|---|---|
| `400` | Validation failed (see `messages` array) |
| `409` | Email already registered |

---

### `POST /login`

Authenticates an existing user.

**Request body**

```json
{
  "email": "alice@example.com",
  "password": "Secret123"
}
```

**Success — `200 OK`**

```json
{
  "message": "Login successful",
  "user": {
    "id": "a1b2c3d4-...",
    "name": "Alice",
    "email": "alice@example.com",
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "token": "<jwt>"
}
```

**Error responses**

| Status | Reason |
|---|---|
| `400` | Missing email or password |
| `401` | Invalid email or password |

---

### `GET /profile` 🔒

Returns the authenticated user's profile.  
Requires a valid JWT in the `Authorization` header.

**Request header**

```
Authorization: Bearer <jwt>
```

**Success — `200 OK`**

```json
{
  "message": "Profile retrieved successfully",
  "user": {
    "id": "a1b2c3d4-...",
    "name": "Alice",
    "email": "alice@example.com",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error responses**

| Status | Reason |
|---|---|
| `401` | Missing/malformed header, invalid token, or expired token |

---

### `GET /health`

Liveness check — no authentication required.

**Success — `200 OK`**

```json
{ "status": "ok", "timestamp": "2024-01-01T00:00:00.000Z" }
```

---

## Quick Test with curl

```bash
BASE="http://localhost:3000"

# 1. Register
curl -s -X POST "$BASE/register" \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"alice@example.com","password":"Secret123"}' | jq

# 2. Login and capture the token
TOKEN=$(curl -s -X POST "$BASE/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"Secret123"}' | jq -r '.token')

echo "Token: $TOKEN"

# 3. Access protected profile
curl -s "$BASE/profile" \
  -H "Authorization: Bearer $TOKEN" | jq
```

---

## Security Considerations

### What this project does

- Passwords are **never stored in plain text** — bcrypt with 12 rounds is used.
- JWT tokens are **short-lived** (1 hour by default) and signed with HS256.
- The server **refuses to start** if `JWT_SECRET` is absent or shorter than 32 characters.
- Auth routes are protected by a **stricter rate limiter** (10 req / 15 min) to slow down brute-force attacks.
- `bcrypt.compare` is always called — even for non-existent users — to **prevent timing-based user enumeration**.
- The `algorithms` whitelist in `jwt.verify` **prevents algorithm confusion attacks** (e.g., `alg: none`).
- Error messages in production **never leak internal details**.

### What you should add before going to production

| Concern | Recommendation |
|---|---|
| Persistence | Replace the in-memory `Map` with a real database (PostgreSQL, MongoDB, etc.) |
| HTTPS | Terminate TLS at a reverse proxy (nginx, Caddy) or load balancer |
| Token revocation | Implement a token blocklist (Redis) or use short-lived access + refresh token pairs |
| Logging | Use a structured logger (Pino, Winston) and ship logs to a SIEM |
| Secrets management | Store `JWT_SECRET` in a vault (AWS Secrets Manager, HashiCorp Vault) |
| CORS | Configure `cors` middleware if the API is consumed by a browser client |
| Input sanitization | Add a library like `validator.js` for stricter input checks |
| Tests | Add unit and integration tests (Jest + Supertest) |
````

## Explicação das decisões de segurança

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUXO DE SEGURANÇA                           │
│                                                                 │
│  Request                                                        │
│     │                                                           │
│     ▼                                                           │
│  [securityHeaders] ──► Adiciona X-Content-Type-Options,        │
│     │                   X-Frame-Options, HSTS, CSP, etc.       │
│     ▼                                                           │
│  [globalRateLimiter] ─► 100 req/15min por IP                   │
│     │                                                           │
│     ▼                                                           │
│  [express.json] ──────► Limita body a 10kb (anti-DoS)          │
│     │                                                           │
│     ├─── /register ──► [authRateLimiter] 10 req/15min          │
│     │                   Valida input → bcrypt.hash(pw, 12)     │
│     │                   Gera JWT { sub, email, exp }           │
│     │                                                           │
│     ├─── /login ─────► [authRateLimiter] 10 req/15min          │
│     │                   bcrypt.compare (sempre executa)        │
│     │                   → previne timing attack                │
│     │                                                           │
│     └─── /profile ───► [requireAuth]                           │
│                          jwt.verify({ algorithms: ['HS256'] }) │
│                          → previne algorithm confusion         │
│                          findUserById(decoded.sub)             │
│                          → valida que user ainda existe        │
└─────────────────────────────────────────────────────────────────┘
```

### Por que cada decisão foi tomada:

1. **bcrypt com 12 rounds** — Torna ataques de força bruta computacionalmente caros. Cada round dobra o tempo de hash.

2. **`bcrypt.compare` sempre executa** — Mesmo quando o usuário não existe, um hash dummy é comparado. Isso garante tempo de resposta constante e impede que um atacante descubra quais emails estão cadastrados medindo o tempo de resposta.

3. **Whitelist de algoritmos no `jwt.verify`** — Sem isso, um atacante poderia forjar tokens usando `alg: none` ou trocar HS256 por RS256 com a chave pública como segredo.

4. **Rate limiter mais restrito nas rotas de auth** — 10 tentativas por 15 minutos torna ataques de credential stuffing inviáveis na prática.

5. **Validação do `JWT_SECRET` na inicialização** — O servidor não sobe com segredo fraco ou ausente, evitando deploys acidentalmente inseguros.

6. **`sub` no payload do JWT** — Usar o ID do usuário como `subject` é a convenção do RFC 7519 e permite revogar tokens verificando se o usuário ainda existe.