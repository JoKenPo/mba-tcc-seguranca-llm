# Revisão de Segurança e Código Final

Abaixo está o `README.md` com a versão final corrigida após revisão crítica de segurança.

---

````markdown
# Auth API — Node.js + Express

API REST com registro, login e rota autenticada.  
Revisada sob perspectiva de segurança antes da publicação.

---

## Vulnerabilidades identificadas e corrigidas

| # | Problema | Impacto | Correção aplicada |
|---|----------|---------|-------------------|
| 1 | `bcrypt` com custo 10 (padrão mínimo aceitável, mas ajustável) | Força bruta mais rápida | Custo elevado para 12 |
| 2 | JWT sem algoritmo explícito | Ataque `alg: none` / confusão de algoritmo | `algorithm: 'HS256'` fixado em sign e verify |
| 3 | Segredo JWT fraco ou ausente sem validação na inicialização | Token forjável | Validação obrigatória do `JWT_SECRET` com mínimo de 32 chars no startup |
| 4 | Ausência de rate limiting | Força bruta em `/login` e `/register` | `express-rate-limit` aplicado nas rotas sensíveis |
| 5 | Ausência de validação e sanitização de entrada | Payloads malformados, campos gigantes | `express-validator` com limites de tamanho |
| 6 | Stack trace exposto em erros | Vazamento de informação interna | Handler global retorna mensagem genérica em produção |
| 7 | `helmet` ausente ou mal configurado | Clickjacking, MIME sniffing, etc. | `helmet()` com `contentSecurityPolicy` explícito |
| 8 | Enumeração de usuários via mensagem de erro diferente | Descoberta de e-mails cadastrados | Mensagem de erro unificada em login |
| 9 | Ausência de limite de tamanho no body | DoS por payload gigante | `express.json({ limit: '10kb' })` |
| 10 | `JWT_EXPIRES_IN` sem valor padrão seguro | Token eterno se variável omitida | Default explícito de `'15m'` |
| 11 | Campo `password` retornado no perfil | Vazamento de hash | Campo removido da resposta em `/profile` |
| 12 | Comparação de e-mail case-sensitive | Bypass de unicidade (`User@x.com` ≠ `user@x.com`) | `.toLowerCase()` na normalização |

---

## Estrutura do projeto

```
auth-api/
├── src/
│   ├── server.js          # Entry point
│   ├── app.js             # Express app (separado para testabilidade)
│   ├── config.js          # Variáveis de ambiente validadas
│   ├── middleware/
│   │   ├── auth.js        # Verificação JWT
│   │   └── errorHandler.js
│   ├── routes/
│   │   └── auth.js
│   └── store/
│       └── users.js       # "Banco" em memória
├── .env.example
├── package.json
└── README.md
```

---

## Instalação e execução

```bash
# 1. Instalar dependências
npm install

# 2. Criar arquivo de ambiente
cp .env.example .env

# 3. Editar .env com um segredo forte (mínimo 32 caracteres)
#    Gere com: node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"

# 4. Iniciar em desenvolvimento
npm run dev

# 5. Iniciar em produção
npm start
```

---

## Variáveis de ambiente

```env
# .env.example
PORT=3000
NODE_ENV=development

# OBRIGATÓRIO — mínimo 32 caracteres, gerado aleatoriamente
JWT_SECRET=substitua_por_um_segredo_longo_e_aleatorio_aqui

# Tempo de expiração do token (padrão: 15m)
JWT_EXPIRES_IN=15m
```

---

## Endpoints

### `POST /register`
```json
// Body
{ "email": "user@example.com", "password": "MinhaSenh@123" }

// 201 Created
{ "message": "Usuário criado com sucesso." }

// 409 Conflict
{ "error": "E-mail já cadastrado." }
```

### `POST /login`
```json
// Body
{ "email": "user@example.com", "password": "MinhaSenh@123" }

// 200 OK
{ "token": "<jwt>" }

// 401 Unauthorized
{ "error": "Credenciais inválidas." }
```

### `GET /profile`
```
Authorization: Bearer <jwt>
```
```json
// 200 OK
{ "id": "uuid", "email": "user@example.com", "createdAt": "..." }
```

---

## Código-fonte

### `package.json`

```json
{
  "name": "auth-api",
  "version": "1.0.0",
  "scripts": {
    "start": "node src/server.js",
    "dev": "node --watch src/server.js"
  },
  "dependencies": {
    "bcrypt": "^5.1.1",
    "express": "^4.19.2",
    "express-rate-limit": "^7.3.1",
    "express-validator": "^7.1.0",
    "helmet": "^7.1.0",
    "jsonwebtoken": "^9.0.2",
    "uuid": "^10.0.0"
  }
}
```

---

### `src/config.js`

```js
'use strict';

// Validação obrigatória no startup — falha rápida antes de aceitar conexões.
// Correção #3 e #10: segredo validado com tamanho mínimo; expiração com default seguro.

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET || JWT_SECRET.length < 32) {
  console.error(
    '[FATAL] JWT_SECRET ausente ou menor que 32 caracteres. ' +
    'Gere um segredo com: node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"'
  );
  process.exit(1);
}

module.exports = {
  PORT: parseInt(process.env.PORT, 10) || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '15m', // Correção #10
  BCRYPT_ROUNDS: 12,                                    // Correção #1
};
```

---

### `src/store/users.js`

```js
'use strict';

// Armazenamento em memória — substituir por banco de dados em produção real.
const users = [];

function findByEmail(email) {
  return users.find((u) => u.email === email) || null;
}

function findById(id) {
  return users.find((u) => u.id === id) || null;
}

function create(user) {
  users.push(user);
  return user;
}

module.exports = { findByEmail, findById, create };
```

---

### `src/middleware/auth.js`

```js
'use strict';

const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');
const userStore = require('../store/users');

// Correção #2: algoritmo fixado explicitamente para evitar ataque "alg: none"
// e confusão entre HS256 e RS256.
module.exports = function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token ausente ou malformado.' });
  }

  const token = authHeader.slice(7); // Remove "Bearer "

  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido ou expirado.' });
  }

  const user = userStore.findById(payload.sub);
  if (!user) {
    return res.status(401).json({ error: 'Usuário não encontrado.' });
  }

  req.user = user;
  next();
};
```

---

### `src/middleware/errorHandler.js`

```js
'use strict';

const { NODE_ENV } = require('../config');

// Correção #6: stack trace nunca exposto em produção.
// eslint-disable-next-line no-unused-vars
module.exports = function errorHandler(err, req, res, next) {
  const isDev = NODE_ENV === 'development';

  console.error('[ERROR]', err);

  res.status(err.status || 500).json({
    error: isDev ? err.message : 'Erro interno do servidor.',
    ...(isDev && { stack: err.stack }),
  });
};
```

---

### `src/routes/auth.js`

```js
'use strict';

const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');

const { JWT_SECRET, JWT_EXPIRES_IN, BCRYPT_ROUNDS } = require('../config');
const userStore = require('../store/users');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// ─── Rate Limiting ────────────────────────────────────────────────────────────
// Correção #4: limita tentativas em rotas sensíveis para dificultar força bruta.

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas tentativas. Tente novamente em 15 minutos.' },
});

// ─── Validadores ─────────────────────────────────────────────────────────────
// Correção #5: validação estrita de entrada com limites de tamanho.

const registerValidators = [
  body('email')
    .isEmail().withMessage('E-mail inválido.')
    .isLength({ max: 254 }).withMessage('E-mail muito longo.')
    .normalizeEmail(),
  body('password')
    .isString()
    .isLength({ min: 8, max: 72 }) // bcrypt trunca em 72 bytes
    .withMessage('Senha deve ter entre 8 e 72 caracteres.'),
];

const loginValidators = [
  body('email').isEmail().normalizeEmail(),
  body('password').isString().isLength({ min: 1, max: 72 }),
];

function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  next();
}

// ─── POST /register ───────────────────────────────────────────────────────────

router.post(
  '/register',
  authLimiter,
  registerValidators,
  handleValidation,
  async (req, res, next) => {
    try {
      // Correção #12: e-mail normalizado para lowercase antes de comparar.
      const email = req.body.email.toLowerCase();
      const { password } = req.body;

      if (userStore.findByEmail(email)) {
        return res.status(409).json({ error: 'E-mail já cadastrado.' });
      }

      // Correção #1: custo 12 para hash mais resistente a força bruta.
      const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

      userStore.create({
        id: uuidv4(),
        email,
        passwordHash,
        createdAt: new Date().toISOString(),
      });

      return res.status(201).json({ message: 'Usuário criado com sucesso.' });
    } catch (err) {
      next(err);
    }
  }
);

// ─── POST /login ──────────────────────────────────────────────────────────────

router.post(
  '/login',
  authLimiter,
  loginValidators,
  handleValidation,
  async (req, res, next) => {
    try {
      const email = req.body.email.toLowerCase();
      const { password } = req.body;

      const user = userStore.findByEmail(email);

      // Correção #8: mensagem de erro unificada — não revela se o e-mail existe.
      // bcrypt.compare é chamado mesmo quando user é null para evitar
      // timing attack por caminho curto (early return).
      const dummyHash =
        '$2b$12$invalidsaltinvalidsaltinvalidsaltinvalidsaltinvalid';
      const passwordMatch = await bcrypt.compare(
        password,
        user ? user.passwordHash : dummyHash
      );

      if (!user || !passwordMatch) {
        return res.status(401).json({ error: 'Credenciais inválidas.' });
      }

      // Correção #2: algoritmo HS256 explícito no sign.
      const token = jwt.sign(
        { sub: user.id, email: user.email },
        JWT_SECRET,
        { algorithm: 'HS256', expiresIn: JWT_EXPIRES_IN }
      );

      return res.status(200).json({ token });
    } catch (err) {
      next(err);
    }
  }
);

// ─── GET /profile ─────────────────────────────────────────────────────────────

router.get('/profile', authMiddleware, (req, res) => {
  // Correção #11: hash da senha jamais incluído na resposta.
  const { passwordHash: _, ...safeUser } = req.user;
  return res.status(200).json(safeUser);
});

module.exports = router;
```

---

### `src/app.js`

```js
'use strict';

const express = require('express');
const helmet = require('helmet');
const authRoutes = require('./routes/auth');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Correção #7: helmet com CSP explícito.
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'none'"],
        frameAncestors: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: true,
    crossOriginOpenerPolicy: { policy: 'same-origin' },
    crossOriginResourcePolicy: { policy: 'same-origin' },
  })
);

// Correção #9: limite de 10 KB no body para evitar DoS por payload gigante.
app.use(express.json({ limit: '10kb' }));

// Rotas
app.use(authRoutes);

// Handler global de erros — deve ser o último middleware.
app.use(errorHandler);

module.exports = app;
```

---

### `src/server.js`

```js
'use strict';

// config.js é importado primeiro — valida variáveis antes de qualquer outra coisa.
const { PORT } = require('./config');
const app = require('./app');

app.listen(PORT, () => {
  console.log(`[server] Rodando na porta ${PORT}`);
});
```

---

## Testando com curl

```bash
# Registrar
curl -s -X POST http://localhost:3000/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"MinhaSenh@123"}' | jq

# Login
TOKEN=$(curl -s -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"MinhaSenh@123"}' | jq -r '.token')

# Perfil autenticado
curl -s http://localhost:3000/profile \
  -H "Authorization: Bearer $TOKEN" | jq
```

---

## Limitações conhecidas (escopo intencional)

| Limitação | Recomendação para produção |
|-----------|---------------------------|
| Dados em memória (perdidos ao reiniciar) | PostgreSQL / MongoDB com ORM |
| HTTPS não configurado na app | Terminar TLS no proxy reverso (nginx, Caddy) |
| Sem refresh token | Implementar rotação de tokens com armazenamento seguro |
| Sem logout / blacklist de tokens | Redis para invalidação de JWTs antes da expiração |
| Sem CORS configurado | `cors` package com lista de origens permitidas explícita |
| Sem testes automatizados | Jest + Supertest cobrindo fluxos de autenticação |
````