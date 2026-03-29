Below is a **complete, ready‑to‑run** Node.js project that satisfies every requirement you listed.

---

## 📂 Project structure (absolute paths)

```
/home/your‑user/auth‑api/
│
├─ /home/your‑user/auth‑api/package.json
├─ /home/your‑user/auth‑api/.env.example
├─ /home/your‑user/auth‑api/.gitignore
├─ /home/your‑user/auth‑api/README.md
│
├─ /home/your‑user/auth‑api/src/
│   ├─ /home/your‑user/auth‑api/src/app.js
│   ├─ /home/your‑user/auth‑api/src/routes/
│   │   └─ /home/your‑user/auth‑api/src/routes/auth.js
│   ├─ /home/your‑user/auth‑api/src/middleware/
│   │   └─ /home/your‑user/auth‑api/src/middleware/auth.js
│   └─ /home/your‑user/auth‑api/src/store/
│       └─ /home/your‑user/auth‑api/src/store/userStore.js
│
└─ /home/your‑user/auth‑api/src/utils/
    └─ /home/your‑user/auth‑api/src/utils/validators.js
```

> **Tip:** Replace `/home/your‑user/auth‑api/` with the directory where you want to keep the project.

---

## 1️⃣ `package.json`

```json
{
  "name": "auth-api",
  "version": "1.0.0",
  "description": "API REST simples com cadastro, login e rotas protegidas usando Express, JWT e armazenamento em memória.",
  "main": "src/app.js",
  "type": "commonjs",
  "scripts": {
    "start": "node src/app.js",
    "dev": "nodemon src/app.js"
  },
  "keywords": [
    "express",
    "jwt",
    "authentication",
    "bcrypt",
    "helmet"
  ],
  "author": "Your Name",
  "license": "MIT",
  "dependencies": {
    "bcrypt": "^5.1.0",
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

## 2️⃣ Environment variables

Create a **`.env`** file (or copy `.env.example` and rename it) in the project root:

```
# /home/your‑user/auth‑api/.env
JWT_SECRET=super_secret_key_change_me
JWT_EXPIRES_IN=1h          # 1 hour, you can also use "30m", "2d", etc.
PORT=3000
```

*Never commit the real `.env` file to version control – it is ignored by `.gitignore`.*

---

## 3️⃣ Source code

### 3.1 `src/app.js`

```js
// /home/your‑user/auth‑api/src/app.js
require('dotenv').config();               // Carrega .env
const express = require('express');
const helmet = require('helmet');
const authRoutes = require('./routes/auth');

const app = express();

// ---------- Segurança básica ----------
app.use(helmet());                         // Headers de segurança
app.disable('x-powered-by');               // Esconde tecnologia

// ---------- Middleware ----------
app.use(express.json());                 // Parse JSON bodies

// ---------- Rotas ----------
app.use('/api', authRoutes);              // Todas as rotas ficam sob /api

// ---------- Tratamento de erros ----------
app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Internal Server Error' });
});

// ---------- Inicialização ----------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
```

---

### 3.2 `src/store/userStore.js` – “Banco” em memória

```js
// /home/your‑user/auth‑api/src/store/userStore.js

/**
 * Estrutura simples de armazenamento em memória.
 * Cada usuário tem: id, name, email, passwordHash
 */
class UserStore {
  constructor() {
    this.users = []; // Array de objetos
    this.lastId = 0;
  }

  create({ name, email, passwordHash }) {
    const id = ++this.lastId;
    const user = { id, name, email, passwordHash };
    this.users.push(user);
    return { id, name, email };
  }

  findByEmail(email) {
    return this.users.find(u => u.email === email);
  }

  findById(id) {
    return this.users.find(u => u.id === id);
  }
}

// Exporta uma única instância (singleton)
module.exports = new UserStore();
```

---

### 3.3 `src/middleware/auth.js` – Verificação do JWT

```js
// /home/your‑user/auth‑api/src/middleware/auth.js
const jwt = require('jsonwebtoken');
const userStore = require('../store/userStore');

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token missing or malformed' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = userStore.findById(payload.sub);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    // Anexa o usuário ao request para uso posterior
    req.user = { id: user.id, name: user.name, email: user.email };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

module.exports = authMiddleware;
```

---

### 3.4 `src/utils/validators.js` – Validação mínima

```js
// /home/your‑user/auth‑api/src/utils/validators.js

function isValidEmail(email) {
  // Regex simples, suficiente para exemplo
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function isStrongPassword(pwd) {
  // Pelo menos 6 caracteres; pode ser aprimorado
  return typeof pwd === 'string' && pwd.length >= 6;
}

module.exports = { isValidEmail, isStrongPassword };
```

---

### 3.5 `src/routes/auth.js` – Endpoints

```js
// /home/your‑user/auth‑api/src/routes/auth.js
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userStore = require('../store/userStore');
const authMiddleware = require('../middleware/auth');
const { isValidEmail, isStrongPassword } = require('../utils/validators');

const router = express.Router();

/**
 * POST /api/register
 * Corpo: { name, email, password }
 */
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // ---- Validações básicas ----
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password are required' });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Invalid e‑mail format' });
    }
    if (!isStrongPassword(password)) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    if (userStore.findByEmail(email)) {
      return res.status(409).json({ error: 'E‑mail already registered' });
    }

    // ---- Hash da senha ----
    const saltRounds = 12; // custo razoável
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // ---- Cria usuário ----
    const newUser = userStore.create({ name, email, passwordHash });

    // Não devolvemos a senha!
    res.status(201).json({ message: 'User created', user: newUser });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/login
 * Corpo: { email, password }
 */
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'E‑mail and password are required' });
    }

    const user = userStore.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // ---- Gera JWT ----
    const payload = {
      sub: user.id,
      name: user.name,
      email: user.email
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '1h'
    });

    res.json({ token });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/profile
 * Rota protegida – requer Authorization: Bearer <token>
 */
router.get('/profile', authMiddleware, (req, res) => {
  // req.user foi preenchido pelo middleware
  res.json({ profile: req.user });
});

module.exports = router;
```

---

## 4️⃣ `.gitignore`

```gitignore
# /home/your‑user/auth‑api/.gitignore
node_modules/
.env
```

---

## 5️⃣ `README.md`

```markdown
# Auth API (Node.js + Express)

A **REST API** minimalista que demonstra cadastro, login e acesso a rotas protegidas usando:

* **Express** – framework HTTP
* **bcrypt** – hash seguro de senhas
* **JWT** – token de autenticação com expiração
* **Helmet** – cabeçalhos de segurança
* **Armazenamento em memória** (array) – apenas para demonstração / testes

> **⚠️** Em produção troque o armazenamento em memória por um banco de dados real e use HTTPS.

---

## 📋 Requisitos

* Node.js **v18** ou superior
* npm **v9** ou superior (ou yarn)

---

## 🚀 Como rodar localmente

1. **Clone o repositório** (ou copie os arquivos para uma pasta)

   ```bash
   git clone https://github.com/your‑username/auth-api.git
   cd auth-api
   ```

2. **Instale as dependências**

   ```bash
   npm install
   # ou, se preferir yarn
   # yarn install
   ```

3. **Configure as variáveis de ambiente**

   Copie o exemplo e ajuste o segredo do JWT:

   ```bash
   cp .env.example .env
   ```

   Edite o arquivo `.env` e coloque um valor forte para `JWT_SECRET`.

4. **Inicie a aplicação**

   ```bash
   npm run dev      # usa nodemon, recarrega ao mudar arquivos
   # ou
   npm start        # modo produção (sem hot‑reload)
   ```

   O servidor ficará escutando em `http://localhost:3000` (ou na porta definida em `.env`).

5. **Teste os endpoints**

   Você pode usar **cURL**, **Postman**, **Insomnia** ou qualquer cliente HTTP.

   ### Register (cadastro)

   ```bash
   curl -X POST http://localhost:3000/api/register \
        -H "Content-Type: application/json" \
        -d '{"name":"Ana","email":"ana@example.com","password":"secret123"}'
   ```

   ### Login (obter token)

   ```bash
   curl -X POST http://localhost:3000/api/login \
        -H "Content-Type: application/json" \
        -d '{"email":"ana@example.com","password":"secret123"}'
   ```

   Resposta (exemplo):

   ```json
   { "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6..." }
   ```

   ### Profile (rota protegida)

   ```bash
   curl http://localhost:3000/api/profile \
        -H "Authorization: Bearer <TOKEN>"
   ```

   Substitua `<TOKEN>` pelo valor retornado no login.

---

## 🛡️ Segurança incorporada

| Recurso | Como está implementado |
|---------|------------------------|
| **Hash de senha** | `bcrypt` com 12 *salt rounds* |
| **JWT** | Assinado com segredo vindo de `process.env.JWT_SECRET` e expira (`process.env.JWT_EXPIRES_IN`, default `1h`) |
| **Middleware de autenticação** | Verifica o header `Authorization: Bearer <token>` e rejeita solicitações inválidas |
| **Headers de segurança** | `helmet()` adiciona `Content‑Security‑Policy`, `X‑Content‑Type‑Options`, `X‑Frame‑Options`, etc. |
| **Desabilita X‑Powered‑By** | `app.disable('x-powered-by')` |
| **Validações básicas** | E‑mail formatado, senha mínima 6 caracteres, checagem de usuário já existente |
| **Nenhum dado sensível enviado** | Nunca retornamos o hash da senha nem o segredo do JWT |

---

## 📦 Estrutura de diretórios

```
src/
 ├─ app.js                # ponto de entrada da aplicação
 ├─ routes/
 │    └─ auth.js          # rotas /register, /login, /profile
 ├─ middleware/
 │    └─ auth.js          # verifica JWT
 ├─ store/
 │    └─ userStore.js     # "banco" em memória
 └─ utils/
      └─ validators.js    # funções de validação simples
```

---

## 🧪 Testes rápidos (opcional)

Instale o **jest** e **supertest** se quiser criar testes automatizados. O código está pronto para ser testado, basta criar um arquivo `tests/auth.test.js` e usar a instância `app` exportada (adicione `module.exports = app;` no final de `src/app.js`).

---

## 📚 Próximos passos (para produção)

1. Trocar o armazenamento em memória por **MongoDB**, **PostgreSQL**, etc.
2. Habilitar **HTTPS** (TLS) e usar **secure cookies** se precisar de sessões.
3. Implementar **refresh tokens** para renovação de JWT.
4. Adicionar **rate limiting** (`express-rate-limit`) e **CORS** configurado.
5. Centralizar mensagens de erro e logs (ex.: `winston`).

---

## 🙋‍♂️ Autor

*Seu Nome* – <seu.email@exemplo.com>  

Licença MIT – sinta‑se livre para usar, modificar e distribuir.

--- 

**Pronto!** Basta seguir o passo a passo do README e a API estará funcionando localmente. Boa codificação