**📁 Project structure (absolute paths)**  

```
/home/your‑user/simple-auth-api/
│
├─ /home/your‑user/simple-auth-api/package.json
├─ /home/your‑user/simple-auth-api/index.js
└─ /home/your‑user/simple-auth-api/README.md
```

---

## 1️⃣ `package.json`  

```json
{
  "name": "simple-auth-api",
  "version": "1.0.0",
  "description": "API simples em Node.js/Express com cadastro, login e rota protegida (armazenamento em memória).",
  "main": "index.js",
  "scripts": {
    "start": "node index.js"
  },
  "keywords": [
    "express",
    "jwt",
    "authentication",
    "node"
  ],
  "author": "Your Name",
  "license": "MIT",
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "express": "^4.18.2",
    "jsonwebtoken": "^9.0.0"
  }
}
```

---

## 2️⃣ `index.js`  

```js
// /home/your-user/simple-auth-api/index.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());

// ---------- Config ----------
const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'sua_chave_secreta_aleatoria'; // em produção use env var

// ---------- In‑memory storage ----------
let users = []; // [{ id, username, passwordHash }]

// ---------- Helpers ----------
function generateToken(user) {
  // payload mínimo: id e username
  return jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, {
    expiresIn: '1h',
  });
}

// Middleware para proteger rotas
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) return res.status(401).json({ error: 'Token não fornecido' });

  jwt.verify(token, JWT_SECRET, (err, payload) => {
    if (err) return res.status(403).json({ error: 'Token inválido ou expirado' });
    req.user = payload; // adiciona payload ao request
    next();
  });
}

// ---------- Rotas ----------
/**
 * @route POST /register
 * @desc  Cadastrar novo usuário
 * @body  { username: string, password: string }
 */
app.post('/register', async (req, res) => {
  const { username, password } = req.body;

  // validações simples
  if (!username || !password) {
    return res.status(400).json({ error: 'username e password são obrigatórios' });
  }

  // verifica se já existe
  const exists = users.find((u) => u.username === username);
  if (exists) {
    return res.status(409).json({ error: 'Usuário já cadastrado' });
  }

  // hash da senha
  const passwordHash = await bcrypt.hash(password, 10);
  const newUser = {
    id: users.length + 1,
    username,
    passwordHash,
  };
  users.push(newUser);

  res.status(201).json({ message: 'Usuário criado com sucesso' });
});

/**
 * @route POST /login
 * @desc  Autenticar usuário e gerar JWT
 * @body  { username: string, password: string }
 */
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  // procura usuário
  const user = users.find((u) => u.username === username);
  if (!user) {
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }

  // compara senha
  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) {
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }

  // gera token
  const token = generateToken(user);
  res.json({ token });
});

/**
 * @route GET /protected
 * @desc  Exemplo de rota protegida
 * @header Authorization: Bearer <token>
 */
app.get('/protected', authenticateToken, (req, res) => {
  res.json({
    message: `Olá ${req.user.username}, você acessou uma rota protegida!`,
    userId: req.user.id,
  });
});

// ---------- Start ----------
app.listen(PORT, () => {
  console.log(`🚀 API rodando em http://localhost:${PORT}`);
});
```

---

## 3️⃣ `README.md`  

```markdown
# Simple Auth API (Node.js + Express)

Uma API mínima que permite:

* **Cadastrar** usuários (`POST /register`);
* **Login** e receber um **JWT** (`POST /login`);
* Acessar uma **rota protegida** usando o token (`GET /protected`).

Os dados são mantidos apenas em memória (array JavaScript), portanto são perdidos ao reiniciar o servidor. Ideal para demonstrações ou aprendizado.

## 📦 Pré‑requisitos

- **Node.js** (v14 ou superior) instalado  
  https://nodejs.org/

## 🚀 Como rodar

```bash
# 1️⃣ Clone ou copie o projeto para sua máquina
git clone https://github.com/SEU_USUARIO/simple-auth-api.git   # opcional
cd /home/your-user/simple-auth-api

# 2️⃣ Instale as dependências
npm install

# 3️⃣ Inicie o servidor
npm start
# ou: node index.js
```

O servidor ficará escutando em `http://localhost:3000`.

## 📋 Endpoints

| Método | Rota        | Descrição                              | Body (JSON)                     | Header (para rotas protegidas) |
|--------|-------------|----------------------------------------|---------------------------------|---------------------------------|
| POST   | `/register` | Cria um novo usuário                   | `{ "username": "...", "password": "..." }` | — |
| POST   | `/login`    | Autentica e devolve um JWT              | `{ "username": "...", "password": "..." }` | — |
| GET    | `/protected`| Exemplo de rota que requer autenticação | — | `Authorization: Bearer <seu_token>` |

### Exemplo usando **curl**

```bash
# Registro
curl -X POST http://localhost:3000/register \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","password":"123456"}'

# Login
TOKEN=$(curl -s -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","password":"123456"}' | jq -r .token)

# Acesso à rota protegida
curl http://localhost:3000/protected \
  -H "Authorization: Bearer $TOKEN"
```

## 🛠️ O que pode ser melhorado?

- Persistência real (Banco de dados);
- Variáveis de ambiente para a chave secreta (`process.env.JWT_SECRET`);
- Refresh tokens, logout, blacklist de tokens, etc.;
- Validação de entrada com **Joi** ou **express-validator**.

---

**Licença:** MIT – sinta‑se livre para usar, modificar e distribuir.  

---  

*Feito com ❤️ por você.*