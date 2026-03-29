# 📘 README – API REST Segura em Node.js (Express)

## Visão geral
Esta API oferece três endpoints básicos:

| Método | Rota       | Descrição                              |
|--------|------------|----------------------------------------|
| POST   | `/register`| Cadastro de usuário (hash de senha)  |
| POST   | `/login`   | Autenticação – devolve JWT             |
| GET    | `/profile`| Dados do usuário autenticado (proteção) |

A aplicação **não usa banco de dados** – os usuários são mantidos em memória (array) apenas para fins de demonstração.  
Todo o código está escrito em **JavaScript** (ES2022) e segue boas práticas de segurança.

---

## 📂 Estrutura do projeto

```
/ (raiz)
│
├─ .env                # Variáveis de ambiente (exemplo abaixo)
├─ package.json
├─ index.js            # Servidor Express
└─ README.md           # (este arquivo)
```

---

## ⚙️ Instalação e execução

1. **Clone o repositório** (ou copie os arquivos para uma pasta vazia).

2. **Instale as dependências**

   ```bash
   npm install
   ```

3. **Crie o arquivo `.env`** na raiz do projeto (exemplo abaixo).  
   **⚠️ Nunca commit o `.env` em repositórios públicos!**

   ```dotenv
   PORT=3000
   JWT_SECRET=supersecreto123!@#   # Use um valor aleatório e forte
   JWT_EXPIRES_IN=1h               # Tempo de validade do token
   ```

4. **Inicie a aplicação**

   ```bash
   node index.js
   ```

   O servidor ficará disponível em `http://localhost:3000`.

---

## 📦 Dependências

| Pacote                | Uso |
|-----------------------|-----|
| **express**           | Framework HTTP |
| **dotenv**            | Carrega variáveis de ambiente |
| **bcryptjs**          | Hash seguro de senhas (12 rounds) |
| **jsonwebtoken**      | Criação/validação de JWT |
| **helmet**            | Cabeçalhos de segurança HTTP |
| **cors**              | Controle de origens (CORS) |
| **express-rate-limit**| Limitação de requisições (brute‑force) |
| **express-validator**| Validação e sanitização de entrada |

Instalação automática via `npm install`.

---

## 🛡️ Principais medidas de segurança implementadas

| Medida | Por quê? |
|--------|----------|
| **Hash de senha com bcrypt (12 rounds)** | Garante que senhas não são armazenadas em texto puro e dificulta ataques de força‑bruta. |
| **JWT assinado com segredo forte (variável de ambiente)** | Impede que tokens sejam forjados. |
| **Expiração do JWT (`1h`)** | Reduz a janela de exploração caso o token seja comprometido. |
| **`helmet`** | Define cabeçalhos HTTP que mitigam XSS, click‑jacking, MIME sniffing, etc. |
| **Rate limiting (100 req/min por IP)** | Diminui risco de ataques de força‑bruta e DoS. |
| **Validação e sanitização de entrada (`express-validator`)** | Evita injeções e dados mal‑formados. |
| **`Authorization: Bearer <token>`** | Token enviado via header, não em cookies ou query strings (evita vazamento em logs). |
| **Variáveis de ambiente obrigatórias** | Falha ao iniciar se `JWT_SECRET` não estiver definido. |
| **Erros genéricos ao cliente** | Não expõe detalhes internos (stack trace). |

---

## 📄 Código completo (corrigido)

```javascript
// index.js
require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');

const app = express();

// ---------- Configurações básicas ----------
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

if (!JWT_SECRET) {
  console.error('❌ ERRO: JWT_SECRET não definido no .env');
  process.exit(1);
}

// ---------- Middlewares de segurança ----------
app.use(helmet()); // Cabeçalhos HTTP seguros
app.use(cors({ origin: '*', methods: ['GET', 'POST'] })); // Ajuste conforme necessidade
app.use(express.json());

// Limitação de requisições (100 req/min por IP)
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Muitas requisições, tente novamente mais tarde.' },
  })
);

// ---------- "Banco de dados" em memória ----------
/**
 * Estrutura do usuário:
 * {
 *   id: Number,
 *   username: String,
 *   email: String,
 *   passwordHash: String
 * }
 */
const users = [];

// ---------- Funções auxiliares ----------
function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// Middleware de autenticação JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ error: 'Token ausente.' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token inválido ou expirado.' });
    req.user = user; // { id, email }
    next();
  });
}

// ---------- Rotas ----------
/**
 * @route   POST /register
 * @desc    Cadastro de novo usuário
 * @access  Público
 */
app.post(
  '/register',
  [
    body('username')
      .trim()
      .isLength({ min: 3, max: 30 })
      .withMessage('Nome de usuário deve ter entre 3 e 30 caracteres.'),
    body('email').isEmail().normalizeEmail().withMessage('E‑mail inválido.'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Senha deve ter no mínimo 8 caracteres.'),
  ],
  (req, res) => {
    // Validação de entrada
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password } = req.body;

    // Verifica se o e‑mail já está cadastrado
    const exists = users.find((u) => u.email === email);
    if (exists) {
      return res.status(409).json({ error: 'E‑mail já cadastrado.' });
    }

    // Hash da senha (12 rounds)
    const passwordHash = bcrypt.hashSync(password, 12);

    const newUser = {
      id: users.length + 1,
      username,
      email,
      passwordHash,
    };
    users.push(newUser);

    return res.status(201).json({ message: 'Usuário criado com sucesso.' });
  }
);

/**
 * @route   POST /login
 * @desc    Autenticação – devolve JWT
 * @access  Público
 */
app.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('E‑mail inválido.'),
    body('password').exists().withMessage('Senha é obrigatória.'),
  ],
  (req, res) => {
    // Validação de entrada
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    const user = users.find((u) => u.email === email);
    if (!user) {
      // Resposta genérica para não revelar se o e‑mail existe
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    const passwordMatch = bcrypt.compareSync(password, user.passwordHash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    const token = generateToken({ id: user.id, email: user.email });
    return res.json({ token });
  }
);

/**
 * @route   GET /profile
 * @desc    Dados do usuário autenticado
 * @access  Protegido (JWT)
 */
app.get('/profile', authenticateToken, (req, res) => {
  const user = users.find((u) => u.id === req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'Usuário não encontrado.' });
  }

  // Não expõe passwordHash
  const { passwordHash, ...publicData } = user;
  return res.json({ user: publicData });
});

// ---------- Tratamento de erros genéricos ----------
app.use((err, req, res, next) => {
  console.error(err);
  return res.status(500).json({ error: 'Erro interno do servidor.' });
});

// ---------- Inicialização ----------
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
```

```json
// package.json
{
  "name": "api-segura-express",
  "version": "1.0.0",
  "description": "API REST simples com registro, login e JWT, usando boas práticas de segurança.",
  "main": "index.js",
  "scripts": {
    "start": "node index.js"
  },
  "author": "Seu Nome",
  "license": "MIT",
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "express-rate-limit": "^7.4.0",
    "express-validator": "^7.0.1",
    "helmet": "^7.1.0",
    "jsonwebtoken": "^9.0.2"
  }
}
```

```dotenv
# .env (exemplo)
PORT=3000
JWT_SECRET=supersecreto123!@#   # Gere um valor aleatório e forte
JWT_EXPIRES_IN=1h
```

---

## 🧪 Testes rápidos (usando `curl`)

```bash
# Registro
curl -X POST http://localhost:3000/register \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","email":"alice@example.com","password":"SenhaForte123"}'

# Login (recebe token)
TOKEN=$(curl -s -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"SenhaForte123"}' | jq -r .token)

# Acesso ao profile (autenticado)
curl -X GET http://localhost:3000/profile \
  -H "Authorization: Bearer $TOKEN"
```

---

## ✅ Conclusão

O código acima já incorpora as correções de segurança necessárias:

* **Hash de senha forte** (`bcrypt` com 12 rounds).  
* **JWT** assinado com segredo externo e **expiração curta**.  
* **Middleware de autenticação** robusto.  
* **Helmet**, **CORS**, **rate‑limit** e **validação de entrada** para mitigar vulnerabilidades comuns.  
* **Variáveis de ambiente obrigatórias** – a aplicação falha ao iniciar se o segredo não for fornecido.  

Com essas práticas, a API está pronta para ser usada em ambientes de desenvolvimento ou como base para projetos mais complexos que, posteriormente, migrem para armazenamento persistente (BD) e outras camadas de segurança (HTTPS, refresh tokens, etc.).