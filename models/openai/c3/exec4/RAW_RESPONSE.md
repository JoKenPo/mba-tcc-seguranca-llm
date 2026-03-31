## 📦 Projeto – API REST de Autenticação (Node.js + Express)

```
auth-api/
├─ src/
│  ├─ routes/
│  │   └─ auth.js          # rotas /register, /login, /profile
│  ├─ middleware/
│  │   └─ auth.js          # middleware de verificação do JWT
│  └─ index.js              # ponto de entrada da aplicação
├─ .env                     # variáveis de ambiente (não versionada)
├─ .gitignore
├─ package.json
├─ package-lock.json
└─ README.md
```

---

## 1️⃣  Dependências

| Pacote | Motivo |
|--------|--------|
| **express** | Framework web |
| **bcryptjs** | Hash seguro de senhas |
| **jsonwebtoken** | Criação e verificação de JWT |
| **dotenv** | Carrega variáveis de ambiente de `.env` |
| **helmet** | Headers de segurança HTTP |
| **cors** | Controle de origem (opcional, mas recomendado) |
| **morgan** | Log de requisições (útil em desenvolvimento) |

> **Dev‑dependency**: `nodemon` – reinicia o servidor automaticamente durante o desenvolvimento.

---

## 2️⃣  Código‑fonte

### `package.json`

```json
{
  "name": "auth-api",
  "version": "1.0.0",
  "description": "API REST simples com registro, login e rotas protegidas usando JWT",
  "main": "src/index.js",
  "type": "commonjs",
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js"
  },
  "keywords": ["express", "jwt", "authentication", "nodejs"],
  "author": "Seu Nome",
  "license": "MIT",
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "helmet": "^7.1.0",
    "jsonwebtoken": "^9.0.2",
    "morgan": "^1.10.0"
  },
  "devDependencies": {
    "nodemon": "^3.1.4"
  }
}
```

### `.gitignore`

```
node_modules/
.env
```

### `.env.example` (copie para `.env` e ajuste)

```
PORT=3000
JWT_SECRET=super_secret_key_change_me
JWT_EXPIRES_IN=1h          # 1h, 30m, 2d etc.
BCRYPT_SALT_ROUNDS=10
```

### `src/index.js`

```js
// src/index.js
require('dotenv').config();               // Carrega .env
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');

const authRoutes = require('./routes/auth');

const app = express();

// ----- Middlewares globais -----
app.use(helmet());                         // Headers de segurança
app.use(cors());                           // Permite requisições de qualquer origem (ajuste conforme necessidade)
app.use(express.json());                  // Parseia JSON no body
app.use(morgan('dev'));                    // Log de requisições (dev)

// ----- Rotas -----
app.use('/api', authRoutes);

// ----- Tratamento de erros genéricos -----
app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Internal Server Error' });
});

// ----- Inicia o servidor -----
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server rodando na porta ${PORT}`);
});
```

### `src/middleware/auth.js` – Middleware de autenticação JWT

```js
// src/middleware/auth.js
const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // Espera o formato: "Bearer <token>"
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token ausente ou mal formatado' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    // Anexa o usuário ao request para uso posterior
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
};

module.exports = authMiddleware;
```

### `src/routes/auth.js` – Rotas de registro, login e perfil

```js
// src/routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// "Banco de dados" em memória
const users = []; // Cada usuário: { id, email, passwordHash, name }

// Helper para gerar JWT
function generateToken(user) {
  const payload = {
    sub: user.id,
    email: user.email,
    name: user.name,
  };

  const options = {
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  };

  return jwt.sign(payload, process.env.JWT_SECRET, options);
}

/**
 * @route   POST /api/register
 * @desc    Cria novo usuário
 * @access  Público
 */
router.post('/register', async (req, res) => {
  const { email, password, name } = req.body;

  // Validações básicas
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'email, password e name são obrigatórios' });
  }

  // Verifica se já existe
  const exists = users.find(u => u.email === email);
  if (exists) {
    return res.status(409).json({ error: 'Usuário já cadastrado' });
  }

  // Hash da senha
  const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS) || 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  const newUser = {
    id: users.length + 1, // simples auto‑incremento
    email,
    name,
    passwordHash,
  };

  users.push(newUser);

  // Opcional: já retorna o token após registro
  const token = generateToken(newUser);

  res.status(201).json({
    message: 'Usuário criado com sucesso',
    token,
  });
});

/**
 * @route   POST /api/login
 * @desc    Autentica usuário e devolve JWT
 * @access  Público
 */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'email e password são obrigatórios' });
  }

  const user = users.find(u => u.email === email);
  if (!user) {
    // Não revela se o e‑mail existe ou não
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) {
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }

  const token = generateToken(user);
  res.json({ token });
});

/**
 * @route   GET /api/profile
 * @desc    Retorna dados do usuário autenticado
 * @access  Protegido (Bearer token)
 */
router.get('/profile', authMiddleware, (req, res) => {
  // req.user vem do middleware
  const user = users.find(u => u.id === req.user.sub);
  if (!user) {
    return res.status(404).json({ error: 'Usuário não encontrado' });
  }

  // Não devolve a hash da senha
  const { passwordHash, ...publicData } = user;
  res.json({ profile: publicData });
});

module.exports = router;
```

---

## 3️⃣  Como executar a API localmente

### Pré‑requisitos

- **Node.js** (versão 18 ou superior) e **npm** instalados.
- (Opcional) **Git** para clonar o repositório.

### Passo a passo

1. **Clone o repositório** (ou copie os arquivos para uma pasta nova)

   ```bash
   git clone https://github.com/SEU_USUARIO/auth-api.git
   cd auth-api
   ```

2. **Instale as dependências**

   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente**

   Copie o exemplo e ajuste conforme necessário:

   ```bash
   cp .env.example .env
   ```

   Edite o arquivo `.env` e **nunca** compartilhe este arquivo publicamente.  
   Exemplo:

   ```env
   PORT=3000
   JWT_SECRET=MinhaChaveSuperSecreta123!
   JWT_EXPIRES_IN=2h
   BCRYPT_SALT_ROUNDS=12
   ```

4. **Inicie a aplicação**

   - **Modo desenvolvimento (com hot‑reload):**

     ```bash
     npm run dev
     ```

   - **Modo produção:**

     ```bash
     npm start
     ```

   O servidor ficará escutando em `http://localhost:3000` (ou na porta definida em `PORT`).

### Testando as rotas

Você pode usar **cURL**, **Postman**, **Insomnia** ou qualquer cliente HTTP.

#### 1️⃣ Registro

```bash
curl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"Secret123","name":"Alice"}'
```

Resposta (exemplo):

```json
{
  "message": "Usuário criado com sucesso",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6..."
}
```

#### 2️⃣ Login

```bash
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"Secret123"}'
```

Resposta:

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5