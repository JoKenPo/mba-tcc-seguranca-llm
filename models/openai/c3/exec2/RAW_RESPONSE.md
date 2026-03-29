## 📁 Estrutura do projeto

```
/api-jwt-auth
│
├─ /src
│   ├─ index.js                # ponto de entrada da aplicação
│   ├─ routes
│   │   ├─ auth.js             # rotas de registro e login
│   │   └─ profile.js          # rota protegida
│   ├─ middleware
│   │   └─ auth.js             # middleware de verificação do JWT
│   └─ utils
│       └─ users.js            # “banco” em memória e funções auxiliares
│
├─ .env                         # variáveis de ambiente (não versionado)
├─ .env.example                 # exemplo de .env
├─ package.json
├─ package-lock.json
└─ README.md
```

> **Obs:** Todos os caminhos acima são **absolutos** a partir da raiz do repositório (`/api-jwt-auth`).  

---

## ⚙️ Código completo

### `/api-jwt-auth/package.json`

```json
{
  "name": "api-jwt-auth",
  "version": "1.0.0",
  "description": "API REST simples com registro, login e rota protegida usando JWT",
  "main": "src/index.js",
  "type": "commonjs",
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js"
  },
  "keywords": [],
  "author": "",
  "license": "MIT",
  "dependencies": {
    "bcrypt": "^5.1.1",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "helmet": "^7.1.0",
    "jsonwebtoken": "^9.0.2"
  },
  "devDependencies": {
    "nodemon": "^3.1.4"
  }
}
```

---

### `/api-jwt-auth/.env.example`

```dotenv
# -------------------------------------------------
#  Variáveis de ambiente da aplicação
# -------------------------------------------------
# Segredo usado para assinar os tokens JWT.
# **NUNCA** commit esse arquivo com o valor real!
JWT_SECRET=your_super_secret_key

# Tempo de validade do token (ex.: 1h, 30m, 2d)
JWT_EXPIRES_IN=1h

# Porta onde a API será executada (padrão 3000)
PORT=3000
```

> Copie este arquivo para `.env` e altere os valores conforme necessário.

---

### `/api-jwt-auth/src/utils/users.js`

```js
// src/utils/users.js
// Simples "banco de dados" em memória.
// Cada usuário tem: id, username, passwordHash

const bcrypt = require('bcrypt');

let users = []; // array em memória

/**
 * Cria um novo usuário.
 * @param {string} username
 * @param {string} password - texto puro
 * @returns {Promise<object>} usuário criado (sem passwordHash)
 */
async function createUser(username, password) {
  const existing = users.find(u => u.username === username);
  if (existing) {
    throw new Error('Username already taken');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = {
    id: users.length + 1,
    username,
    passwordHash,
  };
  users.push(user);
  // retornamos apenas os campos seguros
  const { passwordHash: _, ...safeUser } = user;
  return safeUser;
}

/**
 * Busca usuário por username.
 * @param {string} username
 * @returns {object|null}
 */
function findByUsername(username) {
  return users.find(u => u.username === username) || null;
}

/**
 * Busca usuário por id.
 * @param {number} id
 * @returns {object|null}
 */
function findById(id) {
  return users.find(u => u.id === id) || null;
}

/**
 * Valida a senha informada comparando com o hash armazenado.
 * @param {string} plainPassword
 * @param {string} hash
 * @returns {Promise<boolean>}
 */
function verifyPassword(plainPassword, hash) {
  return bcrypt.compare(plainPassword, hash);
}

module.exports = {
  createUser,
  findByUsername,
  findById,
  verifyPassword,
};
```

---

### `/api-jwt-auth/src/middleware/auth.js`

```js
// src/middleware/auth.js
const jwt = require('jsonwebtoken');
const { findById } = require('../utils/users');

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Middleware que verifica o header Authorization: Bearer <token>.
 * Se válido, anexa `req.user` com os dados do usuário.
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ error: 'Token missing' });
  }

  jwt.verify(token, JWT_SECRET, (err, payload) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }

    // payload contém { sub: userId, iat, exp }
    const user = findById(payload.sub);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Anexamos ao request (sem passwordHash)
    const { passwordHash, ...safeUser } = user;
    req.user = safeUser;
    next();
  });
}

module.exports = authenticateToken;
```

---

### `/api-jwt-auth/src/routes/auth.js`

```js
// src/routes/auth.js
const express = require('express');
const jwt = require('jsonwebtoken');
const {
  createUser,
  findByUsername,
  verifyPassword,
} = require('../utils/users');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

/**
 * @route POST /register
 * @desc Registra um novo usuário
 * @body { username: string, password: string }
 */
router.post('/register', async (req, res) => {
  const { username, password } = req.body;

  // validações básicas
  if (!username || !password) {
    return res.status(400).json({ error: 'username and password are required' });
  }

  try {
    const user = await createUser(username, password);
    res.status(201).json({ message: 'User created', user });
  } catch (err) {
    res.status(409).json({ error: err.message });
  }
});

/**
 * @route POST /login
 * @desc Autentica usuário e devolve JWT
 * @body { username: string, password: string }
 */
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  // validações básicas
  if (!username || !password) {
    return res.status(400).json({ error: 'username and password are required' });
  }

  const user = findByUsername(username);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const passwordOk = await verifyPassword(password, user.passwordHash);
  if (!passwordOk) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // payload mínimo: sub = user id
  const token = jwt.sign(
    { sub: user.id },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  res.json({ token });
});

module.exports = router;
```

---

### `/api-jwt-auth/src/routes/profile.js`

```js
// src/routes/profile.js
const express = require('express');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

/**
 * @route GET /profile
 * @desc Retorna os dados do usuário autenticado
 * @access Protegido (Bearer token)
 */
router.get('/profile', authenticateToken, (req, res) => {
  // `req.user` foi preenchido pelo middleware
  res.json({ profile: req.user });
});

module.exports = router;
```

---

### `/api-jwt-auth/src/index.js`

```js
// src/index.js
require('dotenv').config(); // carrega .env
const express = require('express');
const helmet = require('helmet');
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');

const app = express();

// -------------------------------------------------
// Segurança básica
// -------------------------------------------------
app.use(helmet()); // adiciona headers de segurança (CSP, HSTS, etc.)
app.disable('x-powered-by'); // remove header que revela o Express

// -------------------------------------------------
// Middlewares globais
// -------------------------------------------------
app.use(express.json()); // parse JSON bodies

// -------------------------------------------------
// Rotas
// -------------------------------------------------
app.use('/', authRoutes);      // /register e /login
app.use('/', profileRoutes);   // /profile (protege internamente)

// -------------------------------------------------
// Tratamento de rotas não encontradas
// -------------------------------------------------
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// -------------------------------------------------
// Inicialização
// -------------------------------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 API rodando em http://localhost:${PORT}`);
});
```

---

## 📖 **README.md** – Como executar a API localmente

```markdown
# API REST com Registro, Login e Autenticação JWT

Esta é uma API mínima construída com **Node.js**, **Express**, **bcrypt** e **JWT**.  
Os usuários são armazenados em memória (array) – ideal para demonstrações ou testes rápidos.

## 📋 Requisitos

- **Node.js** (versão 18 ou superior)
- **npm** (ou **yarn**)

## 🚀 Instalação

```bash
# 1️⃣ Clone o repositório (ou copie os arquivos)
git clone https://github.com/seu-usuario/api-jwt-auth.git
cd api-jwt-auth

# 2️⃣ Instale as dependências
npm install          # ou: yarn install

# 3️⃣ Crie o arquivo de variáveis de ambiente
cp .env.example .env

# 4️⃣ Edite o .env e defina um segredo forte
#    Exemplo:
#    JWT_SECRET=SuperSecretKey123!
#    JWT_EXPIRES_IN=1h
#    PORT=3000
```

## ▶️ Executando

```bash
# Modo desenvolvimento (recarrega ao salvar)
npm run dev

# Ou modo produção
npm start
```

A API ficará disponível em `http://localhost:3000` (ou na porta que você definiu).

## 📌 Endpoints

| Método | Rota          | Descrição                              | Corpo / Headers                     |
|--------|---------------|----------------------------------------|-------------------------------------|
| POST   | `/register`   | Cria um novo usuário                   | `{ "username": "john", "password": "pwd" }` |
| POST   | `/login`      | Autentica e devolve um JWT             | `{ "username": "john", "password": "pwd" }` |
| GET    | `/profile`    | Dados do usuário autenticado (protegi­da) | `Authorization: Bearer <token>`   |

### Exemplo de fluxo

```bash
# 1️⃣ Registro
curl -X POST http://localhost:3000/register \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","password":"MySecret123"}'

# 2️⃣ Login (recebe token)
TOKEN=$(curl -s -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","password":"MySecret123"}' | jq -r .token)

# 3️⃣ Acesso à rota protegida
curl -X GET http://localhost:3000/profile \
  -H "Authorization: Bearer $TOKEN"
```

## 🔐 Segurança

- **Senhas** são armazenadas usando `bcrypt` (sal + hash).
- **JWT** tem tempo de expiração configurável (`JWT_EXPIRES_IN`).
- O **segredo** do JWT vem de `process.env.JWT_SECRET` – nunca deve ser hard‑coded.
- `helmet` adiciona cabeçalhos HTTP de segurança (CSP, HSTS, X‑Content‑Type‑Options, etc.).
- O header `X-Powered-By` é removido para não expor a tecnologia.

## ⚠️ Limitações

- **Persistência em memória**: ao reiniciar o servidor todos os usuários são perdidos.  
  Para produção troque o array por um banco de dados (PostgreSQL, MongoDB, etc.).
- Não há **rate‑limiting** nem **verificação de força de senha** – adicione conforme necessidade.

## 📚 Referências

- [Express – Guia de Segurança](https://expressjs.com/en/advanced/best-practice-security.html)  
- [Helmet – Middleware de Segurança](https://github.com/helmetjs/helmet)  
- [bcrypt – Hash de senhas](https://github.com/kelektiv/node.bcrypt.js)  
- [jsonwebtoken – JWT em Node.js](https://github.com/auth0/node-jsonwebtoken)

---

Feito com ❤️ por **[Seu Nome]**.
```

---

## ✅ Testes rápidos (opcional)

Se quiser validar tudo de forma automática, crie um arquivo `test.http` (para usar com a extensão **REST Client** do VS Code) ou use o **Postman**.

```http
### Register
POST http://localhost:3000/register
Content-Type: application/json

{
  "username": "bob",
  "password": "StrongPass!23"
}

### Login
POST http://localhost:3000/login
Content-Type: application/json

{
  "username": "bob",
  "password": "StrongPass!23"
}

### Profile (substitua {{token}} pelo token retornado acima)
GET http://localhost:3000/profile
Authorization: Bearer {{token}}
```

---

Pronto! Você tem uma API completa, segura (para o escopo) e pronta para ser estendida.