# API de Autenticação com Node.js e Express

Vou criar uma API completa com cadastro, login e rota protegida usando JWT.

## Estrutura do Projeto

```
auth-api/
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
├── package.json
└── README.md
```

## Arquivos

### `package.json`

```json
{
  "name": "auth-api",
  "version": "1.0.0",
  "description": "API de autenticação simples com Node.js e Express",
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
// Simula um banco de dados em memória
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

const JWT_SECRET = "minha_chave_secreta_super_segura";

// Middleware que verifica se o token JWT é válido
function authMiddleware(req, res, next) {
  // O token deve vir no header Authorization: Bearer <token>
  const authHeader = req.headers["authorization"];

  if (!authHeader) {
    return res.status(401).json({ error: "Token não fornecido." });
  }

  // Separa o "Bearer" do token em si
  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res
      .status(401)
      .json({ error: "Formato do token inválido. Use: Bearer <token>" });
  }

  try {
    // Verifica e decodifica o token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Adiciona os dados do usuário na requisição para uso posterior
    req.user = decoded;

    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expirado." });
    }
    return res.status(401).json({ error: "Token inválido." });
  }
}

module.exports = { authMiddleware, JWT_SECRET };
```

---

### `src/controllers/authController.js`
> Lógica de negócio: cadastro, login e perfil.

```javascript
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const store = require("../data/store");
const { JWT_SECRET } = require("../middleware/authMiddleware");

// POST /register
// Cadastra um novo usuário
async function register(req, res) {
  try {
    const { name, email, password } = req.body;

    // Validação dos campos obrigatórios
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ error: "Nome, e-mail e senha são obrigatórios." });
    }

    // Validação básica de formato de e-mail
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Formato de e-mail inválido." });
    }

    // Validação de senha mínima
    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: "A senha deve ter pelo menos 6 caracteres." });
    }

    // Verifica se o e-mail já está cadastrado
    const existingUser = store.users.find((u) => u.email === email);
    if (existingUser) {
      return res.status(409).json({ error: "E-mail já cadastrado." });
    }

    // Criptografa a senha antes de salvar (nunca salve senha em texto puro!)
    const hashedPassword = await bcrypt.hash(password, 10);

    // Cria o novo usuário
    const newUser = {
      id: store.nextId++,
      name,
      email,
      password: hashedPassword,
      createdAt: new Date().toISOString(),
    };

    store.users.push(newUser);

    // Retorna os dados sem a senha
    const { password: _, ...userWithoutPassword } = newUser;

    return res.status(201).json({
      message: "Usuário cadastrado com sucesso!",
      user: userWithoutPassword,
    });
  } catch (err) {
    return res.status(500).json({ error: "Erro interno do servidor." });
  }
}

// POST /login
// Autentica o usuário e retorna um token JWT
async function login(req, res) {
  try {
    const { email, password } = req.body;

    // Validação dos campos obrigatórios
    if (!email || !password) {
      return res.status(400).json({ error: "E-mail e senha são obrigatórios." });
    }

    // Busca o usuário pelo e-mail
    const user = store.users.find((u) => u.email === email);
    if (!user) {
      // Mensagem genérica para não revelar se o e-mail existe ou não
      return res.status(401).json({ error: "Credenciais inválidas." });
    }

    // Compara a senha enviada com o hash salvo
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: "Credenciais inválidas." });
    }

    // Gera o token JWT com os dados do usuário (expira em 1 hora)
    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.status(200).json({
      message: "Login realizado com sucesso!",
      token,
    });
  } catch (err) {
    return res.status(500).json({ error: "Erro interno do servidor." });
  }
}

// GET /profile
// Rota protegida — retorna os dados do usuário autenticado
function profile(req, res) {
  // req.user foi preenchido pelo authMiddleware
  const user = store.users.find((u) => u.id === req.user.id);

  if (!user) {
    return res.status(404).json({ error: "Usuário não encontrado." });
  }

  const { password: _, ...userWithoutPassword } = user;

  return res.status(200).json({
    message: "Acesso autorizado!",
    user: userWithoutPassword,
  });
}

// GET /users  (bônus)
// Rota protegida — lista todos os usuários cadastrados
function listUsers(req, res) {
  const usersWithoutPasswords = store.users.map(({ password: _, ...u }) => u);

  return res.status(200).json({
    total: usersWithoutPasswords.length,
    users: usersWithoutPasswords,
  });
}

module.exports = { register, login, profile, listUsers };
```

---

### `src/routes/authRoutes.js`
> Define as rotas públicas e protegidas.

```javascript
const { Router } = require("express");
const {
  register,
  login,
  profile,
  listUsers,
} = require("../controllers/authController");
const { authMiddleware } = require("../middleware/authMiddleware");

const router = Router();

// ── Rotas públicas ──────────────────────────────────────────
router.post("/register", register);
router.post("/login", login);

// ── Rotas protegidas (exigem token JWT válido) ───────────────
router.get("/profile", authMiddleware, profile);
router.get("/users", authMiddleware, listUsers);

module.exports = router;
```

---

### `src/app.js`
> Ponto de entrada da aplicação.

```javascript
const express = require("express");
const authRoutes = require("./routes/authRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middlewares globais ──────────────────────────────────────
app.use(express.json()); // Faz o parse do body em JSON

// ── Rota de health check ─────────────────────────────────────
app.get("/", (req, res) => {
  res.json({
    status: "online",
    message: "API de autenticação funcionando!",
    endpoints: {
      public: ["POST /register", "POST /login"],
      protected: ["GET /profile", "GET /users"],
    },
  });
});

// ── Rotas da aplicação ───────────────────────────────────────
app.use(authRoutes);

// ── Rota 404 para caminhos não encontrados ───────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Rota '${req.path}' não encontrada.` });
});

// ── Inicia o servidor ────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 Servidor rodando em http://localhost:${PORT}`);
  console.log("─────────────────────────────────────────");
  console.log("Endpoints disponíveis:");
  console.log(`  POST http://localhost:${PORT}/register`);
  console.log(`  POST http://localhost:${PORT}/login`);
  console.log(`  GET  http://localhost:${PORT}/profile  (protegida)`);
  console.log(`  GET  http://localhost:${PORT}/users    (protegida)`);
  console.log("─────────────────────────────────────────\n");
});
```

---

### `README.md`

````markdown
# 🔐 Auth API

API REST simples de autenticação com Node.js, Express e JWT.

## Tecnologias

- **Express** — framework web
- **jsonwebtoken** — geração e validação de tokens JWT
- **bcryptjs** — hash seguro de senhas

## Como rodar

### 1. Instale as dependências

```bash
npm install
```

### 2. Inicie o servidor

```bash
# Produção
npm start

# Desenvolvimento (com hot-reload)
npm run dev
```

O servidor sobe em `http://localhost:3000`.

---

## Endpoints

### `POST /register` — Cadastrar usuário

**Body:**
```json
{
  "name": "João Silva",
  "email": "joao@email.com",
  "password": "123456"
}
```

**Resposta (201):**
```json
{
  "message": "Usuário cadastrado com sucesso!",
  "user": { "id": 1, "name": "João Silva", "email": "joao@email.com", "createdAt": "..." }
}
```

---

### `POST /login` — Fazer login

**Body:**
```json
{
  "email": "joao@email.com",
  "password": "123456"
}
```

**Resposta (200):**
```json
{
  "message": "Login realizado com sucesso!",
  "token": "<jwt_token>"
}
```

---

### `GET /profile` — Perfil do usuário autenticado 🔒

**Header obrigatório:**
```
Authorization: Bearer <token>
```

**Resposta (200):**
```json
{
  "message": "Acesso autorizado!",
  "user": { "id": 1, "name": "João Silva", "email": "joao@email.com" }
}
```

---

### `GET /users` — Listar todos os usuários 🔒

**Header obrigatório:**
```
Authorization: Bearer <token>
```

**Resposta (200):**
```json
{
  "total": 1,
  "users": [{ "id": 1, "name": "João Silva", "email": "joao@email.com" }]
}
```

---

## Testando com curl

```bash
# 1. Cadastrar
curl -X POST http://localhost:3000/register \
  -H "Content-Type: application/json" \
  -d '{"name":"João","email":"joao@email.com","password":"123456"}'

# 2. Login (copie o token retornado)
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{"email":"joao@email.com","password":"123456"}'

# 3. Acessar rota protegida
curl http://localhost:3000/profile \
  -H "Authorization: Bearer <cole_o_token_aqui>"
```

> ⚠️ Os dados são armazenados em memória e são perdidos ao reiniciar o servidor.
````

---

## Fluxo da Aplicação

```
Cliente                     API
  │                          │
  ├─ POST /register ────────►│ Valida dados
  │                          │ Hash da senha (bcrypt)
  │◄── 201 + dados ──────────┤ Salva no array
  │                          │
  ├─ POST /login ───────────►│ Busca usuário
  │                          │ Compara senha
  │◄── 200 + JWT token ──────┤ Gera token (1h)
  │                          │
  ├─ GET /profile ──────────►│ authMiddleware
  │  Authorization: Bearer   │ Verifica token JWT
  │                          │ Decodifica payload
  │◄── 200 + perfil ─────────┤ Retorna dados
```

## Pontos importantes de segurança

| Prática | Implementação |
|---|---|
| Senha nunca salva em texto puro | `bcrypt.hash()` com salt 10 |
| Token com expiração | JWT expira em `1h` |
| Mensagem genérica no login | Não revela se e-mail existe |
| Senha nunca retornada | Removida de todas as respostas |
| Token no header `Authorization` | Padrão Bearer Token |