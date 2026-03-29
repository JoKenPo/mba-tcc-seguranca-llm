## 📁 Estrutura do projeto

```
/simple-auth-api
│
├─ /node_modules                # gerado pelo npm install
│
├─ package.json                 # dependências e scripts
├─ package-lock.json            # lockfile (gerado)
│
├─ index.js                     # ponto de entrada da aplicação
│
└─ README.md                    # como rodar o projeto
```

---

## 📦 `package.json`

```json
{
  "name": "simple-auth-api",
  "version": "1.0.0",
  "description": "API simples em Node.js/Express com cadastro, login e rota protegida (armazenamento em memória).",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js"
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

## 🚀 `index.js`

```js
// index.js
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
app.use(express.json());

// ---------- Configurações ----------
const PORT = process.env.PORT || 3000;
const JWT_SECRET = "sua_chave_secreta_aleatoria"; // em produção use env var

// ---------- "Banco de dados" em memória ----------
/**
 * Cada usuário tem a forma:
 * {
 *   id: Number,
 *   username: String,
 *   passwordHash: String
 * }
 */
const users = [];
let nextUserId = 1;

// ---------- Middleware de autenticação ----------
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  // Header esperado: "Bearer <token>"
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Token ausente" });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Token inválido" });
    req.user = user; // payload do token
    next();
  });
}

// ---------- Rotas ----------

// 1️⃣ Cadastro
app.post("/register", async (req, res) => {
  const { username, password } = req.body;

  // validações básicas
  if (!username || !password) {
    return res
      .status(400)
      .json({ error: "username e password são obrigatórios" });
  }

  // verifica se o usuário já existe
  const exists = users.find((u) => u.username === username);
  if (exists) {
    return res.status(409).json({ error: "Usuário já cadastrado" });
  }

  // hash da senha
  const passwordHash = await bcrypt.hash(password, 10);

  const newUser = {
    id: nextUserId++,
    username,
    passwordHash,
  };
  users.push(newUser);

  return res.status(201).json({ message: "Usuário criado com sucesso" });
});

// 2️⃣ Login
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  // validações básicas
  if (!username || !password) {
    return res
      .status(400)
      .json({ error: "username e password são obrigatórios" });
  }

  const user = users.find((u) => u.username === username);
  if (!user) {
    return res.status(401).json({ error: "Credenciais inválidas" });
  }

  const passwordMatch = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatch) {
    return res.status(401).json({ error: "Credenciais inválidas" });
  }

  // gera JWT (payload simples)
  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, {
    expiresIn: "1h",
  });

  return res.json({ token });
});

// 3️⃣ Rota protegida
app.get("/protected", authenticateToken, (req, res) => {
  // req.user vem do middleware
  res.json({
    message: `Olá, ${req.user.username}! Você acessou uma rota protegida.`,
    user: req.user,
  });
});

// ---------- Início do servidor ----------
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});
```

---

## 📖 `README.md`

````markdown
# Simple Auth API (Node.js + Express)

API mínima que permite:

- **Cadastro** de usuários (`POST /register`)
- **Login** e obtenção de JWT (`POST /login`)
- Acesso a **rota protegida** (`GET /protected`) usando o token.

Os dados são armazenados apenas em memória (array JavaScript).  
Ideal para demonstrações ou testes rápidos.

## Requisitos

- **Node.js** (versão 14 ou superior)
- **npm** (vem com o Node)

## Instalação

```bash
# 1️⃣ Clone ou copie o projeto
git clone https://github.com/seu-usuario/simple-auth-api.git
cd simple-auth-api

# 2️⃣ Instale as dependências
npm install
```
````

## Como rodar

```bash
# modo desenvolvimento (recarrega ao mudar arquivos)
npm run dev

# ou modo produção
npm start
```

O servidor iniciará em `http://localhost:3000`.

## Endpoints

| Método | Rota         | Descrição                                                  | Body (JSON)                                 |
| ------ | ------------ | ---------------------------------------------------------- | ------------------------------------------- |
| POST   | `/register`  | Cria um novo usuário                                       | `{ "username": "john", "password": "123" }` |
| POST   | `/login`     | Autentica e devolve um JWT                                 | `{ "username": "john", "password": "123" }` |
| GET    | `/protected` | Rota protegida (necessita `Authorization: Bearer <token>`) | —                                           |

### Exemplo com `curl`

```bash
# 1️⃣ Registrar
curl -X POST http://localhost:3000/register \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","password":"senha123"}'

# 2️⃣ Login (recebe o token)
TOKEN=$(curl -s -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","password":"senha123"}' | jq -r .token)

echo "Token: $TOKEN"

# 3️⃣ Acessar rota protegida
curl -X GET http://localhost:3000/protected \
  -H "Authorization: Bearer $TOKEN"
```

> **Obs.:** O token tem validade de 1 hora. Após esse período, faça login novamente.

## Estrutura de arquivos

```
/simple-auth-api
│
├─ package.json          # dependências e scripts
├─ index.js              # código da API
└─ README.md             # este documento
```

## Próximos passos (opcional)

- Persistir usuários em banco real (MongoDB, PostgreSQL, etc.).
- Utilizar variáveis de ambiente (`process.env.JWT_SECRET`, `process.env.PORT`).
- Implementar refresh token, logout, validação de entrada com Joi/Zod, etc.

---

```

```
