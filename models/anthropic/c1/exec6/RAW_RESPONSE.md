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
│   ├── services/
│   │   └── userService.js
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

**src/app.js**
```javascript
require("dotenv").config();
const express = require("express");
const authRoutes = require("./routes/authRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares globais
app.use(express.json());

// Rota de health check
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "API está funcionando!",
    timestamp: new Date().toISOString(),
  });
});

// Rotas da aplicação
app.use("/api", authRoutes);

// Middleware para rotas não encontradas
app.use((req, res) => {
  res.status(404).json({ error: "Rota não encontrada." });
});

// Middleware global de erros
app.use((err, req, res, next) => {
  console.error(`[ERRO] ${err.message}`);
  res.status(err.status || 500).json({
    error: err.message || "Erro interno do servidor.",
  });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
```

**src/services/userService.js**
```javascript
const bcrypt = require("bcryptjs");

// Banco de dados em memória
const users = [];

/**
 * Busca um usuário pelo e-mail.
 * @param {string} email
 * @returns {object|undefined}
 */
const findByEmail = (email) => {
  return users.find((user) => user.email === email);
};

/**
 * Cria e salva um novo usuário no array.
 * @param {string} name
 * @param {string} email
 * @param {string} password - Senha em texto puro (será hasheada aqui)
 * @returns {object} Usuário criado (sem a senha)
 */
const createUser = async (name, email, password) => {
  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = {
    id: users.length + 1,
    name,
    email,
    password: hashedPassword,
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);

  // Retorna o usuário sem expor a senha
  const { password: _, ...userWithoutPassword } = newUser;
  return userWithoutPassword;
};

/**
 * Valida se a senha fornecida corresponde ao hash salvo.
 * @param {string} plainPassword
 * @param {string} hashedPassword
 * @returns {boolean}
 */
const validatePassword = async (plainPassword, hashedPassword) => {
  return bcrypt.compare(plainPassword, hashedPassword);
};

/**
 * Retorna todos os usuários sem expor as senhas.
 * @returns {Array}
 */
const getAllUsers = () => {
  return users.map(({ password, ...user }) => user);
};

module.exports = { findByEmail, createUser, validatePassword, getAllUsers };
```

**src/controllers/authController.js**
```javascript
const jwt = require("jsonwebtoken");
const userService = require("../services/userService");

/**
 * POST /api/register
 * Cadastra um novo usuário.
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Validação dos campos obrigatórios
    if (!name || !email || !password) {
      return res.status(400).json({
        error: "Os campos name, email e password são obrigatórios.",
      });
    }

    // Validação básica de e-mail
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Formato de e-mail inválido." });
    }

    // Validação de senha mínima
    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: "A senha deve ter no mínimo 6 caracteres." });
    }

    // Verifica se o e-mail já está cadastrado
    const existingUser = userService.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: "E-mail já cadastrado." });
    }

    const user = await userService.createUser(name, email, password);

    return res.status(201).json({
      message: "Usuário cadastrado com sucesso!",
      user,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/login
 * Autentica o usuário e retorna um token JWT.
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "Os campos email e password são obrigatórios." });
    }

    // Verifica se o usuário existe
    const user = userService.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: "Credenciais inválidas." });
    }

    // Valida a senha
    const isPasswordValid = await userService.validatePassword(
      password,
      user.password
    );
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Credenciais inválidas." });
    }

    // Gera o token JWT
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "1h" }
    );

    return res.status(200).json({
      message: "Login realizado com sucesso!",
      token,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/profile
 * Retorna os dados do usuário autenticado (rota protegida).
 */
const profile = (req, res) => {
  const user = userService.findByEmail(req.user.email);
  const { password, ...userWithoutPassword } = user;

  return res.status(200).json({
    message: "Acesso autorizado!",
    user: userWithoutPassword,
  });
};

/**
 * GET /api/users
 * Lista todos os usuários cadastrados (rota protegida).
 */
const listUsers = (req, res) => {
  const users = userService.getAllUsers();

  return res.status(200).json({
    total: users.length,
    users,
  });
};

module.exports = { register, login, profile, listUsers };
```

**src/middlewares/authMiddleware.js**
```javascript
const jwt = require("jsonwebtoken");

/**
 * Middleware que verifica se o token JWT é válido.
 * O token deve ser enviado no header: Authorization: Bearer <token>
 */
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers["authorization"];

  if (!authHeader) {
    return res
      .status(401)
      .json({ error: "Token não fornecido. Acesso negado." });
  }

  // Formato esperado: "Bearer <token>"
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return res
      .status(401)
      .json({ error: "Formato do token inválido. Use: Bearer <token>" });
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Disponibiliza os dados do usuário na requisição
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expirado. Faça login novamente." });
    }
    return res.status(401).json({ error: "Token inválido." });
  }
};

module.exports = authMiddleware;
```

**src/routes/authRoutes.js**
```javascript
const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const authMiddleware = require("../middlewares/authMiddleware");

// Rotas públicas
router.post("/register", authController.register);
router.post("/login", authController.login);

// Rotas protegidas (exigem token JWT válido)
router.get("/profile", authMiddleware, authController.profile);
router.get("/users", authMiddleware, authController.listUsers);

module.exports = router;
```

**.env.example**
```
PORT=3000
JWT_SECRET=sua_chave_secreta_muito_segura_aqui
JWT_EXPIRES_IN=1h
```

**.gitignore**
```
node_modules/
.env
```

**README.md**
````markdown
# API Auth - Node.js + Express + JWT

API RESTful com autenticação JWT, cadastro e login de usuários.
Os dados são armazenados em memória (array JavaScript) e são resetados ao reiniciar o servidor.

---

## Tecnologias

- **Node.js** — Ambiente de execução
- **Express** — Framework web
- **jsonwebtoken** — Geração e validação de tokens JWT
- **bcryptjs** — Hash seguro de senhas
- **dotenv** — Variáveis de ambiente

---

## Como rodar o projeto

### 1. Clone o repositório e instale as dependências

```bash
git clone <url-do-repositorio>
cd api-auth
npm install
```

### 2. Configure as variáveis de ambiente

```bash
cp .env.example .env
```

Edite o arquivo `.env` e defina um valor seguro para `JWT_SECRET`:

```
PORT=3000
JWT_SECRET=minha_chave_super_secreta_123
JWT_EXPIRES_IN=1h
```

### 3. Inicie o servidor

```bash
# Produção
npm start

# Desenvolvimento (com hot-reload via nodemon)
npm run dev
```

O servidor estará disponível em: **http://localhost:3000**

---

## Endpoints

| Método | Rota            | Autenticação | Descrição                        |
|--------|-----------------|:------------:|----------------------------------|
| GET    | `/health`       | ❌           | Verifica se a API está no ar     |
| POST   | `/api/register` | ❌           | Cadastra um novo usuário         |
| POST   | `/api/login`    | ❌           | Autentica e retorna token JWT    |
| GET    | `/api/profile`  | ✅ Bearer    | Retorna dados do usuário logado  |
| GET    | `/api/users`    | ✅ Bearer    | Lista todos os usuários          |

---

## Exemplos de uso

### Cadastrar usuário
```bash
curl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{"name": "João Silva", "email": "joao@email.com", "password": "123456"}'
```

**Resposta:**
```json
{
  "message": "Usuário cadastrado com sucesso!",
  "user": {
    "id": 1,
    "name": "João Silva",
    "email": "joao@email.com",
    "createdAt": "2024-01-15T10:00:00.000Z"
  }
}
```

### Fazer login
```bash
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email": "joao@email.com", "password": "123456"}'
```

**Resposta:**
```json
{
  "message": "Login realizado com sucesso!",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Acessar rota protegida
```bash
curl http://localhost:3000/api/profile \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Resposta:**
```json
{
  "message": "Acesso autorizado!",
  "user": {
    "id": 1,
    "name": "João Silva",
    "email": "joao@email.com",
    "createdAt": "2024-01-15T10:00:00.000Z"
  }
}
```
````

---

## Como o projeto funciona

```
Cadastro  →  Senha é hasheada com bcrypt  →  Usuário salvo no array em memória
Login     →  Senha comparada com o hash   →  Token JWT gerado e retornado
Rota      →  Token extraído do header     →  JWT verificado  →  Acesso liberado
protegida    Authorization: Bearer <token>   (assinatura + expiração)
```

**Pontos importantes:**
- A senha **nunca** é armazenada em texto puro — o `bcryptjs` gera um hash seguro
- O token JWT é **assinado** com `JWT_SECRET` e tem **expiração** configurável
- O middleware `authMiddleware` protege rotas automaticamente, basta adicioná-lo
- Os dados são **perdidos** ao reiniciar o servidor (armazenamento em memória)
- O erro de credenciais inválidas retorna a **mesma mensagem** para e-mail e senha incorretos (evita enumeração de usuários)