## 📦 Projeto – API simples de usuários com Express & JWT  

A API permite:

1. **Cadastrar usuário** – `POST /register`  
2. **Login** – `POST /login` (recebe um token JWT)  
3. **Rota protegida** – `GET /protected` (exige token válido)

> **Obs:** Todos os dados são mantidos apenas em memória (array JavaScript). Quando o servidor for reiniciado os usuários são perdidos – perfeito para demonstração / testes.

---

## 📂 Estrutura de arquivos

```
simple-auth-api/
│
├─ package.json          # dependências e scripts
├─ index.js              # código da API
├─ .gitignore            # arquivos que não devem ser versionados
└─ README.md            # (este arquivo)
```

---

## 🛠️ Como rodar

1. **Clone ou copie o projeto** para uma pasta vazia.  
2. **Instale as dependências**

   ```bash
   npm install
   ```

3. **Inicie o servidor**

   ```bash
   npm start
   ```

   O servidor ficará escutando em `http://localhost:3000`.

4. **Teste a API** (exemplo usando `curl`)

   ```bash
   # 1️⃣ Registro
   curl -X POST http://localhost:3000/register \
        -H "Content-Type: application/json" \
        -d '{"username":"alice","password":"secret"}'

   # 2️⃣ Login (recebe o token)
   curl -X POST http://localhost:3000/login \
        -H "Content-Type: application/json" \
        -d '{"username":"alice","password":"secret"}'

   # 3️⃣ Acesso à rota protegida (substitua <TOKEN> pelo token retornado)
   curl http://localhost:3000/protected \
        -H "Authorization: Bearer <TOKEN>"
   ```

---

## 📦 Código completo

### `package.json`

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
  "keywords": ["express", "jwt", "auth", "api", "nodejs"],
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

### `.gitignore`

```
node_modules/
.env
```

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
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey'; // em produção use .env
const JWT_EXPIRES_IN = '1h';

// ---------- "Banco de dados" em memória ----------
/**
 * Cada usuário tem:
 * {
 *   id: Number,
 *   username: String,
 *   passwordHash: String
 * }
 */
const users = [];

// ---------- Helpers ----------
function generateToken(user) {
  const payload = { id: user.id, username: user.username };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) return res.status(401).json({ message: 'Token ausente' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Token inválido' });
    req.user = user; // adiciona info do usuário à requisição
    next();
  });
}

// ---------- Rotas ----------
/**
 * @route POST /register
 * @desc  Cadastrar novo usuário
 * @body  { username, password }
 */
app.post('/register', async (req, res) => {
  const { username, password } = req.body;

  // validações básicas
  if (!username || !password) {
    return res.status(400).json({ message: 'username e password são obrigatórios' });
  }

  // verifica se já existe
  const exists = users.find(u => u.username === username);
  if (exists) {
    return res.status(409).json({ message: 'Usuário já cadastrado' });
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
 * @body  { username, password }
 */
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  // procura usuário
  const user = users.find(u => u.username === username);
  if (!user) {
    return res.status(401).json({ message: 'Credenciais inválidas' });
  }

  // compara senha
  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) {
    return res.status(401).json({ message: 'Credenciais inválidas' });
  }

  // gera token
  const token = generateToken(user);
  res.json({ token });
});

/**
 * @route GET /protected
 * @desc  Exemplo de rota protegida (requer JWT)
 */
app.get('/protected', authenticateToken, (req, res) => {
  res.json({
    message: `Olá ${req.user.username}, você acessou uma rota protegida!`,
    user: req.user,
  });
});

// ---------- Início ----------
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});
```

---

## 🧪 Testes rápidos (usando **curl**)

```bash
# 1️⃣ Registro
curl -X POST http://localhost:3000/register \
     -H "Content-Type: application/json" \
     -d '{"username":"bob","password":"123456"}'

# 2️⃣ Login → obtém o token
TOKEN=$(curl -s -X POST http://localhost:3000/login \
               -H "Content-Type: application/json" \
               -d '{"username":"bob","password":"123456"}' | jq -r .token)

echo "Token: $TOKEN"

# 3️⃣ Rota protegida
curl http://localhost:3000/protected \
     -H "Authorization: Bearer $TOKEN"
```

> **Dica:** `jq` é opcional, serve apenas para extrair o token da resposta JSON.

---

## 📌 Observações finais

- **Segurança:** Em produção nunca deixe a chave JWT hard‑coded; use variáveis de ambiente (`process.env.JWT_SECRET`).  
- **Persistência:** Como os usuários ficam em memória, reiniciar o servidor limpa tudo. Para um projeto real troque o array por um banco (MongoDB, PostgreSQL, etc.).  
- **Validação:** Este exemplo tem validações mínimas; considere usar bibliotecas como `express-validator` para regras mais robustas.  

Pronto! 🎉 Agora você tem uma API mínima, funcional e pronta para ser estendida. Boa codificação