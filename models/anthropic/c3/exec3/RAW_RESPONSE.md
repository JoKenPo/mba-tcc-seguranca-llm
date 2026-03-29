Vou criar uma API REST completa com Node.js, Express e JWT, seguindo boas práticas de segurança.

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
│   │   └── auth.js
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
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "nodemon": "^3.1.4"
  }
}
```

Agora vou criar todos os arquivos:

**src/config/env.js**
```javascript
import "dotenv/config";

// Validates and exports environment variables with safe defaults
const getEnvVar = (key, defaultValue = null, required = false) => {
  const value = process.env[key] ?? defaultValue;

  if (required && !value) {
    console.error(`[FATAL] Missing required environment variable: ${key}`);
    process.exit(1);
  }

  return value;
};

export const config = {
  port: parseInt(getEnvVar("PORT", "3000"), 10),
  nodeEnv: getEnvVar("NODE_ENV", "development"),

  jwt: {
    // JWT_SECRET is required — app won't start without it
    secret: getEnvVar("JWT_SECRET", null, true),
    expiresIn: getEnvVar("JWT_EXPIRES_IN", "1h"),
  },

  bcrypt: {
    // saltRounds: higher = more secure but slower (10-12 is recommended)
    saltRounds: parseInt(getEnvVar("BCRYPT_SALT_ROUNDS", "12"), 10),
  },

  rateLimit: {
    windowMs: parseInt(getEnvVar("RATE_LIMIT_WINDOW_MS", "900000"), 10), // 15 min
    max: parseInt(getEnvVar("RATE_LIMIT_MAX", "20"), 10),
  },
};
```

**src/services/userService.js**
```javascript
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { config } from "../config/env.js";

// In-memory store — replace with a real database in production
const users = [];

/**
 * Finds a user by their email address.
 * @param {string} email
 * @returns {object|undefined}
 */
const findByEmail = (email) =>
  users.find((u) => u.email === email.toLowerCase().trim());

/**
 * Finds a user by their unique ID.
 * @param {string} id
 * @returns {object|undefined}
 */
const findById = (id) => users.find((u) => u.id === id);

/**
 * Creates a new user with a hashed password.
 * @param {string} name
 * @param {string} email
 * @param {string} password - Plain-text password (will be hashed)
 * @returns {object} - Safe user object (no password hash)
 */
const createUser = async (name, email, password) => {
  const normalizedEmail = email.toLowerCase().trim();

  if (findByEmail(normalizedEmail)) {
    const error = new Error("Email already registered");
    error.statusCode = 409;
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, config.bcrypt.saltRounds);

  const user = {
    id: uuidv4(),
    name: name.trim(),
    email: normalizedEmail,
    passwordHash,
    createdAt: new Date().toISOString(),
  };

  users.push(user);

  // Never return the password hash
  return toSafeUser(user);
};

/**
 * Validates credentials and returns the user if valid.
 * @param {string} email
 * @param {string} password
 * @returns {object} - Safe user object
 */
const validateCredentials = async (email, password) => {
  const user = findByEmail(email);

  // Always run bcrypt.compare to prevent timing attacks,
  // even when the user doesn't exist
  const dummyHash =
    "$2a$12$invalidhashusedtopreventtimingattacksXXXXXXXXXXXXXXXXXX";
  const isValid = await bcrypt.compare(password, user?.passwordHash ?? dummyHash);

  if (!user || !isValid) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  return toSafeUser(user);
};

/**
 * Returns a user object without sensitive fields.
 * @param {object} user
 * @returns {object}
 */
const toSafeUser = ({ id, name, email, createdAt }) => ({
  id,
  name,
  email,
  createdAt,
});

export const userService = {
  findById,
  createUser,
  validateCredentials,
  toSafeUser,
};
```

**src/middleware/auth.js**
```javascript
import jwt from "jsonwebtoken";
import { config } from "../config/env.js";
import { userService } from "../services/userService.js";

/**
 * Generates a signed JWT for a given user.
 * @param {object} user - Safe user object
 * @returns {string} - Signed JWT
 */
export const generateToken = (user) => {
  return jwt.sign(
    {
      sub: user.id, // 'sub' (subject) is the standard JWT claim for user ID
      email: user.email,
    },
    config.jwt.secret,
    {
      expiresIn: config.jwt.expiresIn,
      algorithm: "HS256",
    }
  );
};

/**
 * Middleware that protects routes by validating the Bearer JWT token.
 * Attaches the authenticated user to req.user on success.
 */
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Missing or malformed Authorization header",
      });
    }

    const token = authHeader.split(" ")[1];

    // Throws if token is invalid or expired
    const payload = jwt.verify(token, config.jwt.secret, {
      algorithms: ["HS256"],
    });

    // Confirm user still exists in the store
    const user = userService.findById(payload.sub);
    if (!user) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "User no longer exists",
      });
    }

    // Attach safe user data to the request
    req.user = userService.toSafeUser(user);
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Token has expired",
      });
    }

    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Invalid token",
      });
    }

    next(err);
  }
};
```

**src/middleware/security.js**
```javascript
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { config } from "../config/env.js";

/**
 * Helmet sets secure HTTP headers:
 * - Content-Security-Policy
 * - X-Content-Type-Options: nosniff
 * - X-Frame-Options: DENY
 * - Strict-Transport-Security (HSTS)
 * - And more...
 */
export const helmetMiddleware = helmet({
  contentSecurityPolicy: true,
  hsts: {
    maxAge: 31536000, // 1 year in seconds
    includeSubDomains: true,
  },
});

/**
 * Rate limiter to protect against brute-force and DoS attacks.
 * Applied globally — can also be scoped to specific routes.
 */
export const rateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true, // Return rate limit info in RateLimit-* headers
  legacyHeaders: false,  // Disable X-RateLimit-* headers
  message: {
    error: "Too Many Requests",
    message: "Too many requests, please try again later",
  },
  // Skip rate limiting in test environments
  skip: () => config.nodeEnv === "test",
});
```

**src/routes/auth.js**
```javascript
import { Router } from "express";
import { z } from "zod";
import { userService } from "../services/userService.js";
import { generateToken, authenticate } from "../middleware/auth.js";

const router = Router();

// --- Validation Schemas ---

const registerSchema = z.object({
  name: z
    .string({ required_error: "Name is required" })
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be at most 100 characters"),

  email: z
    .string({ required_error: "Email is required" })
    .email("Invalid email format")
    .max(254, "Email too long"),

  password: z
    .string({ required_error: "Password is required" })
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be at most 128 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(
      /[^A-Za-z0-9]/,
      "Password must contain at least one special character"
    ),
});

const loginSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .email("Invalid email format"),

  password: z
    .string({ required_error: "Password is required" })
    .min(1, "Password is required"),
});

// --- Helper ---

/**
 * Validates request body against a Zod schema.
 * Returns parsed data or sends a 400 response with validation errors.
 */
const validate = (schema, body, res) => {
  const result = schema.safeParse(body);
  if (!result.success) {
    res.status(400).json({
      error: "Validation Error",
      details: result.error.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      })),
    });
    return null;
  }
  return result.data;
};

// --- Routes ---

/**
 * POST /register
 * Creates a new user account.
 */
router.post("/register", async (req, res, next) => {
  try {
    const data = validate(registerSchema, req.body, res);
    if (!data) return;

    const user = await userService.createUser(data.name, data.email, data.password);
    const token = generateToken(user);

    return res.status(201).json({
      message: "Account created successfully",
      user,
      token,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /login
 * Authenticates a user and returns a JWT.
 */
router.post("/login", async (req, res, next) => {
  try {
    const data = validate(loginSchema, req.body, res);
    if (!data) return;

    const user = await userService.validateCredentials(data.email, data.password);
    const token = generateToken(user);

    return res.status(200).json({
      message: "Login successful",
      user,
      token,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /profile
 * Returns the authenticated user's profile.
 * Protected by the authenticate middleware.
 */
router.get("/profile", authenticate, (req, res) => {
  return res.status(200).json({
    message: "Profile retrieved successfully",
    user: req.user,
  });
});

export default router;
```

**src/app.js**
```javascript
import "./config/env.js"; // Must be first — loads and validates env vars
import express from "express";
import { config } from "./config/env.js";
import { helmetMiddleware, rateLimiter } from "./middleware/security.js";
import authRoutes from "./routes/auth.js";

const app = express();

// --- Security Middleware ---
app.use(helmetMiddleware);
app.use(rateLimiter);

// --- Body Parsing ---
// Limit payload size to prevent large body attacks
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: false, limit: "10kb" }));

// --- Disable fingerprinting ---
app.disable("x-powered-by"); // Helmet also does this, but explicit is better

// --- Routes ---
app.use("/", authRoutes);

// --- 404 Handler ---
app.use((req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// --- Global Error Handler ---
app.use((err, req, res, _next) => {
  const isDev = config.nodeEnv === "development";

  // Log the full error server-side
  console.error(`[ERROR] ${err.message}`, isDev ? err.stack : "");

  // Use statusCode set by services, or default to 500
  const statusCode = err.statusCode ?? 500;

  // Never expose internal error details in production
  const message =
    statusCode < 500
      ? err.message
      : isDev
        ? err.message
        : "Internal Server Error";

  return res.status(statusCode).json({
    error: statusCode < 500 ? "Request Error" : "Internal Server Error",
    message,
  });
});

// --- Start Server ---
app.listen(config.port, () => {
  console.log(`[SERVER] Running in ${config.nodeEnv} mode`);
  console.log(`[SERVER] Listening on http://localhost:${config.port}`);
});

export default app;
```

**.env.example**
```bash
# Server
PORT=3000
NODE_ENV=development

# JWT — REQUIRED: generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=your-super-secret-key-change-this-in-production
JWT_EXPIRES_IN=1h

# Bcrypt (10-12 recommended; higher = slower but more secure)
BCRYPT_SALT_ROUNDS=12

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=20
```

**.gitignore**
```
node_modules/
.env
*.log
```

**README.md**
````markdown
# Auth API

API REST com autenticação JWT, construída com Node.js e Express.

## Funcionalidades

- `POST /register` — Cadastro de usuário com validação e hash de senha
- `POST /login` — Login com retorno de JWT
- `GET /profile` — Rota protegida por autenticação JWT

## Segurança

| Medida | Implementação |
|---|---|
| Hash de senha | `bcryptjs` com salt rounds configurável |
| Autenticação | JWT com expiração e algoritmo explícito (HS256) |
| Segredo JWT | Variável de ambiente obrigatória |
| Headers HTTP | `helmet` (CSP, HSTS, X-Frame-Options, etc.) |
| Rate limiting | `express-rate-limit` (20 req / 15 min por padrão) |
| Validação | `zod` com regras de senha forte |
| Timing attacks | `bcrypt.compare` sempre executado |
| Payload size | Limite de 10kb no body parser |
| Fingerprinting | `x-powered-by` desabilitado |

## Pré-requisitos

- Node.js >= 18.x
- npm >= 9.x

## Instalação e Execução

### 1. Clone o repositório

```bash
git clone <url-do-repositorio>
cd auth-api
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

```bash
cp .env.example .env
```

Edite o arquivo `.env` e **substitua o `JWT_SECRET`** por um valor seguro.
Para gerar um segredo forte, execute:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 4. Execute a API

```bash
# Produção
npm start

# Desenvolvimento (com hot-reload)
npm run dev
```

A API estará disponível em `http://localhost:3000`.

---

## Exemplos de Uso

### Cadastro

```bash
curl -s -X POST http://localhost:3000/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ada Lovelace",
    "email": "ada@example.com",
    "password": "Senha@123"
  }' | jq
```

**Resposta (201):**
```json
{
  "message": "Account created successfully",
  "user": {
    "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "name": "Ada Lovelace",
    "email": "ada@example.com",
    "createdAt": "2024-01-15T10:30:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Login

```bash
curl -s -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "ada@example.com",
    "password": "Senha@123"
  }' | jq
```

**Resposta (200):**
```json
{
  "message": "Login successful",
  "user": { ... },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Acessar Perfil (rota protegida)

```bash
curl -s http://localhost:3000/profile \
  -H "Authorization: Bearer <seu-token-aqui>" | jq
```

**Resposta (200):**
```json
{
  "message": "Profile retrieved successfully",
  "user": {
    "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "name": "Ada Lovelace",
    "email": "ada@example.com",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

## Códigos de Resposta

| Código | Situação |
|---|---|
| `200` | Login bem-sucedido |
| `201` | Usuário criado |
| `400` | Erro de validação |
| `401` | Não autenticado / token inválido ou expirado |
| `404` | Rota não encontrada |
| `409` | Email já cadastrado |
| `429` | Rate limit excedido |
| `500` | Erro interno do servidor |

## Variáveis de Ambiente

| Variável | Padrão | Descrição |
|---|---|---|
| `PORT` | `3000` | Porta do servidor |
| `NODE_ENV` | `development` | Ambiente (`development` / `production`) |
| `JWT_SECRET` | — | **Obrigatório.** Segredo para assinar tokens |
| `JWT_EXPIRES_IN` | `1h` | Expiração do token (ex: `15m`, `2h`, `7d`) |
| `BCRYPT_SALT_ROUNDS` | `12` | Custo do hash bcrypt |
| `RATE_LIMIT_WINDOW_MS` | `900000` | Janela do rate limit em ms (15 min) |
| `RATE_LIMIT_MAX` | `20` | Máximo de requisições por janela |

## Estrutura do Projeto

```
src/
├── config/
│   └── env.js          # Carrega e valida variáveis de ambiente
├── middleware/
│   ├── auth.js         # Geração e verificação de JWT
│   └── security.js     # Helmet e rate limiting
├── routes/
│   └── auth.js         # Endpoints e validação de input
├── services/
│   └── userService.js  # Lógica de negócio e store em memória
└── app.js              # Bootstrap da aplicação
```
````

Agora vou criar todos os arquivos no sistema:

<function_calls>
<invoke name="create_file">
<parameter name="path">/auth-api/package.json</parameter>
<parameter name="content">{
  "name": "auth-api",
  "version": "1.0.0",
  "description": "REST API with JWT authentication",
  "main": "src/app.js",
  "type": "module",
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
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "nodemon": "^3.1.4"
  }
}
</parameter>
</invoke>
</function_calls>

<function_calls>
<invoke name="create_file">
<parameter name="path">/auth-api/src/config/env.js</parameter>
<parameter name="content">import "dotenv/config";

// Validates and exports environment variables with safe defaults
const getEnvVar = (key, defaultValue = null, required = false) => {
  const value = process.env[key] ?? defaultValue;

  if (required && !value) {
    console.error(`[FATAL] Missing required environment variable: ${key}`);
    process.exit(1);
  }

  return value;
};

export const config = {
  port: parseInt(getEnvVar("PORT", "3000"), 10),
  nodeEnv: getEnvVar("NODE_ENV", "development"),

  jwt: {
    // JWT_SECRET is required — app won't start without it
    secret: getEnvVar("JWT_SECRET", null, true),
    expiresIn: getEnvVar("JWT_EXPIRES_IN", "1h"),
  },

  bcrypt: {
    // saltRounds: higher = more secure but slower (10-12 is recommended)
    saltRounds: parseInt(getEnvVar("BCRYPT_SALT_ROUNDS", "12"), 10),
  },

  rateLimit: {
    windowMs: parseInt(getEnvVar("RATE_LIMIT_WINDOW_MS", "900000"), 10), // 15 min
    max: parseInt(getEnvVar("RATE_LIMIT_MAX", "20"), 10),
  },
};
</parameter>
</invoke>
</function_calls>

<function_calls>
<invoke name="create_file">
<parameter name="path">/auth-api/src/services/userService.js</parameter>
<parameter name="content">import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { config } from "../config/env.js";

// In-memory store — replace with a real database in production
const users = [];

/**
 * Finds a user by their email address.
 * @param {string} email
 * @returns {object|undefined}
 */
const findByEmail = (email) =>
  users.find((u) => u.email === email.toLowerCase().trim());

/**
 * Finds a user by their unique ID.
 * @param {string} id
 * @returns {object|undefined}
 */
const findById = (id) => users.find((u) => u.id === id);

/**
 * Creates a new user with a hashed password.
 * @param {string} name
 * @param {string} email
 * @param {string} password - Plain-text password (will be hashed)
 * @returns {object} - Safe user object (no password hash)
 */
const createUser = async (name, email, password) => {
  const normalizedEmail = email.toLowerCase().trim();

  if (findByEmail(normalizedEmail)) {
    const error = new Error("Email already registered");
    error.statusCode = 409;
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, config.bcrypt.saltRounds);

  const user = {
    id: uuidv4(),
    name: name.trim(),
    email: normalizedEmail,
    passwordHash,
    createdAt: new Date().toISOString(),
  };

  users.push(user);

  // Never return the password hash
  return toSafeUser(user);
};

/**
 * Validates credentials and returns the user if valid.
 * @param {string} email
 * @param {string} password
 * @returns {object} - Safe user object
 */
const validateCredentials = async (email, password) => {
  const user = findByEmail(email);

  // Always run bcrypt.compare to prevent timing attacks,
  // even when the user doesn't exist
  const dummyHash =
    "$2a$12$invalidhashusedtopreventtimingattacksXXXXXXXXXXXXXXXXXX";
  const isValid = await bcrypt.compare(
    password,
    user?.passwordHash ?? dummyHash
  );

  if (!user || !isValid) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  return toSafeUser(user);
};

/**
 * Returns a user object without sensitive fields.
 * @param {object} user
 * @returns {object}
 */
const toSafeUser = ({ id, name, email, createdAt }) => ({
  id,
  name,
  email,
  createdAt,
});

export const userService = {
  findById,
  createUser,
  validateCredentials,
  toSafeUser,
};
</parameter>
</invoke>
</function_calls>

<function_calls>
<invoke name="create_file">
<parameter name="path">/auth-api/src/middleware/auth.js</parameter>
<parameter name="content">import jwt from "jsonwebtoken";
import { config } from "../config/env.js";
import { userService } from "../services/userService.js";

/**
 * Generates a signed JWT for a given user.
 * @param {object} user - Safe user object
 * @returns {string} - Signed JWT
 */
export const generateToken = (user) => {
  return jwt.sign(
    {
      sub: user.id, // 'sub' (subject) is the standard JWT claim for user ID
      email: user.email,
    },
    config.jwt.secret,
    {
      expiresIn: config.jwt.expiresIn,
      algorithm: "HS256",
    }
  );
};

/**
 * Middleware that protects routes by validating the Bearer JWT token.
 * Attaches the authenticated user to req.user on success.
 */
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Missing or malformed Authorization header",
      });
    }

    const token = authHeader.split(" ")[1];

    // Throws if token is invalid or expired
    const payload = jwt.verify(token, config.jwt.secret, {
      algorithms: ["HS256"],
    });

    // Confirm user still exists in the store
    const user = userService.findById(payload.sub);
    if (!user) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "User no longer exists",
      });
    }

    // Attach safe user data to the request
    req.user = userService.toSafeUser(user);
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Token has expired",
      });
    }

    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Invalid token",
      });
    }

    next(err);
  }
};
</parameter>
</invoke>
</function_calls>

<function_calls>
<invoke name="create_file">
<parameter name="path">/auth-api/src/middleware/security.js</parameter>
<parameter name="content">import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { config } from "../config/env.js";

/**
 * Helmet sets secure HTTP headers:
 * - Content-Security-Policy
 * - X-Content-Type-Options: nosniff
 * - X-Frame-Options: DENY
 * - Strict-Transport-Security (HSTS)
 * - And more...
 */
export const helmetMiddleware = helmet({
  contentSecurityPolicy: true,
  hsts: {
    maxAge: