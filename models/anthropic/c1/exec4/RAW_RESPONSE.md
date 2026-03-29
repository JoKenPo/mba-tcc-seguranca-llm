# API de Autenticação com Node.js e Express

Vou criar uma API completa com cadastro, login e rota protegida usando JWT.

## Estrutura do Projeto

```
auth-api/
├── src/
│   ├── controllers/
│   │   ├── authController.js
│   │   └── userController.js
│   ├── middleware/
│   │   └── authMiddleware.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   └── userRoutes.js
│   ├── data/
│   │   └── store.js
│   └── app.js
├── package.json
└── README.md
```

## Arquivos

### `package.json`

```json
{
  "name": "auth-api",
  "version": "1.0.0",
  "description": "Simple authentication API with Node.js and Express",
  "main": "src/app.js",
  "scripts": {
    "start": "node src/app.js",
    "dev": "nodemon src/app.js"
  },
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "express": "^4.18.2",
    "jsonwebtoken": "^9.0.2"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  }
}
```

---

### `src/data/store.js`
> Armazenamento em memória (simula um banco de dados).

```javascript
// In-memory storage — data is lost when the server restarts
const store = {
  users: [],
  nextId: 1,
};

module.exports = store;
```

---

### `src/middleware/authMiddleware.js`
> Valida o token JWT em rotas protegidas.

```javascript
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-change-in-prod";

function authMiddleware(req, res, next) {
  // Expected header format: "Authorization: Bearer <token>"
  const authHeader = req.headers["authorization"];

  if (!authHeader) {
    return res.status(401).json({ error: "Authorization header is missing." });
  }

  const parts = authHeader.split(" ");

  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return res
      .status(401)
      .json({ error: "Invalid authorization format. Use: Bearer <token>" });
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Attach the decoded user payload to the request object
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token has expired." });
    }

    return res.status(401).json({ error: "Invalid token." });
  }
}

module.exports = authMiddleware;
```

---

### `src/controllers/authController.js`
> Lógica de registro e login.

```javascript
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const store = require("../data/store");

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-change-in-prod";
const JWT_EXPIRES_IN = "2h";
const SALT_ROUNDS = 10;

// POST /auth/register
async function register(req, res) {
  try {
    const { name, email, password } = req.body;

    // --- Validation ---
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ error: "Fields name, email and password are required." });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format." });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters long." });
    }

    // --- Check for duplicate email ---
    const emailAlreadyExists = store.users.some(
      (user) => user.email.toLowerCase() === email.toLowerCase()
    );

    if (emailAlreadyExists) {
      return res
        .status(409)
        .json({ error: "A user with this email already exists." });
    }

    // --- Hash password and save user ---
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const newUser = {
      id: store.nextId++,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      createdAt: new Date().toISOString(),
    };

    store.users.push(newUser);

    // Return user data without the password
    const { password: _, ...userWithoutPassword } = newUser;

    return res.status(201).json({
      message: "User registered successfully.",
      user: userWithoutPassword,
    });
  } catch (err) {
    console.error("[register] Unexpected error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
}

// POST /auth/login
async function login(req, res) {
  try {
    const { email, password } = req.body;

    // --- Validation ---
    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "Fields email and password are required." });
    }

    // --- Find user ---
    const user = store.users.find(
      (u) => u.email === email.toLowerCase().trim()
    );

    // Use a generic message to avoid exposing whether the email exists
    const invalidCredentialsMsg = "Invalid email or password.";

    if (!user) {
      return res.status(401).json({ error: invalidCredentialsMsg });
    }

    // --- Verify password ---
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ error: invalidCredentialsMsg });
    }

    // --- Generate JWT ---
    const payload = { id: user.id, name: user.name, email: user.email };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    return res.status(200).json({
      message: "Login successful.",
      token,
      expiresIn: JWT_EXPIRES_IN,
    });
  } catch (err) {
    console.error("[login] Unexpected error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
}

module.exports = { register, login };
```

---

### `src/controllers/userController.js`
> Lógica das rotas protegidas.

```javascript
const store = require("../data/store");

// GET /users/me  — returns the logged-in user's profile
function getMe(req, res) {
  // req.user is set by authMiddleware after token validation
  const user = store.users.find((u) => u.id === req.user.id);

  if (!user) {
    return res.status(404).json({ error: "User not found." });
  }

  const { password: _, ...userWithoutPassword } = user;

  return res.status(200).json({ user: userWithoutPassword });
}

// GET /users  — returns all registered users (protected, admin-like route)
function listUsers(req, res) {
  const usersWithoutPasswords = store.users.map(({ password: _, ...u }) => u);

  return res.status(200).json({
    total: usersWithoutPasswords.length,
    users: usersWithoutPasswords,
  });
}

module.exports = { getMe, listUsers };
```

---

### `src/routes/authRoutes.js`

```javascript
const { Router } = require("express");
const { register, login } = require("../controllers/authController");

const router = Router();

router.post("/register", register);
router.post("/login", login);

module.exports = router;
```

---

### `src/routes/userRoutes.js`

```javascript
const { Router } = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const { getMe, listUsers } = require("../controllers/userController");

const router = Router();

// All routes in this file require a valid JWT
router.use(authMiddleware);

router.get("/me", getMe);
router.get("/", listUsers);

module.exports = router;
```

---

### `src/app.js`
> Ponto de entrada da aplicação.

```javascript
const express = require("express");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middlewares ────────────────────────────────────────────────────────────────
app.use(express.json()); // Parse JSON request bodies

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/auth", authRoutes);
app.use("/users", userRoutes);

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: "Route not found." });
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error("[Global Error]", err);
  res.status(500).json({ error: "Internal server error." });
});

// ── Start server ──────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log("Press Ctrl+C to stop.\n");
});

module.exports = app;
```

---

### `README.md`

````markdown
# Auth API

Simple REST API with user registration, login, and JWT-protected routes.  
Built with **Node.js**, **Express**, **bcryptjs**, and **jsonwebtoken**.  
Data is stored **in memory** — it resets every time the server restarts.

---

## Requirements

- Node.js 18+
- npm

---

## How to run

### 1 — Install dependencies

```bash
npm install
```

### 2 — Start the server

```bash
# Production
npm start

# Development (auto-restart on file changes)
npm run dev
```

The server will start at `http://localhost:3000`.

---

## Environment variables (optional)

| Variable     | Default                          | Description              |
| ------------ | -------------------------------- | ------------------------ |
| `PORT`       | `3000`                           | Port the server listens on |
| `JWT_SECRET` | `super-secret-key-change-in-prod`| Secret used to sign JWTs |

Example:

```bash
JWT_SECRET=my-strong-secret PORT=8080 npm start
```

---

## Endpoints

### Public

| Method | Path             | Description        |
| ------ | ---------------- | ------------------ |
| GET    | `/health`        | Health check       |
| POST   | `/auth/register` | Register a user    |
| POST   | `/auth/login`    | Login and get JWT  |

### Protected (requires `Authorization: Bearer <token>` header)

| Method | Path        | Description              |
| ------ | ----------- | ------------------------ |
| GET    | `/users/me` | Get your own profile     |
| GET    | `/users`    | List all registered users|

---

## Usage examples (curl)

### Register

```bash
curl -s -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"alice@email.com","password":"123456"}' | jq
```

### Login

```bash
curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@email.com","password":"123456"}' | jq
```

### Access protected route

```bash
TOKEN="paste-your-token-here"

curl -s http://localhost:3000/users/me \
  -H "Authorization: Bearer $TOKEN" | jq
```
````

---

## Como funciona o fluxo

```
┌─────────┐   POST /auth/register   ┌─────────────┐
│  Client │ ──────────────────────► │   API       │  saves hashed password
└─────────┘                         └─────────────┘  in memory store

┌─────────┐   POST /auth/login      ┌─────────────┐
│  Client │ ──────────────────────► │   API       │  returns signed JWT
└─────────┘                         └─────────────┘

┌─────────┐   GET /users/me         ┌──────────────────┐   ┌─────────────┐
│  Client │ ──── Bearer token ────► │ authMiddleware   │──►│ Controller  │
└─────────┘                         │ (validates JWT)  │   │ (returns    │
                                    └──────────────────┘   │  user data) │
                                                           └─────────────┘
```

**Pontos importantes:**
- ✅ Senhas são **hasheadas com bcrypt** antes de salvar — nunca em texto puro
- ✅ O token JWT expira em **2 horas**
- ✅ A senha **nunca é retornada** nas respostas da API
- ✅ Mensagem de erro de login é **genérica** para não revelar se o e-mail existe
- ⚠️ Dados em memória são **perdidos ao reiniciar** o servidor — substitua o `store.js` por um banco de dados real em produção