**📁 Estrutura do projeto**

```
/projects/rest-api-node
│
├─ package.json
├─ README.md
└─ src
   ├─ app.js
   ├─ middleware
   │   └─ authMiddleware.js
   ├─ routes
   │   ├─ auth.js
   │   └─ profile.js
   ├─ controllers
   │   ├─ authController.js
   │   └─ profileController.js
   └─ services
       └─ userService.js
```

---

## 1️⃣ `package.json`

```json
{
  "name": "rest-api-node",
  "version": "1.0.0",
  "description": "API REST simples com Express, JWT e armazenamento em memória",
  "main": "src/app.js",
  "scripts": {
    "start": "node src/app.js",
    "dev": "nodemon src/app.js"
  },
  "keywords": [],
  "author": "",
  "license": "MIT",
  "dependencies": {
    "express": "^4.18.2",
    "jsonwebtoken": "^9.0.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
```

---

## 2️⃣ `src/app.js`

```javascript
// src/app.js
const express = require("express");
const authRoutes = require("./routes/auth");
const profileRoutes = require("./routes/profile");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware global
app.use(express.json());

// Rotas
app.use("/register", authRoutes);
app.use("/login", authRoutes);
app.use("/profile", profileRoutes);

// Tratamento de rotas não encontradas
app.use((req, res) => {
  res.status(404).json({ error: "Rota não encontrada" });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
```

---

## 3️⃣ `src/middleware/authMiddleware.js`

```javascript
// src/middleware/authMiddleware.js
const jwt = require("jsonwebtoken");

const JWT_SECRET = "sua_chave_secreta_aleatoria"; // Em produção, use env var

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  // Formato esperado: "Bearer <token>"
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Token não fornecido" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Token inválido" });
    req.user = user; // { id, email }
    next();
  });
}

module.exports = { authenticateToken, JWT_SECRET };
```

---

## 4️⃣ `src/services/userService.js`

```javascript
// src/services/userService.js
let users = []; // Armazenamento em memória
let nextId = 1;

/**
 * Cria um novo usuário.
 * @param {string} email
 * @param {string} password
 * @returns {{id:number,email:string,password:string}}
 */
function createUser(email, password) {
  const user = { id: nextId++, email, password };
  users.push(user);
  return user;
}

/**
 * Busca usuário por email.
 * @param {string} email
 * @returns {{id:number,email:string,password:string}|undefined}
 */
function findByEmail(email) {
  return users.find((u) => u.email === email);
}

/**
 * Busca usuário por id.
 * @param {number} id
 * @returns {{id:number,email:string,password:string}|undefined}
 */
function findById(id) {
  return users.find((u) => u.id === id);
}

/**
 * Reseta o armazenamento (útil para testes).
 */
function reset() {
  users = [];
  nextId = 1;
}

module.exports = {
  createUser,
  findByEmail,
  findById,
  reset,
};
```

---

## 5️⃣ `src/controllers/authController.js`

```javascript
// src/controllers/authController.js
const jwt = require("jsonwebtoken");
const { createUser, findByEmail } = require("../services/userService");
const { JWT_SECRET } = require("../middleware/authMiddleware");

/**
 * POST /register
 */
async function register(req, res) {
  const { email, password } = req.body;

  // Validações básicas
  if (!email || !password) {
    return res.status(400).json({ error: "Email e senha são obrigatórios" });
  }

  if (findByEmail(email)) {
    return res.status(409).json({ error: "Usuário já cadastrado" });
  }

  const user = createUser(email, password);
  // Não retornamos a senha
  const { password: _, ...userWithoutPassword } = user;
  res
    .status(201)
    .json({ message: "Usuário criado", user: userWithoutPassword });
}

/**
 * POST /login
 */
async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email e senha são obrigatórios" });
  }

  const user = findByEmail(email);
  if (!user || user.password !== password) {
    return res.status(401).json({ error: "Credenciais inválidas" });
  }

  // Payload mínimo
  const payload = { id: user.id, email: user.email };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });

  res.json({ token });
}

module.exports = {
  register,
  login,
};
```

---

## 6️⃣ `src/controllers/profileController.js`

```javascript
// src/controllers/profileController.js
const { findById } = require("../services/userService");

/**
 * GET /profile
 * Requer autenticação via JWT.
 */
async function getProfile(req, res) {
  const userId = req.user.id;
  const user = findById(userId);

  if (!user) {
    return res.status(404).json({ error: "Usuário não encontrado" });
  }

  const { password, ...userWithoutPassword } = user;
  res.json({ profile: userWithoutPassword });
}

module.exports = {
  getProfile,
};
```

---

## 7️⃣ `src/routes/auth.js`

```javascript
// src/routes/auth.js
const express = require("express");
const { register, login } = require("../controllers/authController");

const router = express.Router();

// Como o mesmo router é usado para /register e /login, distinguimos pelo método
router.post("/", (req, res, next) => {
  // Se a rota chamada for /register, delega ao register, caso contrário ao login
  if (req.baseUrl.endsWith("/register")) {
    return register(req, res, next);
  }
  if (req.baseUrl.endsWith("/login")) {
    return login(req, res, next);
  }
  // Fallback (não deveria acontecer)
  res.status(404).json({ error: "Rota não encontrada" });
});

module.exports = router;
```

> **Observação:** O `router` acima serve tanto para `/register` quanto para `/login`. Ele verifica o caminho base (`req.baseUrl`) e encaminha para o controlador correto. Essa abordagem mantém o código enxuto e evita a criação de dois arquivos de rota idênticos.

---

## 8️⃣ `src/routes/profile.js`

```javascript
// src/routes/profile.js
const express = require("express");
const { getProfile } = require("../controllers/profileController");
const { authenticateToken } = require("../middleware/authMiddleware");

const router = express.Router();

// Todas as rotas abaixo exigem autenticação
router.use(authenticateToken);

router.get("/", getProfile);

module.exports = router;
```

---

## 9️⃣ `README.md`

````markdown
# API REST em Node.js (Express) – Usuários e JWT

## 📋 Descrição

Esta API demonstra um fluxo básico de autenticação:

| Endpoint    | Método | Descrição                               |
| ----------- | ------ | --------------------------------------- |
| `/register` | POST   | Cria um usuário (email + senha)         |
| `/login`    | POST   | Valida credenciais e devolve um JWT     |
| `/profile`  | GET    | Retorna os dados do usuário autenticado |

A persistência é **em memória** (array JavaScript) – ideal para protótipos ou testes.

## 🛠️ Requisitos

- **Node.js** (versão >= 14)
- **npm** (ou **yarn**)

## 🚀 Como executar

```bash
# 1️⃣ Clone o repositório (ou copie os arquivos)
git clone <url-do-repositorio>
cd rest-api-node

# 2️⃣ Instale as dependências
npm install          # ou: yarn install

# 3️⃣ Inicie a aplicação
npm start            # modo produção
# ou
npm run dev          # modo desenvolvimento (com nodemon)

# 4️⃣ A API ficará disponível em http://localhost:3000
```
````

## 📡 Testando os endpoints

### 1️⃣ Registro

```bash
curl -X POST http://localhost:3000/register \
  -H "Content-Type: application/json" \
  -d '{"email":"usuario@example.com","password":"123456"}'
```

Resposta esperada (201):

```json
{
  "message": "Usuário criado",
  "user": {
    "id": 1,
    "email": "usuario@example.com"
  }
}
```

### 2️⃣ Login

```bash
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{"email":"usuario@example.com","password":"123456"}'
```

Resposta esperada (200):

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6..."
}
```

### 3️⃣ Acessar o perfil (autenticado)

```bash
TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6...

curl -X GET http://localhost:3000/profile \
  -H "Authorization: Bearer $TOKEN"
```

Resposta esperada (200):

```json
{
  "profile": {
    "id": 1,
    "email": "usuario@example.com"
  }
}
```

## 🧪 Reset da base em memória (para testes)

Como os usuários são armazenados apenas em memória, reiniciar o processo (`Ctrl+C` + `npm start`) limpa todos os registros.

## 📂 Estrutura de pastas

```
src/
│
├─ app.js                 # ponto de entrada da aplicação
├─ middleware/
│   └─ authMiddleware.js # validação do JWT
├─ routes/
│   ├─ auth.js            # /register e /login
│   └─ profile.js        # /profile (protected)
├─ controllers/
│   ├─ authController.js
│   └─ profileController.js
└─ services/
    └─ userService.js    # armazenamento em memória
```

## 🔐 Segurança

- **Senha**: neste exemplo a senha é armazenada em texto puro apenas para simplificar. Em produção, use `bcrypt` ou outra função de hash.
- **JWT secret**: a chave está hard‑coded (`JWT_SECRET`). Substitua por uma variável de ambiente (`process.env.JWT_SECRET`) antes de colocar em produção.

## 📄 Licença

Este projeto está sob a licença MIT. Feel free to use and adapt!
