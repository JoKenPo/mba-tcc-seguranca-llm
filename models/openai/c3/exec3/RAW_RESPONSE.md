**Estrutura do projeto**

```
/api-jwt-auth
│
├─ /src
│   ├─ app.js
│   ├─ routes
│   │   ├─ auth.js
│   │   └─ profile.js
│   ├─ middleware
│   │   └─ auth.js
│   └─ utils
│       └─ users.js
│
├─ .env.example
├─ .gitignore
├─ package.json
├─ package-lock.json
└─ README.md
```

---

## 1️⃣ `package.json` – dependências e scripts  

**Caminho:** `/api-jwt-auth/package.json`

```json
{
  "name": "api-jwt-auth",
  "version": "1.0.0",
  "description": "API REST simples com registro, login e rota protegida usando JWT e armazenamento em memória",
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
    "nodejs"
  ],
  "author": "Seu Nome",
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

## 2️⃣ `.env.example` – variáveis de ambiente  

**Caminho:** `/api-jwt-auth/.env.example`

```dotenv
# Chave secreta usada para assinar os tokens JWT.
# **NUNCA** commit a versão real deste arquivo com o valor real da chave.
JWT_SECRET=supersecretkey123

# Tempo de validade do token (ex.: 1h, 30m, 2d)
JWT_EXPIRES_IN=1h

# Porta onde a aplicação será executada (padrão 3000)
PORT=3000
```

> Copie este arquivo para `.env` e altere os valores conforme necessário.

---

## 3️⃣ `src/utils/users.js` – “banco de dados” em memória  

**Caminho:** `/api-jwt-auth/src/utils/users.js`

```js
// Armazena usuários em memória.
// Cada usuário tem: id, username, passwordHash
const users = [];

let nextId = 1;

/**
 * Busca um usuário pelo nome de usuário.
 * @param {string} username
 * @returns {object|undefined}
 */
function findByUsername(username) {
  return users.find(u => u.username === username);
}

/**
 * Busca um usuário pelo id.
 * @param {number} id
 * @returns {object|undefined}
 */
function findById(id) {
  return users.find(u => u.id === id);
}

/**
 * Cria e armazena um novo usuário.
 * @param {string} username
 * @param {string} passwordHash
 * @returns {object} usuário criado
 */
function createUser(username, passwordHash) {
  const user = {
    id: nextId++,
    username,
    passwordHash,
  };
  users.push(user);
  return user;
}

/**
 * Reseta o armazenamento (útil para testes).
 */
function reset() {
  users.length = 0;
  nextId = 1;
}

module.exports = {
  findByUsername,
  findById,
  createUser,
  reset,
};
```

---

## 4️⃣ `src/middleware/auth.js` – verificação do JWT  

**Caminho:** `/api-jwt-auth/src/middleware/auth.js`

```js
const jwt = require('jsonwebtoken');
const { findById } = require('../utils/users');

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // Espera o formato: "Bearer <token>"
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = findById(payload.sub);
    if (!user) {
      return res.status(401).json({ error: 'Usuário não encontrado' });
    }

    // Anexa o usuário ao request para uso posterior
    req.user = { id: user.id, username: user.username };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
};

module.exports = authMiddleware;
```

---

## 5️⃣ `src/routes/auth.js` – rotas de registro e login  

**Caminho:** `/api-jwt-auth/src/routes/auth.js`

```js
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { findByUsername, createUser } = require('../utils/users');

const router = express.Router();

/**
 * @route POST /register
 * @desc Registra um novo usuário
 * @body { username: string, password: string }
 */
router.post('/register', async (req, res) => {
  const { username, password } = req.body;

  // Valida entrada mínima
  if (!username || !password) {
    return res.status(400).json({ error: 'username e password são obrigatórios' });
  }

  // Verifica se já existe
  if (findByUsername(username)) {
    return res.status(409).json({ error: 'Usuário já existe' });
  }

  // Hash da senha (12 salt rounds – balance entre segurança e performance)
  const passwordHash = await bcrypt.hash(password, 12);

  const user = createUser(username, passwordHash);

  // Não devolve a senha nem o hash
  return res.status(201).json({ id: user.id, username: user.username });
});

/**
 * @route POST /login
 * @desc Autentica usuário e devolve JWT
 * @body { username: string, password: string }
 */
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  // Validação básica
  if (!username || !password) {
    return res.status(400).json({ error: 'username e password são obrigatórios' });
  }

  const user = findByUsername(username);
  if (!user) {
    // Não revela se o usuário existe ou não
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }

  const passwordMatch = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatch) {
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }

  // Cria payload mínimo: sub (subject) = id do usuário
  const payload = { sub: user.id };

  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  });

  return res.json({ token });
});

module.exports = router;
```

---

## 6️⃣ `src/routes/profile.js` – rota protegida  

**Caminho:** `/api-jwt-auth/src/routes/profile.js`

```js
const express = require('express');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

/**
 * @route GET /profile
 * @desc Retorna informações do usuário autenticado
 * @access Protegido por JWT
 */
router.get('/profile', authMiddleware, (req, res) => {
  // req.user foi preenchido pelo middleware
  res.json({
    id: req.user.id,
    username: req.user.username,
    message: 'Este é um recurso protegido.',
  });
});

module.exports = router;
```

---

## 7️⃣ `src/app.js` – ponto de entrada da aplicação  

**Caminho:** `/api-jwt-auth/src/app.js`

```js
require('dotenv').config(); // Carrega .env
const express = require('express');
const helmet = require('helmet');
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');

const app = express();

// ---------- Middleware globais ----------
app.use(helmet());                     // Headers de segurança
app.use(express.json());               // Parse JSON body
app.disable('x-powered-by');           // Remove header que indica que é Express

// ---------- Rotas ----------
app.use('/', authRoutes);              // /register e /login
app.use('/', profileRoutes);           // /profile (protegida)

// ---------- Tratamento de rotas não encontradas ----------
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// ---------- Tratamento de erros ----------
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

// ---------- Inicialização ----------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 API rodando em http://localhost:${PORT}`);
});
```

---

## 8️⃣ `.gitignore`  

**Caminho:** `/api-jwt-auth/.gitignore`

```
node_modules/
.env
```

---

## 9️⃣ `README.md` – como executar localmente  

**Caminho:** `/api-jwt-auth/README.md`

```markdown
# API REST de Cadastro, Login e Acesso Autenticado (Node.js + Express)

Esta é uma implementação mínima, porém segura, de um serviço de autenticação usando:

- **Express** como framework HTTP
- **bcrypt** para hash de senhas
- **JWT** (JSON Web Token) com expiração
- **Helmet** para cabeçalhos de segurança
- **Armazenamento em memória** (array) – ideal apenas para demonstração ou testes

## 📂 Estrutura de pastas

```
/api-jwt-auth
│
├─ src/
│   ├─ app.js                # ponto de entrada
│   ├─ routes/
│   │   ├─ auth.js           # /register e /login
│   │   └─ profile.js        # /profile (protegida)
│   ├─ middleware/
│   │   └─ auth.js           # verifica JWT
│   └─ utils/
│       └─ users.js          # "banco" em memória
│
├─ .env.example              # variáveis de ambiente (copiar para .env)
├─ .gitignore
├─ package.json
└─ README.md
```

## ⚙️ Pré‑requisitos

- **Node.js** (versão 18 ou superior)  
- **npm** (geralmente já vem com o Node)

## 🚀 Como rodar a aplicação

1. **Clone o repositório** (ou copie os arquivos para uma pasta local)

   ```bash
   git clone https://github.com/SEU_USUARIO/api-jwt-auth.git
   cd api-jwt-auth
   ```

2. **Instale as dependências**

   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente**

   ```bash
   cp .env.example .env
   ```

   Edite o arquivo `.env` e altere `JWT_SECRET` para um valor forte e aleatório.
   Você também pode mudar `JWT_EXPIRES_IN` (ex.: `30m`, `2h`, `1d`) e a `PORT`.

4. **Inicie a API**

   - Modo desenvolvimento (recarrega ao salvar arquivos):

     ```bash
     npm run dev
     ```

   - Modo produção:

     ```bash
     npm start
     ```

   A aplicação ficará disponível em `http://localhost:3000` (ou na porta que você definiu).

## 📋 Endpoints

| Método | Rota       | Descrição                              | Corpo (JSON)                     | Protegida |
|--------|------------|----------------------------------------|----------------------------------|-----------|
| POST   | `/register`| Cria um novo usuário                    | `{ "username": "john", "password": "pwd123" }` | ❌ |
| POST   | `/login`   | Autentica e devolve um JWT              | `{ "username": "john", "password": "pwd123" }` | ❌ |
| GET    | `/profile` | Retorna dados do usuário autenticado    | —                                | ✅ (Bearer token) |

### Exemplo de fluxo

```bash
# 1️⃣ Registro
curl -X POST http://localhost:3000/register \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","password":"SuperSecret123"}'

# 2️⃣ Login (recebe o token)
TOKEN=$(curl -s -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","password":"SuperSecret123"}' | jq -r .token)

# 3️⃣ Acesso à rota protegida
curl -X GET http://localhost:3000/profile \
  -H "Authorization: Bearer $TOKEN"
```

## 🔐 Segurança

- **Hash de senhas**: `bcrypt` com 12 salt rounds.
- **JWT**: assinatura HMAC SHA‑256 usando a variável `JWT_SECRET`.
- **Expiração**: configurável via `JWT_EXPIRES_IN`.
- **Headers**: `helmet` adiciona `Content‑Security‑Policy`, `X‑Frame‑Options`, `X‑XSS‑Protection`, etc.
- **Desativado**: header `X-Powered-By` (não revela que é Express).
- **Nenhum** parâmetro ou configuração insegura está habilitado por padrão.

## 🧪 Testes rápidos (opcional)

Como o “banco” está em memória, ao reiniciar a aplicação todos os usuários são perdidos. Isso facilita testes manuais, mas **não** deve ser usado em produção.

## 📦 Deploy

Para ambientes de produção basta:

1. Definir as variáveis de ambiente (`JWT_SECRET`, `PORT`, `JWT_EXPIRES_IN`).
2. Executar `npm install --production`.
3. Iniciar com `npm start` ou via process manager (PM2, Docker, etc.).

> **Importante:** Em produção troque o armazenamento em memória por um banco de dados persistente (PostgreSQL, MongoDB, etc.) e implemente mecanismos de rotação de chaves JWT.

---

**Pronto!** Agora você tem uma API funcional, segura e pronta para ser estendida.