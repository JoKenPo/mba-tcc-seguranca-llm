## 📂 Estrutura do Projeto

```
my-api/
├─ src/
│  ├─ app.js
│  ├─ routes/
│  │   ├─ auth.routes.js
│  │   └─ profile.routes.js
│  ├─ controllers/
│  │   ├─ auth.controller.js
│  │   └─ profile.controller.js
│  └─ services/
│      ├─ user.service.js
│      └─ auth.service.js
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

## 2️⃣ `src/app.js`

```js
// src/app.js
const express = require('express');
const bodyParser = require('body-parser');

const authRoutes = require('./routes/auth.routes');
const profileRoutes = require('./routes/profile.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());

// Rotas
app.use('/api', authRoutes);
app.use('/api', profileRoutes);

// Tratamento de rotas não encontradas
app.use((req, res) => {
  res.status(404).json({ message: 'Rota não encontrada' });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
```

---

## 3️⃣ Rotas

### 3.1 `src/routes/auth.routes.js`

```js
// src/routes/auth.routes.js
const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth.controller');

// Registro
router.post('/register', authController.register);

// Login
router.post('/login', authController.login);

module.exports = router;
```

### 3.2 `src/routes/profile.routes.js`

```js
// src/routes/profile.routes.js
const express = require('express');
const router = express.Router();

const profileController = require('../controllers/profile.controller');
const authMiddleware = require('../services/auth.service').verifyToken;

// Rota protegida
router.get('/profile', authMiddleware, profileController.getProfile);

module.exports = router;
```

---

## 4️⃣ Controllers

### 4.1 `src/controllers/auth.controller.js`

```js
// src/controllers/auth.controller.js
const userService = require('../services/user.service');
const authService = require('../services/auth.service');

exports.register = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validação simples
    if (!email || !password) {
      return res.status(400).json({ message: 'Email e senha são obrigatórios' });
    }

    const existing = await userService.findByEmail(email);
    if (existing) {
      return res.status(409).json({ message: 'Usuário já cadastrado' });
    }

    const newUser = await userService.createUser(email, password);
    res.status(201).json({ id: newUser.id, email: newUser.email });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro interno' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email e senha são obrigatórios' });
    }

    const user = await userService.findByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    const passwordMatch = await authService.comparePassword(password, user.passwordHash);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    const token = authService.generateToken({ id: user.id, email: user.email });
    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro interno' });
  }
};
```

### 4.2 `src/controllers/profile.controller.js`

```js
// src/controllers/profile.controller.js
const userService = require('../services/user.service');

exports.getProfile = async (req, res) => {
  // O middleware de autenticação já adicionou `req.user`
  const user = await userService.findById(req.user.id);
  if (!user) {
    return res.status(404).json({ message: 'Usuário não encontrado' });
  }

  // Não retornamos a senha (hash)
  res.json({ id: user.id, email: user.email });
};
```

---

## 5️⃣ Services

### 5.1 `src/services/user.service.js`

```js
// src/services/user.service.js
const bcrypt = require('bcryptjs');

let users = []; // Armazenamento em memória
let nextId = 1;

/**
 * Cria um novo usuário.
 * @param {string} email
 * @param {string} password - senha em texto puro
 * @returns {Promise<Object>}
 */
exports.createUser = async (email, password) => {
  const passwordHash = await bcrypt.hash(password, 10);
  const user = { id: nextId++, email, passwordHash };
  users.push(user);
  return { id: user.id, email: user.email };
};

/**
 * Busca usuário pelo e‑mail.
 * @param {string} email
 * @returns {Promise<Object|undefined>}
 */
exports.findByEmail = async (email) => {
  return users.find((u) => u.email === email);
};

/**
 * Busca usuário pelo id.
 * @param {number} id
 * @returns {Promise<Object|undefined>}
 */
exports.findById = async (id) => {
  return users.find((u) => u.id === id);
};

/**
 * Limpa o armazenamento (útil para testes).
 */
exports._reset = () => {
  users = [];
  nextId = 1;
};
```

### 5.2 `src/services/auth.service.js`

```js
// src/services/auth.service.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const SECRET_KEY = process.env.JWT_SECRET || 'my_super_secret_key';
const EXPIRATION = '1h'; // 1 hora

/**
 * Gera um token JWT contendo o payload informado.
 * @param {Object} payload
 * @returns {string}
 */
exports.generateToken = (payload) => {
  return jwt.sign(payload, SECRET_KEY, { expiresIn: EXPIRATION });
};

/**
 * Verifica o token enviado no header Authorization.
 * Se válido, adiciona `req.user` e chama next().
 */
exports.verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ message: 'Token não fornecido' });
  }

  const token = authHeader.split(' ')[1]; // Espera "Bearer <token>"
  if (!token) {
    return res.status(401).json({ message: 'Token mal formatado' });
  }

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Token inválido ou expirado' });
    }
    req.user = decoded; // { id, email, iat, exp }
    next();
  });
};

/**
 * Compara senha em texto puro com o hash armazenado.
 * @param {string} plain
 * @param {string} hash
 * @returns {Promise<boolean>}
 */
exports.comparePassword = (plain, hash) => {
  return bcrypt.compare(plain, hash);
};
```

---

## 6️⃣ `.gitignore`

```
node_modules/
.env
```

---

## 7️⃣ `README.md`

```markdown
# API REST com Express, JWT e armazenamento em memória

Esta é uma API simples que demonstra:

* Registro de usuários (`POST /api/register`)
* Login retornando um token JWT (`POST /api/login`)
* Acesso a um recurso protegido (`GET /api/profile`) somente com token válido
* Persistência **em memória** (array JavaScript) – nada é salvo em disco ou banco.

## 📋 Requisitos

* **Node.js** (versão 14 ou superior)
* **npm** (ou **yarn**)

## 🚀 Como rodar a aplicação

1. **Clone o repositório** (ou copie os arquivos para uma pasta)

   ```bash
   git clone <url-do-repositorio>
   cd my-api
   ```

2. **Instale as dependências**

   ```bash
   npm install
   # ou, se preferir yarn
   # yarn install
   ```

3. **Inicie o servidor**

   - Modo desenvolvimento (recarrega ao salvar arquivos)  

     ```bash
     npm run dev
     ```

   - Modo produção  

     ```bash
     npm start
     ```

   O servidor será iniciado na porta **3000** (ou na porta definida na variável de ambiente `PORT`).

4. **Teste os endpoints**

   Você pode usar o **cURL**, **Postman**, **Insomnia**, ou qualquer cliente HTTP.

   ### Registro

   ```bash
   curl -X POST http://localhost:3000/api/register \
        -H "Content-Type: application/json" \
        -d '{"email":"usuario@example.com","password":"senha123"}'
   ```

   Resposta (exemplo):

   ```json
   {
     "id": 1,
     "email": "usuario@example.com"
   }
   ```

   ### Login

   ```bash
   curl -X POST http://localhost:3000/api/login \
        -H "Content-Type: application/json" \
        -d '{"email":"usuario@example.com","password":"senha123"}'
   ```

   Resposta (exemplo):

   ```json
   {
     "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6..."
   }
   ```

   ### Acesso ao perfil (rota protegida)

   ```bash
   curl -X GET http://localhost:3000/api/profile \
        -H "Authorization: Bearer <TOKEN-OBTIDO-NO-LOGIN>"
   ```

   Resposta (exemplo):

   ```json
   {
     "id": 1,
     "email": "usuario@example.com"
   }
   ```

## ⚙️ Configurações avançadas

* **Porta** – Defina a variável de ambiente `PORT` para mudar a porta padrão.
* **Segredo JWT** – Por padrão usamos `my_super_secret_key`. Em produção, defina a variável `JWT_SECRET` com um valor forte.

```bash
export PORT=4000
export JWT_SECRET=seu_segredo_muito_forte
npm start
```

## 📦 Estrutura de pastas

```
src/
│
├─ app.js                → ponto de entrada da aplicação
├─ routes/               → definição das rotas
│   ├─ auth.routes.js
│   └─ profile.routes.js
│
├─ controllers/          → lógica de tratamento das requisições
│   ├─ auth.controller.js
│   └─ profile.controller.js
│
└─ services/             → camada de negócio (usuários, JWT, etc.)
    ├─ user.service.js
    └─ auth.service.js
```

## 🧪 Testes rápidos (opcional)

Como a persistência é em memória, basta reiniciar o servidor para limpar os usuários cadastrados. Caso queira escrever testes automatizados, basta importar os serviços (`user.service.js`) e usar frameworks como **Jest** ou **Mocha**.

---

**Pronto!** 🎉 Você tem uma API funcional, organizada e pronta para ser estendida (por exemplo, adicionando um banco de dados real ou mais rotas). Boa codificação