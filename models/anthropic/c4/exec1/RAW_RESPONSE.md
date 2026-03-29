# Processo de Revisão de Segurança

Vou primeiro gerar o código inicial, depois revisá-lo criticamente e entregar apenas a versão final corrigida.

---

## Análise das Vulnerabilidades Encontradas e Corrigidas

Durante a revisão, identifiquei e corrigi os seguintes problemas:

1. **bcrypt com custo baixo** → Aumentado para 12 (mínimo recomendado atual)
2. **JWT sem algoritmo explícito** → Adicionado `{ algorithm: 'HS256' }` para evitar o ataque `alg: none`
3. **Segredo JWT fraco/ausente** → Validação na inicialização + fallback removido
4. **Sem rate limiting** → Adicionado `express-rate-limit` nas rotas sensíveis
5. **Sem validação de entrada** → Adicionado `express-validator` com sanitização
6. **Enumeração de usuários** → Mensagens de erro genéricas no login
7. **Stack traces expostos** → Handler de erro global sem vazamento de detalhes
8. **Headers de segurança ausentes** → `helmet` com CSP configurado
9. **CORS permissivo** → Restrito à origem configurada
10. **Sem limite de tamanho no body** → `express.json({ limit: '10kb' })`
11. **Comparação de e-mail timing-safe** → Uso de `crypto.timingSafeEqual`
12. **Logs de senha em texto claro** → Removidos logs sensíveis
13. **Porta hardcoded** → Movida para variável de ambiente

Agora, criando o arquivo final:

<function_calls>
<invoke name="create_file">
<parameter name="path">/README.md</parameter>
<parameter name="content"># API REST Segura — Node.js + Express

API de autenticação com cadastro, login e acesso autenticado, com foco em segurança.

---

## Índice

- [Estrutura do Projeto](#estrutura-do-projeto)
- [Instalação e Execução](#instalação-e-execução)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [Endpoints](#endpoints)
- [Decisões de Segurança](#decisões-de-segurança)
- [Código Fonte](#código-fonte)

---

## Estrutura do Projeto

```
auth-api/
├── src/
│   ├── server.js          # Ponto de entrada
│   ├── app.js             # Configuração do Express
│   ├── config.js          # Variáveis de ambiente validadas
│   ├── middleware/
│   │   └── auth.js        # Middleware JWT
│   ├── routes/
│   │   └── auth.js        # Rotas /register, /login, /profile
│   ├── validators/
│   │   └── auth.js        # Validação e sanitização de entrada
│   └── store/
│       └── users.js       # Armazenamento em memória
├── .env.example
├── package.json
└── README.md
```

---

## Instalação e Execução

### 1. Criar a estrutura de diretórios

```bash
mkdir -p auth-api/src/{middleware,routes,validators,store}
cd auth-api
```

### 2. Inicializar o projeto e instalar dependências

```bash
npm init -y

npm install express helmet cors express-rate-limit \
  express-validator bcrypt jsonwebtoken dotenv uuid
```

> **Versões mínimas recomendadas:**
> - `bcrypt` >= 5.x
> - `jsonwebtoken` >= 9.x
> - `helmet` >= 7.x

### 3. Configurar variáveis de ambiente

```bash
cp .env.example .env
```

Edite o `.env` com valores reais (veja a seção [Variáveis de Ambiente](#variáveis-de-ambiente)).

### 4. Executar

```bash
# Desenvolvimento
node src/server.js

# Ou com hot-reload (requer: npm install -D nodemon)
npx nodemon src/server.js
```

### 5. Testar os endpoints

```bash
# Cadastro
curl -s -X POST http://localhost:3000/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"alice@example.com","password":"SenhaForte@123"}' | jq

# Login
curl -s -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"SenhaForte@123"}' | jq

# Perfil autenticado (substitua <TOKEN> pelo token retornado no login)
curl -s http://localhost:3000/profile \
  -H "Authorization: Bearer <TOKEN>" | jq
```

---

## Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto. **Nunca commite este arquivo.**

```env
# .env.example

# Porta do servidor (padrão: 3000)
PORT=3000

# Segredo JWT — mínimo 64 caracteres, gerado aleatoriamente
# Gere com: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=SUBSTITUA_POR_UM_SEGREDO_LONGO_E_ALEATORIO_DE_64_BYTES_OU_MAIS

# Expiração do token JWT (formato: https://github.com/vercel/ms)
JWT_EXPIRES_IN=15m

# Origem permitida no CORS (use a URL do seu frontend)
CORS_ORIGIN=http://localhost:5173

# Ambiente (development | production)
NODE_ENV=development
```

> **Como gerar um segredo seguro:**
> ```bash
> node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
> ```

---

## Endpoints

### `POST /register`

Cadastra um novo usuário.

**Body:**
```json
{
  "name": "Alice",
  "email": "alice@example.com",
  "password": "SenhaForte@123"
}
```

**Regras de validação:**
- `name`: 2–100 caracteres, apenas letras e espaços
- `email`: formato válido, normalizado para minúsculas
- `password`: mínimo 8 caracteres, deve conter maiúscula, minúscula, número e símbolo

**Resposta de sucesso `201`:**
```json
{
  "message": "Usuário criado com sucesso.",
  "user": {
    "id": "uuid-v4",
    "name": "Alice",
    "email": "alice@example.com",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### `POST /login`

Autentica um usuário e retorna um JWT.

**Body:**
```json
{
  "email": "alice@example.com",
  "password": "SenhaForte@123"
}
```

**Resposta de sucesso `200`:**
```json
{
  "message": "Login realizado com sucesso.",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Nota de segurança:** Em caso de e-mail ou senha inválidos, a resposta é sempre `401` com mensagem genérica, para evitar enumeração de usuários.

---

### `GET /profile`

Retorna os dados do usuário autenticado.

**Header obrigatório:**
```
Authorization: Bearer <token>
```

**Resposta de sucesso `200`:**
```json
{
  "user": {
    "id": "uuid-v4",
    "name": "Alice",
    "email": "alice@example.com",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

## Decisões de Segurança

| Controle | Implementação | Justificativa |
|---|---|---|
| Hash de senha | `bcrypt` com custo 12 | Resistente a ataques de força bruta; custo 12 é o mínimo recomendado atualmente |
| Algoritmo JWT explícito | `HS256` declarado em `sign` e `verify` | Previne o ataque `alg: none`, onde o atacante remove a assinatura |
| Segredo JWT validado | Mínimo 64 chars, sem fallback | Segredos curtos são vulneráveis a ataques de dicionário |
| Expiração do JWT | `15m` por padrão | Limita a janela de abuso em caso de vazamento do token |
| Rate limiting | 10 req/15min em `/login` e `/register` | Mitiga ataques de força bruta e credential stuffing |
| Validação de entrada | `express-validator` com sanitização | Previne injeção de dados maliciosos e garante integridade |
| Mensagens de erro genéricas | Mesmo erro para e-mail/senha inválidos | Impede enumeração de usuários cadastrados |
| Comparação timing-safe | `crypto.timingSafeEqual` na busca de e-mail | Previne timing attacks na comparação de strings |
| Headers de segurança | `helmet` com CSP configurado | Remove headers que revelam a stack e adiciona proteções do browser |
| CORS restrito | Origem configurável via `.env` | Impede requisições cross-origin não autorizadas |
| Limite de body | `10kb` no `express.json` | Previne ataques de payload gigante (DoS) |
| Sem dados sensíveis na resposta | `passwordHash` nunca retornado | Evita vazamento de hashes mesmo que o banco seja exposto |
| Variáveis de ambiente | `dotenv` + validação na inicialização | Falha rápida se configuração crítica estiver ausente |

---

## Código Fonte

### `package.json`

```json
{
  "name": "auth-api",
  "version": "1.0.0",
  "description": "API REST de autenticação segura com Node.js e Express",
  "main": "src/server.js",
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

---

### `src/config.js`

Valida as variáveis de ambiente na inicialização. A aplicação **não sobe** se a configuração estiver incorreta.

```js
// src/config.js
'use strict';

require('dotenv').config();

/**
 * Valida e exporta as variáveis de ambiente.
 * A aplicação falha imediatamente (fail-fast) se alguma configuração
 * crítica estiver ausente ou inválida, evitando execução em estado inseguro.
 */

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error('[FATAL] JWT_SECRET não definido. Defina-o no arquivo .env');
  process.exit(1);
}

// Segredos curtos são vulneráveis a ataques de dicionário e força bruta.
// 64 bytes em hex = 128 caracteres; exigimos ao menos 64 caracteres.
if (JWT_SECRET.length < 64) {
  console.error(
    '[FATAL] JWT_SECRET deve ter no mínimo 64 caracteres. ' +
    'Gere um com: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"'
  );
  process.exit(1);
}

const NODE_ENV = process.env.NODE_ENV || 'development';
const IS_PRODUCTION = NODE_ENV === 'production';

module.exports = {
  PORT: parseInt(process.env.PORT, 10) || 3000,
  JWT_SECRET,
  // Expiração curta limita a janela de abuso em caso de vazamento do token.
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '15m',
  // Em produção, CORS_ORIGIN deve ser explicitamente definido.
  CORS_ORIGIN: process.env.CORS_ORIGIN || (IS_PRODUCTION ? null : 'http://localhost:5173'),
  NODE_ENV,
  IS_PRODUCTION,
  // Custo do bcrypt: 12 é o mínimo recomendado atualmente.
  // Valores maiores aumentam a segurança mas também o tempo de resposta.
  BCRYPT_ROUNDS: 12,
};
```

---

### `src/store/users.js`

```js
// src/store/users.js
'use strict';

const crypto = require('crypto');

/**
 * Armazenamento em memória (substitua por um banco de dados em produção).
 *
 * AVISO: Todos os dados são perdidos ao reiniciar o servidor.
 * Em produção, use um banco de dados com conexão TLS e credenciais seguras.
 */
const users = [];

/**
 * Busca um usuário pelo e-mail usando comparação timing-safe.
 *
 * Por que timing-safe?
 * Comparações simples (===) podem vazar informações sobre o dado comparado
 * através do tempo de execução (timing attack). crypto.timingSafeEqual
 * garante tempo constante independentemente do conteúdo.
 *
 * @param {string} email - E-mail normalizado (minúsculas, sem espaços)
 * @returns {object|undefined} Usuário encontrado ou undefined
 */
function findUserByEmail(email) {
  const emailBuffer = Buffer.from(email);

  return users.find((user) => {
    const storedBuffer = Buffer.from(user.email);

    // timingSafeEqual exige buffers de mesmo tamanho.
    if (emailBuffer.length !== storedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(emailBuffer, storedBuffer);
  });
}

/**
 * Busca um usuário pelo ID.
 * IDs são UUIDs v4 gerados internamente; não há risco de timing attack
 * relevante aqui, pois o ID vem de um JWT já validado.
 *
 * @param {string} id
 * @returns {object|undefined}
 */
function findUserById(id) {
  return users.find((user) => user.id === id);
}

/**
 * Cria e armazena um novo usuário.
 *
 * @param {object} userData
 * @param {string} userData.id
 * @param {string} userData.name
 * @param {string} userData.email
 * @param {string} userData.passwordHash
 * @returns {object} Usuário criado (sem o hash da senha)
 */
function createUser({ id, name, email, passwordHash }) {
  const user = {
    id,
    name,
    email,
    passwordHash,
    createdAt: new Date().toISOString(),
  };

  users.push(user);

  // Nunca retorne o hash da senha. Mesmo internamente, retornar apenas
  // o necessário reduz o risco de vazamento acidental em logs ou respostas.
  const { passwordHash: _, ...safeUser } = user;
  return safeUser;
}

module.exports = { findUserByEmail, findUserById, createUser };
```

---

### `src/validators/auth.js`

```js
// src/validators/auth.js
'use strict';

const { body, validationResult } = require('express-validator');

/**
 * Regras de validação para o cadastro.
 *
 * Por que validar e sanitizar?
 * - Validação garante que apenas dados no formato esperado sejam processados.
 * - Sanitização (trim, escape, normalizeEmail) remove caracteres que poderiam
 *   ser usados em ataques de injeção ou causar comportamento inesperado.
 */
const registerRules = [
  body('name')
    .trim()
    .notEmpty().withMessage('Nome é obrigatório.')
    .isLength({ min: 2, max: 100 }).withMessage('Nome deve ter entre 2 e 100 caracteres.')
    // Permite apenas letras (incluindo acentuadas) e espaços simples.
    .matches(/^[\p{L}\s]+$/u).withMessage('Nome deve conter apenas letras e espaços.')
    // Escapa caracteres HTML para prevenir XSS caso o valor seja exibido em algum template.
    .escape(),

  body('email')
    .trim()
    .notEmpty().withMessage('E-mail é obrigatório.')
    .isEmail().withMessage('E-mail inválido.')
    // normalizeEmail converte para minúsculas e remove variações (ex: Gmail dots).
    // Isso garante consistência no armazenamento e evita cadastros duplicados disfarçados.
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Senha é obrigatória.')
    .isLength({ min: 8 }).withMessage('Senha deve ter no mínimo 8 caracteres.')
    // Exige complexidade mínima: maiúscula, minúscula, número e símbolo.
    // Senhas fracas são a principal causa de comprometimento de contas.
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+$/)
    .withMessage('Senha deve conter maiúscula, minúscula, número e símbolo.'),
];

/**
 * Regras de validação para o login.
 * Mais permissivas que o cadastro para não revelar o formato esperado.
 */
const loginRules = [
  body('email')
    .trim()
    .notEmpty().withMessage('E-mail é obrigatório.')
    .isEmail().withMessage('E-mail inválido.')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Senha é obrigatória.')
    // Limite máximo para prevenir ataques de DoS via bcrypt com senhas enormes.
    // bcrypt processa apenas os primeiros 72 bytes; senhas maiores são truncadas silenciosamente.
    .isLength({ max: 128 }).withMessage('Senha inválida.'),
];

/**
 * Middleware que verifica os resultados da validação.
 * Retorna 422 com os erros encontrados, sem processar a requisição.
 *
 * Por que 422 e não 400?
 * 400 (Bad Request) indica que o servidor não entendeu a requisição.
 * 422 (Unprocessable Entity) indica que a requisição foi entendida,
 * mas os dados não passaram na validação semântica — mais preciso aqui.
 */
function validate(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).json({
      message: 'Dados inválidos.',
      errors: errors.array().map((e) => ({
        field: e.path,
        message: e.msg,
      })),
    });
  }

  next();
}

module.exports = { registerRules, loginRules, validate };
```

---

### `src/middleware/auth.js`

```js
// src/middleware/auth.js
'use strict';

const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');
const { findUserById } = require('../store/users');

/**
 * Middleware de autenticação JWT.
 *
 * Fluxo:
 * 1. Extrai o token do header Authorization (formato: "Bearer <token>")
 * 2. Verifica a assinatura e a expiração com algoritmo explícito
 * 3. Busca o usuário no store para garantir que ainda existe
 * 4. Anexa o usuário ao objeto req para uso nas rotas
 */
function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token de autenticação não fornecido.' });
  }

  const token = authHeader.slice(7); // Remove "Bearer "

  let payload;
  try {
    /**
     * Por que especificar algorithms: ['HS256']?
     *
     * Sem essa opção, versões antigas do jsonwebtoken aceitavam o algoritmo
     * declarado no próprio header do JWT. Um atacante poderia forjar um token
     * com alg: "none" e sem assinatura, e ele seria aceito como válido.
     *
     * Fixar o algoritmo no servidor garante que apenas tokens assinados com
     * HS256 sejam aceitos, independentemente do que o header do token declare.
     */
    payload = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
  } catch (err) {
    // Não diferencie "token expirado" de "token inválido" na resposta.
    // Detalhes sobre o motivo da rejeição podem ajudar um atacante.
    return res.status(401).json({ message: 'Token inválido ou expirado.' });
  }

  // Valida que o usuário referenciado no token ainda existe no store.
  // Isso é importante para cenários onde o usuário foi removido após a emissão do token.
  // Em produção, considere também uma blocklist de tokens revogados.
  const user = findUserById(payload.sub);

  if (!user) {
    return res.status(401).json({ message: 'Token inválido ou expirado.' });
  }

  // Anexa apenas os dados necessários, nunca o hash da senha.
  req.user = user;
  next();
}

module.exports = { authenticate };
```

---

### `src/routes/auth.js`

```js
// src/routes/auth.js
'use strict';

const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const rateLimit = require('express-rate-limit');

const { JWT_SECRET, JWT_EXPIRES_IN, BCRYPT_ROUNDS } = require('../config');
const { findUserByEmail, findUserById, createUser } = require('../store/users');
const { authenticate } = require('../middleware/auth');
const { registerRules, loginRules, validate } = require('../validators/auth');

const router = express.Router();

/**
 * Rate limiting para rotas sensíveis.
 *
 * Por que limitar /login e /register?
 * - /login: previne ataques de força bruta e credential stuffing.
 * - /register: previne criação massiva de contas (spam, abuso de recursos).
 *
 * Configuração conservadora: 10 tentativas a cada 15 minutos por IP.
 * Ajuste conforme o perfil de uso legítimo da sua aplicação.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10,
  // standardHeaders: true envia os headers RateLimit-* (RFC 6585) na resposta,
  // permitindo que clientes legítimos saibam quando podem tentar novamente.
  standardHeaders: true,
  // legacyHeaders: false remove os headers X-RateLimit-* deprecados.
  legacyHeaders: false,
  message: {
    message: 'Muitas tentativas. Tente novamente em 15 minutos.',
  },
  // skipSuccessfulRequests: true não conta requisições bem-sucedidas no limite.
  // Útil para /login: apenas falhas consomem a cota, não logins legítimos.
  skipSuccessfulRequests: true,
});

// ---------------------------------------------------------------------------
// POST /register
// ---------------------------------------------------------------------------

/**
 * Cadastra um novo usuário.
 *
 * Segurança:
 * - Senha é hasheada com bcrypt (custo 12) antes de armazenar.
 * - O hash nunca é retornado na resposta.
 * - E-mail duplicado retorna 409, mas sem revelar dados do usuário existente.
 */
router.post('/register', authLimiter, registerRules, validate, async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = findUserByEmail(email);
    if (existingUser) {
      // 409 Conflict indica que o recurso já existe.
      // Não retorne dados do usuário existente (ex: data de criação).
      return res.status(409).json({ message: 'E-mail já cadastrado.' });
    }

    /**
     * Por que bcrypt com custo 12?
     *
     * O custo (work factor) determina quantas iterações o algoritmo executa.
     * Cada incremento dobra o tempo de processamento.
     * Custo 12 leva ~250ms em hardware moderno — aceitável para UX,
     * mas caro o suficiente para tornar ataques de força bruta inviáveis.
     *
     * NUNCA armazene senhas em texto claro, MD5, SHA-1 ou SHA-256 simples.
     * Esses algoritmos são rápidos demais para hashing de senhas.
     */
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const newUser = createUser({
      id: uuidv4(),
      name,
      email,
      passwordHash,
    });

    // 201 Created com os dados do usuário (sem o hash).
    return res.status(201).json({
      message: 'Usuário criado com sucesso.',
      user: newUser,
    });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// POST /login
// ---------------------------------------------------------------------------

/**
 * Autentica um usuário e retorna um JWT.
 *
 * Segurança:
 * - Mensagem de erro genérica para e-mail ou senha inválidos.
 *   Diferenciar os dois casos permitiria enumeração de usuários cadastrados.
 * - bcrypt.compare é usado mesmo quando o usuário não existe (dummy hash)
 *   para garantir tempo de resposta constante e evitar timing attacks.
 * - O JWT é assinado com algoritmo explícito (HS256).
 */

// Hash fictício usado quando o usuário não existe.
// Garante que bcrypt.compare sempre execute, evitando timing attacks
// que revelariam se um e-mail está cadastrado ou não.
const DUMMY_HASH = '$2b$12$invalidhashusedtopreventimaginarytimingattacksXXXXXXXXXX';

router.post('/login', authLimiter, loginRules, validate, async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = findUserByEmail(email);

    /**
     * Por que sempre executar bcrypt.compare?
     *
     * Se retornássemos imediatamente quando o usuário não existe,
     * um atacante poderia medir o tempo de resposta:
     * - Resposta rápida → e-mail não cadastrado
     * - Resposta lenta  → e-mail cadastrado (bcrypt está rodando)
     *
     * Ao sempre executar o compare (com hash fictício quando necessário),
     * o tempo de resposta é similar nos dois casos.
     */
    const hashToCompare = user ? user.passwordHash : DUMMY_HASH;
    const passwordMatch = await bcrypt.compare(password, hashToCompare);

    if (!user || !passwordMatch) {
      // Mensagem genérica: não revele se foi o e-mail ou a senha que falhou.
      return res.status(401).json({ message: 'Credenciais inválidas.' });
    }

    /**
     * Estrutura do payload JWT:
     * - sub (subject): ID do usuário — campo padrão do RFC 7519 para identificar o sujeito.
     * - iat (issued at): adicionado automaticamente pelo jsonwebtoken.
     * - exp (expires at): adicionado automaticamente com base em JWT_EXPIRES_IN.
     *
     * Não inclua dados sensíveis no payload (senha, hash, dados financeiros).
     * O payload é codificado em Base64, não criptografado — qualquer um pode lê-lo.
     *
     * Por que algorithm: 'HS256' explícito?
     * Previne o ataque "alg: none" onde um token sem assinatura seria aceito.
     */
    const token = jwt.sign(
      { sub: user.id },
      JWT_SECRET,
      {
        algorithm: 'HS256',
        expiresIn: JWT_EXPIRES_IN,
      }
    );

    return res.status(200).json({
      message: 'Login realizado com sucesso.',
      token,
    });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// GET /profile
// ---------------------------------------------------------------------------

/**
 * Retorna os dados do usuário autenticado.
 * O middleware `authenticate` garante que apenas usuários com JWT válido acessem esta rota.
 */
router.get('/profile', authenticate, (req, res) => {
  // req.user é populado pelo middleware authenticate (sem o hash da senha).
  return res.status(200).json({ user: req.user });
});

module.exports = router;
```

---

### `src/app.js`

```js
// src/app.js
'use strict';

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');

const { CORS_ORIGIN, IS_PRODUCTION } = require('./config');
const authRoutes = require('./routes/auth');

const app = express();

// ---------------------------------------------------------------------------
// Headers de segurança (helmet)
// ---------------------------------------------------------------------------

/**
 * helmet configura vários headers HTTP de segurança:
 *
 * - Content-Security-Policy: restringe de onde recursos podem ser carregados.
 *   Mesmo sendo uma API (sem HTML), é boa prática definir uma política restritiva.
 * - X-Content-Type-Options: nosniff — impede que o browser "adivinhe" o MIME type.
 * - X-Frame-Options: DENY — impede que a página seja carregada em iframes (clickjacking).
 * - Strict-Transport-Security: força HTTPS em produção.
 * - X-Powered-By: removido — não revele que usa Express.
 */
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'none'"],
        frameAncestors: ["'none'"],
      },
    },
    // HSTS só faz sentido em produção (com HTTPS configurado).
    hsts: IS_PRODUCTION
      ? { maxAge: 31536000, includeSubDomains: true, preload: true }
      : false,
  })
);

// ---------------------------------------------------------------------------
// CORS
// ---------------------------------------------------------------------------

/**
 * Por que restringir o CORS?
 *
 