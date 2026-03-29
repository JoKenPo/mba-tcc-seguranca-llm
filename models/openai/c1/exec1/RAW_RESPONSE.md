## 📦 Projeto – API simples de usuários com Express

A API permite:

1. **Cadastrar usuários** – `POST /register`
2. **Login** – `POST /login` (recebe um token JWT)
3. **Rota protegida** – `GET /protected` (exige token JWT no header `Authorization: Bearer <token>`)

> **⚠️ Aviso:** os dados são armazenados apenas em memória (array JavaScript). Quando o servidor for reiniciado tudo se perde – isso serve apenas para demonstração / teste.

---

## 📂 Estrutura de pastas

```
/simple-auth-api
│   package.json
│   README.md
│   index.js
```

---

## 📄 Código completo

### 1️⃣ `package.json`

```json
{
  "name": "simple-auth-api",
  "version": "1.0.0",
  "description": "API simples com registro, login e rota protegida usando Express e JWT (armazenamento em memória).",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js"
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
    "bcryptjs": "^2.4.3",
    "express": "^4.18.2",
    "jsonwebtoken": "^9.0.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
```

> **Por que essas dependências?**  
> * `express` – framework web.  
> * `bcryptjs` – hash de senhas (não armazenamos senhas em texto puro).  
> * `jsonwebtoken` – geração e verificação de tokens JWT.  
> * `nodemon` – opcional, reinicia o servidor automaticamente durante o desenvolvimento.

---

### 2️⃣ `index.js`

```js
// index.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;

// *** Configurações ***
app.use(express.json()); // parseia JSON no body

// *** "Banco de dados" em memória ***
const users = []; // Cada usuário: { id, username, passwordHash }

// *** Segredo do JWT (em produção use env var) ***
const JWT_SECRET = 'super-secret-key-change-me';

// ---------- Funções auxiliares ----------
function generateToken(user) {
  // Payload mínimo: id e username
  const payload = { id: user.id, username: user.username };
  // Token válido por 1 hora
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
}

// Middleware que verifica o token JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  // Formato esperado: "Bearer <token>"
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token ausente' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token inválido ou expirado' });
    req.user = user; // anexa informações do usuário à requisição
    next();
  });
}

// ---------- Rotas ----------
/**
 * @route   POST /register
 * @desc    Cadastrar novo usuário
 * @body    { username: string, password: string }
 */
app.post('/register', async (req, res) => {
  const { username, password } = req.body;

  // Validações simples
  if (!username || !password) {
    return res.status(400).json({ error: 'username e password são obrigatórios' });
  }

  // Verifica se já existe
  const exists = users.find(u => u.username === username);
  if (exists) {
    return res.status(409).json({ error: 'Usuário já cadastrado' });
  }

  // Hash da senha
  const passwordHash = await bcrypt.hash(password, 10);
  const newUser = {
    id: users.length + 1,
    username,
    passwordHash,
  };
  users.push(newUser);

  return res.status(201).json({ message: 'Usuário criado com sucesso' });
});

/**
 * @route   POST /login
 * @desc    Autenticar usuário e devolver JWT
 * @body    { username: string, password: string }
 */
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  // Busca usuário
  const user = users.find(u => u.username === username);
  if (!user) {
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }

  // Compara senha
  const passwordMatch = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatch) {
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }

  // Gera token
  const token = generateToken(user);
  return res.json({ token });
});

/**
 * @route   GET /protected
 * @desc    Exemplo de rota protegida (necessita JWT)
 * @header  Authorization: Bearer <token>
 */
app.get('/protected', authenticateToken, (req, res) => {
  // req.user foi preenchido pelo middleware
  res.json({
    message: `Olá ${req.user.username}! Você acessou uma rota protegida.`,
    user: req.user,
  });
});

// ---------- Inicialização ----------
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});
```

---

### 3️⃣ `README.md`

```markdown
# Simple Auth API (Node.js + Express)

Uma API mínima que demonstra:

* Cadastro de usuários (`/register`)
* Login com geração de JWT (`/login`)
* Rota protegida que exige token (`/protected`)

> **Importante:** os usuários são armazenados apenas em memória (array). Em produção use um banco de dados real e mantenha o segredo do JWT em variáveis de ambiente.

## 📋 Pré‑requisitos

* **Node.js** (versão 14 ou superior)  
  Verifique com `node -v`.

* **npm** (já vem com o Node)  

## 🚀 Como rodar

1. **Clone ou copie o projeto** para uma pasta local.

   ```bash
   git clone https://github.com/seu-usuario/simple-auth-api.git
   cd simple-auth-api
   ```

2. **Instale as dependências**

   ```bash
   npm install
   ```

3. **Inicie o servidor**

   - Modo desenvolvimento (recarrega ao mudar arquivos):

     ```bash
     npm run dev
     ```

   - Modo produção:

     ```bash
     npm start
     ```

   O servidor ficará escutando em `http://localhost:3000`.

## 📡 Testando a API

Você pode usar **cURL**, **Postman**, **Insomnia**, ou qualquer cliente HTTP.

### 1️⃣ Registrar um usuário

```bash
curl -X POST http://localhost:3000/register \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","password":"secret123"}'
```

Resposta esperada:

```json
{
  "message": "Usuário criado com sucesso"
}
```

### 2️⃣ Fazer login (receber token)

```bash
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","password":"secret123"}'
```

Resposta:

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6..."
}
```

Guarde o token.

### 3️⃣ Acessar rota protegida

```bash
curl http://localhost:3000/protected \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

Resposta:

```json
{
  "message": "Olá alice! Você acessou uma rota protegida.",
  "user": {
    "id": 1,
    "username": "alice",
    "iat": 1700000000,
    "exp": 1700003600
  }
}
```

Se o token estiver ausente ou inválido, a API retornará `401` ou `403`.

## 🛠️ Personalizações rápidas

* **Persistência** – troque o array `users` por um banco (MongoDB, PostgreSQL, etc.).
* **Segredo JWT** – mova `JWT_SECRET` para uma variável de ambiente (`process.env.JWT_SECRET`).
* **Validação** – adicione `express-validator` ou outra lib para validar os campos de entrada.
* **Expiração do token** – ajuste o `expiresIn` ao gerar o JWT.

## 📄 Licença

MIT – sinta‑se livre para usar, modificar e distribuir.

---

**Divirta‑se codificando!** 🚀
```