**📂 Estrutura do projeto**

```
/my-api
│   package.json
│   .gitignore
│   README.md
│
└───src
    │   app.js
    │
    ├───controllers
    │       authController.js
    │       userController.js
    │
    ├───middleware
    │       authMiddleware.js
    │
    ├───routes
    │       authRoutes.js
    │       userRoutes.js
    │
    └───services
            userService.js
```

---

## 1️⃣ `package.json` – dependências do projeto  

**Caminho:** `/my-api/package.json`

```json
{
  "name": "my-api",
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
    "bcryptjs": "^2.4.3",
    "body-parser": "^1.20.2",
    "express": "^4.18.2",
    "jsonwebtoken": "^9.0.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
```

---

## 2️⃣ `app.js` – ponto de entrada da aplicação  

**Caminho:** `/my-api/src/app.js`

```js
// src/app.js
const express = require('express');
const bodyParser = require('body-parser');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware global
app.use(bodyParser.json());

// Rotas
app.use('/api', authRoutes);   // /api/register, /api/login
app.use('/api', userRoutes);   // /api/profile

// Tratamento de rotas não encontradas
app.use((req, res) => {
  res.status(404).json({ message: 'Rota não encontrada' });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
```

---

## 3️⃣ Serviços – lógica de negócio (armazenamento em memória)  

**Caminho:** `/my-api/src/services/userService.js`

```js
// src/services/userService.js
const bcrypt = require('bcryptjs');

let users = []; // Armazenamento em memória

/**
 * Cria um novo usuário.
 * @param {string} email
 * @param {string} password - senha em texto puro
 * @returns {object} usuário criado (sem a senha hash)
 */
async function createUser(email, password) {
  // Verifica se o e‑mail já existe
  const exists = users.find(u => u.email === email);
  if (exists) {
    throw new Error('Email já cadastrado');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const newUser = {
    id: users.length + 1,
    email,
    passwordHash,
  };
  users.push(newUser);
  // Retorna o usuário sem a hash da senha
  const { passwordHash: _, ...userWithoutPassword } = newUser;
  return userWithoutPassword;
}

/**
 * Busca um usuário pelo e‑mail.
 * @param {string} email
 * @returns {object|null}
 */
function findByEmail(email) {
  return users.find(u => u.email === email) || null;
}

/**
 * Busca um usuário pelo id.
 * @param {number} id
 * @returns {object|null}
 */
function findById(id) {
  return users.find(u => u.id === id) || null;
}

/**
 * Valida a senha informada comparando com o hash armazenado.
 * @param {object} user - objeto retornado por findByEmail
 * @param {string} passwordPlain
 * @returns {boolean}
 */
async function validatePassword(user, passwordPlain) {
  return bcrypt.compare(passwordPlain, user.passwordHash);
}

module.exports = {
  createUser,
  findByEmail,
  findById,
  validatePassword,
};
```

---

## 4️⃣ Controllers – tratamento das requisições  

### 4.1 `authController.js`  

**Caminho:** `/my-api/src/controllers/authController.js`

```js
// src/controllers/authController.js
const jwt = require('jsonwebtoken');
const userService = require('../services/userService');

const JWT_SECRET = 'sua_chave_secreta_aleatoria'; // Em produção, use variável de ambiente
const JWT_EXPIRES_IN = '1h';

/**
 * POST /register
 */
async function register(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ message: 'Email e senha são obrigatórios' });
  }

  try {
    const user = await userService.createUser(email, password);
    return res.status(201).json({ message: 'Usuário criado', user });
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
    return res
      .status(400)
      .json({ message: 'Email e senha são obrigatórios' });
  }

  const user = userService.findByEmail(email);
  if (!user) {
    return res.status(401).json({ message: 'Credenciais inválidas' });
  }

  const isValid = await userService.validatePassword(user, password);
  if (!isValid) {
    return res.status(401).json({ message: 'Credenciais inválidas' });
  }

  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });

  return res.json({ token });
}

module.exports = {
  register,
  login,
};
```

### 4.2 `userController.js`  

**Caminho:** `/my-api/src/controllers/userController.js`

```js
// src/controllers/userController.js
const userService = require('../services/userService');

/**
 * GET /profile
 * Requer autenticação (middleware authMiddleware)
 */
function getProfile(req, res) {
  // O middleware já adicionou req.user (payload do JWT)
  const user = userService.findById(req.user.id);
  if (!user) {
    return res.status(404).json({ message: 'Usuário não encontrado' });
  }

  const { passwordHash, ...userData } = user;
  return res.json({ profile: userData });
}

module.exports = {
  getProfile,
};
```

---

## 5️⃣ Middleware – verificação do token JWT  

**Caminho:** `/my-api/src/middleware/authMiddleware.js`

```js
// src/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'sua_chave_secreta_aleatoria'; // Deve ser a mesma usada no authController

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  // O token deve vir no formato: "Bearer <token>"
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res
      .status(401)
      .json({ message: 'Token não fornecido' });
  }

  jwt.verify(token, JWT_SECRET, (err, payload) => {
    if (err) {
      return res
        .status(403)
        .json({ message: 'Token inválido ou expirado' });
    }
    // payload contém { id, email, iat, exp }
    req.user = payload;
    next();
  });
}

module.exports = {
  authenticateToken,
};
```

---

## 6️⃣ Rotas  

### 6.1 Rotas de autenticação (`/register` e `/login`)  

**Caminho:** `/my-api/src/routes/authRoutes.js`

```js
// src/routes/authRoutes.js
const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');

// POST /api/register
router.post('/register', authController.register);

// POST /api/login
router.post('/login', authController.login);

module.exports = router;
```

### 6.2 Rotas protegidas (`/profile`)  

**Caminho:** `/my-api/src/routes/userRoutes.js`

```js
// src/routes/userRoutes.js
const express = require('express');
const router = express.Router();

const userController = require('../controllers/userController');
const { authenticateToken } = require('../middleware/authMiddleware');

// GET /api/profile  (apenas usuários autenticados)
router.get('/profile', authenticateToken, userController.getProfile);

module.exports = router;
```

---

## 7️⃣ `.gitignore` (opcional)  

**Caminho:** `/my-api/.gitignore`

```
node_modules/
.env
```

---

## 8️⃣ `README.md` – Como rodar a API localmente  

**Caminho:** `/my-api/README.md`

```markdown
# API REST simples com Node.js, Express e JWT

Esta é uma API mínima que demonstra:

- Registro de usuários (`POST /api/register`)
- Login retornando um token JWT (`POST /api/login`)
- Acesso a recurso protegido (`GET /api/profile`)
- Persistência em memória (array JavaScript)
- Estrutura de projeto organizada (routes, controllers, services, middleware)

## 📋 Pré‑requisitos

- **Node.js** (versão 14 ou superior)
- **npm** (geralmente vem junto com o Node)

## 🚀 Instalação e execução

1. **Clone o repositório** (ou copie os arquivos para uma pasta)

   ```bash
   git clone <url-do-repositorio> my-api
   cd my-api
   ```

2. **Instale as dependências**

   ```bash
   npm install
   ```

3. **Inicie a aplicação**

   - Modo desenvolvimento (recarrega ao salvar arquivos):

     ```bash
     npm run dev
     ```

   - Modo produção:

     ```bash
     npm start
     ```

   O servidor será iniciado na porta **3000** (ou na porta definida pela variável de ambiente `PORT`).

4. **Teste os endpoints**

   Você pode usar o **cURL**, **Postman**, **Insomnia**, ou qualquer cliente HTTP.

   ### Registro

   ```bash
   curl -X POST http://localhost:3000/api/register \
        -H "Content-Type: application/json" \
        -d '{"email":"usuario@example.com","password":"senha123"}'
   ```

   ### Login (recebe o token)

   ```bash
   curl -X POST http://localhost:3000/api/login \
        -H "Content-Type: application/json" \
        -d '{"email":"usuario@example.com","password":"senha123"}'
   ```

   Resposta esperada:

   ```json
   { "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6..." }
   ```

   ### Acesso ao perfil (rota protegida)

   Substitua `<TOKEN>` pelo token retornado no login.

   ```bash
   curl -X GET http://localhost:3000/api/profile \
        -H "Authorization: Bearer <TOKEN>"
   ```

   Resposta esperada:

   ```json
   {
     "profile": {
       "id": 1,
       "email": "usuario@example.com"
     }
   }
   ```

## 🛠️ Observações

- **Persistência**: Os usuários são armazenados apenas em memória. Ao reiniciar o servidor, todos os dados são perdidos. Para produção, substitua o `userService` por um banco de dados real.
- **Segurança**: A chave secreta do JWT está hard‑coded (`sua_chave_secreta_aleatoria`). Em ambientes reais, use variáveis de ambiente (`process.env.JWT_SECRET`).
- **Validação**: Este exemplo contém validações básicas. Considere usar bibliotecas como `express-validator` para regras mais robustas.

## 📄 Licença

Este projeto está licenciado sob a licença MIT – sinta‑se livre para usar, modificar e distribuir.

```

---

## ✅ Resumo rápido dos arquivos criados

| Caminho absoluto                     | Descrição                              |
|--------------------------------------|----------------------------------------|
| `/my-api/package.json`               | Dependências e scripts npm             |
| `/my-api/.gitignore`                 | Ignora `node_modules` e arquivos sensíveis |
| `/my-api/README.md`                  | Guia de instalação e uso               |
| `/my-api/src/app.js`                 | Configuração do Express e rotas        |
| `/my-api/src/services/userService.js`| Lógica de negócio (armazenamento em memória) |
| `/my-api/src/controllers/authController.js` | Registro e login |
| `/my-api/src/controllers/userController.js` | Endpoint protegido `/profile` |
| `/my-api/src/middleware/authMiddleware.js` | Verificação do JWT |
| `/my-api/src/routes/authRoutes.js`   | Rotas `/register` e `/login`           |
| `/my-api/src/routes/userRoutes.js`   | Rota `/profile` protegida              |

Pronto! Basta seguir as instruções do `README.md` e a API estará funcionando localmente. Boa codificação