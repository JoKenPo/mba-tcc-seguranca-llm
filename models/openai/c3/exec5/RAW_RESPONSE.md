## 📁 Estrutura do projeto (caminhos absolutos)

> **⚠️** Substitua **`/home/usuario/meu‑api`** pelo caminho onde você deseja criar o projeto.

```
/home/usuario/meu-api
│
├─ /home/usuario/meu-api/package.json
├─ /home/usuario/meu-api/.env
├─ /home/usuario/meu-api/server.js
├─ /home/usuario/meu-api/routes/auth.js
├─ /home/usuario/meu-api/middleware/auth.js
├─ /home/usuario/meu-api/models/user.js
└─ /home/usuario/meu-api/README.md
```

---

## 1️⃣ `package.json` – dependências e scripts

**Caminho:** `/home/usuario/meu-api/package.json`

```json
{
  "name": "api-auth-mem",
  "version": "1.0.0",
  "description": "API REST simples com cadastro, login e proteção por JWT (armazenamento em memória).",
  "main": "server.js",
  "type": "commonjs",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "keywords": [],
  "author": "",
  "license": "MIT",
  "dependencies": {
    "bcrypt": "^5.1.1",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "helmet": "^8.0.0",
    "jsonwebtoken": "^9.0.2"
  },
  "devDependencies": {
    "nodemon": "^3.1.4"
  }
}
```

---

## 2️⃣ Variáveis de ambiente

**Caminho:** `/home/usuario/meu-api/.env`

```dotenv
# Segredo usado para assinar os tokens JWT.
JWT_SECRET=supersecreto12345

# Tempo de validade do token (ex.: 1h, 30m, 2d)
JWT_EXPIRES_IN=1h

# Porta onde a API será executada (padrão 3000)
PORT=3000
```

> **⚠️** Nunca versionar o arquivo `.env` em repositórios públicos.  
> Para produção, use um gerenciador de segredos ou variáveis de ambiente do seu serviço de hospedagem.

---

## 3️⃣ Modelo de usuário (armazenamento em memória)

**Caminho:** `/home/usuario/meu-api/models/user.js`

```js
/**
 * Simula um "banco de dados" em memória.
 * Cada usuário tem: id, name, email, passwordHash
 */

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
 * Busca usuário pelo id.
 * @param {string} id
 * @returns {object|undefined}
 */
function findById(id) {
  return users.find(u => u.id === id);
}

/**
 * Cria e persiste um novo usuário.
 * @param {object} payload { id, name, email, passwordHash }
 * @returns {object} usuário criado (sem a hash)
 */
function create({ id, name, email, passwordHash }) {
  const user = { id, name, email, passwordHash };
  users.push(user);
  // Retorna cópia sem a senha hash para não vazar
  const { passwordHash: _, ...safeUser } = user;
  return safeUser;
}

/**
 * Exporta apenas as funções necessárias.
 */
module.exports = {
  findByEmail,
  findById,
  create,
};
```

---

## 4️⃣ Middleware de autenticação (JWT)

**Caminho:** `/home/usuario/meu-api/middleware/auth.js`

```js
const jwt = require('jsonwebtoken');
const { findById } = require('../models/user');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Middleware que verifica o header Authorization: Bearer <token>
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

    // payload contém { sub: userId, iat, exp }
    const user = findById(payload.sub);
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Remove a hash antes de expor ao resto da aplicação
    const { passwordHash, ...safeUser } = user;
    req.user = safeUser;
    next();
  });
}

module.exports = authenticateToken;
```

---

## 5️⃣ Rotas de autenticação (register, login, profile)

**Caminho:** `/home/usuario/meu-api/routes/auth.js`

```js
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { findByEmail, create } = require('../models/user');
const authenticateToken = require('../middleware/auth');
require('dotenv').config();

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
const SALT_ROUNDS = 12; // número de rounds do bcrypt

/**
 * @route POST /register
 * @desc Cria novo usuário
 * @body { name, email, password }
 */
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  // Validações básicas
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Nome, e‑mail e senha são obrigatórios' });
  }

  if (findByEmail(email)) {
    return res.status(409).json({ error: 'E‑mail já cadastrado' });
  }

  try {
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = create({
      id: uuidv4(),
      name,
      email,
      passwordHash,
    });

    return res.status(201).json({ message: 'Usuário criado', user });
  } catch (err) {
    console.error('Erro ao registrar usuário:', err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * @route POST /login
 * @desc Autentica usuário e devolve JWT
 * @body { email, password }
 */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'E‑mail e senha são obrigatórios' });
  }

  const user = findByEmail(email);
  if (!user) {
    // Não revelar se o e‑mail existe
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }

  try {
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const token = jwt.sign(
      { sub: user.id }, // sub = subject (identificador do usuário)
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.json({ token });
  } catch (err) {
    console.error('Erro ao fazer login:', err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * @route GET /profile
 * @desc Rota protegida – devolve dados do usuário autenticado
 * @header Authorization: Bearer <token>
 */
router.get('/profile', authenticateToken, (req, res) => {
  // `req.user` já foi preenchido pelo middleware
  return res.json({ profile: req.user });
});

module.exports = router;
```

---

## 6️⃣ Servidor principal

**Caminho:** `/home/usuario/meu-api/server.js`

```js
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const authRoutes = require('./routes/auth');
require('dotenv').config();

const app = express();

// ----- Configurações de segurança -----
app.use(helmet());                     // Headers de segurança padrão
app.disable('x-powered-by');           // Esconde tecnologia do servidor
app.use(cors({ origin: '*', methods: ['GET','POST'] })); // Ajuste conforme necessidade

// ----- Middleware padrão -----
app.use(express.json());               // Parse JSON bodies

// ----- Rotas -----
app.use('/', authRoutes);

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

## 7️⃣ README – Como executar a API localmente

**Caminho:** `/home/usuario/meu-api/README.md`

```markdown
# API REST de Cadastro, Login e Perfil (Node.js + Express)

Esta é uma implementação mínima, porém segura, de uma API que permite:

| Método | Rota      | Descrição                     | Protegida? |
|--------|-----------|------------------------------|------------|
| POST   | `/register` | Cria um novo usuário          | ❌ |
| POST   | `/login`    | Autentica e devolve JWT       | ❌ |
| GET    | `/profile`  | Retorna dados do usuário logado | ✅ (Bearer token) |

## 📋 Requisitos

- **Node.js** (versão 18 ou superior)
- **npm** (ou **yarn**)

## 🚀 Instalação e execução

1. **Clone ou copie o projeto** para o diretório desejado:

   ```bash
   cd /home/usuario
   git clone <url-do-repositorio> meu-api   # ou simplesmente copie os arquivos
   cd meu-api
   ```

2. **Instale as dependências**:

   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente**:

   Crie um arquivo `.env` na raiz do projeto (já incluído como exemplo) e defina:

   ```dotenv
   JWT_SECRET=seuSegredoSuperSecreto
   JWT_EXPIRES_IN=1h          # tempo de validade do token
   PORT=3000                  # opcional
   ```

   > **Importante:** Nunca compartilhe o valor de `JWT_SECRET`. Em produção, use um gerenciador de segredos.

4. **Inicie a API**:

   - Modo desenvolvimento (recarrega ao mudar arquivos):

     ```bash
     npm run dev
     ```

   - Modo produção:

     ```bash
     npm start
     ```

   A aplicação ficará disponível em `http://localhost:3000`.

## 📡 Testando as rotas

Você pode usar **cURL**, **Postman**, **Insomnia** ou qualquer cliente HTTP.

### 1️⃣ Registro

```bash
curl -X POST http://localhost:3000/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Ana Silva","email":"ana@example.com","password":"senhaForte123"}'
```

Resposta esperada (código 201):

```json
{
  "message": "Usuário criado",
  "user": {
    "id": "c3f5e8b2-9c1a-4d6e-9f2a-1b2c3d4e5f6a",
    "name": "Ana Silva",
    "email": "ana@example.com"
  }
}
```

### 2️⃣ Login

```bash
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ana@example.com","password":"senhaForte123"}'
```

Resposta (código 200):

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6..."
}
```

Guarde o token para a próxima chamada.

### 3️⃣ Acesso ao perfil (rota protegida)

```bash
curl -X GET http://localhost:3000/profile \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

Resposta (código 200):

```json
{
  "profile": {
    "id": "c3f5e8b2-9c1a-4d6e-9