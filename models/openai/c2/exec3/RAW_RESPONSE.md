## 📂 Estrutura do projeto

```
/my-api
│
├─ /controllers
│   ├─ authController.js
│   └─ userController.js
│
├─ /services
│   ├─ authService.js
│   └─ userService.js
│
├─ /routes
│   ├─ authRoutes.js
│   └─ userRoutes.js
│
├─ app.js
├─ package.json
├─ .gitignore
└─ README.md
```

---

## 1️⃣ `package.json`

```json
{
  "name": "my-api",
  "version": "1.0.0",
  "description": "API REST simples com Express, JWT e armazenamento em memória",
  "main": "app.js",
  "type": "commonjs",
  "scripts": {
    "start": "node app.js",
    "dev": "nodemon app.js"
  },
  "keywords": [],
  "author": "",
  "license": "MIT",
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "express": "^4.18.2",
    "jsonwebtoken": "^9.0.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
```

---

## 2️⃣ `app.js`

```javascript
// app.js
const express = require("express");
const bodyParser = require("express").json;
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware global
app.use(bodyParser());

// Rotas
app.use("/api", authRoutes);
app.use("/api", userRoutes);

// Tratamento de erro 404
app.use((req, res) => {
  res.status(404).json({ message: "Rota não encontrada" });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
```

---

## 3️⃣ Serviços (`/services`)

### 3.1 `services/userService.js`

```javascript
// services/userService.js
const bcrypt = require("bcryptjs");

// Armazenamento em memória
const users = [];

/**
 * Cria um novo usuário.
 * @param {string} email
 * @param {string} password - senha em texto puro
 * @returns {object} usuário criado (sem a senha hash)
 */
async function createUser(email, password) {
  // Verifica se já existe
  const exists = users.find((u) => u.email === email);
  if (exists) {
    throw new Error("Email já cadastrado");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = { id: users.length + 1, email, passwordHash };
  users.push(user);
  // Retorna objeto sem a hash da senha
  const { passwordHash: _, ...userWithoutPass } = user;
  return userWithoutPass;
}

/**
 * Busca usuário por email.
 * @param {string} email
 * @returns {object|null}
 */
function findByEmail(email) {
  return users.find((u) => u.email === email) || null;
}

/**
 * Busca usuário por ID.
 * @param {number} id
 * @returns {object|null}
 */
function findById(id) {
  return users.find((u) => u.id === id) || null;
}

module.exports = {
  createUser,
  findByEmail,
  findById,
};
```

### 3.2 `services/authService.js`

```javascript
// services/authService.js
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const userService = require("./userService");

const JWT_SECRET = process.env.JWT_SECRET || "my_super_secret_key";
const JWT_EXPIRES_IN = "1h";

/**
 * Autentica usuário e gera token JWT.
 * @param {string} email
 * @param {string} password - texto puro
 * @returns {string} token JWT
 */
async function login(email, password) {
  const user = userService.findByEmail(email);
  if (!user) {
    throw new Error("Credenciais inválidas");
  }

  const passwordMatch = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatch) {
    throw new Error("Credenciais inválidas");
  }

  const payload = { sub: user.id, email: user.email };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  return token;
}

/**
 * Middleware que verifica o token JWT.
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ message: "Token não fornecido" });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: "Token inválido ou expirado" });
    }
    // Anexa informações do usuário ao request
    req.user = { id: decoded.sub, email: decoded.email };
    next();
  });
}

module.exports = {
  login,
  authenticateToken,
};
```

---

## 4️⃣ Controllers (`/controllers`)

### 4.1 `controllers/authController.js`

```javascript
// controllers/authController.js
const userService = require("../services/userService");
const authService = require("../services/authService");

/**
 * POST /register
 */
async function register(req, res) {
  const { email, password } = req.body;

  // Validação básica
  if (!email || !password) {
    return res.status(400).json({ message: "Email e senha são obrigatórios" });
  }

  try {
    const newUser = await userService.createUser(email, password);
    return res.status(201).json({ message: "Usuário criado", user: newUser });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
}

/**
 * POST /login
 */
async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email e senha são obrigatórios" });
  }

  try {
    const token = await authService.login(email, password);
    return res.json({ token });
  } catch (err) {
    return res.status(401).json({ message: err.message });
  }
}

module.exports = {
  register,
  login,
};
```

### 4.2 `controllers/userController.js`

```javascript
// controllers/userController.js
const userService = require("../services/userService");

/**
 * GET /profile
 * Requer autenticação (middleware já adicionou req.user)
 */
function getProfile(req, res) {
  const user = userService.findById(req.user.id);
  if (!user) {
    return res.status(404).json({ message: "Usuário não encontrado" });
  }

  const { passwordHash, ...userWithoutPass } = user;
  return res.json({ profile: userWithoutPass });
}

module.exports = {
  getProfile,
};
```

---

## 5️⃣ Rotas (`/routes`)

### 5.1 `routes/authRoutes.js`

```javascript
// routes/authRoutes.js
const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");

// Registro
router.post("/register", authController.register);

// Login
router.post("/login", authController.login);

module.exports = router;
```

### 5.2 `routes/userRoutes.js`

```javascript
// routes/userRoutes.js
const express = require("express");
const router = express.Router();

const userController = require("../controllers/userController");
const authService = require("../services/authService");

// Rota protegida
router.get(
  "/profile",
  authService.authenticateToken,
  userController.getProfile,
);

module.exports = router;
```

---

## 6️⃣ `.gitignore`

```
node_modules/
.env
```

---

## 7️⃣ `README.md`

````markdown
# API REST Simples com Express & JWT

Esta é uma API mínima que demonstra:

- Registro de usuário (`POST /api/register`)
- Login retornando um **JWT** (`POST /api/login`)
- Acesso a um recurso protegido (`GET /api/profile`) apenas com token válido
- Persistência em memória (array JavaScript) – **não** usa banco de dados

## 📋 Requisitos

- **Node.js** (versão 14 ou superior)
- **npm** (ou **yarn**)

## 🚀 Como rodar a aplicação

1. **Clone o repositório** (ou copie os arquivos para uma pasta local)

   ```bash
   git clone https://github.com/SEU_USUARIO/my-api.git
   cd my-api
   ```
````

2. **Instale as dependências**

   ```bash
   npm install
   # ou, se preferir yarn
   # yarn install
   ```

3. **(Opcional) Defina a secret do JWT**

   Por padrão a aplicação usa a chave `my_super_secret_key`.  
   Para mudar, crie um arquivo `.env` na raiz do projeto:

   ```env
   JWT_SECRET=uma_chave_mais_segura
   ```

   > **Importante:** o `.env` está incluído no `.gitignore`.

4. **Inicie o servidor**

   ```bash
   npm start          # modo produção
   # ou
   npm run dev        # modo desenvolvimento (com nodemon)
   ```

   O servidor ficará escutando em `http://localhost:3000`.

## 📡 Endpoints

| Método | URL             | Descrição                               | Corpo (JSON)                                              |
| ------ | --------------- | --------------------------------------- | --------------------------------------------------------- |
| POST   | `/api/register` | Cria um novo usuário                    | `{ "email": "user@example.com", "password": "senha123" }` |
| POST   | `/api/login`    | Autentica e devolve um token JWT        | `{ "email": "user@example.com", "password": "senha123" }` |
| GET    | `/api/profile`  | Retorna os dados do usuário autenticado | **Header** `Authorization: Bearer <token>`                |

### Exemplo de uso com `curl`

```bash
# Registro
curl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{"email":"john@doe.com","password":"123456"}'

# Login
TOKEN=$(curl -s -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@doe.com","password":"123456"}' | jq -r .token)

# Perfil (autenticado)
curl -X GET http://localhost:3000/api/profile \
  -H "Authorization: Bearer $TOKEN"
```

## 🛠️ Estrutura de pastas

```
/controllers   ← lógica de tratamento das requisições
/services      ← regras de negócio (usuário, autenticação)
/routes        ← definição das rotas da API
app.js         ← ponto de entrada da aplicação
package.json   ← dependências e scripts
.gitignore     ← arquivos a serem ignorados pelo Git
README.md      ← este documento
```

## ⚠️ Observações

- **Persistência em memória** – ao reiniciar o servidor todos os usuários são perdidos.  
  Para produção troque o array por um banco de dados (MongoDB, PostgreSQL, etc.).
- **Segurança** – a secret do JWT deve ser forte e mantida fora do código (variável de ambiente).
- **Validação** – aqui usamos validações mínimas; em projetos reais recomenda‑se bibliotecas como `joi` ou `express-validator`.

---

```

```
