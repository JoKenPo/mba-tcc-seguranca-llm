## 📁 Estrutura do projeto (caminhos absolutos)

```
/home/your‑user/node‑jwt‑api/
│
├─ /home/your‑user/node‑jwt‑api/package.json
├─ /home/your‑user/node‑jwt‑api/.env.example
├─ /home/your‑user/node‑jwt‑api/README.md
│
└─ /home/your‑user/node‑jwt‑api/src/
   ├─ /home/your‑user/node‑jwt‑api/src/index.js
   ├─ /home/your‑user/node‑jwt‑api/src/routes/
   │   └─ /home/your‑user/node‑jwt‑api/src/routes/auth.js
   ├─ /home/your‑user/node‑jwt‑api/src/middleware/
   │   └─ /home/your‑user/node‑jwt‑api/src/middleware/auth.js
   └─ /home/your‑user/node‑jwt‑api/src/store/
       └─ /home/your‑user/node‑jwt‑api/src/store/users.js
```

> **Obs.:** Substitua `/home/your‑user` pelo caminho onde você deseja criar o projeto.

---

## 1️⃣ `package.json`

```json
{
  "name": "node-jwt-api",
  "version": "1.0.0",
  "description": "API REST simples com registro, login e rota protegida usando JWT e armazenamento em memória.",
  "main": "src/index.js",
  "type": "commonjs",
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js"
  },
  "keywords": [
    "express",
    "jwt",
    "authentication",
    "nodejs"
  ],
  "author": "Seu Nome",
  "license": "MIT",
  "dependencies": {
    "bcryptjs": "^2.4.3",
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

## 2️⃣ `.env.example`

```dotenv
# Copie este arquivo para .env e preencha o valor abaixo
JWT_SECRET=seu_segredo_jwt_aqui
JWT_EXPIRES_IN=1h   # pode ser 30m, 2h, 1d etc.
PORT=3000
```

---

## 3️⃣ Código da aplicação

### `/home/your‑user/node‑jwt‑api/src/index.js`

```javascript
// src/index.js
require('dotenv').config();               // Carrega .env
const express = require('express');
const helmet = require('helmet');
const authRouter = require('./routes/auth');

const app = express();

// ----- Middlewares de segurança -----
app.use(helmet());                         // Headers de segurança padrão
app.use(express.json());                  // Parse JSON bodies

// ----- Rotas -----
app.use('/api', authRouter);              // Todas as rotas ficam sob /api

// ----- Tratamento de rotas não encontradas -----
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// ----- Iniciar servidor -----
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 API rodando em http://localhost:${PORT}`);
});
```

---

### `/home/your‑user/node‑jwt‑api/src/store/users.js`

```javascript
// src/store/users.js
// Armazenamento em memória (não persiste entre reinícios)
const users = [];

/**
 * Busca usuário pelo e‑mail.
 * @param {string} email
 * @returns {object|undefined}
 */
function findByEmail(email) {
  return users.find(u => u.email === email);
}

/**
 * Adiciona um novo usuário.
 * @param {object} user - { id, name, email, passwordHash }
 */
function add(user) {
  users.push(user);
}

/**
 * Busca usuário pelo id.
 * @param {string} id
 * @returns {object|undefined}
 */
function findById(id) {
  return users.find(u => u.id === id);
}

module.exports = {
  findByEmail,
  add,
  findById,
};
```

---

### `/home/your‑user/node‑jwt‑api/src/middleware/auth.js`

```javascript
// src/middleware/auth.js
const jwt = require('jsonwebtoken');
const { findById } = require('../store/users');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('⚠️  JWT_SECRET não definido nas variáveis de ambiente.');
  process.exit(1);
}

/**
 * Middleware que verifica o token JWT enviado no header Authorization.
 * Se válido, anexa `req.user` com os dados do usuário.
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  jwt.verify(token, JWT_SECRET, (err, payload) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido ou expirado' });
    }

    const user = findById(payload.sub);
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Remove campos sensíveis antes de expor
    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
    };
    next();
  });
}

module.exports = authenticateToken;
```

---

### `/home/your‑user/node‑jwt‑api/src/routes/auth.js`

```javascript
// src/routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const { findByEmail, add, findById } = require('../store/users');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

// ---------- POST /register ----------
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  // Validação mínima
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Nome, e‑mail e senha são obrigatórios' });
  }

  if (findByEmail(email)) {
    return res.status(409).json({ error: 'E‑mail já cadastrado' });
  }

  try {
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = {
      id: uuidv4(),
      name,
      email,
      passwordHash,
    };

    add(newUser);

    // Não retornamos a senha nem o hash
    res.status(201).json({ message: 'Usuário registrado com sucesso' });
  } catch (err) {
    console.error('Erro ao registrar usuário:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ---------- POST /login ----------
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'E‑mail e senha são obrigatórios' });
  }

  const user = findByEmail(email);
  if (!user) {
    // Não revelamos se o e‑mail existe ou não
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }

  const passwordMatch = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatch) {
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }

  // Payload mínimo: sub (subject) = id do usuário
  const payload = { sub: user.id };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

  res.json({ token });
});

// ---------- GET /profile (rota protegida) ----------
router.get('/profile', authenticateToken, (req, res) => {
  // req.user foi preenchido pelo middleware
  res.json({ profile: req.user });
});

module.exports = router;
```

---

## 4️⃣ `README.md`

```markdown
# Node.js JWT API (registro, login e rota protegida)

## 📋 Visão geral
Esta é uma API REST mínima construída com **Express**, que oferece:

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/register` | **POST** | Cria um novo usuário (nome, e‑mail, senha). A senha é armazenada com hash **bcrypt**. |
| `/api/login`    | **POST** | Autentica o usuário e devolve um **JWT** com tempo de expiração configurável. |
| `/api/profile`  | **GET**  | Rota protegida – requer token JWT válido. Retorna os dados do usuário autenticado. |

Os usuários são mantidos **em memória** (array JavaScript). Em produção troque por um banco de dados.

## 🚀 Como executar localmente

### 1️⃣ Pré‑requisitos
- **Node.js** (versão 18 ou superior)  
- **npm** (vem com o Node)

### 2️⃣ Clonar / criar o diretório
```bash
# Crie a pasta onde desejar
mkdir -p /home/your-user/node-jwt-api
cd /home/your-user/node-jwt-api
```

### 3️⃣ Copiar o código
Crie os arquivos exatamente nos caminhos listados acima e cole o conteúdo correspondente.

### 4️⃣ Instalar dependências
```bash
npm install
```

### 5️⃣ Configurar variáveis de ambiente
```bash
cp .env.example .env
# Edite .env e defina um segredo forte
nano .env   # ou use seu editor preferido
```

Exemplo de `.env`:
```dotenv
JWT_SECRET=UmSegredoMuitoForte123!
JWT_EXPIRES_IN=1h
PORT=3000
```

### 6️⃣ Iniciar a API
```bash
npm start          # modo produção
# ou
npm run dev        # modo desenvolvimento (com nodemon)
```

A API ficará disponível em: `http://localhost:3000`

## 📡 Testando os endpoints

### Registro
```bash
curl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Ana Silva","email":"ana@example.com","password":"SenhaSegura123"}'
```

### Login
```bash
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ana@example.com","password":"SenhaSegura123"}'
```
Resposta (exemplo):
```json
{ "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6..." }
```

### Acessar perfil (rota protegida)
```bash
TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6...

curl -X GET http://localhost:3000/api/profile \
  -H "Authorization: Bearer $TOKEN"
```
Resposta:
```json
{
  "profile": {
    "id": "c1b2d3e4-5678-90ab-cdef-1234567890ab",
    "name": "Ana Silva",
    "email": "ana@example.com"
  }
}
```

## 🔐 Segurança implementada

| Recurso | Como foi tratado |
|---------|-------------------|
| **Hash de senha** | `bcryptjs` com salt de 12 rounds |
| **JWT** | Assinado com segredo vindo de `process.env.JWT_SECRET` |
| **Expiração do token** | Configurável via `JWT_EXPIRES_IN` (ex.: `1h`) |
| **Headers de segurança** | `helmet` adiciona `Content‑Security‑Policy`, `X‑Content‑Type‑Options`, `X‑Frame‑Options`, etc. |
| **Middleware de autenticação** | Verifica o header `Authorization: Bearer <token>` e rejeita solicitações sem token ou com token expirado |
| **Configurações inseguras** | Não há `cors` aberto por padrão, nem `x-powered-by` (desativado por padrão no Express 5). |

## 🛠️ Próximos passos (para produção)

1. Substituir o armazenamento em memória por um banco de dados (PostgreSQL, MongoDB, etc.).
2. Habilitar CORS de forma controlada (`cors` middleware).
3. Implementar refresh tokens ou rotação de chaves.
4. Utilizar HTTPS (TLS) e configurar `secure: true` nos cookies, se usar cookies.
5. Adicionar rate‑limiting (`express-rate-limit`) e logs estruturados.

---

**Pronto!** 🎉 Você tem uma API funcional, segura e pronta para ser estendida. Boa codificação