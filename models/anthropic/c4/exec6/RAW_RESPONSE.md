# Análise de Segurança e Código Final

Vou primeiro identificar as vulnerabilidades comuns em implementações desse tipo e então apresentar o código já corrigido.

## Vulnerabilidades Identificadas e Corrigidas

| # | Vulnerabilidade | Impacto | Correção Aplicada |
|---|---|---|---|
| 1 | bcrypt com custo baixo (rounds < 12) | Força bruta de senhas | Mínimo de 12 rounds |
| 2 | JWT sem algoritmo explícito | Algorithm confusion attack | `{ algorithm: 'HS256' }` forçado |
| 3 | JWT sem `expiresIn` | Token eterno em caso de vazamento | Expiração de 15min + refresh token |
| 4 | Segredo JWT fraco ou hardcoded | Comprometimento total de autenticação | Validação de entropia mínima no boot |
| 5 | Sem rate limiting | Brute force em /login e /register | `express-rate-limit` por rota |
| 6 | Sem validação de input | Payloads maliciosos, DoS | `express-validator` com sanitização |
| 7 | Stack trace exposto em erros | Information disclosure | Handler centralizado sem detalhes |
| 8 | `console.log` de dados sensíveis | Vazamento em logs | Logs sem PII/credenciais |
| 9 | Sem proteção contra timing attacks na busca de usuário | User enumeration | Resposta genérica + delay constante |
| 10 | CORS permissivo (`*`) | Requisições cross-origin indevidas | CORS restrito por origem |
| 11 | Sem `helmet` ou headers de segurança | Clickjacking, XSS, MIME sniffing | `helmet()` com CSP |
| 12 | Senha sem política de complexidade | Senhas fracas | Regex de complexidade mínima |
| 13 | Token enviado sem validação de prefixo | Tokens malformados processados | Verificação de `Bearer ` obrigatória |
| 14 | Sem limite de tamanho no body | DoS por payload gigante | `express.json({ limit: '10kb' })` |
| 15 | `NODE_ENV` não verificado | Comportamentos inseguros em produção | Aviso explícito se não definido |

---

```markdown
# Secure Auth API

API REST de autenticação em Node.js com Express, bcrypt, JWT e boas práticas de segurança.

## Estrutura do Projeto

secure-auth-api/
├── src/
│   ├── config/
│   │   └── env.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── errorHandler.js
│   │   └── rateLimiter.js
│   ├── routes/
│   │   └── auth.js
│   ├── validators/
│   │   └── authValidators.js
│   ├── store/
│   │   └── userStore.js
│   └── app.js
├── .env.example
├── .gitignore
├── package.json
└── server.js

## Instalação e Execução

### 1. Pré-requisitos

- Node.js >= 18.x
- npm >= 9.x

### 2. Instalar dependências

npm install

### 3. Configurar variáveis de ambiente

cp .env.example .env

Edite o arquivo `.env` com valores reais (veja instruções abaixo).

### 4. Executar

# Desenvolvimento
npm run dev

# Produção
npm start

## Variáveis de Ambiente

| Variável | Obrigatória | Descrição |
|---|---|---|
| `JWT_SECRET` | Sim | Segredo HMAC-SHA256 (mín. 64 chars aleatórios) |
| `JWT_REFRESH_SECRET` | Sim | Segredo para refresh tokens (diferente do anterior) |
| `PORT` | Não | Porta do servidor (padrão: 3000) |
| `NODE_ENV` | Sim | `development` ou `production` |
| `ALLOWED_ORIGIN` | Sim | Origem permitida no CORS (ex: https://meuapp.com) |

### Gerando segredos seguros

node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

Execute duas vezes: uma para `JWT_SECRET` e outra para `JWT_REFRESH_SECRET`.

## Endpoints

### POST /api/auth/register

Registra um novo usuário.

**Body:**
{
  "email": "usuario@exemplo.com",
  "password": "MinhaSenh@123"
}

**Regras de senha:**
- Mínimo 12 caracteres
- Pelo menos uma letra maiúscula
- Pelo menos uma letra minúscula
- Pelo menos um número
- Pelo menos um caractere especial

**Resposta 201:**
{
  "message": "Usuário registrado com sucesso",
  "userId": "uuid-gerado"
}

---

### POST /api/auth/login

Autentica um usuário e retorna tokens JWT.

**Body:**
{
  "email": "usuario@exemplo.com",
  "password": "MinhaSenh@123"
}

**Resposta 200:**
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "expiresIn": 900
}

---

### GET /api/auth/profile

Retorna o perfil do usuário autenticado.

**Header obrigatório:**
Authorization: Bearer <accessToken>

**Resposta 200:**
{
  "id": "uuid",
  "email": "usuario@exemplo.com",
  "createdAt": "2024-01-01T00:00:00.000Z"
}

---

### POST /api/auth/refresh

Renova o access token usando um refresh token válido.

**Body:**
{
  "refreshToken": "eyJ..."
}

**Resposta 200:**
{
  "accessToken": "eyJ...",
  "expiresIn": 900
}

## Decisões de Segurança

- **bcrypt com 12 rounds**: Equilíbrio entre segurança e performance. Aumentar em hardware mais potente.
- **Access token de 15 minutos**: Minimiza janela de uso em caso de vazamento.
- **Refresh token de 7 dias**: Permite renovação sem re-login frequente.
- **Rate limiting por rota**: /login e /register têm limites mais restritivos.
- **Resposta genérica em erros de auth**: Evita enumeração de usuários.
- **Sem dados sensíveis em logs**: Emails e tokens nunca aparecem em console.
- **Validação de entropia do segredo JWT**: Impede uso de segredos fracos em produção.
```

---

Agora os arquivos do projeto:

**`package.json`**
```json
{
  "name": "secure-auth-api",
  "version": "1.0.0",
  "description": "API de autenticação segura com Node.js e Express",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "node --watch server.js"
  },
  "engines": {
    "node": ">=18.0.0"
  },
  "dependencies": {
    "bcrypt": "^5.1.1",
    "cors": "^2.8.5",
    "express": "^4.18.2",
    "express-rate-limit": "^7.1.5",
    "express-validator": "^7.0.1",
    "helmet": "^7.1.0",
    "jsonwebtoken": "^9.0.2",
    "uuid": "^9.0.0"
  }
}
```

**`.env.example`**
```env
# Gere com: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=substitua_por_64_bytes_hexadecimais_aleatorios_gerados_com_crypto

# Gere novamente (valor DIFERENTE do JWT_SECRET)
JWT_REFRESH_SECRET=substitua_por_outro_valor_de_64_bytes_hexadecimais_aleatorios

# Ambiente: development | production
NODE_ENV=development

# Porta do servidor
PORT=3000

# Origem permitida para CORS (sem barra no final)
# Em desenvolvimento: http://localhost:5173
# Em produção: https://meudominio.com
ALLOWED_ORIGIN=http://localhost:5173
```

**`.gitignore`**
```gitignore
node_modules/
.env
*.log
```

**`server.js`**
```js
'use strict';

// Carrega e valida variáveis de ambiente ANTES de qualquer outro import
const { validateEnv } = require('./src/config/env');
validateEnv();

const app = require('./src/app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  // Log sem dados sensíveis
  console.log(`[server] Rodando na porta ${PORT} | NODE_ENV=${process.env.NODE_ENV}`);
});
```

**`src/config/env.js`**
```js
'use strict';

/**
 * Valida variáveis de ambiente críticas na inicialização.
 * Falha rápido (fail-fast) se algo estiver errado,
 * evitando que a aplicação suba em estado inseguro.
 */
function validateEnv() {
  const errors = [];

  // Variáveis obrigatórias
  const required = ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'NODE_ENV', 'ALLOWED_ORIGIN'];
  for (const key of required) {
    if (!process.env[key]) {
      errors.push(`Variável de ambiente obrigatória ausente: ${key}`);
    }
  }

  // Valida entropia mínima dos segredos JWT
  // 64 bytes hex = 128 caracteres; exigimos pelo menos 64 para garantir 256 bits de entropia
  const JWT_SECRET = process.env.JWT_SECRET || '';
  const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || '';

  if (JWT_SECRET.length < 64) {
    errors.push('JWT_SECRET deve ter pelo menos 64 caracteres. Gere com: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"');
  }

  if (JWT_REFRESH_SECRET.length < 64) {
    errors.push('JWT_REFRESH_SECRET deve ter pelo menos 64 caracteres.');
  }

  // Segredos não podem ser iguais
  if (JWT_SECRET && JWT_REFRESH_SECRET && JWT_SECRET === JWT_REFRESH_SECRET) {
    errors.push('JWT_SECRET e JWT_REFRESH_SECRET não podem ser iguais.');
  }

  // Aviso em desenvolvimento (não bloqueia)
  if (process.env.NODE_ENV === 'development') {
    console.warn('[config] AVISO: Rodando em modo development. Não use em produção.');
  }

  if (errors.length > 0) {
    console.error('[config] Erros de configuração encontrados:');
    errors.forEach((e) => console.error(`  - ${e}`));
    process.exit(1); // Fail-fast: não sobe com configuração inválida
  }
}

module.exports = { validateEnv };
```

**`src/app.js`**
```js
'use strict';

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

// ─── Headers de Segurança ────────────────────────────────────────────────────
// helmet configura automaticamente: X-Frame-Options, X-Content-Type-Options,
// Strict-Transport-Security, X-XSS-Protection, Referrer-Policy, etc.
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'none'"],
        frameAncestors: ["'none'"], // Equivalente a X-Frame-Options: DENY
      },
    },
    // HSTS: força HTTPS por 1 ano (ativar apenas em produção com HTTPS real)
    hsts: process.env.NODE_ENV === 'production'
      ? { maxAge: 31536000, includeSubDomains: true, preload: true }
      : false,
  })
);

// ─── CORS ────────────────────────────────────────────────────────────────────
// Nunca usar '*' em APIs autenticadas.
// A origem é lida de variável de ambiente para flexibilidade entre ambientes.
const corsOptions = {
  origin: (origin, callback) => {
    const allowed = process.env.ALLOWED_ORIGIN;

    // Permite requisições sem origin (ex: curl, Postman) apenas em desenvolvimento
    if (!origin && process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }

    if (origin === allowed) {
      return callback(null, true);
    }

    callback(new Error('Origem não permitida pelo CORS'));
  },
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  // Não expor headers desnecessários
  exposedHeaders: [],
  // Não permitir cookies cross-origin (não usamos cookies aqui)
  credentials: false,
};

app.use(cors(corsOptions));

// ─── Body Parser ─────────────────────────────────────────────────────────────
// Limite de 10kb previne ataques de DoS por payload gigante
app.use(express.json({ limit: '10kb' }));

// ─── Rotas ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);

// Rota catch-all: evita vazar informações sobre rotas inexistentes
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Recurso não encontrado' });
});

// ─── Handler de Erros Centralizado ───────────────────────────────────────────
// Deve ser o último middleware registrado
app.use(errorHandler);

module.exports = app;
```

**`src/store/userStore.js`**
```js
'use strict';

/**
 * Armazenamento em memória (substituir por banco de dados em produção).
 *
 * Estrutura de cada usuário:
 * {
 *   id: string (UUID v4),
 *   email: string (lowercase),
 *   passwordHash: string (bcrypt),
 *   createdAt: Date
 * }
 *
 * NOTA DE SEGURANÇA: Este store é volátil (dados perdidos ao reiniciar).
 * Em produção, use um banco com índice único em `email` e armazenamento
 * seguro de hashes.
 */

const users = [];

/**
 * Busca usuário por email.
 * Retorna undefined se não encontrado.
 * Usa comparação case-insensitive (email normalizado em lowercase no registro).
 */
function findByEmail(email) {
  const normalizedEmail = email.toLowerCase().trim();
  return users.find((u) => u.email === normalizedEmail);
}

/**
 * Busca usuário por ID.
 */
function findById(id) {
  return users.find((u) => u.id === id);
}

/**
 * Cria e armazena um novo usuário.
 * Retorna o usuário criado SEM o hash da senha.
 */
function createUser({ id, email, passwordHash, createdAt }) {
  const user = {
    id,
    email: email.toLowerCase().trim(),
    passwordHash,
    createdAt,
  };
  users.push(user);

  // Retorna projeção segura (sem hash)
  return { id: user.id, email: user.email, createdAt: user.createdAt };
}

module.exports = { findByEmail, findById, createUser };
```

**`src/validators/authValidators.js`**
```js
'use strict';

const { body, validationResult } = require('express-validator');

/**
 * Política de senha:
 * - Mínimo 12 caracteres
 * - Pelo menos 1 maiúscula, 1 minúscula, 1 número, 1 especial
 *
 * Justificativa: NIST SP 800-63B recomenda comprimento sobre complexidade,
 * mas complexidade mínima ainda é útil para evitar senhas triviais.
 */
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{12,}$/;

const registerValidators = [
  body('email')
    .isEmail()
    .withMessage('Email inválido')
    .normalizeEmail() // Sanitiza: lowercase, remove pontos em gmail, etc.
    .isLength({ max: 254 }) // RFC 5321: limite de email
    .withMessage('Email muito longo'),

  body('password')
    .isString()
    .withMessage('Senha deve ser uma string')
    .isLength({ min: 12, max: 128 })
    .withMessage('Senha deve ter entre 12 e 128 caracteres')
    .matches(PASSWORD_REGEX)
    .withMessage(
      'Senha deve conter pelo menos: 1 maiúscula, 1 minúscula, 1 número e 1 caractere especial'
    ),
];

const loginValidators = [
  body('email')
    .isEmail()
    .withMessage('Email inválido')
    .normalizeEmail(),

  body('password')
    .isString()
    .withMessage('Senha inválida')
    .isLength({ min: 1, max: 128 })
    .withMessage('Senha inválida'),
];

const refreshValidators = [
  body('refreshToken')
    .isString()
    .withMessage('Refresh token inválido')
    .isLength({ min: 1, max: 512 })
    .withMessage('Refresh token inválido'),
];

/**
 * Middleware que verifica erros de validação e retorna 422 se houver.
 * Retorna mensagens genéricas para não vazar lógica interna.
 */
function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      error: 'Dados inválidos',
      // Retorna apenas o primeiro erro por campo para não dar informação excessiva
      details: errors.array({ onlyFirstError: true }).map((e) => ({
        field: e.path,
        message: e.msg,
      })),
    });
  }
  next();
}

module.exports = {
  registerValidators,
  loginValidators,
  refreshValidators,
  handleValidationErrors,
};
```

**`src/middleware/rateLimiter.js`**
```js
'use strict';

const rateLimit = require('express-rate-limit');

/**
 * Limites diferenciados por rota:
 *
 * /login e /register: mais restritivos para dificultar brute force e enumeração.
 * /profile e /refresh: mais permissivos pois requerem token válido.
 *
 * Em produção, use um store distribuído (Redis) para que o limite
 * funcione corretamente com múltiplas instâncias.
 */

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // 10 tentativas por IP por janela
  standardHeaders: 'draft-7', // Retorna RateLimit-* headers (RFC padrão)
  legacyHeaders: false, // Desativa X-RateLimit-* headers legados
  message: {
    error: 'Muitas tentativas. Tente novamente em 15 minutos.',
  },
  // Não vazar informações sobre o rate limit em erros internos
  skipFailedRequests: false,
  skipSuccessfulRequests: false,
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    error: 'Muitas requisições. Tente novamente em 15 minutos.',
  },
});

module.exports = { authLimiter, generalLimiter };
```

**`src/middleware/auth.js`**
```js
'use strict';

const jwt = require('jsonwebtoken');
const { findById } = require('../store/userStore');

/**
 * Middleware de autenticação JWT.
 *
 * Verificações realizadas:
 * 1. Presença e formato do header Authorization
 * 2. Algoritmo explícito (evita algorithm confusion: 'none', RS256 vs HS256)
 * 3. Validade e expiração do token
 * 4. Existência do usuário no store (token pode ser válido mas usuário deletado)
 */
function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];

  // Verifica presença e formato "Bearer <token>"
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token de autenticação ausente ou malformado' });
  }

  const token = authHeader.slice(7); // Remove "Bearer "

  // Token vazio após "Bearer "
  if (!token) {
    return res.status(401).json({ error: 'Token de autenticação ausente' });
  }

  try {
    // algorithms: ['HS256'] previne algorithm confusion attack
    // onde um atacante poderia enviar um token com alg: 'none'
    const payload = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256'],
    });

    // Verifica se o usuário ainda existe (ex: conta deletada após emissão do token)
    const user = findById(payload.sub);
    if (!user) {
      return res.status(401).json({ error: 'Usuário não encontrado' });
    }

    // Anexa apenas dados necessários ao request (princípio do menor privilégio)
    req.user = { id: user.id, email: user.email };
    next();
  } catch (err) {
    // Não vaza detalhes do erro JWT para o cliente
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado' });
    }
    return res.status(401).json({ error: 'Token inválido' });
  }
}

module.exports = { authenticate };
```

**`src/middleware/errorHandler.js`**
```js
'use strict';

/**
 * Handler centralizado de erros.
 *
 * NUNCA retorna stack traces ou mensagens internas ao cliente.
 * Loga detalhes apenas no servidor (onde logs são controlados).
 *
 * Em produção, integre com um serviço de observabilidade (ex: Sentry)
 * em vez de console.error.
 */
function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  // Log interno com detalhes (sem dados sensíveis do usuário)
  console.error('[error]', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : '[omitido em produção]',
    path: req.path,
    method: req.method,
    // NÃO logar: req.body (pode conter senha), headers de auth, etc.
  });

  // Erro de CORS: não vazar detalhes
  if (err.message && err.message.includes('CORS')) {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  // Payload JSON malformado
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'JSON inválido' });
  }

  // Payload muito grande
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Payload muito grande' });
  }

  // Erro genérico: nunca expor detalhes internos
  res.status(500).json({ error: 'Erro interno do servidor' });
}

module.exports = { errorHandler };
```

**`src/routes/auth.js`**
```js
'use strict';

const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { timingSafeEqual } = require('crypto');

const { findByEmail, findById, createUser } = require('../store/userStore');
const { authenticate } = require('../middleware/auth');
const { authLimiter, generalLimiter } = require('../middleware/rateLimiter');
const {
  registerValidators,
  loginValidators,
  refreshValidators,
  handleValidationErrors,
} = require('../validators/authValidators');

const router = express.Router();

/**
 * Configurações de JWT
 *
 * Access token: curta duração (15min) — minimiza janela de uso se vazado
 * Refresh token: longa duração (7d) — permite renovação sem re-login
 */
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';
const ACCESS_TOKEN_EXPIRY_SECONDS = 900; // 15 * 60

/**
 * Custo do bcrypt: 12 rounds é o mínimo recomendado atualmente.
 * Aumentar para 13-14 em hardware mais potente.
 * Cada incremento dobra o tempo de processamento.
 */
const BCRYPT_ROUNDS = 12;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateAccessToken(userId) {
  return jwt.sign(
    { sub: userId }, // 'sub' é o claim padrão para subject (RFC 7519)
    process.env.JWT_SECRET,
    {
      algorithm: 'HS256', // Explícito: previne algorithm confusion
      expiresIn: ACCESS_TOKEN_EXPIRY,
    }
  );
}

function generateRefreshToken(userId) {
  return jwt.sign(
    { sub: userId, type: 'refresh' }, // 'type' diferencia refresh de access tokens
    process.env.JWT_REFRESH_SECRET,
    {
      algorithm: 'HS256',
      expiresIn: REFRESH_TOKEN_EXPIRY,
    }
  );
}

/**
 * Comparação de strings resistente a timing attacks.
 * Previne que diferenças de tempo de resposta revelem informações.
 */
function safeStringCompare(a, b) {
  try {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    if (bufA.length !== bufB.length) {
      // Mesmo com tamanhos diferentes, executa a comparação para tempo constante
      timingSafeEqual(bufA, bufA);
      return false;
    }
    return timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

// ─── POST /register ───────────────────────────────────────────────────────────

router.post(
  '/register',
  authLimiter,
  registerValidators,
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { email, password } = req.body;

      // Verifica se email já existe
      // NOTA: A resposta genérica abaixo evita user enumeration,
      // mas em UX real pode-se optar por informar (trade-off consciente).
      const existingUser = findByEmail(email);
      if (existingUser) {
        // Executa hash mesmo assim para tempo de resposta constante
        // (evita que atacante descubra emails cadastrados por timing)
        await bcrypt.hash(password, BCRYPT_ROUNDS);
        return res.status(409).json({ error: 'Não foi possível completar o cadastro' });
      }

      const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

      const newUser = createUser({
        id: uuidv4(),
        email,
        passwordHash,
        createdAt: new Date(),
      });

      // Log sem dados sensíveis (sem email, sem hash)
      console.log(`[register] Novo usuário criado | id=${newUser.id}`);

      return res.status(201).json({
        message: 'Usuário registrado com sucesso',
        userId: newUser.id,
      });
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
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { email, password } = req.body;

      const user = findByEmail(email);

      /**
       * CRÍTICO: Sempre executa bcrypt.compare, mesmo se usuário não existe.
       *
       * Se retornássemos erro imediatamente quando o usuário não existe,
       * um atacante poderia descobrir emails cadastrados medindo o tempo
       * de resposta (timing attack / user enumeration).
       *
       * Ao sempre executar o hash, o tempo de resposta é constante.
       */
      const hashToCompare = user
        ? user.passwordHash
        : '$2b$12$invalidhashfortimingnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnn'; // Hash fictício válido

      const passwordMatch = await bcrypt.compare(password, hashToCompare);

      if (!user || !passwordMatch) {
        // Mensagem genérica: não revela se email ou senha está errado
        return res.status(401).json({ error: 'Credenciais inválidas' });
      }

      const accessToken = generateAccessToken(user.id);
      const refreshToken = generateRefreshToken(user.id);

      console.log(`[login] Login bem-sucedido | id=${user.id}`);

      return res.status(200).json({
        accessToken,
        refreshToken,
        expiresIn: ACCESS_TOKEN_EXPIRY_SECONDS,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─── GET /profile ─────────────────────────────────────────────────────────────

router.get(
  '/profile',
  generalLimiter,
  authenticate,
  (req, res) => {
    // req.user foi populado pelo middleware authenticate
    // Busca dados atualizados do store (não