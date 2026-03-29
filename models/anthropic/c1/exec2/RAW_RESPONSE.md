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
│   ├── services/
│   │   └── userService.js
│   └── app.js
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## Arquivos

### `package.json`

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

### `src/app.js`

```javascript
require("dotenv").config();
const express = require("express");
const authRoutes = require("./routes/authRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Middlewares Globais ───────────────────────────────────────────────────────
app.use(express.json());

// ─── Rotas ────────────────────────────────────────────────────────────────────
app.use("/api", authRoutes);

// ─── Rota raiz ────────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({
    message: "API de autenticação rodando!",
    endpoints: {
      register: "POST /api/register",
      login: "POST /api/login",
      profile: "GET /api/profile (requer token)",
      users: "GET /api/users (requer token)",
    },
  });
});

// ─── Handler de rotas não encontradas ─────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: "Rota não encontrada" });
});

// ─── Handler de erros globais ─────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Erro interno do servidor" });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});

module.exports = app;
```

### `src/services/userService.js`

```javascript
const bcrypt = require("bcryptjs");

// ─── "Banco de dados" em memória ──────────────────────────────────────────────
const users = [];
let nextId = 1;

// ─── Busca usuário pelo e-mail ─────────────────────────────────────────────────
const findByEmail = (email) => {
  return users.find((user) => user.email === email.toLowerCase().trim());
};

// ─── Busca usuário pelo ID ─────────────────────────────────────────────────────
const findById = (id) => {
  return users.find((user) => user.id === id);
};

// ─── Cria um novo usuário ──────────────────────────────────────────────────────
const createUser = async ({ name, email, password }) => {
  const SALT_ROUNDS = 10;
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  const newUser = {
    id: nextId++,
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password: hashedPassword,
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);

  // Retorna o usuário sem a senha
  const { password: _, ...userWithoutPassword } = newUser;
  return userWithoutPassword;
};

// ─── Valida a senha do usuário ─────────────────────────────────────────────────
const validatePassword = async (plainPassword, hashedPassword) => {
  return bcrypt.compare(plainPassword, hashedPassword);
};

// ─── Lista todos os usuários sem a senha ──────────────────────────────────────
const listUsers = () => {
  return users.map(({ password, ...user }) => user);
};

module.exports = {
  findByEmail,
  findById,
  createUser,
  validatePassword,
  listUsers,
};
```

### `src/controllers/authController.js`

```javascript
const jwt = require("jsonwebtoken");
const userService = require("../services/userService");

// ─── Gera um token JWT para o usuário ─────────────────────────────────────────
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "1h" }
  );
};

// ─── POST /api/register ───────────────────────────────────────────────────────
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validação dos campos obrigatórios
    if (!name || !email || !password) {
      return res.status(400).json({
        error: "Campos obrigatórios ausentes",
        required: ["name", "email", "password"],
      });
    }

    // Validação básica de e-mail
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Formato de e-mail inválido" });
    }

    // Validação de senha mínima
    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: "A senha deve ter no mínimo 6 caracteres" });
    }

    // Verifica se o e-mail já está cadastrado
    const existingUser = userService.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: "E-mail já cadastrado" });
    }

    const user = await userService.createUser({ name, email, password });
    const token = generateToken(user);

    return res.status(201).json({
      message: "Usuário cadastrado com sucesso",
      user,
      token,
    });
  } catch (error) {
    console.error("Erro no registro:", error);
    return res.status(500).json({ error: "Erro ao cadastrar usuário" });
  }
};

// ─── POST /api/login ──────────────────────────────────────────────────────────
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validação dos campos obrigatórios
    if (!email || !password) {
      return res.status(400).json({
        error: "Campos obrigatórios ausentes",
        required: ["email", "password"],
      });
    }

    // Busca o usuário pelo e-mail
    const user = userService.findByEmail(email);
    if (!user) {
      // Mensagem genérica para não revelar se o e-mail existe
      return res.status(401).json({ error: "Credenciais inválidas" });
    }

    // Valida a senha
    const isPasswordValid = await userService.validatePassword(
      password,
      user.password
    );
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Credenciais inválidas" });
    }

    const { password: _, ...userWithoutPassword } = user;
    const token = generateToken(userWithoutPassword);

    return res.status(200).json({
      message: "Login realizado com sucesso",
      user: userWithoutPassword,
      token,
    });
  } catch (error) {
    console.error("Erro no login:", error);
    return res.status(500).json({ error: "Erro ao realizar login" });
  }
};

// ─── GET /api/profile ─────────────────────────────────────────────────────────
const getProfile = (req, res) => {
  // req.user é preenchido pelo authMiddleware
  const user = userService.findById(req.user.id);

  if (!user) {
    return res.status(404).json({ error: "Usuário não encontrado" });
  }

  const { password, ...userWithoutPassword } = user;

  return res.status(200).json({
    message: "Perfil obtido com sucesso",
    user: userWithoutPassword,
  });
};

// ─── GET /api/users ───────────────────────────────────────────────────────────
const listUsers = (req, res) => {
  const users = userService.listUsers();

  return res.status(200).json({
    message: "Usuários listados com sucesso",
    total: users.length,
    users,
  });
};

module.exports = { register, login, getProfile, listUsers };
```

### `src/middleware/authMiddleware.js`

```javascript
const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  // Espera o header: Authorization: Bearer <token>
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: "Token não fornecido" });
  }

  const parts = authHeader.split(" ");

  // Verifica o formato "Bearer <token>"
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return res
      .status(401)
      .json({ error: "Formato do token inválido. Use: Bearer <token>" });
  }

  const token = parts[1];

  try {
    // Verifica e decodifica o token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Injeta os dados do usuário na requisição
    req.user = decoded;
    return next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expirado" });
    }
    return res.status(401).json({ error: "Token inválido" });
  }
};

module.exports = authMiddleware;
```

### `src/routes/authRoutes.js`

```javascript
const { Router } = require("express");
const authController = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");

const router = Router();

// ─── Rotas públicas ───────────────────────────────────────────────────────────
router.post("/register", authController.register);
router.post("/login", authController.login);

// ─── Rotas protegidas (requerem token JWT válido) ─────────────────────────────
router.get("/profile", authMiddleware, authController.getProfile);
router.get("/users", authMiddleware, authController.listUsers);

module.exports = router;
```

### `.env.example`

```bash
PORT=3000
JWT_SECRET=troque_por_uma_chave_secreta_forte_aqui
JWT_EXPIRES_IN=1h
```

### `.gitignore`

```
node_modules/
.env
```

### `README.md`

````markdown
# API de Autenticação com Node.js e JWT

API REST com cadastro de usuários, login e rotas protegidas por JWT.
Os dados são armazenados em memória (array JavaScript), sem banco de dados.

## Tecnologias

- **Node.js** + **Express** — servidor HTTP
- **jsonwebtoken** — geração e validação de tokens JWT
- **bcryptjs** — hash seguro de senhas
- **dotenv** — variáveis de ambiente

## Como rodar

### 1. Clone e instale as dependências

```bash
git clone <url-do-repositorio>
cd api-auth
npm install
```

### 2. Configure as variáveis de ambiente

```bash
cp .env.example .env
```

Edite o `.env` e defina um valor seguro para `JWT_SECRET`:

```env
PORT=3000
JWT_SECRET=minha_chave_super_secreta_123
JWT_EXPIRES_IN=1h
```

### 3. Inicie o servidor

```bash
# Produção
npm start

# Desenvolvimento (reinicia ao salvar)
npm run dev
```

O servidor estará disponível em `http://localhost:3000`.

---

## Endpoints

| Método | Rota            | Autenticação | Descrição                    |
| ------ | --------------- | ------------ | ---------------------------- |
| GET    | `/`             | Não          | Informações da API           |
| POST   | `/api/register` | Não          | Cadastra um novo usuário     |
| POST   | `/api/login`    | Não          | Autentica e retorna um token |
| GET    | `/api/profile`  | **Sim**      | Retorna o perfil do usuário  |
| GET    | `/api/users`    | **Sim**      | Lista todos os usuários      |

Para rotas protegidas, envie o header:

```
Authorization: Bearer <seu_token_jwt>
```

---

## Exemplos de uso

### Cadastrar usuário

```bash
curl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{"name": "Maria Silva", "email": "maria@email.com", "password": "senha123"}'
```

**Resposta (201):**

```json
{
  "message": "Usuário cadastrado com sucesso",
  "user": {
    "id": 1,
    "name": "Maria Silva",
    "email": "maria@email.com",
    "createdAt": "2024-01-15T10:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Fazer login

```bash
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email": "maria@email.com", "password": "senha123"}'
```

**Resposta (200):**

```json
{
  "message": "Login realizado com sucesso",
  "user": { "id": 1, "name": "Maria Silva", "email": "maria@email.com" },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Acessar rota protegida

```bash
curl http://localhost:3000/api/profile \
  -H "Authorization: Bearer <token_recebido_no_login>"
```

**Resposta (200):**

```json
{
  "message": "Perfil obtido com sucesso",
  "user": {
    "id": 1,
    "name": "Maria Silva",
    "email": "maria@email.com",
    "createdAt": "2024-01-15T10:00:00.000Z"
  }
}
```

---

## Observação

Os dados são armazenados **apenas em memória**. Ao reiniciar o servidor, todos os usuários cadastrados são perdidos.
````

---

## Visão Geral da Arquitetura

```
Requisição HTTP
      │
      ▼
  app.js (Express + middlewares globais)
      │
      ▼
  authRoutes.js (define os endpoints)
      │
      ├── Rotas públicas ──────────────────► authController.js
      │                                            │
      └── Rotas protegidas                         │
              │                                    │
              ▼                                    ▼
      authMiddleware.js                    userService.js
      (valida o JWT)                   (lógica + array em memória)
```

### Decisões de segurança importantes

| Prática | Onde | Por quê |
|---|---|---|
| **Hash de senha** com bcrypt | `userService.js` | Nunca armazena senha em texto puro |
| **Mensagem genérica** no login | `authController.js` | Não revela se o e-mail existe |
| **Senha excluída** das respostas | `userService.js` / controller | Nunca expõe o hash ao cliente |
| **JWT_SECRET** via `.env` | `authMiddleware.js` | Segredo fora do código-fonte |