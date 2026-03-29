Vou criar a API REST completa com autenticação JWT. Deixa eu primeiro explorar o ambiente atual.

<tool_call>
{"name": "fs_ls", "arguments": {"path": "/"}}
</tool_call>
<tool_response>
[".dockerenv", "bin", "boot", "dev", "etc", "home", "lib", "lib64", "media", "mnt", "opt", "proc", "root", "run", "sbin", "srv", "sys", "tmp", "usr", "var"]
</tool_response>

<tool_call>
{"name": "fs_ls", "arguments": {"path": "/home"}}
</tool_call>
<tool_response>
["user"]
</tool_response>

<tool_call>
{"name": "fs_ls", "arguments": {"path": "/home/user"}}
</tool_call>
<tool_response>
[]
</tool_response>

Perfeito. Vou criar toda a estrutura do projeto em `/home/user`.

<tool_call>
{"name": "fs_mkdir", "arguments": {"path": "/home/user/jwt-auth-api"}}
</tool_call>
<tool_response>
null
</tool_response>

<tool_call>
{"name": "fs_mkdir", "arguments": {"path": "/home/user/jwt-auth-api/src"}}
</tool_call>
<tool_response>
null
</tool_response>

<tool_call>
{"name": "fs_mkdir", "arguments": {"path": "/home/user/jwt-auth-api/src/routes"}}
</tool_call>
<tool_response>
null
</tool_response>

<tool_call>
{"name": "fs_mkdir", "arguments": {"path": "/home/user/jwt-auth-api/src/controllers"}}
</tool_call>
<tool_response>
null
</tool_response>

<tool_call>
{"name": "fs_mkdir", "arguments": {"path": "/home/user/jwt-auth-api/src/services"}}
</tool_call>
<tool_response>
null
</tool_response>

<tool_call>
{"name": "fs_mkdir", "arguments": {"path": "/home/user/jwt-auth-api/src/middlewares"}}
</tool_call>
<tool_response>
null
</tool_response>

<tool_call>
{"name": "fs_mkdir", "arguments": {"path": "/home/user/jwt-auth-api/src/models"}}
</tool_call>
<tool_response>
null
</tool_response>

<tool_call>
{"name": "fs_mkdir", "arguments": {"path": "/home/user/jwt-auth-api/src/config"}}
</tool_call>
<tool_response>
null
</tool_response>

Agora vou criar todos os arquivos do projeto:
<tool_call>
{"name": "fs_write", "arguments": {"path": "/home/user/jwt-auth-api/package.json", "content": "{\n  \"name\": \"jwt-auth-api\",\n  \"version\": \"1.0.0\",\n  \"description\": \"REST API with JWT authentication using Node.js and Express\",\n  \"main\": \"src/server.js\",\n  \"scripts\": {\n    \"start\": \"node src/server.js\",\n    \"dev\": \"nodemon src/server.js\"\n  },\n  \"keywords\": [\"nodejs\", \"express\", \"jwt\", \"authentication\", \"rest-api\"],\n  \"author\": \"\",\n  \"license\": \"MIT\",\n  \"dependencies\": {\n    \"bcryptjs\": \"^2.4.3\",\n    \"express\": \"^4.18.2\",\n    \"jsonwebtoken\": \"^9.0.2\",\n    \"uuid\": \"^9.0.0\"\n  },\n  \"devDependencies\": {\n    \"nodemon\": \"^3.0.2\"\n  }\n}\n"}}
</tool_call>
<tool_response>
null
</tool_response>

<tool_call>
{"name": "fs_write", "arguments": {"path": "/home/user/jwt-auth-api/src/config/env.js", "content": "/**\n * Centralized environment configuration.\n * Values can be overridden via real environment variables.\n */\nconst config = {\n  port: process.env.PORT || 3000,\n\n  jwt: {\n    secret: process.env.JWT_SECRET || 'super-secret-jwt-key-change-in-production',\n    expiresIn: process.env.JWT_EXPIRES_IN || '1h',\n  },\n\n  bcrypt: {\n    saltRounds: Number(process.env.BCRYPT_SALT_ROUNDS) || 10,\n  },\n};\n\nmodule.exports = config;\n"}}
</tool_call>
<tool_response>
null
</tool_response>

<tool_call>
{"name": "fs_write", "arguments": {"path": "/home/user/jwt-auth-api/src/models/userStore.js", "content": "/**\n * In-memory user store.\n *\n * Acts as a simple database replacement using a plain JavaScript array.\n * All data is lost when the process restarts — intentional for this demo.\n *\n * Shape of each user object:\n * {\n *   id:        string  (UUID v4)\n *   email:     string  (unique, lower-cased)\n *   password:  string  (bcrypt hash)\n *   createdAt: string  (ISO 8601)\n * }\n */\n\nconst users = [];\n\n/**\n * Returns a shallow copy of the full users array.\n * Never expose the raw array to callers so they cannot mutate it directly.\n */\nfunction findAll() {\n  return [...users];\n}\n\n/**\n * Finds a single user by email (case-insensitive).\n * @param {string} email\n * @returns {object|undefined}\n */\nfunction findByEmail(email) {\n  return users.find((u) => u.email === email.toLowerCase());\n}\n\n/**\n * Finds a single user by id.\n * @param {string} id\n * @returns {object|undefined}\n */\nfunction findById(id) {\n  return users.find((u) => u.id === id);\n}\n\n/**\n * Persists a new user object.\n * @param {object} user - Must already contain id, email, password, createdAt.\n * @returns {object} The stored user.\n */\nfunction save(user) {\n  users.push(user);\n  return user;\n}\n\nmodule.exports = { findAll, findByEmail, findById, save };\n"}}
</tool_call>
<tool_response>
null
</tool_response>

<tool_call>
{"name": "fs_write", "arguments": {"path": "/home/user/jwt-auth-api/src/services/authService.js", "content": "/**\n * Auth Service\n *\n * Encapsulates all business logic related to authentication:\n *   - registering new users\n *   - validating credentials on login\n *   - issuing JWT tokens\n *   - fetching profile data\n */\n\nconst bcrypt = require('bcryptjs');\nconst jwt = require('jsonwebtoken');\nconst { v4: uuidv4 } = require('uuid');\n\nconst userStore = require('../models/userStore');\nconst config = require('../config/env');\n\n// ---------------------------------------------------------------------------\n// Helpers\n// ---------------------------------------------------------------------------\n\n/**\n * Returns a sanitized user object safe to send to the client\n * (i.e. without the password hash).\n * @param {object} user\n * @returns {object}\n */\nfunction sanitize(user) {\n  const { password, ...safe } = user; // eslint-disable-line no-unused-vars\n  return safe;\n}\n\n/**\n * Generates a signed JWT for the given user.\n * @param {object} user\n * @returns {string} Signed JWT.\n */\nfunction generateToken(user) {\n  const payload = { sub: user.id, email: user.email };\n  return jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn });\n}\n\n// ---------------------------------------------------------------------------\n// Service methods\n// ---------------------------------------------------------------------------\n\n/**\n * Registers a new user.\n *\n * @param {string} email\n * @param {string} password - Plain-text; will be hashed before storage.\n * @returns {{ user: object }} Sanitized user.\n * @throws {Error} If email is already taken or inputs are invalid.\n */\nasync function register(email, password) {\n  // --- Input validation ---\n  if (!email || typeof email !== 'string') {\n    const err = new Error('Email is required.');\n    err.statusCode = 400;\n    throw err;\n  }\n\n  if (!password || typeof password !== 'string') {\n    const err = new Error('Password is required.');\n    err.statusCode = 400;\n    throw err;\n  }\n\n  const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;\n  if (!emailRegex.test(email)) {\n    const err = new Error('Invalid email format.');\n    err.statusCode = 400;\n    throw err;\n  }\n\n  if (password.length < 6) {\n    const err = new Error('Password must be at least 6 characters long.');\n    err.statusCode = 400;\n    throw err;\n  }\n\n  // --- Uniqueness check ---\n  const normalizedEmail = email.toLowerCase();\n  const existing = userStore.findByEmail(normalizedEmail);\n  if (existing) {\n    const err = new Error('Email already registered.');\n    err.statusCode = 409;\n    throw err;\n  }\n\n  // --- Persist ---\n  const hashedPassword = await bcrypt.hash(password, config.bcrypt.saltRounds);\n\n  const newUser = {\n    id: uuidv4(),\n    email: normalizedEmail,\n    password: hashedPassword,\n    createdAt: new Date().toISOString(),\n  };\n\n  userStore.save(newUser);\n\n  return { user: sanitize(newUser) };\n}\n\n/**\n * Authenticates a user and returns a JWT.\n *\n * @param {string} email\n * @param {string} password - Plain-text password to compare against the hash.\n * @returns {{ token: string, user: object }}\n * @throws {Error} If credentials are invalid.\n */\nasync function login(email, password) {\n  // --- Input validation ---\n  if (!email || !password) {\n    const err = new Error('Email and password are required.');\n    err.statusCode = 400;\n    throw err;\n  }\n\n  // --- Lookup ---\n  const user = userStore.findByEmail(email.toLowerCase());\n  if (!user) {\n    // Generic message to avoid user enumeration\n    const err = new Error('Invalid email or password.');\n    err.statusCode = 401;\n    throw err;\n  }\n\n  // --- Password check ---\n  const passwordMatch = await bcrypt.compare(password, user.password);\n  if (!passwordMatch) {\n    const err = new Error('Invalid email or password.');\n    err.statusCode = 401;\n    throw err;\n  }\n\n  // --- Issue token ---\n  const token = generateToken(user);\n\n  return { token, user: sanitize(user) };\n}\n\n/**\n * Retrieves the profile of an authenticated user by id.\n *\n * @param {string} userId\n * @returns {{ user: object }} Sanitized user.\n * @throws {Error} If the user is not found.\n */\nfunction getProfile(userId) {\n  const user = userStore.findById(userId);\n  if (!user) {\n    const err = new Error('User not found.');\n    err.statusCode = 404;\n    throw err;\n  }\n  return { user: sanitize(user) };\n}\n\nmodule.exports = { register, login, getProfile };\n"}}
</tool_call>
<tool_response>
null
</tool_response>

<tool_call>
{"name": "fs_write", "arguments": {"path": "/home/user/jwt-auth-api/src/middlewares/authMiddleware.js", "content": "/**\n * Authentication Middleware\n *\n * Validates the JWT sent in the Authorization header.\n * Expected header format: \"Authorization: Bearer <token>\"\n *\n * On success  → attaches the decoded payload to req.user and calls next().\n * On failure  → responds immediately with 401 Unauthorized.\n */\n\nconst jwt = require('jsonwebtoken');\nconst config = require('../config/env');\n\n/**\n * @param {import('express').Request}  req\n * @param {import('express').Response} res\n * @param {import('express').NextFunction} next\n */\nfunction authMiddleware(req, res, next) {\n  const authHeader = req.headers['authorization'];\n\n  if (!authHeader) {\n    return res.status(401).json({\n      success: false,\n      message: 'Authorization header is missing.',\n    });\n  }\n\n  // Header must follow the \"Bearer <token>\" scheme\n  const parts = authHeader.split(' ');\n  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {\n    return res.status(401).json({\n      success: false,\n      message: 'Authorization header format must be: Bearer <token>',\n    });\n  }\n\n  const token = parts[1];\n\n  try {\n    const decoded = jwt.verify(token, config.jwt.secret);\n    // Attach the decoded payload so downstream handlers can use it\n    req.user = decoded;\n    return next();\n  } catch (err) {\n    // Distinguish between an expired token and a completely invalid one\n    const message =\n      err.name === 'TokenExpiredError' ? 'Token has expired.' : 'Invalid token.';\n\n    return res.status(401).json({\n      success: false,\n      message,\n    });\n  }\n}\n\nmodule.exports = authMiddleware;\n"}}
</tool_call>
<tool_response>
null
</tool_response>

<tool_call>
{"name": "fs_write", "arguments": {"path": "/home/user/jwt-auth-api/src/middlewares/errorHandler.js", "content": "/**\n * Global Error Handler Middleware\n *\n * Must be registered LAST in the Express middleware chain.\n * Catches any error forwarded via next(err) and returns a\n * consistent JSON error response.\n */\n\n/**\n * @param {Error}  err\n * @param {import('express').Request}  req\n * @param {import('express').Response} res\n * @param {import('express').NextFunction} next  // must be declared even if unused\n */\n// eslint-disable-next-line no-unused-vars\nfunction errorHandler(err, req, res, next) {\n  // Use the status code attached to the error, or fall back to 500\n  const statusCode = err.statusCode || 500;\n\n  // Never leak internal stack traces to the client in production\n  const isProduction = process.env.NODE_ENV === 'production';\n\n  const response = {\n    success: false,\n    message: err.message || 'Internal Server Error',\n  };\n\n  if (!isProduction && err.stack) {\n    response.stack = err.stack;\n  }\n\n  return res.status(statusCode).json(response);\n}\n\nmodule.exports = errorHandler;\n"}}
</tool_call>
<tool_response>
null
</tool_response>

<tool_call>
{"name": "fs_write", "arguments": {"path": "/home/user/jwt-auth-api/src/controllers/authController.js", "content": "/**\n * Auth Controller\n *\n * Handles HTTP request/response concerns for authentication endpoints.\n * Delegates all business logic to authService.\n */\n\nconst authService = require('../services/authService');\n\n/**\n * POST /register\n *\n * Body: { email: string, password: string }\n *\n * Success  201 → { success: true, message, data: { user } }\n * Failure  4xx → forwarded to the global error handler\n */\nasync function register(req, res, next) {\n  try {\n    const { email, password } = req.body;\n    const result = await authService.register(email, password);\n\n    return res.status(201).json({\n      success: true,\n      message: 'User registered successfully.',\n      data: result,\n    });\n  } catch (err) {\n    return next(err);\n  }\n}\n\n/**\n * POST /login\n *\n * Body: { email: string, password: string }\n *\n * Success  200 → { success: true, message, data: { token, user } }\n * Failure  4xx → forwarded to the global error handler\n */\nasync function login(req, res, next) {\n  try {\n    const { email, password } = req.body;\n    const result = await authService.login(email, password);\n\n    return res.status(200).json({\n      success: true,\n      message: 'Login successful.',\n      data: result,\n    });\n  } catch (err) {\n    return next(err);\n  }\n}\n\n/**\n * GET /profile\n *\n * Requires a valid JWT (enforced by authMiddleware before this handler).\n * req.user is populated by the middleware with the decoded JWT payload.\n *\n * Success  200 → { success: true, message, data: { user } }\n * Failure  4xx → forwarded to the global error handler\n */\nfunction getProfile(req, res, next) {\n  try {\n    // req.user.sub contains the user id embedded in the token\n    const result = authService.getProfile(req.user.sub);\n\n    return res.status(200).json({\n      success: true,\n      message: 'Profile retrieved successfully.',\n      data: result,\n    });\n  } catch (err) {\n    return next(err);\n  }\n}\n\nmodule.exports = { register, login, getProfile };\n"}}
</tool_call>
<tool_response>
null
</tool_response>

<tool_call>
{"name": "fs_write", "arguments": {"path": "/home/user/jwt-auth-api/src/routes/authRoutes.js", "content": "/**\n * Auth Routes\n *\n * Maps HTTP verbs + paths to their controller handlers.\n * The /profile route is protected by the authMiddleware.\n */\n\nconst { Router } = require('express');\nconst authController = require('../controllers/authController');\nconst authMiddleware = require('../middlewares/authMiddleware');\n\nconst router = Router();\n\n// Public routes\nrouter.post('/register', authController.register);\nrouter.post('/login', authController.login);\n\n// Protected routes\nrouter.get('/profile', authMiddleware, authController.getProfile);\n\nmodule.exports = router;\n"}}
</tool_call>
<tool_response>
null
</tool_response>

<tool_call>
{"name": "fs_write", "arguments": {"path": "/home/user/jwt-auth-api/src/app.js", "content": "/**\n * Express Application Factory\n *\n * Creates and configures the Express app without starting the HTTP server.\n * Keeping the app creation separate from server startup makes testing easier.\n */\n\nconst express = require('express');\n\nconst authRoutes = require('./routes/authRoutes');\nconst errorHandler = require('./middlewares/errorHandler');\n\nconst app = express();\n\n// ---------------------------------------------------------------------------\n// Global Middleware\n// ---------------------------------------------------------------------------\n\n// Parse incoming JSON bodies\napp.use(express.json());\n\n// Parse URL-encoded bodies (e.g. HTML form submissions)\napp.use(express.urlencoded({ extended: true }));\n\n// ---------------------------------------------------------------------------\n// Health-check route\n// ---------------------------------------------------------------------------\napp.get('/health', (_req, res) => {\n  res.status(200).json({\n    success: true,\n    message: 'API is up and running.',\n    timestamp: new Date().toISOString(),\n  });\n});\n\n// ---------------------------------------------------------------------------\n// API Routes\n// ---------------------------------------------------------------------------\napp.use('/', authRoutes);\n\n// ---------------------------------------------------------------------------\n// 404 handler — must come AFTER all valid routes\n// ---------------------------------------------------------------------------\napp.use((_req, res) => {\n  res.status(404).json({\n    success: false,\n    message: 'Route not found.',\n  });\n});\n\n// ---------------------------------------------------------------------------\n// Global error handler — must be the LAST middleware registered\n// ---------------------------------------------------------------------------\napp.use(errorHandler);\n\nmodule.exports = app;\n"}}
</tool_call>
<tool_response>
null
</tool_response>

<tool_call>
{"name": "fs_write", "arguments": {"path": "/home/user/jwt-auth-api/src/server.js", "content": "/**\n * HTTP Server Entry Point\n *\n * Imports the configured Express app and starts listening on the\n * port defined in the environment configuration.\n */\n\nconst app = require('./app');\nconst config = require('./config/env');\n\nconst server = app.listen(config.port, () => {\n  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');\n  console.log('  🚀  JWT Auth API is running');\n  console.log(`  📡  http://localhost:${config.port}`);\n  console.log(`  🌍  Environment : ${process.env.NODE_ENV || 'development'}`);\n  console.log(`  🔑  JWT expires : ${config.jwt.expiresIn}`);\n  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');\n});\n\n// Graceful shutdown on SIGTERM / SIGINT\nfunction shutdown(signal) {\n  console.log(`\\n[server] Received ${signal}. Shutting down gracefully...`);\n  server.close(() => {\n    console.log('[server] HTTP server closed.');\n    process.exit(0);\n  });\n}\n\nprocess.on('SIGTERM', () => shutdown('SIGTERM'));\nprocess.on('SIGINT', () => shutdown('SIGINT'));\n\nmodule.exports = server;\n"}}
</tool_call>
<tool_response>
null
</tool_response>

<tool_call>
{"name": "fs_write", "arguments": {"path": "/home/user/jwt-auth-api/.env.example", "content": "# ─────────────────────────────────────────────────────────────────────────────\n# Environment Variables — copy this file to .env and adjust the values.\n# NEVER commit your real .env file to version control.\n# ─────────────────────────────────────────────────────────────────────────────\n\n# Port the HTTP server will listen on\nPORT=3000\n\n# Secret key used to sign JWT tokens.\n# Use a long, random string in production (e.g. output of: openssl rand -hex 64)\nJWT_SECRET=super-secret-jwt-key-change-in-production\n\n# How long a JWT remains valid (jsonwebtoken format: 60, \"2 days\", \"10h\", \"7d\")\nJWT_EXPIRES_IN=1h\n\n# bcrypt cost factor — higher = slower hash but more secure (10-12 is typical)\nBCRYPT_SALT_ROUNDS=10\n\n# Node environment: development | production | test\nNODE_ENV=development\n"}}
</tool_call>
<tool_response>
null
</tool_response>

<tool_call>
{"name": "fs_write", "arguments": {"path": "/home/user/jwt-auth-api/.gitignore", "content": "# Dependencies\nnode_modules/\n\n# Environment variables — never commit real secrets\n.env\n\n# Logs\nlogs/\n*.log\nnpm-debug.log*\n\n# OS files\n.DS_Store\nThumbs.db\n\n# Editor directories\n.vscode/\n.idea/\n"}}
</tool_call>
<tool_response>
null
</tool_response>

Agora vou criar o README completo e detalhado:
<tool_call>
{"name": "fs_write", "arguments": {"path": "/home/user/jwt-auth-api/README.md", "content": "# JWT Auth API\n\nA lightweight REST API built with **Node.js** and **Express** that demonstrates\nJWT-based authentication with in-memory persistence.\n\n---\n\n## Table of Contents\n\n- [Features](#features)\n- [Project Structure](#project-structure)\n- [Prerequisites](#prerequisites)\n- [Installation](#installation)\n- [Running the Server](#running-the-server)\n- [Environment Variables](#environment-variables)\n- [API Reference](#api-reference)\n  - [Health Check](#health-check)\n  - [POST /register](#post-register)\n  - [POST /login](#post-login)\n  - [GET /profile](#get-profile)\n- [Testing with cURL](#testing-with-curl)\n- [Testing with Postman / Insomnia](#testing-with-postman--insomnia)\n- [Architecture Decisions](#architecture-decisions)\n- [Security Notes](#security-notes)\n\n---\n\n## Features\n\n| Feature | Detail |\n|---|---|\n| User registration | Email + password (bcrypt hashed) |\n| JWT login | Returns a signed token valid for 1 h |\n| Protected route | `GET /profile` requires a valid Bearer token |\n| In-memory store | Plain JavaScript array — no database needed |\n| Layered architecture | `routes → controllers → services → models` |\n| Global error handler | Consistent JSON error responses |\n| Graceful shutdown | Handles `SIGTERM` / `SIGINT` |\n\n---\n\n## Project Structure\n\n```\njwt-auth-api/\n├── src/\n│   ├── config/\n│   │   └── env.js              # Centralised environment config\n│   ├── controllers/\n│   │   └── authController.js   # HTTP request/response handling\n│   ├── middlewares/\n│   │   ├── authMiddleware.js    # JWT validation\n│   │   └── errorHandler.js     # Global error handler\n│   ├── models/\n│   │   └── userStore.js        # In-memory user \"database\"\n│   ├── routes/\n│   │   └── authRoutes.js       # Route definitions\n│   ├── services/\n│   │   └── authService.js      # Business logic\n│   ├── app.js                  # Express app factory\n│   └── server.js               # HTTP server entry point\n├── .env.example                # Environment variable template\n├── .gitignore\n├── package.json\n└── README.md\n```\n\n### Layer Responsibilities\n\n```\nHTTP Request\n     │\n     ▼\n ┌─────────┐\n │  Route  │  Declares the path and HTTP verb; applies middleware.\n └────┬────┘\n      │\n      ▼\n ┌────────────┐\n │ Controller │  Reads req, calls the service, writes res / calls next(err).\n └─────┬──────┘\n       │\n       ▼\n ┌─────────┐\n │ Service │  Pure business logic — no knowledge of HTTP.\n └────┬────┘\n      │\n      ▼\n ┌───────────┐\n │   Model   │  Data access — the in-memory array lives here.\n └───────────┘\n```\n\n---\n\n## Prerequisites\n\n| Tool | Minimum version |\n|---|---|\n| [Node.js](https://nodejs.org/) | 18.x |\n| npm | 9.x (bundled with Node 18) |\n\nVerify your versions:\n\n```bash\nnode --version   # e.g. v20.11.0\nnpm --version    # e.g. 10.2.4\n```\n\n---\n\n## Installation\n\n```bash\n# 1. Clone (or download) the repository\ngit clone https://github.com/your-username/jwt-auth-api.git\ncd jwt-auth-api\n\n# 2. Install dependencies\nnpm install\n\n# 3. Create your local environment file\ncp .env.example .env\n# Edit .env and set a strong JWT_SECRET before going to production\n```\n\n---\n\n## Running the Server\n\n### Production mode\n\n```bash\nnpm start\n```\n\n### Development mode (auto-restart on file changes)\n\n```bash\nnpm run dev\n```\n\nExpected output:\n\n```\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n  🚀  JWT Auth API is running\n  📡  http://localhost:3000\n  🌍  Environment : development\n  🔑  JWT expires : 1h\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n```\n\n---\n\n## Environment Variables\n\nCopy `.env.example` to `.env` and adjust the values:\n\n| Variable | Default | Description |\n|---|---|---|\n| `PORT` | `3000` | Port the server listens on |\n| `JWT_SECRET` | `super-secret-jwt-key-change-in-production` | Secret used to sign tokens — **change this!** |\n| `JWT_EXPIRES_IN` | `1h` | Token lifetime (`60`, `\"2 days\"`, `\"10h\"`, `\"7d\"`) |\n| `BCRYPT_SALT_ROUNDS` | `10` | bcrypt cost factor |\n| `NODE_ENV` | `development` | `development` \\| `production` \\| `test` |\n\n---\n\n## API Reference\n\nAll responses follow this envelope:\n\n```jsonc\n// Success\n{ \"success\": true