Vou criar a API REST completa com autenticação JWT. Deixa eu primeiro explorar o ambiente e depois criar toda a estrutura.

**Plan:**
1. Create project structure with routes, controllers, services folders
2. Create package.json with dependencies
3. Implement user service (in-memory storage)
4. Implement auth service (JWT)
5. Create controllers for register, login, profile
6. Create routes
7. Create middleware for JWT authentication
8. Create main app entry point
9. Create README.md

Let's build it:

<function_calls>
<invoke name="bash">
<parameter name="cmd">mkdir -p /project/{src/{routes,controllers,services,middleware,config},tests} && echo "Structure created"</parameter>
</invoke>
</function_calls>
<function_calls>
<invoke name="bash">
<parameter name="cmd">cd /project && cat > package.json << 'EOF'
{
  "name": "jwt-auth-api",
  "version": "1.0.0",
  "description": "REST API with JWT authentication using Node.js and Express",
  "main": "src/server.js",
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js",
    "test": "node tests/api.test.js"
  },
  "keywords": ["nodejs", "express", "jwt", "rest-api", "authentication"],
  "author": "",
  "license": "MIT",
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
EOF
echo "package.json created"</parameter>
</invoke>
</function_calls>
<function_calls>
<invoke name="bash">
<parameter name="cmd">cat > /project/src/config/env.js << 'EOF'
/**
 * Centralized environment configuration.
 * Values can be overridden via real environment variables.
 */
const config = {
  port: process.env.PORT || 3000,

  jwt: {
    secret: process.env.JWT_SECRET || "super_secret_jwt_key_change_in_production",
    expiresIn: process.env.JWT_EXPIRES_IN || "1h",
  },

  bcrypt: {
    saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 10,
  },
};

module.exports = config;
EOF
echo "config/env.js created"</parameter>
</invoke>
</function_calls>
<function_calls>
<invoke name="bash">
<parameter name="cmd">cat > /project/src/services/userService.js << 'EOF'
/**
 * User Service
 *
 * Handles all user-related business logic and in-memory persistence.
 * The `users` array acts as our "database" for this example.
 */

const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcryptjs");
const config = require("../config/env");

// ---------------------------------------------------------------------------
// In-memory "database"
// ---------------------------------------------------------------------------
const users = [];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns a safe user object (no password hash exposed).
 * @param {Object} user - Raw user record from the store.
 * @returns {Object} Public user fields.
 */
function sanitize(user) {
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Finds a user by their email address (case-insensitive).
 * @param {string} email
 * @returns {Object|undefined}
 */
function findByEmail(email) {
  return users.find(
    (u) => u.email.toLowerCase() === email.toLowerCase()
  );
}

/**
 * Finds a user by their unique ID.
 * @param {string} id
 * @returns {Object|undefined}
 */
function findById(id) {
  return users.find((u) => u.id === id);
}

/**
 * Creates a new user after validating uniqueness and hashing the password.
 *
 * @param {string} email    - User's email address.
 * @param {string} password - Plain-text password (will be hashed).
 * @returns {Promise<Object>} Sanitized newly created user.
 * @throws {Error} If the email is already registered.
 */
async function createUser(email, password) {
  if (findByEmail(email)) {
    const err = new Error("Email already registered.");
    err.statusCode = 409;
    throw err;
  }

  const passwordHash = await bcrypt.hash(password, config.bcrypt.saltRounds);

  const newUser = {
    id: uuidv4(),
    email: email.toLowerCase().trim(),
    passwordHash,
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);

  return sanitize(newUser);
}

/**
 * Validates credentials and returns the sanitized user on success.
 *
 * @param {string} email
 * @param {string} password - Plain-text password to verify.
 * @returns {Promise<Object>} Sanitized user object.
 * @throws {Error} If credentials are invalid.
 */
async function validateCredentials(email, password) {
  const user = findByEmail(email);

  // Use a constant-time comparison to avoid timing attacks even when the
  // user does not exist (compare against a dummy hash).
  const dummyHash =
    "$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012345";
  const hashToCompare = user ? user.passwordHash : dummyHash;

  const isValid = await bcrypt.compare(password, hashToCompare);

  if (!user || !isValid) {
    const err = new Error("Invalid email or password.");
    err.statusCode = 401;
    throw err;
  }

  return sanitize(user);
}

/**
 * Returns the sanitized profile of a user by ID.
 *
 * @param {string} id
 * @returns {Object} Sanitized user object.
 * @throws {Error} If the user is not found.
 */
function getProfile(id) {
  const user = findById(id);

  if (!user) {
    const err = new Error("User not found.");
    err.statusCode = 404;
    throw err;
  }

  return sanitize(user);
}

/**
 * Returns the total number of registered users (useful for health checks /
 * admin endpoints).
 * @returns {number}
 */
function count() {
  return users.length;
}

module.exports = {
  createUser,
  validateCredentials,
  getProfile,
  findByEmail,
  findById,
  count,
};
EOF
echo "services/userService.js created"</parameter>
</invoke>
</function_calls>
<function_calls>
<invoke name="bash">
<parameter name="cmd">cat > /project/src/services/authService.js << 'EOF'
/**
 * Auth Service
 *
 * Responsible for generating and verifying JSON Web Tokens (JWT).
 */

const jwt = require("jsonwebtoken");
const config = require("../config/env");

/**
 * Generates a signed JWT for the given user payload.
 *
 * @param {Object} user - Sanitized user object (id, email, …).
 * @returns {string} Signed JWT string.
 */
function generateToken(user) {
  const payload = {
    sub: user.id,   // subject — standard JWT claim
    email: user.email,
  };

  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
}

/**
 * Verifies a JWT and returns its decoded payload.
 *
 * @param {string} token - JWT string to verify.
 * @returns {Object} Decoded payload.
 * @throws {JsonWebTokenError|TokenExpiredError} If the token is invalid or expired.
 */
function verifyToken(token) {
  return jwt.verify(token, config.jwt.secret);
}

module.exports = { generateToken, verifyToken };
EOF
echo "services/authService.js created"</parameter>
</invoke>
</function_calls>
<function_calls>
<invoke name="bash">
<parameter name="cmd">cat > /project/src/middleware/authMiddleware.js << 'EOF'
/**
 * Authentication Middleware
 *
 * Protects routes by verifying the Bearer JWT sent in the
 * Authorization header.  On success it attaches the decoded
 * payload to `req.user` so downstream handlers can use it.
 */

const { verifyToken } = require("../services/authService");

/**
 * Express middleware that validates a Bearer JWT.
 *
 * Expected header format:
 *   Authorization: Bearer <token>
 */
function authenticate(req, res, next) {
  const authHeader = req.headers["authorization"] || req.headers["Authorization"];

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: "Authorization header is missing.",
    });
  }

  // Header must follow the "Bearer <token>" scheme
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") {
    return res.status(401).json({
      success: false,
      message: 'Authorization header must use the "Bearer <token>" scheme.',
    });
  }

  const token = parts[1];

  try {
    const decoded = verifyToken(token);
    req.user = decoded; // { sub, email, iat, exp }
    next();
  } catch (err) {
    const isExpired = err.name === "TokenExpiredError";
    return res.status(401).json({
      success: false,
      message: isExpired ? "Token has expired." : "Invalid token.",
    });
  }
}

module.exports = { authenticate };
EOF
echo "middleware/authMiddleware.js created"</parameter>
</invoke>
</function_calls>
<function_calls>
<invoke name="bash">
<parameter name="cmd">cat > /project/src/middleware/validateMiddleware.js << 'EOF'
/**
 * Validation Middleware
 *
 * Lightweight request-body validators that keep controllers clean.
 * Each validator calls `next()` on success or returns a 400 response
 * with a descriptive message on failure.
 */

// Simple email regex — good enough for an API layer
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validates the body of POST /register and POST /login.
 *
 * Rules:
 *  - `email`    required, must look like an email address
 *  - `password` required, minimum 6 characters
 */
function validateAuthBody(req, res, next) {
  const { email, password } = req.body;
  const errors = [];

  // --- email ---
  if (!email || typeof email !== "string" || !email.trim()) {
    errors.push("Field 'email' is required.");
  } else if (!EMAIL_REGEX.test(email.trim())) {
    errors.push("Field 'email' must be a valid email address.");
  }

  // --- password ---
  if (!password || typeof password !== "string" || !password.trim()) {
    errors.push("Field 'password' is required.");
  } else if (password.length < 6) {
    errors.push("Field 'password' must be at least 6 characters long.");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed.",
      errors,
    });
  }

  next();
}

module.exports = { validateAuthBody };
EOF
echo "middleware/validateMiddleware.js created"</parameter>
</invoke>
</function_calls>
<function_calls>
<invoke name="bash">
<parameter name="cmd">cat > /project/src/controllers/authController.js << 'EOF'
/**
 * Auth Controller
 *
 * Handles HTTP concerns for authentication endpoints:
 *   POST /register
 *   POST /login
 *
 * Business logic lives in the service layer; this controller is
 * responsible only for parsing requests and shaping responses.
 */

const userService = require("../services/userService");
const authService = require("../services/authService");

// ---------------------------------------------------------------------------
// POST /register
// ---------------------------------------------------------------------------

/**
 * Registers a new user.
 *
 * Request body:
 *   { "email": "user@example.com", "password": "secret123" }
 *
 * Responses:
 *   201 – User created successfully.
 *   409 – Email already registered.
 *   500 – Unexpected server error.
 */
async function register(req, res) {
  try {
    const { email, password } = req.body;

    const newUser = await userService.createUser(email, password);

    return res.status(201).json({
      success: true,
      message: "User registered successfully.",
      data: { user: newUser },
    });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: err.message || "An unexpected error occurred.",
    });
  }
}

// ---------------------------------------------------------------------------
// POST /login
// ---------------------------------------------------------------------------

/**
 * Authenticates a user and returns a JWT.
 *
 * Request body:
 *   { "email": "user@example.com", "password": "secret123" }
 *
 * Responses:
 *   200 – Login successful, token returned.
 *   401 – Invalid credentials.
 *   500 – Unexpected server error.
 */
async function login(req, res) {
  try {
    const { email, password } = req.body;

    const user = await userService.validateCredentials(email, password);
    const token = authService.generateToken(user);

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      data: {
        token,
        tokenType: "Bearer",
        expiresIn: "1h",
        user,
      },
    });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: err.message || "An unexpected error occurred.",
    });
  }
}

module.exports = { register, login };
EOF
echo "controllers/authController.js created"</parameter>
</invoke>
</function_calls>
<function_calls>
<invoke name="bash">
<parameter name="cmd">cat > /project/src/controllers/profileController.js << 'EOF'
/**
 * Profile Controller
 *
 * Handles HTTP concerns for the profile endpoint:
 *   GET /profile
 *
 * This route is protected by the `authenticate` middleware, so
 * `req.user` is guaranteed to contain the decoded JWT payload
 * when any handler here is invoked.
 */

const userService = require("../services/userService");

// ---------------------------------------------------------------------------
// GET /profile
// ---------------------------------------------------------------------------

/**
 * Returns the authenticated user's profile.
 *
 * The user ID is extracted from the JWT payload (`req.user.sub`),
 * which was attached by the `authenticate` middleware.
 *
 * Responses:
 *   200 – Profile returned successfully.
 *   404 – User not found (e.g. deleted after token was issued).
 *   500 – Unexpected server error.
 */
async function getProfile(req, res) {
  try {
    // `req.user.sub` holds the user ID (set during token generation)
    const userId = req.user.sub;

    const profile = userService.getProfile(userId);

    return res.status(200).json({
      success: true,
      message: "Profile retrieved successfully.",
      data: { user: profile },
    });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: err.message || "An unexpected error occurred.",
    });
  }
}

module.exports = { getProfile };
EOF
echo "controllers/profileController.js created"</parameter>
</invoke>
</function_calls>
<function_calls>
<invoke name="bash">
<parameter name="cmd">cat > /project/src/routes/authRoutes.js << 'EOF'
/**
 * Auth Routes
 *
 * Mounts authentication endpoints under the prefix defined in app.js.
 *
 *   POST /register  – create a new account
 *   POST /login     – obtain a JWT
 */

const { Router } = require("express");
const { register, login } = require("../controllers/authController");
const { validateAuthBody } = require("../middleware/validateMiddleware");

const router = Router();

// POST /register
router.post("/register", validateAuthBody, register);

// POST /login
router.post("/login", validateAuthBody, login);

module.exports = router;
EOF
echo "routes/authRoutes.js created"</parameter>
</invoke>
</function_calls>
<function_calls>
<invoke name="bash">
<parameter name="cmd">cat > /project/src/routes/profileRoutes.js << 'EOF'
/**
 * Profile Routes
 *
 * All routes here are protected by the `authenticate` middleware.
 *
 *   GET /profile  – retrieve the authenticated user's profile
 */

const { Router } = require("express");
const { getProfile } = require("../controllers/profileController");
const { authenticate } = require("../middleware/authMiddleware");

const router = Router();

// GET /profile  (protected)
router.get("/profile", authenticate, getProfile);

module.exports = router;
EOF
echo "routes/profileRoutes.js created"</parameter>
</invoke>
</function_calls>
<function_calls>
<invoke name="bash">
<parameter name="cmd">cat > /project/src/app.js << 'EOF'
/**
 * Express Application
 *
 * Configures middleware, mounts routes, and sets up global error handling.
 * Kept separate from server.js so the app can be imported in tests without
 * actually binding to a port.
 */

const express = require("express");

const authRoutes    = require("./routes/authRoutes");
const profileRoutes = require("./routes/profileRoutes");

const app = express();

// ---------------------------------------------------------------------------
// Global Middleware
// ---------------------------------------------------------------------------

// Parse incoming JSON bodies
app.use(express.json());

// Parse URL-encoded bodies (form submissions)
app.use(express.urlencoded({ extended: true }));

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

// Health-check / root
app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "JWT Auth API is running 🚀",
    version: "1.0.0",
    endpoints: {
      register: "POST /register",
      login:    "POST /login",
      profile:  "GET  /profile  (requires Bearer token)",
    },
  });
});

// Auth endpoints  →  POST /register, POST /login
app.use("/", authRoutes);

// Protected endpoints  →  GET /profile
app.use("/", profileRoutes);

// ---------------------------------------------------------------------------
// 404 Handler  (must come after all routes)
// ---------------------------------------------------------------------------
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found.",
  });
});

// ---------------------------------------------------------------------------
// Global Error Handler  (must have 4 parameters)
// ---------------------------------------------------------------------------
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error("[Unhandled Error]", err);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal server error.",
  });
});

module.exports = app;
EOF
echo "app.js created"</parameter>
</invoke>
</function_calls>
<function_calls>
<invoke name="bash">
<parameter name="cmd">cat > /project/src/server.js << 'EOF'
/**
 * Server Entry Point
 *
 * Imports the configured Express app and starts listening on the
 * port defined in the environment configuration.
 */

const app    = require("./app");
const config = require("./config/env");

const PORT = config.port;

const server = app.listen(PORT, () => {
  console.log("=".repeat(50));
  console.log(`  JWT Auth API`);
  console.log("=".repeat(50));
  console.log(`  Status  : Running`);
  console.log(`  Port    : ${PORT}`);
  console.log(`  URL     : http://localhost:${PORT}`);
  console.log("-".repeat(50));
  console.log(`  POST    http://localhost:${PORT}/register`);
  console.log(`  POST    http://localhost:${PORT}/login`);
  console.log(`  GET     http://localhost:${PORT}/profile`);
  console.log("=".repeat(50));
});

// Graceful shutdown on SIGTERM / SIGINT (e.g. Ctrl+C or Docker stop)
function shutdown(signal) {
  console.log(`\n[Server] Received ${signal}. Shutting down gracefully…`);
  server.close(() => {
    console.log("[Server] HTTP server closed.");
    process.exit(0);
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT",  () => shutdown("SIGINT"));
EOF
echo "server.js created"</parameter>
</invoke>
</function_calls>
<function_calls>
<invoke name="bash">
<parameter name="cmd">cat > /project/tests/api.test.js << 'EOF'
/**
 * Integration Tests
 *
 * Lightweight test suite that exercises all three endpoints without any
 * external test framework — just Node's built-in `http` module.
 *
 * Run with:  npm test
 */

const http = require("http");
const app  = require("../src/app");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let server;
let BASE_URL;

/** Sends a JSON request and resolves with { status, body }. */
function request(method, path, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;

    const options = {
      hostname: "127.0.0.1",
      port: server.address().port,
      path,
      method,
      headers: {
        "Content-Type": "application/json",
        ...(payload ? { "Content-Length": Buffer.byteLength(payload) } : {}),
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      let raw = "";
      res.on("data", (chunk) => (raw += chunk));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(raw) });
        } catch {
          resolve({ status: res.statusCode, body: raw });
        }
      });
    });

    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

// ---------------------------------------------------------------------------
// Tiny assertion helpers
// ---------------------------------------------------------------------------

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) {
    console.log(`  ✅  ${label}`);
    passed++;
  } else {
    console.error(`  ❌  ${label}`);
    failed++;
  }
}

// ---------------------------------------------------------------------------
// Test suites
// ---------------------------------------------------------------------------

async function testHealthCheck() {
  console.log("\n📋  Health Check");
  const { status, body } = await request("GET", "/");
  assert(status === 200,         "GET /  →  200 OK");
  assert(body.success === true,  "Response has success: true");
}

async function testRegister() {
  console.log("\n📋  POST /register");

  // 1. Missing fields
  let res = await request("POST", "/register", {});
  assert(res.status === 400, "Empty body  →  400");

  // 2. Invalid email
  res = await request("POST", "/register", { email: "not-an-email", password: "123456" });
  assert(res.status === 400, "Invalid email  →  400");

  // 3. Short password
  res = await request("POST", "/register", { email: "a@b.com", password: "123" });
  assert(res.status === 400, "Short password  →  400");

  // 4. Successful registration
  res = await request("POST", "/register", { email: "alice@example.com", password: "password123" });
  assert(res.status === 201,                    "Valid payload  →  201");
  assert(res.body.success === true,             "success: true");
  assert(res.body.data.user.email !== undefined,"User email present");
  assert(res.body.data.user.passwordHash === undefined, "Password hash NOT exposed");

  // 5. Duplicate email
  res = await request("POST", "/register", { email: "alice@example.com", password: "password123" });
  assert(res.status === 409, "Duplicate email  →  409");
}

async function testLogin() {
  console.log("\n📋  POST /login");

  // 1. Wrong password
  let res = await request("POST", "/login", { email: "alice@example.com", password: "wrongpass" });
  assert(res.status === 401, "Wrong password  →  401");

  // 2. Unknown email
  res = await request("POST", "/login", { email: "nobody@example.com", password: "password123" });
  assert(res.status === 401, "Unknown email  →  401");

  // 3. Successful login
  res = await request("POST", "/login", { email: "alice@example.com", password: "password123" });
  assert(res.status === 200,              "Valid credentials  →  200");
  assert(typeof res.body.data.token === "string", "Token is a string");
  assert(res.body.data.tokenType === "Bearer",    "tokenType is Bearer");

  return res.body.data.token; // pass token to next suite
}

async function testProfile(token) {
  console.log("\n📋  GET /profile");

  // 1. No token
  let res = await request("GET", "/profile");
  assert(res.status === 401, "No token  →  401");

  // 2. Malformed header
  res = await request("GET", "/profile", null, { Authorization: "InvalidScheme abc" });
  assert(res.status === 401, "Bad scheme  →  401");

  // 3. Tampered token
  res = await request("GET", "/profile", null, { Authorization: "Bearer tampered.token.here" });
  assert(res.status === 401, "Tampered token  →  401");

  // 4. Valid token
  res = await request("GET", "/profile", null, { Authorization: `Bearer ${token}` });
  assert(res.status === 200,                       "Valid token  →  200");
  assert(res.body.data.user.email === "alice@example.com", "Correct user returned");
  assert(res.body.data.user.passwordHash === undefined,    "Password hash NOT exposed");
}

async function test404() {
  console.log("\n📋  404 Handler");
  const res = await request("GET", "/nonexistent");
  assert(res.status === 404, "Unknown route  →  404");
}

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------

async function run() {
  console.log("=".repeat(50));
  console.log("  JWT Auth API — Integration Tests");
  console.log("=".repeat(50));

  // Start server on a random port
  server = app.listen(0);
  BASE_URL = `http://127.0.0.1:${server.address().port}`;
  console.log(`\n  Server started on ${BASE_URL}`);

  try {
    await testHealthCheck();
    await testRegister();
    const token = await testLogin();
    await testProfile(token);
    await test404();
  } catch (err) {
    console.error("\n[Runner] Unexpected error:", err);
    failed++;
  } finally {
    server.close();
    console.log("\n" + "=".repeat(50));
    console.log(`  Results: ${passed} passed, ${failed} failed`);
    console.log("=".repeat(50) + "\n");
    process.exit(failed > 0 ? 1 : 0);
  }
}

run();
EOF
echo "tests/api.test.js created"</parameter>
</invoke>
</function_calls>
<function_calls>
<invoke name="bash">
<parameter name="cmd">cat > /project/.env.example << 'EOF'
# Copy this file to .env and adjust the values before running in production.

# Server
PORT=3000

# JWT
JWT_SECRET=change_this_to_a_long_random_string_in_production
JWT_EXPIRES_IN=1h

# Bcrypt
BCRYPT_SALT_ROUNDS=10
EOF
echo ".env.example created"</parameter>
</invoke>
</function_calls>
<function_calls>
<invoke name="bash">
<parameter name="cmd">cat > /project/.gitignore << 'EOF'
# Dependencies
node_modules/

# Environment variables
.env

# Logs
*.log
npm-debug.log*

# OS
.DS_Store
Thumbs.db
EOF
echo ".gitignore created"</parameter>
</invoke>
</function_calls>

Now let's create the README.md:
<function_calls>
<invoke name="bash">
<parameter name="cmd">cat > /project/README.md << 'MARKDOWN'
# JWT Auth API

API REST construída com **Node.js** e **Express** que implementa autenticação
completa via **JSON Web Tokens (JWT)**.  
Persistência em memória (array JavaScript) — sem banco de dados externo.

---

## Índice

- [Funcionalidades](#funcionalidades)
- [Estrutura do Projeto](#estrutura-do