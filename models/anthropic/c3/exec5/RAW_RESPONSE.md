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
    "bcryptjs": "^2.4.3",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "express-rate-limit": "^7.3.1",
    "helmet": "^7.1.0",
    "jsonwebtoken": "^9.0.2",
    "validator": "^13.12.0"
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

# JWT - Use a strong secret in production (min 32 chars)
JWT_SECRET=your-super-secret-key-change-this-in-production-min-32-chars
JWT_EXPIRES_IN=1h

# Bcrypt
BCRYPT_SALT_ROUNDS=12
```

**.gitignore**
```
node_modules/
.env
*.log
```

**src/config/env.js**
```javascript
import "dotenv/config";

const requiredEnvVars = ["JWT_SECRET"];

/**
 * Validates that all required environment variables are set
 * and that they meet minimum security requirements.
 * Throws an error if any required variable is missing or insecure.
 */
function validateEnv() {
  const missing = requiredEnvVars.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`
    );
  }

  if (process.env.JWT_SECRET.length < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters long");
  }
}

validateEnv();

export const config = {
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || "development",
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || "1h",
  },
  bcrypt: {
    saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12,
  },
};
```

**src/services/userService.js**
```javascript
// In-memory storage — replace with a real DB in production
const users = [];

/**
 * Finds a user by their email address.
 * @param {string} email
 * @returns {object|undefined} The user object or undefined if not found.
 */
export function findUserByEmail(email) {
  return users.find((u) => u.email === email.toLowerCase().trim());
}

/**
 * Finds a user by their unique ID.
 * @param {string} id
 * @returns {object|undefined} The user object or undefined if not found.
 */
export function findUserById(id) {
  return users.find((u) => u.id === id);
}

/**
 * Creates a new user and stores them in memory.
 * @param {object} userData - Object containing name, email, and hashedPassword.
 * @returns {object} The newly created user (without the password hash).
 */
export function createUser({ name, email, hashedPassword }) {
  const newUser = {
    id: crypto.randomUUID(),
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password: hashedPassword,
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);

  // Return user without the password hash
  const { password, ...safeUser } = newUser;
  return safeUser;
}
```

**src/middleware/security.js**
```javascript
import helmet from "helmet";
import rateLimit from "express-rate-limit";

/**
 * Helmet middleware — sets secure HTTP response headers.
 * Protects against well-known web vulnerabilities by default.
 */
export const securityHeaders = helmet();

/**
 * Global rate limiter — limits each IP to 100 requests per 15 minutes.
 * Helps mitigate brute-force and DoS attacks.
 */
export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many requests, please try again later.",
  },
});

/**
 * Strict rate limiter for auth routes — limits each IP to 10 requests per 15 minutes.
 * Provides extra protection against brute-force login/register attempts.
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many authentication attempts, please try again later.",
  },
});
```

**src/middleware/auth.js**
```javascript
import jwt from "jsonwebtoken";
import { config } from "../config/env.js";
import { findUserById } from "../services/userService.js";

/**
 * Authentication middleware.
 * Validates the Bearer token from the Authorization header,
 * looks up the user, and attaches them to req.user.
 * Returns 401 if the token is missing, invalid, or expired.
 */
export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "Access denied. No token provided.",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    const user = findUserById(decoded.sub);

    if (!user) {
      return res.status(401).json({ error: "User not found." });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired." });
    }

    return res.status(401).json({ error: "Invalid token." });
  }
}
```

**src/routes/auth.js**
```javascript
import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import validator from "validator";
import { config } from "../config/env.js";
import { findUserByEmail, createUser } from "../services/userService.js";
import { authRateLimiter } from "../middleware/security.js";

const router = Router();

// Apply strict rate limiting to all auth routes
router.use(authRateLimiter);

/**
 * POST /register
 * Registers a new user with name, email, and password.
 * Validates input, hashes the password, and stores the user.
 */
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // --- Input validation ---
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email and password are required." });
    }

    if (typeof name !== "string" || name.trim().length < 2) {
      return res.status(400).json({ error: "Name must be at least 2 characters." });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({ error: "Invalid email format." });
    }

    // Password policy: min 8 chars, at least one uppercase, one number, one symbol
    if (
      !validator.isStrongPassword(password, {
        minLength: 8,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1,
      })
    ) {
      return res.status(400).json({
        error:
          "Password must be at least 8 characters and include uppercase, lowercase, number, and symbol.",
      });
    }

    // --- Check for duplicate email ---
    if (findUserByEmail(email)) {
      // Use a generic message to avoid user enumeration
      return res.status(409).json({ error: "Registration failed. Please try again." });
    }

    // --- Hash password and persist user ---
    const hashedPassword = await bcrypt.hash(password, config.bcrypt.saltRounds);
    const user = createUser({ name, email, hashedPassword });

    return res.status(201).json({
      message: "User registered successfully.",
      user,
    });
  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
});

/**
 * POST /login
 * Authenticates a user with email and password.
 * Returns a signed JWT on success.
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // --- Input validation ---
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({ error: "Invalid email format." });
    }

    // --- Lookup user ---
    const user = findUserByEmail(email);

    // Use bcrypt.compare even if user is not found to prevent timing attacks
    const dummyHash = "$2a$12$invalidhashfortimingattackprevention000000000000000000";
    const passwordMatch = await bcrypt.compare(
      password,
      user ? user.password : dummyHash
    );

    if (!user || !passwordMatch) {
      // Generic message to avoid user enumeration
      return res.status(401).json({ error: "Invalid credentials." });
    }

    // --- Sign JWT ---
    const token = jwt.sign(
      { sub: user.id, email: user.email },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn, algorithm: "HS256" }
    );

    return res.status(200).json({
      message: "Login successful.",
      token,
      expiresIn: config.jwt.expiresIn,
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
});

export default router;
```

**src/routes/profile.js**
```javascript
import { Router } from "express";
import { authenticate } from "../middleware/auth.js";

const router = Router();

/**
 * GET /profile
 * Protected route — requires a valid Bearer token.
 * Returns the authenticated user's profile data.
 */
router.get("/profile", authenticate, (req, res) => {
  return res.status(200).json({
    message: "Profile retrieved successfully.",
    user: req.user,
  });
});

export default router;
```

**src/app.js**
```javascript
import express from "express";
import { config } from "./config/env.js";
import { securityHeaders, globalRateLimiter } from "./middleware/security.js";
import authRoutes from "./routes/auth.js";
import profileRoutes from "./routes/profile.js";

const app = express();

// --- Global Middleware ---

// Parse JSON bodies (limit prevents large payload attacks)
app.use(express.json({ limit: "10kb" }));

// Security headers via Helmet
app.use(securityHeaders);

// Global rate limiting
app.use(globalRateLimiter);

// Disable X-Powered-By to avoid exposing the tech stack
app.disable("x-powered-by");

// --- Routes ---
app.use("/", authRoutes);
app.use("/", profileRoutes);

// --- 404 Handler ---
app.use((req, res) => {
  res.status(404).json({ error: "Route not found." });
});

// --- Global Error Handler ---
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error." });
});

// --- Start Server ---
app.listen(config.port, () => {
  console.log(`Server running on port ${config.port} [${config.nodeEnv}]`);
});

export default app;
```

Agora o README completo:

**README.md**
````markdown
# Auth API

A REST API built with Node.js, Express and JWT that provides user registration,
login and authenticated profile access — with security best practices applied throughout.

---

## Features

| Feature | Detail |
|---|---|
| Password hashing | bcrypt with configurable salt rounds |
| Authentication | JWT with expiration and HS256 algorithm |
| Security headers | Helmet (CSP, HSTS, X-Frame-Options, …) |
| Rate limiting | Global (100 req/15 min) + Auth routes (10 req/15 min) |
| Input validation | Email format, password strength policy, type checks |
| Timing-attack prevention | Dummy bcrypt compare when user is not found |
| User enumeration prevention | Generic error messages on register/login |
| Payload size limit | JSON body capped at 10 kb |
| Secret validation | App refuses to start without a valid JWT_SECRET |

---

## Project Structure

```
auth-api/
├── src/
│   ├── config/
│   │   └── env.js          # Env var loading and validation
│   ├── middleware/
│   │   ├── auth.js         # JWT authentication middleware
│   │   └── security.js     # Helmet + rate limiters
│   ├── routes/
│   │   ├── auth.js         # POST /register, POST /login
│   │   └── profile.js      # GET /profile (protected)
│   ├── services/
│   │   └── userService.js  # In-memory user store
│   └── app.js              # Express app entry point
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

## Requirements

- Node.js >= 18.0.0 (uses `crypto.randomUUID` built-in)
- npm >= 9

---

## Running Locally

### 1 — Clone and install dependencies

```bash
git clone https://github.com/your-username/auth-api.git
cd auth-api
npm install
```

### 2 — Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and set a strong `JWT_SECRET` (minimum 32 characters):

```env
PORT=3000
NODE_ENV=development
JWT_SECRET=my-very-strong-secret-key-change-me-now!
JWT_EXPIRES_IN=1h
BCRYPT_SALT_ROUNDS=12
```

> ⚠️ Never commit your `.env` file. It is already listed in `.gitignore`.

### 3 — Start the server

```bash
# Production
npm start

# Development (auto-reload with nodemon)
npm run dev
```

You should see:

```
Server running on port 3000 [development]
```

---

## API Reference

### POST /register

Registers a new user.

**Request body**

```json
{
  "name": "Alice",
  "email": "alice@example.com",
  "password": "Secret@123"
}
```

**Password policy:** minimum 8 characters, at least one uppercase letter,
one lowercase letter, one number and one symbol.

**Responses**

| Status | Meaning |
|---|---|
| 201 | User created successfully |
| 400 | Validation error (missing fields, weak password, …) |
| 409 | Email already registered (generic message) |
| 429 | Too many requests |
| 500 | Internal server error |

**201 example**

```json
{
  "message": "User registered successfully.",
  "user": {
    "id": "a1b2c3d4-...",
    "name": "Alice",
    "email": "alice@example.com",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### POST /login

Authenticates a user and returns a JWT.

**Request body**

```json
{
  "email": "alice@example.com",
  "password": "Secret@123"
}
```

**Responses**

| Status | Meaning |
|---|---|
| 200 | Login successful — token returned |
| 400 | Missing or invalid fields |
| 401 | Invalid credentials (generic message) |
| 429 | Too many requests |
| 500 | Internal server error |

**200 example**

```json
{
  "message": "Login successful.",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": "1h"
}
```

---

### GET /profile

Returns the authenticated user's profile.
Requires a valid JWT in the `Authorization` header.

**Headers**

```
Authorization: Bearer <token>
```

**Responses**

| Status | Meaning |
|---|---|
| 200 | Profile returned |
| 401 | Missing, invalid or expired token |
| 500 | Internal server error |

**200 example**

```json
{
  "message": "Profile retrieved successfully.",
  "user": {
    "id": "a1b2c3d4-...",
    "name": "Alice",
    "email": "alice@example.com",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

## Quick Test with curl

```bash
BASE=http://localhost:3000

# 1. Register
curl -s -X POST $BASE/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"alice@example.com","password":"Secret@123"}' | jq

# 2. Login — copy the token from the response
curl -s -X POST $BASE/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"Secret@123"}' | jq

# 3. Access protected profile (replace <token> with the value from step 2)
curl -s $BASE/profile \
  -H "Authorization: Bearer <token>" | jq
```

---

## Security Decisions

### Passwords — bcrypt
Passwords are hashed with **bcrypt** before storage.
The salt rounds are configurable via `BCRYPT_SALT_ROUNDS` (default: 12).
The raw password is never stored or logged.

### JWT
- Signed with **HS256** and a secret loaded exclusively from the environment.
- The app **refuses to start** if `JWT_SECRET` is shorter than 32 characters.
- Tokens expire after the period set in `JWT_EXPIRES_IN` (default: `1h`).

### Timing-attack prevention
On login, `bcrypt.compare` is always called — even when the email is not found —
using a dummy hash. This ensures the response time is the same regardless of
whether the user exists, preventing user enumeration via timing differences.

### User enumeration prevention
Both `/register` (duplicate email) and `/login` (wrong credentials) return
**generic error messages** that do not reveal whether an email is registered.

### Rate limiting
- **Global:** 100 requests per IP per 15 minutes.
- **Auth routes:** 10 requests per IP per 15 minutes.

### HTTP security headers (Helmet)
Helmet sets headers such as `Content-Security-Policy`, `Strict-Transport-Security`,
`X-Frame-Options`, `X-Content-Type-Options` and others automatically.

### Payload size
The JSON body parser is capped at **10 kb** to mitigate large-payload DoS attacks.

---

## Production Checklist

- [ ] Replace in-memory storage with a real database (PostgreSQL, MongoDB, …)
- [ ] Use HTTPS (TLS certificate)
- [ ] Store `JWT_SECRET` in a secrets manager (AWS Secrets Manager, HashiCorp Vault, …)
- [ ] Add a refresh-token mechanism
- [ ] Set up structured logging (Winston, Pino, …)
- [ ] Add request ID tracing
- [ ] Run behind a reverse proxy (Nginx, Caddy, …)
- [ ] Enable CORS only for trusted origins
````

## Como funciona cada decisão de segurança

```
┌─────────────────────────────────────────────────────────────────┐
│                        REQUEST FLOW                             │
│                                                                 │
│  Client ──► Helmet Headers                                      │
│         ──► Rate Limiter (global: 100/15min)                    │
│         ──► JSON Parser (limit: 10kb)                           │
│         ──► Route Handler                                       │
│               │                                                 │
│               ├── /register ──► Validate ──► bcrypt ──► Store  │
│               │                                                 │
│               ├── /login ──► Validate ──► bcrypt.compare        │
│               │              (always runs, even if no user)     │
│               │              ──► JWT sign ──► Return token      │
│               │                                                 │
│               └── /profile ──► authenticate middleware          │
│                               ──► jwt.verify                    │
│                               ──► findUserById                  │
│                               ──► Return profile                │
└─────────────────────────────────────────────────────────────────┘
```

**Resumo das proteções implementadas:**

| Ameaça | Proteção |
|---|---|
| Senhas expostas | bcrypt hash com salt rounds configurável |
| Token roubado permanente | JWT com expiração (`JWT_EXPIRES_IN`) |
| Brute-force | Rate limiter restrito nas rotas de auth |
| Timing attacks | `bcrypt.compare` sempre executado |
| User enumeration | Mensagens de erro genéricas |
| Headers inseguros | Helmet com defaults seguros |
| Payload gigante | Body parser limitado a 10kb |
| Secret fraco | Validação mínima de 32 chars na inicialização |