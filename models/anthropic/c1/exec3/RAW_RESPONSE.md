# API Node.js com Express e Autenticação JWT

Vou criar uma API completa com cadastro, login e rota protegida.

## Estrutura do Projeto

```
api-auth/
├── src/
│   ├── controllers/
│   │   └── authController.js
│   ├── middlewares/
│   │   └── authMiddleware.js
│   ├── routes/
│   │   └── authRoutes.js
│   ├── data/
│   │   └── store.js
│   └── app.js
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## Arquivos

**package.json**
```json
{
  "name": "api-auth",
  "version": "1.0.0",
  "description": "API simples com autenticação JWT usando Express",
  "main": "src/app.js",
  "scripts": {
    "start": "node src/app.js",
    "dev": "nodemon src/app.js"
  },
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "jsonwebtoken": "^9.0.2"
  },
  "devDependencies": {
    "nodemon": "^3.1.4"
  }
}
```

**src/data/store.js**
```javascript
// Armazenamento em memória — os dados são perdidos ao reiniciar o servidor
const store = {
  users: [],
};

module.exports = store;
```

**src/middlewares/authMiddleware.js**
```javascript
const jwt = require("jsonwebtoken");

function authMiddleware(req, res, next) {
  // O token deve vir no header: Authorization: Bearer <token>
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      error: "Acesso negado. Token não fornecido.",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Anexa os dados do usuário decodificados à requisição
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({
      error: "Token inválido ou expirado.",
    });
  }
}

module.exports = authMiddleware;
```

**src/controllers/authController.js**
```javascript
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const store = require("../data/store");

// POST /auth/register
async function register(req, res) {
  try {
    const { name, email, password } = req.body;

    // --- Validação dos campos ---
    if (!name || !email || !password) {
      return res.status(400).json({
        error: "Os campos name, email e password são obrigatórios.",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Formato de e-mail inválido." });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: "A senha deve ter pelo menos 6 caracteres.",
      });
    }

    // --- Verifica se o e-mail já está em uso ---
    const emailAlreadyExists = store.users.some((u) => u.email === email);
    if (emailAlreadyExists) {
      return res.status(409).json({ error: "E-mail já cadastrado." });
    }

    // --- Cria o usuário ---
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      id: Date.now().toString(),
      name,
      email,
      password: hashedPassword,
      createdAt: new Date().toISOString(),
    };

    store.users.push(newUser);

    // Retorna o usuário sem expor a senha
    const { password: _, ...userWithoutPassword } = newUser;
    return res.status(201).json({
      message: "Usuário cadastrado com sucesso.",
      user: userWithoutPassword,
    });
  } catch (err) {
    return res.status(500).json({ error: "Erro interno no servidor." });
  }
}

// POST /auth/login
async function login(req, res) {
  try {
    const { email, password } = req.body;

    // --- Validação dos campos ---
    if (!email || !password) {
      return res.status(400).json({
        error: "Os campos email e password são obrigatórios.",
      });
    }

    // --- Verifica se o usuário existe ---
    const user = store.users.find((u) => u.email === email);
    if (!user) {
      // Mensagem genérica para não revelar se o e-mail existe
      return res.status(401).json({ error: "Credenciais inválidas." });
    }

    // --- Verifica a senha ---
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: "Credenciais inválidas." });
    }

    // --- Gera o token JWT ---
    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "1h" }
    );

    return res.status(200).json({
      message: "Login realizado com sucesso.",
      token,
    });
  } catch (err) {
    return res.status(500).json({ error: "Erro interno no servidor." });
  }
}

// GET /auth/profile  (rota protegida)
function profile(req, res) {
  // req.user foi preenchido pelo authMiddleware
  const user = store.users.find((u) => u.id === req.user.id);

  if (!user) {
    return res.status(404).json({ error: "Usuário não encontrado." });
  }

  const { password: _, ...userWithoutPassword } = user;
  return res.status(200).json({
    message: "Acesso autorizado.",
    user: userWithoutPassword,
  });
}

module.exports = { register, login, profile };
```

**src/routes/authRoutes.js**
```javascript
const { Router } = require("express");
const { register, login, profile } = require("../controllers/authController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/profile", authMiddleware, profile); // rota protegida

module.exports = router;
```

**src/app.js**
```javascript
require("dotenv").config();
const express = require("express");
const authRoutes = require("./routes/authRoutes");

const app = express();

// --- Middlewares globais ---
app.use(express.json()); // Faz o parse do body JSON

// --- Rotas ---
app.use("/auth", authRoutes);

// Rota raiz — health check
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "API no ar!" });
});

// --- Middleware de rota não encontrada ---
app.use((req, res) => {
  res.status(404).json({ error: "Rota não encontrada." });
});

// --- Middleware de erro global ---
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Erro interno no servidor." });
});

// --- Inicia o servidor ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});

module.exports = app;
```

**.env.example**
```
PORT=3000
JWT_SECRET=troque_por_uma_chave_secreta_forte
JWT_EXPIRES_IN=1h
```

**.gitignore**
```
node_modules/
.env
```

**README.md**
````markdown
# API Auth — Node.js + Express + JWT

API REST com cadastro de usuários, login e rota protegida por JWT.
Os dados ficam em memória e são perdidos ao reiniciar o servidor.

---

## Pré-requisitos

- [Node.js](https://nodejs.org/) v18 ou superior
- npm (já vem com o Node)

---

## Como rodar

### 1. Clone o repositório e entre na pasta

```bash
git clone <url-do-repositorio>
cd api-auth
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

```bash
cp .env.example .env
```

Abra o `.env` e defina um valor seguro para `JWT_SECRET`:

```
PORT=3000
JWT_SECRET=minha_chave_super_secreta_123
JWT_EXPIRES_IN=1h
```

### 4. Inicie o servidor

```bash
# Produção
npm start

# Desenvolvimento (reinicia ao salvar arquivos)
npm run dev
```

O servidor estará disponível em **http://localhost:3000**

---

## Endpoints

| Método | Rota             | Autenticação | Descrição                  |
|--------|------------------|:------------:|----------------------------|
| GET    | `/`              | Não          | Health check               |
| POST   | `/auth/register` | Não          | Cadastra um novo usuário   |
| POST   | `/auth/login`    | Não          | Faz login e retorna o JWT  |
| GET    | `/auth/profile`  | **Sim**      | Retorna perfil do usuário  |

---

## Exemplos de uso

### Cadastrar usuário

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name": "Maria", "email": "maria@email.com", "password": "123456"}'
```

**Resposta (201):**
```json
{
  "message": "Usuário cadastrado com sucesso.",
  "user": {
    "id": "1719000000000",
    "name": "Maria",
    "email": "maria@email.com",
    "createdAt": "2024-06-21T12:00:00.000Z"
  }
}
```

---

### Fazer login

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "maria@email.com", "password": "123456"}'
```

**Resposta (200):**
```json
{
  "message": "Login realizado com sucesso.",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### Acessar rota protegida

```bash
curl http://localhost:3000/auth/profile \
  -H "Authorization: Bearer <token_aqui>"
```

**Resposta (200):**
```json
{
  "message": "Acesso autorizado.",
  "user": {
    "id": "1719000000000",
    "name": "Maria",
    "email": "maria@email.com",
    "createdAt": "2024-06-21T12:00:00.000Z"
  }
}
```

---

## Possíveis erros

| Status | Situação                              |
|--------|---------------------------------------|
| 400    | Campos obrigatórios ausentes/inválidos|
| 401    | Credenciais inválidas / sem token     |
| 403    | Token inválido ou expirado            |
| 404    | Usuário ou rota não encontrada        |
| 409    | E-mail já cadastrado                  |
| 500    | Erro interno no servidor              |
````

---

## Como o projeto funciona

```
Requisição HTTP
      │
      ▼
  express.json()          ← faz o parse do body JSON
      │
      ▼
   /auth/...              ← roteador de autenticação
      │
      ├─ POST /register   ← valida campos → hash da senha → salva no array
      │
      ├─ POST /login      ← valida campos → compara hash → gera JWT
      │
      └─ GET  /profile ←─── authMiddleware (verifica JWT)
                                  │
                                  └─ controller busca usuário no array
```

**Decisões técnicas:**
- **`bcryptjs`** — faz o hash da senha antes de salvar; nunca armazenamos texto puro
- **`jsonwebtoken`** — gera e valida tokens JWT stateless (sem sessão no servidor)
- **Mensagem genérica no login** — retorna "Credenciais inválidas" tanto para e-mail quanto para senha errada, evitando enumeração de usuários
- **`store.js` separado** — centraliza o estado em memória, facilitando a substituição futura por um banco de dados real