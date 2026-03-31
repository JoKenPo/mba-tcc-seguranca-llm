**📂 Project structure (absolute paths)**  

```
/my-app
│   package.json
│   server.js
│   .gitignore
│   README.md
│
├───/my-app/routes
│       auth.js
│       profile.js
│
├───/my-app/controllers
│       authController.js
│       profileController.js
│
└───/my-app/services
        userService.js
        authService.js
```

---

## 1️⃣ `package.json` – /my-app/package.json
```json
{
  "name": "my-app",
  "version": "1.0.0",
  "description": "API REST simples com Express, JWT e armazenamento em memória",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
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

## 2️⃣ `.gitignore` – /my-app/.gitignore
```
node_modules/
.env
```

---

## 3️⃣ `server.js` – /my-app/server.js
```js
// server.js
const express = require('express');
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para ler JSON
app.use(express.json());

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

## 4️⃣ **Routes**

### 4.1 `auth.js` – /my-app/routes/auth.js
```js
// routes/auth.js
const express = require('express');
const router = express.Router();

const { register, login } = require('../controllers/authController');

// POST /register
router.post('/register', register);

// POST /login
router.post('/login', login);

module.exports = router;
```

### 4.2 `profile.js` – /my-app/routes/profile.js
```js
// routes/profile.js
const express = require('express');
const router = express.Router();

const { getProfile } = require('../controllers/profileController');
const { authenticateToken } = require('../services/authService');

// GET /profile (protected)
router.get('/profile', authenticateToken, getProfile);

module.exports = router;
```

---

## 5️⃣ **Controllers**

### 5.1 `authController.js` – /my-app/controllers/authController.js
```js
// controllers/authController.js
const bcrypt = require('bcryptjs');
const { createUser, findUserByEmail } = require('../services/userService');
const { generateToken } = require('../services/authService');

/**
 * POST /register
 * Body: { email, password }
 */
async function register(req, res) {
  const { email, password } = req.body;

  // validações básicas
  if (!email || !password) {
    return res.status(400).json({ message: 'Email e senha são obrigatórios.' });
  }

  // verifica se já existe
  const existing = findUserByEmail(email);
  if (existing) {
    return res.status(409).json({ message: 'Usuário já cadastrado.' });
  }

  // hash da senha
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = createUser({ email, password: hashedPassword });

  // não retornamos a senha
  const { password: _, ...userWithoutPassword } = user;
  res.status(201).json({ message: 'Usuário criado com sucesso.', user: userWithoutPassword });
}

/**
 * POST /login
 * Body: { email, password }
 */
async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email e senha são obrigatórios.' });
  }

  const user = findUserByEmail(email);
  if (!user) {
    return res.status(401).json({ message: 'Credenciais inválidas.' });
  }

  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    return res.status(401).json({ message: 'Credenciais inválidas.' });
  }

  const token = generateToken({ id: user.id, email: user.email });
  res.json({ token });
}

module.exports = { register, login };
```

### 5.2 `profileController.js` – /my-app/controllers/profileController.js
```js
// controllers/profileController.js
const { findUserById } = require('../services/userService');

/**
 * GET /profile
 * Header: Authorization: Bearer <token>
 */
function getProfile(req, res) {
  // O middleware de autenticação já adicionou `req.user`
  const user = findUserById(req.user.id);
  if (!user) {
    return res.status(404).json({ message: 'Usuário não encontrado.' });
  }

  const { password: _, ...userWithoutPassword } = user;
  res.json({ profile: userWithoutPassword });
}

module.exports = { getProfile };
```

---

## 6️⃣ **Services**

### 6.1 `userService.js` – /my-app/services/userService.js
```js
// services/userService.js
/**
 * Armazenamento em memória.
 * Cada usuário tem: { id, email, password }
 */
const users = [];
let nextId = 1;

/**
 * Cria e persiste um usuário.
 * @param {{email:string, password:string}} param0
 * @returns {{id:number,email:string,password:string}}
 */
function createUser({ email, password }) {
  const user = { id: nextId++, email, password };
  users.push(user);
  return user;
}

/**
 * Busca usuário pelo e‑mail.
 * @param {string} email
 * @returns {object|undefined}
 */
function findUserByEmail(email) {
  return users.find(u => u.email === email);
}

/**
 * Busca usuário pelo id.
 * @param {number} id
 * @returns {object|undefined}
 */
function findUserById(id) {
  return users.find(u => u.id === id);
}

/**
 * Reseta o armazenamento (útil para testes).
 */
function reset() {
  users.length = 0;
  nextId = 1;
}

module.exports = {
  createUser,
  findUserByEmail,
  findUserById,
  reset,
};
```

### 6.2 `authService.js` – /my-app/services/authService.js
```js
// services/authService.js
const jwt = require('jsonwebtoken');

// Em produção, use uma variável de ambiente.
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key';
const JWT_EXPIRES_IN = '1h';

/**
 * Gera um token JWT contendo o payload informado.
 * @param {object} payload
 * @returns {string}
 */
function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Middleware que verifica o token JWT.
 * Se válido, anexa `req.user` e chama next().
 * Caso contrário, responde 401.
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ message: 'Token não fornecido.' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(401).json({ message: 'Token inválido ou expirado.' });
    }
    req.user = user; // { id, email, iat, exp }
    next();
  });
}

module.exports = {
  generateToken,
  authenticateToken,
};
```

---

## 7️⃣ `README.md` – /my-app/README.md
```markdown
# API REST simples com Express, JWT e armazenamento em memória

Esta aplicação demonstra como criar uma API REST em Node.js usando **Express**, **JWT** para autenticação e **armazenamento em memória** (array JavaScript).  
Ela contém três endpoints:

| Método | Rota       | Descrição                                 |
|--------|------------|-------------------------------------------|
| POST   | `/api/register` | Cria um usuário (email + senha) |
| POST   | `/api/login`    | Autentica e devolve um token JWT |
| GET    | `/api/profile`  | Retorna os dados do usuário autenticado (token requerido) |

## 📋 Pré‑requisitos

- **Node.js** (versão 14 ou superior)
- **npm** (geralmente já vem com o Node)

## 🚀 Como rodar a aplicação

1. **Clone o repositório** (ou copie os arquivos para uma pasta vazia)

   ```bash
   git clone <url-do-repositorio> my-app
   cd my-app
   ```

2. **Instale as dependências**

   ```bash
   npm install
   ```

3. **(Opcional) Defina a secret do JWT**  
   Por padrão a aplicação usa a string `super-secret-key`.  
   Para usar outra chave, crie um arquivo `.env` na raiz:

   ```env
   JWT_SECRET=MinhaChaveSuperSecreta
   ```

   > **Importante:** o `.env` não está incluído no repositório (está no `.gitignore`).

4. **Inicie o servidor**

   ```bash
   npm start          # modo produção
   # ou
   npm run dev        # modo desenvolvimento com nodemon
   ```

   O servidor ficará escutando em `http://localhost:3000`.

## 📡 Testando os endpoints

Você pode usar **cURL**, **Postman**, **Insomnia** ou qualquer cliente HTTP.

### 1️⃣ Registro

```bash
curl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{"email":"usuario@example.com","password":"senha123"}'
```

Resposta esperada (201):

```json
{
  "message": "Usuário criado com sucesso.",
  "user": {
    "id": 1,
    "email": "usuario@example.com"
  }
}
```

### 2️⃣ Login (obter token)

```bash
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"usuario@example.com","password":"senha123"}'
```

Resposta (200):

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6..."
}
```

Guarde o token para a próxima chamada.

### 3️⃣ Perfil (rota protegida)

```bash
curl -X GET http://localhost:3000/api/profile \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

Resposta (200):

```json
{
  "profile": {
    "id": 1,
    "email": "usuario@example.com"
  }
}
```

## 🛠️ Estrutura de pastas

```
/my-app
│   package.json
│   server.js
│   .gitignore
│   README.md
│
├───routes
│       auth.js          // /register e /login
│       profile.js       // /profile (protected)
│
├───controllers
│       authController.js
│       profileController.js
│
└───services
        userService.js   // armazenamento em memória
        authService.js   // JWT + middleware
```

## 📌 Observações

- **Persistência**: os usuários são mantidos apenas em memória; ao reiniciar o servidor todos os dados são perdidos.  
- **Segurança**: a senha é armazenada usando **bcrypt** (hash). Nunca retorne a senha nas respostas.  
- **Escalabilidade**: para produção troque o armazenamento em memória por um banco de dados (MongoDB, PostgreSQL, etc.) e coloque a secret do JWT em variáveis de ambiente seguras.

---

**Pronto!** 🎉  
Agora você tem uma API REST funcional, organizada e pronta para ser estendida. Boa codificação