# API Node.js com Express e Autenticação JWT

Vou criar uma API completa com cadastro, login e rota protegida.

## Estrutura do Projeto

```
api-auth/
├── src/
│   ├── controllers/
│   │   └── authController.js
│   ├── middleware/
│   │   └── authMiddleware.js
│   ├── routes/
│   │   └── authRoutes.js
│   ├── data/
│   │   └── store.js
│   └── app.js
├── .env.example
├── package.json
└── README.md
```

## Arquivos

**`package.json`**
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

**`.env.example`**
```env
PORT=3000
JWT_SECRET=troque_por_um_segredo_forte_aqui
JWT_EXPIRES_IN=1h
```

**`src/data/store.js`**
```js
// Simula um banco de dados em memória
const store = {
  users: [],
  nextId: 1,
};

module.exports = store;
```

**`src/middleware/authMiddleware.js`**
```js
const jwt = require("jsonwebtoken");

// Middleware que valida o token JWT no header Authorization
function authMiddleware(req, res, next) {
  const authHeader = req.headers["authorization"];

  // O header deve vir no formato: "Bearer <token>"
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "Token não fornecido. Use o header: Authorization: Bearer <token>",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Injeta os dados do usuário decodificado na requisição
    req.user = decoded;
    next();
  } catch (err) {
    const message =
      err.name === "TokenExpiredError" ? "Token expirado." : "Token inválido.";

    return res.status(401).json({ error: message });
  }
}

module.exports = authMiddleware;
```

**`src/controllers/authController.js`**
```js
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const store = require("../data/store");

// POST /auth/register
async function register(req, res) {
  const { name, email, password } = req.body;

  // Validação básica dos campos
  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ error: "Os campos name, email e password são obrigatórios." });
  }

  if (password.length < 6) {
    return res
      .status(400)
      .json({ error: "A senha deve ter pelo menos 6 caracteres." });
  }

  // Verifica se o e-mail já está cadastrado
  const emailAlreadyExists = store.users.some((user) => user.email === email);
  if (emailAlreadyExists) {
    return res.status(409).json({ error: "E-mail já cadastrado." });
  }

  // Gera o hash da senha antes de salvar
  const passwordHash = await bcrypt.hash(password, 10);

  const newUser = {
    id: store.nextId++,
    name,
    email,
    passwordHash,
    createdAt: new Date().toISOString(),
  };

  store.users.push(newUser);

  // Retorna o usuário sem expor o hash da senha
  return res.status(201).json({
    message: "Usuário cadastrado com sucesso.",
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      createdAt: newUser.createdAt,
    },
  });
}

// POST /auth/login
async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ error: "Os campos email e password são obrigatórios." });
  }

  // Busca o usuário pelo e-mail
  const user = store.users.find((u) => u.email === email);
  if (!user) {
    // Mensagem genérica para não revelar se o e-mail existe ou não
    return res.status(401).json({ error: "E-mail ou senha inválidos." });
  }

  // Compara a senha enviada com o hash armazenado
  const passwordMatch = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatch) {
    return res.status(401).json({ error: "E-mail ou senha inválidos." });
  }

  // Gera o token JWT com os dados públicos do usuário no payload
  const token = jwt.sign(
    { id: user.id, name: user.name, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );

  return res.status(200).json({
    message: "Login realizado com sucesso.",
    token,
  });
}

// GET /auth/me  (rota protegida)
function me(req, res) {
  // req.user foi injetado pelo authMiddleware após validar o token
  const user = store.users.find((u) => u.id === req.user.id);

  if (!user) {
    return res.status(404).json({ error: "Usuário não encontrado." });
  }

  return res.status(200).json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    },
  });
}

// GET /users  (rota protegida - lista todos os usuários)
function listUsers(req, res) {
  const users = store.users.map(({ id, name, email, createdAt }) => ({
    id,
    name,
    email,
    createdAt,
  }));

  return res.status(200).json({ total: users.length, users });
}

module.exports = { register, login, me, listUsers };
```

**`src/routes/authRoutes.js`**
```js
const { Router } = require("express");
const { register, login, me, listUsers } = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");

const router = Router();

// Rotas públicas
router.post("/auth/register", register);
router.post("/auth/login", login);

// Rotas protegidas — o authMiddleware valida o token antes de chamar o controller
router.get("/auth/me", authMiddleware, me);
router.get("/users", authMiddleware, listUsers);

module.exports = router;
```

**`src/app.js`**
```js
require("dotenv").config();
const express = require("express");
const authRoutes = require("./routes/authRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

// Faz o Express interpretar o body das requisições como JSON
app.use(express.json());

// Rota de health check
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "API no ar!" });
});

// Registra todas as rotas de autenticação
app.use(authRoutes);

// Handler global para rotas não encontradas
app.use((req, res) => {
  res.status(404).json({ error: `Rota ${req.method} ${req.path} não encontrada.` });
});

// Handler global de erros inesperados
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Erro interno do servidor." });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
  console.log("Rotas disponíveis:");
  console.log("  POST /auth/register");
  console.log("  POST /auth/login");
  console.log("  GET  /auth/me   [protegida]");
  console.log("  GET  /users     [protegida]");
});
```

**`README.md`**
```markdown
# API Auth — Node.js + Express + JWT

API REST com cadastro de usuários, login e rotas protegidas por JWT.  
Os dados ficam em memória (array JS) e são perdidos ao reiniciar o servidor.

---

## Pré-requisitos

- [Node.js](https://nodejs.org/) v18 ou superior

---

## Como rodar

### 1. Instale as dependências
npm install

### 2. Configure as variáveis de ambiente
Copie o arquivo de exemplo e edite se quiser:
cp .env.example .env

### 3. Inicie o servidor

# Produção
npm start

# Desenvolvimento (reinicia ao salvar)
npm run dev

O servidor sobe em: http://localhost:3000

---

## Rotas

| Método | Rota            | Autenticação | Descrição                        |
|--------|-----------------|:------------:|----------------------------------|
| GET    | /               | Não          | Health check                     |
| POST   | /auth/register  | Não          | Cadastra um novo usuário         |
| POST   | /auth/login     | Não          | Faz login e retorna o JWT        |
| GET    | /auth/me        | **Sim**      | Retorna dados do usuário logado  |
| GET    | /users          | **Sim**      | Lista todos os usuários          |

---

## Exemplos de uso (curl)

### Cadastrar usuário
curl -s -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Maria","email":"maria@email.com","password":"123456"}'

### Fazer login
curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"maria@email.com","password":"123456"}'

### Acessar rota protegida (substitua <TOKEN> pelo token retornado no login)
curl -s http://localhost:3000/auth/me \
  -H "Authorization: Bearer <TOKEN>"

### Listar usuários (rota protegida)
curl -s http://localhost:3000/users \
  -H "Authorization: Bearer <TOKEN>"
```

---

## Como funciona o fluxo

```
┌─────────┐     POST /register      ┌─────────────┐
│ Cliente │ ──────────────────────► │   API       │
│         │                         │             │
│         │     POST /login         │  Valida     │
│         │ ──────────────────────► │  credenciais│
│         │ ◄── { token: "..." } ── │  → JWT      │
│         │                         │             │
│         │  GET /auth/me           │  authMiddle-│
│         │  Authorization: Bearer  │  ware valida│
│         │  <token> ─────────────► │  o token    │
│         │ ◄── dados do usuário ── │             │
└─────────┘                         └─────────────┘
```

1. **`/register`** — valida os campos, faz hash da senha com `bcryptjs` e salva no array em memória
2. **`/login`** — compara a senha com o hash e, se válida, assina um JWT com `jsonwebtoken`
3. **`authMiddleware`** — intercepta rotas protegidas, verifica e decodifica o token antes de chamar o controller
4. **`/auth/me` e `/users`** — só acessíveis com token válido no header `Authorization`