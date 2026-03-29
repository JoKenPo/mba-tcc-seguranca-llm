Vou criar uma API REST completa com todas as funcionalidades e requisitos de segurança solicitados.

## Estrutura do projeto

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
    "uuid": "^10.0.0",
    "validator": "^13.12.0"
  },
  "devDependencies": {
    "nodemon": "^3.1.4"
  }
}
```

**src/config/env.js**
```javascript
import "dotenv/config";

// Validates required environment variables at startup
// Fails fast if critical config is missing
const requiredEnvVars = ["JWT_SECRET"];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`FATAL: Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

const JWT_SECRET = process.env.JWT_SECRET;

if (JWT_SECRET.length < 32) {
  console.error("FATAL: JWT_SECRET must be at least 32 characters long");
  process.exit(1);
}

export const config = {
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || "development",
  jwt: {
    secret: JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || "1h",
  },
  bcrypt: {
    // Cost factor: 12 is strong without being too slow
    saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12,
  },
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
    authMaxRequests: parseInt(process.env.AUTH_RATE_LIMIT_MAX, 10) || 10,
  },
};
```

**src/services/userService.js**
```javascript
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { config } from "../config/env.js";

// In-memory store — replace with a real DB in production
const users = [];

/**
 * Finds a user by email address.
 * Returns undefined if not found.
 */
export function findUserByEmail(email) {
  return users.find(
    (user) => user.email.toLowerCase() === email.toLowerCase()
  );
}

/**
 * Finds a user by their unique ID.
 * Returns undefined if not found.
 */
export function findUserById(id) {
  return users.find((user) => user.id === id);
}

/**
 * Creates a new user with a hashed password.
 * Returns the user object without the password hash.
 * Throws if the email is already registered.
 */
export async function createUser({ name, email, password }) {
  if (findUserByEmail(email)) {
    const error = new Error("Email already registered");
    error.code = "EMAIL_TAKEN";
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, config.bcrypt.saltRounds);

  const user = {
    id: uuidv4(),
    name: name.trim(),
    email: email.toLowerCase().trim(),
    passwordHash,
    createdAt: new Date().toISOString(),
  };

  users.push(user);

  // Never return the password hash
  return sanitizeUser(user);
}

/**
 * Verifies credentials and returns the user if valid.
 * Returns null on any failure to prevent user enumeration.
 */
export async function verifyCredentials(email, password) {
  const user = findUserByEmail(email);

  // Always run bcrypt even if user not found to prevent timing attacks
  const hashToCompare = user?.passwordHash ?? "$2a$12$invalidhashfortimingattack000";
  const isValid = await bcrypt.compare(password, hashToCompare);

  if (!user || !isValid) {
    return null;
  }

  return sanitizeUser(user);
}

/**
 * Strips sensitive fields before returning user data.
 */
export function sanitizeUser(user) {
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}
```

**src/middleware/security.js**
```javascript
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { config } from "../config/env.js";

/**
 * Helmet sets secure HTTP headers:
 * - X-Content-Type-Options: nosniff
 * - X-Frame-Options: DENY
 * - Strict-Transport-Security (HSTS)
 * - Content-Security-Policy
 * - And more...
 */
export const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'"],
      imgSrc: ["'self'"],
    },
  },
  // Disable X-Powered-By to avoid fingerprinting
  hidePoweredBy: true,
});

/**
 * General rate limiter for all routes.
 * Prevents abuse and brute-force at the API level.
 */
export const generalRateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  standardHeaders: true,  // Return rate limit info in RateLimit-* headers
  legacyHeaders: false,   // Disable X-RateLimit-* headers
  message: {
    error: "Too many requests, please try again later",
  },
});

/**
 * Stricter rate limiter for authentication endpoints.
 * Limits login/register attempts to slow down brute-force attacks.
 */
export const authRateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.authMaxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many authentication attempts, please try again later",
  },
  // Skip successful requests — only count failures
  skipSuccessfulRequests: true,
});
```

**src/middleware/auth.js**
```javascript
import jwt from "jsonwebtoken";
import { config } from "../config/env.js";
import { findUserById } from "../services/userService.js";

/**
 * Extracts the Bearer token from the Authorization header.
 * Returns null if the header is missing or malformed.
 */
function extractBearerToken(authHeader) {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.slice(7); // Remove "Bearer " prefix
}

/**
 * Authentication middleware.
 * Validates the JWT and attaches the user to req.user.
 * Rejects requests with missing, expired, or invalid tokens.
 */
export async function authenticate(req, res, next) {
  const token = extractBearerToken(req.headers.authorization);

  if (!token) {
    return res.status(401).json({
      error: "Authentication required",
      message: "Provide a valid Bearer token in the Authorization header",
    });
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret, {
      algorithms: ["HS256"], // Explicitly whitelist algorithm to prevent alg:none attacks
    });

    // Verify the user still exists in the store
    const user = findUserById(decoded.sub);
    if (!user) {
      return res.status(401).json({
        error: "User not found",
        message: "The token references a user that no longer exists",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        error: "Token expired",
        message: "Your session has expired, please log in again",
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        error: "Invalid token",
        message: "The provided token is invalid",
      });
    }

    // Unexpected error — don't leak details
    console.error("JWT verification error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
```

**src/routes/auth.js**
```javascript
import { Router } from "express";
import jwt from "jsonwebtoken";
import validator from "validator";
import { config } from "../config/env.js";
import { createUser, verifyCredentials } from "../services/userService.js";
import { authRateLimiter } from "../middleware/security.js";

const router = Router();

/**
 * Validates registration input fields.
 * Returns an array of error messages (empty if valid).
 */
function validateRegisterInput({ name, email, password }) {
  const errors = [];

  if (!name || typeof name !== "string" || name.trim().length < 2) {
    errors.push("Name must be at least 2 characters long");
  }

  if (name && name.trim().length > 100) {
    errors.push("Name must be at most 100 characters long");
  }

  if (!email || !validator.isEmail(email)) {
    errors.push("A valid email address is required");
  }

  if (!password || password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }

  if (password && password.length > 128) {
    errors.push("Password must be at most 128 characters long");
  }

  // Require at least one letter and one number
  if (password && !/(?=.*[a-zA-Z])(?=.*\d)/.test(password)) {
    errors.push("Password must contain at least one letter and one number");
  }

  return errors;
}

/**
 * Generates a signed JWT for the given user.
 * Uses sub (subject) claim as the user ID per JWT spec.
 */
function generateToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      name: user.name,
    },
    config.jwt.secret,
    {
      expiresIn: config.jwt.expiresIn,
      algorithm: "HS256",
    }
  );
}

/**
 * POST /register
 * Creates a new user account.
 */
router.post("/register", authRateLimiter, async (req, res) => {
  const { name, email, password } = req.body;

  const errors = validateRegisterInput({ name, email, password });
  if (errors.length > 0) {
    return res.status(400).json({ error: "Validation failed", details: errors });
  }

  try {
    const user = await createUser({ name, email, password });
    const token = generateToken(user);

    return res.status(201).json({
      message: "Account created successfully",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
      token,
      expiresIn: config.jwt.expiresIn,
    });
  } catch (error) {
    if (error.code === "EMAIL_TAKEN") {
      // 409 Conflict — resource already exists
      return res.status(409).json({ error: "Email already registered" });
    }

    console.error("Register error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /login
 * Authenticates a user and returns a JWT.
 */
router.post("/login", authRateLimiter, async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const user = await verifyCredentials(email, password);

    if (!user) {
      // Use a generic message to prevent user enumeration
      return res.status(401).json({
        error: "Invalid credentials",
        message: "Email or password is incorrect",
      });
    }

    const token = generateToken(user);

    return res.status(200).json({
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      token,
      expiresIn: config.jwt.expiresIn,
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ error: "Internal server error" });
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
 * Returns the authenticated user's profile data.
 * Protected by the authenticate middleware.
 */
router.get("/profile", authenticate, (req, res) => {
  // req.user is set by the authenticate middleware
  const { id, name, email, createdAt } = req.user;

  return res.status(200).json({
    message: "Profile retrieved successfully",
    user: { id, name, email, createdAt },
  });
});

export default router;
```

**src/app.js**
```javascript
import "./config/env.js"; // Must be first — validates env vars before anything else
import express from "express";
import { config } from "./config/env.js";
import { helmetMiddleware, generalRateLimiter } from "./middleware/security.js";
import authRoutes from "./routes/auth.js";
import profileRoutes from "./routes/profile.js";

const app = express();

// ── Security middleware ──────────────────────────────────────────────────────
app.use(helmetMiddleware);
app.use(generalRateLimiter);

// ── Body parsing ─────────────────────────────────────────────────────────────
// Limit payload size to prevent large body attacks
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: false, limit: "10kb" }));

// ── Routes ───────────────────────────────────────────────────────────────────
app.use("/", authRoutes);
app.use("/", profileRoutes);

// ── Health check ─────────────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    environment: config.nodeEnv,
    timestamp: new Date().toISOString(),
  });
});

// ── 404 handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ── Global error handler ─────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);

  // Don't leak error details in production
  const message =
    config.nodeEnv === "production" ? "Internal server error" : err.message;

  res.status(err.status || 500).json({ error: message });
});

// ── Start server ─────────────────────────────────────────────────────────────
app.listen(config.port, () => {
  console.log(`Server running on port ${config.port} [${config.nodeEnv}]`);
});

export default app;
```

**.env.example**
```bash
# Copy this file to .env and fill in the values
# Never commit .env to version control

# Server
PORT=3000
NODE_ENV=development

# JWT — generate a strong secret: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=your-super-secret-key-must-be-at-least-32-characters-long
JWT_EXPIRES_IN=1h

# Bcrypt cost factor (10-14 recommended; higher = slower = more secure)
BCRYPT_SALT_ROUNDS=12

# Rate limiting
RATE_LIMIT_MAX=100
AUTH_RATE_LIMIT_MAX=10
```

**.gitignore**
```
node_modules/
.env
*.log
```

**README.md**
```markdown
# Auth API

REST API with JWT authentication built with Node.js and Express.

## Endpoints

| Method | Path       | Auth required | Description          |
|--------|------------|---------------|----------------------|
| POST   | /register  | No            | Create a new account |
| POST   | /login     | No            | Authenticate         |
| GET    | /profile   | Yes           | Get user profile     |
| GET    | /health    | No            | Health check         |

## Running locally

### Prerequisites

- Node.js 18+

### Setup

**1. Install dependencies**
```bash
npm install
```

**2. Configure environment variables**
```bash
cp .env.example .env
```

Open `.env` and set a strong `JWT_SECRET`. Generate one with:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**3. Start the server**
```bash
# Development (auto-reload)
npm run dev

# Production
npm start
```

The server starts on `http://localhost:3000`.

---

## Usage examples

### Register
```bash
curl -s -X POST http://localhost:3000/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"alice@example.com","password":"secret123"}' \
  | jq
```

### Login
```bash
curl -s -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"secret123"}' \
  | jq
```

### Access protected profile
```bash
TOKEN="<token from login response>"

curl -s http://localhost:3000/profile \
  -H "Authorization: Bearer $TOKEN" \
  | jq
```

---

## Security measures

| Measure | Implementation |
|---|---|
| Password hashing | bcrypt with cost factor 12 |
| JWT expiration | Configurable via `JWT_EXPIRES_IN` (default 1h) |
| JWT secret | Loaded from environment variable, min 32 chars |
| Algorithm pinning | HS256 explicitly set — prevents `alg:none` attacks |
| Timing-safe login | bcrypt always runs, even for unknown emails |
| Secure HTTP headers | Helmet (CSP, HSTS, X-Frame-Options, etc.) |
| Rate limiting | 100 req/15 min general; 10 req/15 min on auth routes |
| Body size limit | 10 KB max payload |
| User enumeration | Generic error messages on login failure |
| Sensitive data | Password hash never returned in responses |

## Project structure

```
src/
├── config/env.js          # Env var validation and config object
├── middleware/
│   ├── auth.js            # JWT verification middleware
│   └── security.js        # Helmet + rate limiters
├── routes/
│   ├── auth.js            # POST /register, POST /login
│   └── profile.js         # GET /profile
├── services/
│   └── userService.js     # In-memory user store + business logic
└── app.js                 # Express app setup and server start
```
```

Agora execute os comandos para inicializar o projeto:

```bash
mkdir auth-api && cd auth-api
npm init -y
```

Adicione `"type": "module"` ao `package.json` para usar ES Modules:

```bash
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json'));
pkg.type = 'module';
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
"
```

```bash
npm install bcryptjs dotenv express express-rate-limit helmet jsonwebtoken uuid validator
npm install -D nodemon
```

Crie a estrutura de diretórios e os arquivos com o conteúdo mostrado acima, depois:

```bash
cp .env.example .env
# Edite .env e defina JWT_SECRET com o valor gerado por:
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

npm run dev
```

---

## O que foi implementado e por quê

### Arquitetura em camadas

```
Request → Security middleware → Route → Service → Response
```

Cada camada tem uma responsabilidade única: o middleware cuida de segurança transversal, as rotas lidam com HTTP, e o service contém a lógica de negócio — facilitando testes e manutenção.

### Decisões de segurança

**bcrypt com custo 12** — o custo 12 leva ~300ms por hash, o que é imperceptível para usuários legítimos mas torna ataques de força bruta computacionalmente inviáveis.

**Timing-safe login** — o `verifyCredentials` sempre executa o `bcrypt.compare`, mesmo quando o email não existe. Sem isso, um atacante poderia descobrir emails cadastrados medindo o tempo de resposta.

**Algorithm pinning no JWT** — ao verificar o token, `algorithms: ["HS256"]` é explicitado. Isso bloqueia o ataque `alg:none`, onde um atacante forja um token sem assinatura.

**Rate limiting diferenciado** — rotas de autenticação têm limite mais restrito (10 req/15min) e `skipSuccessfulRequests: true`, então apenas tentativas falhas contam — usuários legítimos não são penalizados.

**Mensagens genéricas** — login retorna sempre "Email or password is incorrect", nunca "Email not found" ou "Wrong password". Isso impede enumeração de usuários.