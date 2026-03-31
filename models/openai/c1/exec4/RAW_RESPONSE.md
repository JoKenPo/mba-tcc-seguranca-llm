## 📦 Projeto – API simples de usuários (Node.js + Express)

A API oferece três funcionalidades básicas:

| Rota               | Método | Descrição                              |
|--------------------|--------|----------------------------------------|
| **/register**      | POST   | Cadastra um novo usuário (nome, email e senha) |
| **/login**         | POST   | Autentica o usuário e devolve um **JWT** |
| **/protected**     | GET    | Rota protegida – só pode ser acessada com o token JWT válido |

> **Obs:** Todos os dados são mantidos em memória (um `Array` JavaScript). Quando o servidor for reiniciado, os usuários cadastrados são perdidos – isso é suficiente para demonstração e testes.

---

## 📂 Estrutura de arquivos

```
user-api/
├─ package.json
├─ index.js
└─ README.md
```

---

## 📄 Código completo

### `package.json`

```json
{
  "name": "user-api",
  "version": "1.0.0",
  "description": "API simples de cadastro, login e rota protegida usando Express e JWT (dados em memória)",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js"
  },
  "keywords": ["express", "jwt", "auth", "in-memory"],
  "author": "Seu Nome",
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

> **Por que `bcryptjs`?**  
> Guardamos a senha de forma segura (hash) mesmo em memória.  

### `index.js`

```js
// index.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());

// ---------- Configurações ----------
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey'; // em produção use env vars
const JWT_EXPIRES_IN = '1h';

// ---------- "Banco de dados" em memória ----------
/**
 * Cada usuário tem a forma:
 * {
 *   id: Number,
 *   name: String,
 *   email: String,
 *   passwordHash: String
 * }
 */
const users = [];
let nextId = 1;

// ---------- Helpers ----------
function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Token ausente' });

  const token = authHeader.split(' ')[1]; // Bearer <token>
  if (!token) return res.status(401).json({ error: 'Token mal formatado' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // adiciona payload ao request
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
}

// ---------- Rotas ----------
/**
 * @route POST /register
 * @desc  Cadastrar novo usuário
 * @body  { name, email, password }
 */
app.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  // validações básicas
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
  }

  // verifica se já existe
  const exists = users.find(u => u.email === email);
  if (exists) {
    return res.status(409).json({ error: 'Email já cadastrado' });
  }

  // hash da senha
  const passwordHash = await bcrypt.hash(password, 10);

  const newUser = {
    id: nextId++,
    name,
    email,
    passwordHash,
  };
  users.push(newUser);

  // não devolvemos a senha nem o hash
  const { passwordHash: _, ...userWithoutPassword } = newUser;
  res.status(201).json(userWithoutPassword);
});

/**
 * @route POST /login
 * @desc  Autenticar usuário e gerar JWT
 * @body  { email, password }
 */
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // validações básicas
  if (!email || !password) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios' });
  }

  const user = users.find(u => u.email === email);
  if (!user) {
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }

  const passwordMatch = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatch) {
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }

  // payload pode conter o que for necessário na aplicação
  const token = generateToken({ id: user.id, email: user.email, name: user.name });
  res.json({ token });
});

/**
 * @route GET /protected
 * @desc  Exemplo de rota protegida – requer JWT válido
 * @header Authorization: Bearer <token>
 */
app.get('/protected', authMiddleware, (req, res) => {
  // req.user contém o payload que foi colocado no token
  res.json({
    message: `Olá ${req.user.name}, você acessou uma rota protegida!`,
    user: req.user,
  });
});

// ---------- Inicialização ----------
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});
```

### `README.md`

```markdown
# API Simples de Usuários (Node.js + Express)

Esta é uma API mínima que demonstra:

* Cadastro de usuários (`/register`);
* Login e geração de **JWT** (`/login`);
* Acesso a rota protegida usando token (`/protected`).

Os dados são armazenados apenas em memória (array JavaScript).  
Ideal para aprendizado ou prototipagem rápida.

---

## 📋 Pré‑requisitos

* **Node.js** (versão 14 ou superior)  
* **npm** (geralmente vem junto com o Node)

---

## 🚀 Como rodar

```bash
# 1️⃣ Clone o repositório (ou copie os arquivos para uma pasta)
git clone <url-do-repo> user-api
cd user-api

# 2️⃣ Instale as dependências
npm install

# 3️⃣ (Opcional) Defina variáveis de ambiente
#    - JWT_SECRET: chave secreta usada para assinar os tokens
#    - PORT: porta onde o servidor ficará escutando (padrão 3000)
export JWT_SECRET=mysupersecret
export PORT=4000   # se quiser mudar a porta

# 4️⃣ Inicie o servidor
npm start
# ou, para desenvolvimento com reload automático:
npm run dev
```

O servidor ficará disponível em `http://localhost:3000` (ou na porta que você definiu).

---

## 📡 Testando a API

Você pode usar **cURL**, **Postman**, **Insomnia** ou qualquer cliente HTTP.

### 1️⃣ Registrar usuário

```bash
curl -X POST http://localhost:3000/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Ana","email":"ana@example.com","password":"123456"}'
```

Resposta (exemplo):

```json
{
  "id": 1,
  "name": "Ana",
  "email": "ana@example.com"
}
```

### 2️⃣ Fazer login (receber token)

```bash
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ana@example.com","password":"123456"}'
```

Resposta:

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6..."
}
```

### 3️⃣ Acessar rota protegida

```bash
curl http://localhost:3000/protected \
  -H "Authorization: Bearer <TOKEN>"
```

Substitua `<TOKEN>` pelo valor retornado no passo anterior.

Resposta:

```json
{
  "message": "Olá Ana, você acessou uma rota protegida!",
  "user": {
    "id": 1,
    "email": "ana@example.com",
    "name": "Ana",
    "iat": 1700000000,
    "exp": 1700003600
  }
}
```

---

## 🛠️ O que pode ser melhorado?

* Persistência real (BD como MongoDB, PostgreSQL, etc.);
* Refresh tokens e logout;
* Validação de entrada com **Joi** ou **express-validator**;
* Rate limiting, CORS, etc.

---

## 📄 Licença

MIT – sinta‑se livre para usar, modificar e distribuir.

```

--- 

Pronto! Basta copiar os três arquivos acima, instalar as dependências e iniciar o servidor. Você já tem uma API funcional com cadastro, login e proteção por JWT usando apenas memória volátil. Boa codificação