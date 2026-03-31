## 📦 Projeto – API simples de usuários com Express

A API oferece três funcionalidades principais:

| Rota | Método | Descrição |
|------|--------|-----------|
| `/register` | **POST** | Cadastra um novo usuário (nome, email, senha). |
| `/login` | **POST** | Autentica o usuário e devolve um **JWT**. |
| `/protected` | **GET** | Rota protegida – só pode ser acessada com um token JWT válido. |

> **Importante:** Todos os dados são mantidos apenas em memória (um `Array`). Quando o servidor for reiniciado, os usuários cadastrados são perdidos. Isso serve apenas como exemplo didático.

---

## 📂 Estrutura de arquivos

```
node-express-auth/
│
├─ package.json
├─ .gitignore
├─ README.md
└─ index.js
```

---

## 🛠️ Como rodar o projeto

1. **Clone ou copie a pasta** para sua máquina.

2. **Instale as dependências**

   ```bash
   npm install
   ```

3. **Inicie o servidor**

   ```bash
   node index.js
   ```

   O servidor ficará escutando em `http://localhost:3000`.

4. **Teste as rotas** (ex.: usando *Postman*, *Insomnia* ou `curl`).

   ```bash
   # Registro
   curl -X POST http://localhost:3000/register \
        -H "Content-Type: application/json" \
        -d '{"name":"Ana","email":"ana@example.com","password":"123456"}'

   # Login
   curl -X POST http://localhost:3000/login \
        -H "Content-Type: application/json" \
        -d '{"email":"ana@example.com","password":"123456"}'

   # Acesso à rota protegida (substitua <TOKEN> pelo token retornado no login)
   curl -X GET http://localhost:3000/protected \
        -H "Authorization: Bearer <TOKEN>"
   ```

---

## 📦 Código completo

### `package.json`

```json
{
  "name": "node-express-auth",
  "version": "1.0.0",
  "description": "API simples com registro, login e rota protegida usando Express e JWT (armazenamento em memória).",
  "main": "index.js",
  "scripts": {
    "start": "node index.js"
  },
  "keywords": ["express", "jwt", "auth", "nodejs", "in-memory"],
  "author": "Seu Nome",
  "license": "MIT",
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "express": "^4.18.2",
    "jsonwebtoken": "^9.0.0"
  }
}
```

### `.gitignore`

```
node_modules
.env
```

### `index.js`

```js
// index.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;

// ---------------------------------------------------
// Configurações
// ---------------------------------------------------
app.use(express.json()); // parse JSON bodies

// Segredo usado para assinar os tokens JWT.
// Em produção, guarde isso em uma variável de ambiente.
const JWT_SECRET = 's3cr3t_k3y_change_me';

// ---------------------------------------------------
// "Banco de dados" em memória
// ---------------------------------------------------
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

// ---------------------------------------------------
// Middleware de autenticação
// ---------------------------------------------------
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  // O header deve ser: "Bearer <token>"
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Token não fornecido' });

  jwt.verify(token, JWT_SECRET, (err, userPayload) => {
    if (err) return res.status(403).json({ error: 'Token inválido' });
    // Anexa os dados do usuário ao request para uso posterior
    req.user = userPayload;
    next();
  });
}

// ---------------------------------------------------
// Rotas
// ---------------------------------------------------

// 1️⃣ Registro de usuário
app.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  // Validações básicas
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
  }

  // Verifica se o email já está cadastrado
  const exists = users.find(u => u.email === email);
  if (exists) {
    return res.status(409).json({ error: 'Email já cadastrado' });
  }

  // Gera hash da senha
  const passwordHash = await bcrypt.hash(password, 10);

  const newUser = {
    id: nextId++,
    name,
    email,
    passwordHash,
  };
  users.push(newUser);

  // Não devolvemos a senha nem o hash
  const { passwordHash: _, ...userWithoutPassword } = newUser;
  res.status(201).json({ message: 'Usuário criado', user: userWithoutPassword });
});

// 2️⃣ Login
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // Validação simples
  if (!email || !password) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios' });
  }

  const user = users.find(u => u.email === email);
  if (!user) {
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }

  // Cria o token JWT (payload mínimo)
  const payload = { id: user.id, name: user.name, email: user.email };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

  res.json({ message: 'Login bem‑sucedido', token });
});

// 3️⃣ Rota protegida
app.get('/protected', authenticateToken, (req, res) => {
  // O middleware já garantiu que o token é válido e colocou o payload em req.user
  res.json({
    message: 'Acesso autorizado à rota protegida!',
    user: req.user,
  });
});

// ---------------------------------------------------
// Inicia o servidor
// ---------------------------------------------------
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});
```

---

## 📚 Explicação rápida dos principais pontos

1. **Armazenamento em memória** – O array `users` funciona como um “banco de dados” temporário. Cada usuário recebe um `id` incremental.

2. **Hash de senha** – Utilizamos `bcryptjs` para nunca armazenar a senha em texto puro. No login, a senha enviada é comparada ao hash armazenado.

3. **JWT (JSON Web Token)** – Após o login, o servidor gera um token assinado com `JWT_SECRET`. O token contém apenas informações mínimas (id, nome, email) e tem validade de 1 hora.

4. **Middleware `authenticateToken`** – Verifica o header `Authorization: Bearer <token>`. Se o token for válido, o payload é colocado em `req.user`, permitindo que a rota protegida acesse os dados do usuário autenticado.

5. **Rotas**  
   - `POST /register` → cria usuário.  
   - `POST /login` → devolve token JWT.  
   - `GET /protected` → exige token válido.

---

## ✅ Testes rápidos (usando `curl`)

```bash
# 1️⃣ Registro
curl -X POST http://localhost:3000/register \
     -H "Content-Type: application/json" \
     -d '{"name":"João","email":"joao@example.com","password":"senha123"}'

# 2️⃣ Login (recebe token)
TOKEN=$(curl -s -X POST http://localhost:3000/login \
     -H "Content-Type: application/json" \
     -d '{"email":"joao@example.com","password":"senha123"}' | jq -r .token)

echo "Token obtido: $TOKEN"

# 3️⃣ Acesso à rota protegida
curl -X GET http://localhost:3000/protected \
     -H "Authorization: Bearer $TOKEN"
```

> **Obs.:** O comando acima usa `jq` para extrair o token da resposta JSON. Caso não tenha `jq`, basta copiar o token manualmente.

---

### 🎉 Pronto!  
Com esses poucos arquivos você tem uma API funcional, totalmente em JavaScript, que demonstra registro, login e proteção de rotas usando JWT e armazenamento em memória. Boa codificação