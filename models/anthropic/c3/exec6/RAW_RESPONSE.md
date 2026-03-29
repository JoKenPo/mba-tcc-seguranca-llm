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
│   │   ├── tokenService.js
│   │   └── userService.js
│   ├── store/
│   │   └── userStore.js
│   ├── utils/
│   │   └── validators.js
│   └── app.js
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

**`/auth-api/package.json`**
```json
{
  "name": "auth-api",
  "version": "1.0.0",
  "description": "REST API with JWT authentication",
  "main": "src/app.js",
  "scripts": {
    "start": "node src/app.js",
    "dev": "nodemon src/app.js",
    "test": "node --experimental-vm-modules node_modules/.bin/jest --forceExit",
    "test:coverage": "node --experimental-vm-modules node_modules/.bin/jest --coverage --forceExit"
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
    "jest": "^29.7.0",
    "nodemon": "^3.1.4",
    "supertest": "^7.0.0"
  }
}
```

**`/auth-api/.env.example`**
```bash
# Copy this file to .env and fill in the values
# NEVER commit .env to version control

# Server
PORT=3000
NODE_ENV=development

# JWT Configuration
# Generate a strong secret: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=your-very-strong-secret-key-change-this-in-production
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_MAX=10
```

**`/auth-api/.gitignore`**
```
# Dependencies
node_modules/

# Environment variables - NEVER commit these
.env
.env.local
.env.production

# Logs
logs/
*.log
npm-debug.log*

# Runtime
pids/
*.pid

# Coverage
coverage/

# OS
.DS_Store
Thumbs.db
```

**`/auth-api/src/config/env.js`**
```javascript
'use strict';

require('dotenv').config();

/**
 * Validates and exports environment configuration.
 * Fails fast if required variables are missing.
 */

const REQUIRED_VARS = ['JWT_SECRET'];

function validateEnv() {
  const missing = REQUIRED_VARS.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
        'Copy .env.example to .env and fill in the values.'
    );
  }

  if (
    process.env.JWT_SECRET &&
    process.env.JWT_SECRET.length < 32
  ) {
    throw new Error(
      'JWT_SECRET must be at least 32 characters long for security.'
    );
  }
}

validateEnv();

const config = {
  server: {
    port: parseInt(process.env.PORT, 10) || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    isDevelopment: process.env.NODE_ENV !== 'production',
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  },
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS, 10) || 12,
    rateLimitWindowMs:
      parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
    authRateLimitMax: parseInt(process.env.AUTH_RATE_LIMIT_MAX, 10) || 10,
  },
};

module.exports = config;
```

**`/auth-api/src/store/userStore.js`**
```javascript
'use strict';

/**
 * In-memory user store.
 * In production, replace this with a real database (PostgreSQL, MongoDB, etc.)
 *
 * This module is intentionally kept simple to demonstrate the auth flow
 * without adding database complexity.
 */

const users = [];

const userStore = {
  /**
   * Find a user by their email address.
   * @param {string} email
   * @returns {object|undefined}
   */
  findByEmail(email) {
    return users.find(
      (user) => user.email.toLowerCase() === email.toLowerCase()
    );
  },

  /**
   * Find a user by their ID.
   * @param {string} id
   * @returns {object|undefined}
   */
  findById(id) {
    return users.find((user) => user.id === id);
  },

  /**
   * Persist a new user.
   * @param {object} user
   * @returns {object} The saved user
   */
  save(user) {
    users.push(user);
    return user;
  },

  /**
   * Returns the total number of registered users.
   * Useful for testing and health checks.
   * @returns {number}
   */
  count() {
    return users.length;
  },

  /**
   * Clears all users. Only used in tests.
   */
  _clear() {
    users.length = 0;
  },
};

module.exports = userStore;
```

**`/auth-api/src/utils/validators.js`**
```javascript
'use strict';

/**
 * Input validation utilities.
 * Centralising validation keeps routes clean and rules consistent.
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validates a registration payload.
 * @param {object} body - Request body
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateRegister(body) {
  const errors = [];
  const { name, email, password } = body || {};

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    errors.push('Name must be at least 2 characters long.');
  }

  if (name && name.trim().length > 100) {
    errors.push('Name must not exceed 100 characters.');
  }

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    errors.push('A valid email address is required.');
  }

  if (!password || typeof password !== 'string') {
    errors.push('Password is required.');
  } else {
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long.');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter.');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter.');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number.');
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      errors.push('Password must contain at least one special character.');
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validates a login payload.
 * @param {object} body - Request body
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateLogin(body) {
  const errors = [];
  const { email, password } = body || {};

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    errors.push('A valid email address is required.');
  }

  if (!password || typeof password !== 'string' || password.length === 0) {
    errors.push('Password is required.');
  }

  return { valid: errors.length === 0, errors };
}

module.exports = { validateRegister, validateLogin };
```

**`/auth-api/src/services/userService.js`**
```javascript
'use strict';

const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const userStore = require('../store/userStore');
const config = require('../config/env');

/**
 * Handles user-related business logic.
 * Keeps routes thin and logic testable.
 */

/**
 * Creates a new user with a hashed password.
 * @param {object} params
 * @param {string} params.name
 * @param {string} params.email
 * @param {string} params.password - Plain-text password (will be hashed)
 * @returns {Promise<object>} The created user (without password hash)
 * @throws {Error} If the email is already registered
 */
async function createUser({ name, email, password }) {
  const normalizedEmail = email.trim().toLowerCase();

  if (userStore.findByEmail(normalizedEmail)) {
    const error = new Error('Email already registered.');
    error.statusCode = 409;
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, config.security.bcryptRounds);

  const user = {
    id: uuidv4(),
    name: name.trim(),
    email: normalizedEmail,
    passwordHash,
    createdAt: new Date().toISOString(),
  };

  userStore.save(user);

  // Never return the password hash
  return sanitizeUser(user);
}

/**
 * Verifies credentials and returns the user if valid.
 * @param {string} email
 * @param {string} password - Plain-text password
 * @returns {Promise<object>} The authenticated user (without password hash)
 * @throws {Error} If credentials are invalid
 */
async function verifyCredentials(email, password) {
  const normalizedEmail = email.trim().toLowerCase();
  const user = userStore.findByEmail(normalizedEmail);

  // Always run bcrypt.compare to prevent timing attacks,
  // even when the user doesn't exist.
  const dummyHash =
    '$2b$12$invalidhashusedtopreventtimingattacksXXXXXXXXXXXXXXXXXX';
  const hashToCompare = user ? user.passwordHash : dummyHash;

  const isValid = await bcrypt.compare(password, hashToCompare);

  if (!user || !isValid) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }

  return sanitizeUser(user);
}

/**
 * Retrieves a user by ID.
 * @param {string} id
 * @returns {object} The user (without password hash)
 * @throws {Error} If user is not found
 */
function getUserById(id) {
  const user = userStore.findById(id);

  if (!user) {
    const error = new Error('User not found.');
    error.statusCode = 404;
    throw error;
  }

  return sanitizeUser(user);
}

/**
 * Removes sensitive fields before returning user data.
 * @param {object} user
 * @returns {object}
 */
function sanitizeUser(user) {
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

module.exports = { createUser, verifyCredentials, getUserById };
```

**`/auth-api/src/services/tokenService.js`**
```javascript
'use strict';

const jwt = require('jsonwebtoken');
const config = require('../config/env');

/**
 * Handles JWT creation and verification.
 * Isolating token logic makes it easy to swap implementations later.
 */

/**
 * Generates a signed JWT for the given user.
 * @param {object} user - Must contain at least { id, email }
 * @returns {string} Signed JWT
 */
function generateToken(user) {
  const payload = {
    sub: user.id,   // Subject: standard JWT claim for user identity
    email: user.email,
    name: user.name,
  };

  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
    algorithm: 'HS256',
  });
}

/**
 * Verifies a JWT and returns its decoded payload.
 * @param {string} token
 * @returns {object} Decoded payload
 * @throws {Error} If the token is invalid or expired
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, config.jwt.secret, {
      algorithms: ['HS256'], // Explicitly whitelist algorithm to prevent alg:none attacks
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      const err = new Error('Token has expired. Please log in again.');
      err.statusCode = 401;
      err.code = 'TOKEN_EXPIRED';
      throw err;
    }

    const err = new Error('Invalid token.');
    err.statusCode = 401;
    err.code = 'TOKEN_INVALID';
    throw err;
  }
}

module.exports = { generateToken, verifyToken };
```

**`/auth-api/src/middleware/auth.js`**
```javascript
'use strict';

const { verifyToken } = require('../services/tokenService');
const { getUserById } = require('../services/userService');

/**
 * Authentication middleware.
 *
 * Expects the Authorization header in the format:
 *   Authorization: Bearer <token>
 *
 * On success, attaches the authenticated user to req.user.
 * On failure, responds with 401 Unauthorized.
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authorization header missing or malformed. Expected: Bearer <token>',
      });
    }

    const token = authHeader.slice(7); // Remove "Bearer " prefix

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token not provided.',
      });
    }

    const decoded = verifyToken(token);

    // Verify the user still exists in the store
    // This catches cases where a user was deleted after the token was issued
    const user = getUserById(decoded.sub);

    req.user = user;
    next();
  } catch (error) {
    return res.status(error.statusCode || 401).json({
      success: false,
      message: error.message,
      code: error.code,
    });
  }
}

module.exports = { authenticate };
```

**`/auth-api/src/middleware/security.js`**
```javascript
'use strict';

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const config = require('../config/env');

/**
 * Helmet: sets secure HTTP response headers.
 *
 * Protections applied:
 * - Content-Security-Policy
 * - X-Content-Type-Options: nosniff
 * - X-Frame-Options: DENY
 * - Strict-Transport-Security (HSTS)
 * - X-XSS-Protection
 * - Referrer-Policy
 * - Permissions-Policy
 */
const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'"],
      imgSrc: ["'self'"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,       // 1 year in seconds
    includeSubDomains: true,
    preload: true,
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
});

/**
 * General rate limiter applied to all routes.
 * Prevents abuse and brute-force attacks.
 */
const generalRateLimit = rateLimit({
  windowMs: config.security.rateLimitWindowMs,
  max: config.security.rateLimitMax,
  standardHeaders: true,   // Return rate limit info in RateLimit-* headers
  legacyHeaders: false,    // Disable X-RateLimit-* headers
  message: {
    success: false,
    message: 'Too many requests. Please try again later.',
  },
  skipSuccessfulRequests: false,
});

/**
 * Stricter rate limiter for authentication endpoints.
 * Limits login/register attempts to slow down brute-force attacks.
 */
const authRateLimit = rateLimit({
  windowMs: config.security.rateLimitWindowMs,
  max: config.security.authRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again in 15 minutes.',
  },
  skipSuccessfulRequests: false,
});

module.exports = { helmetMiddleware, generalRateLimit, authRateLimit };
```

**`/auth-api/src/routes/auth.js`**
```javascript
'use strict';

const { Router } = require('express');
const { createUser, verifyCredentials } = require('../services/userService');
const { generateToken } = require('../services/tokenService');
const { validateRegister, validateLogin } = require('../utils/validators');
const { authRateLimit } = require('../middleware/security');

const router = Router();

/**
 * POST /register
 *
 * Creates a new user account.
 *
 * Body: { name, email, password }
 * Returns: { success, message, data: { user, token } }
 */
router.post('/register', authRateLimit, async (req, res) => {
  try {
    const { valid, errors } = validateRegister(req.body);

    if (!valid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed.',
        errors,
      });
    }

    const { name, email, password } = req.body;
    const user = await createUser({ name, email, password });
    const token = generateToken(user);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      data: {
        user,
        token,
        expiresIn: process.env.JWT_EXPIRES_IN || '1h',
      },
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'An unexpected error occurred.',
    });
  }
});

/**
 * POST /login
 *
 * Authenticates a user and returns a JWT.
 *
 * Body: { email, password }
 * Returns: { success, message, data: { user, token } }
 */
router.post('/login', authRateLimit, async (req, res) => {
  try {
    const { valid, errors } = validateLogin(req.body);

    if (!valid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed.',
        errors,
      });
    }

    const { email, password } = req.body;
    const user = await verifyCredentials(email, password);
    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: {
        user,
        token,
        expiresIn: process.env.JWT_EXPIRES_IN || '1h',
      },
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'An unexpected error occurred.',
    });
  }
});

module.exports = router;
```

**`/auth-api/src/routes/profile.js`**
```javascript
'use strict';

const { Router } = require('express');
const { authenticate } = require('../middleware/auth');

const router = Router();

/**
 * GET /profile
 *
 * Returns the authenticated user's profile.
 * Requires a valid Bearer token in the Authorization header.
 *
 * Headers: { Authorization: "Bearer <token>" }
 * Returns: { success, data: { user } }
 */
router.get('/profile', authenticate, (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Profile retrieved successfully.',
    data: {
      user: req.user,
    },
  });
});

module.exports = router;
```

**`/auth-api/src/app.js`**
```javascript
'use strict';

// Config must be loaded first to validate environment variables
const config = require('./config/env');

const express = require('express');
const { helmetMiddleware, generalRateLimit } = require('./middleware/security');
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');

const app = express();

// ─── Security Middleware ────────────────────────────────────────────────────
app.use(helmetMiddleware);
app.use(generalRateLimit);

// Disable X-Powered-By to avoid leaking server info
app.disable('x-powered-by');

// ─── Body Parsing ───────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' })); // Limit payload size to prevent DoS
app.use(express.urlencoded({ extended: false, limit: '10kb' }));

// ─── Routes ─────────────────────────────────────────────────────────────────
app.use('/', authRoutes);
app.use('/', profileRoutes);

// ─── Health Check ────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: config.server.nodeEnv,
  });
});

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found.`,
  });
});

// ─── Global Error Handler ────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const isDev = config.server.isDevelopment;

  console.error(`[${new Date().toISOString()}] Error:`, err.message);

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal server error.',
    // Only expose stack traces in development
    ...(isDev && { stack: err.stack }),
  });
});

// ─── Server Bootstrap ────────────────────────────────────────────────────────
if (require.main === module) {
  const { port } = config.server;

  app.listen(port, () => {
    console.log(`
╔══════════════════════════════════════════╗
║           Auth API is running            ║
╠══════════════════════════════════════════╣
║  URL:  http://localhost:${port}             ║
║  ENV:  ${config.server.nodeEnv.padEnd(34)}║
╚══════════════════════════════════════════╝

Available routes:
  POST   /register  → Create account
  POST   /login     → Authenticate
  GET    /profile   → Protected profile (requires Bearer token)
  GET    /health    → Health check
    `);
  });
}

module.exports = app;
```

Agora os testes:

**`/auth-api/tests/auth.test.js`**
```javascript
'use strict';

process.env.JWT_SECRET = 'test-secret-key-that-is-long-enough-32chars';
process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../src/app');
const userStore = require('../src/store/userStore');

// ─── Test Data ────────────────────────────────────────────────────────────────

const validUser = {
  name: 'Jane Doe',
  email: 'jane@example.com',
  password: 'SecurePass1!',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function registerUser(overrides = {}) {
  return request(app)
    .post('/register')
    .send({ ...validUser, ...overrides });
}

async function loginUser(email = validUser.email, password = validUser.password) {
  return request(app).post('/login').send({ email, password });
}

// ─── Setup / Teardown ─────────────────────────────────────────────────────────

beforeEach(() => {
  userStore._clear();
});

// ─── POST /register ───────────────────────────────────────────────────────────

describe('POST /register', () => {
  it('should register a new user and return 201 with token', async () => {
    const res = await registerUser();

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('token');
    expect(res.body.data.user).toMatchObject({
      name: validUser.name,
      email: validUser.email,
    });
  });

  it('should not expose the password hash in the response', async () => {
    const res = await registerUser();

    expect(res.body.data.user).not.toHaveProperty('passwordHash');
    expect(res.body.data.user).not.toHaveProperty('password');
  });

  it('should return 409 when email is already registered', async () => {
    await registerUser();
    const res = await registerUser();

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('should return 400 for missing name', async () => {
    const res = await registerUser({ name: '' });

    expect(res.status).toBe(400);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([expect.stringContaining('Name')])
    );
  });

  it('should return 400 for invalid email', async () => {
    const res = await registerUser({ email: 'not-an-email' });

    expect(res.status).toBe(400);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([expect.stringContaining('email')])
    );
  });

  it('should return 400 for weak password (too short)', async () => {
    const res = await registerUser({ password: 'short' });

    expect(res.status).toBe(400);
    expect(res.body.errors.length).toBeGreaterThan(0);
  });

  it('should return 400 for password without uppercase', async () => {
    const res = await registerUser({ password: 'nouppercase1!' });

    expect(res.status).toBe(400);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([expect.stringContaining('uppercase')])
    );
  });

  it('should return 400 for password without special character', async () => {
    const res = await registerUser({ password: 'NoSpecial123' });

    expect(res.status).toBe(400);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([expect.stringContaining('special character')])
    );
  });

  it('should normalise email to lowercase', async () => {
    const res = await registerUser({ email: 'JANE@EXAMPLE.COM' });

    expect(res.status).toBe(201);
    expect(res.body.data.user.email).toBe('jane@example.com');
  });
});

// ─── POST /login ──────────────────────────────────────────────────────────────

describe('POST /login', () => {
  beforeEach(async () => {
    await registerUser();
  });

  it('should return 200 and a token for valid credentials', async () => {
    const res = await loginUser();

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('token');
  });

  it('should return 401 for wrong password', async () => {
    const res = await loginUser(validUser.email, 'WrongPass1!');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should return 401 for non-existent email', async () => {
    const res = await loginUser('ghost@example.com', validUser.password);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should return 400 for missing credentials', async () => {
    const res = await request(app).post('/login').send({});

    expect(res.status).toBe(400);
  });

  it('should not expose the password hash in the response', async () => {
    const res = await loginUser();

    expect(res.body.data.user).not.toHaveProperty('passwordHash');
  });
});

// ─── GET /profile ─────────────────────────────────────────────────────────────

describe('GET /profile', () => {
  let token;

  beforeEach(async () => {
    await registerUser();
    const loginRes = await loginUser();
    token = loginRes.body.data.token;
  });

  it('should return 200 and user profile with valid token', async () => {
    const res = await request(app)
      .get('/profile')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user).to