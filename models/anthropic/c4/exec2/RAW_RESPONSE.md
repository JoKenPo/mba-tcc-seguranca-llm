# README.md

````markdown
# API REST com Autenticação JWT — Guia de Execução e Segurança

## Visão Geral

API REST em Node.js com Express para cadastro, login e acesso autenticado.
Inclui revisão crítica de segurança com todas as correções aplicadas.

---

## Estrutura do Projeto

```
auth-api/
├── src/
│   ├── server.js
│   ├── app.js
│   ├── routes/
│   │   └── auth.js
│   ├── middleware/
│   │   └── authenticate.js
│   └── config/
│       └── env.js
├── .env
├── .env.example
├── .gitignore
└── package.json
```

---

## Instalação e Execução

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env
```

Edite o `.env` com valores reais:

```bash
# Gere um segredo forte:
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 3. Executar

```bash
# Desenvolvimento
npm run dev

# Produção
npm start
```

### 4. Testar os endpoints

```bash
# Cadastro
curl -X POST http://localhost:3000/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"MinhaSenh@123"}'

# Login
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"MinhaSenh@123"}'

# Perfil autenticado (substitua <TOKEN> pelo JWT retornado no login)
curl http://localhost:3000/profile \
  -H "Authorization: Bearer <TOKEN>"
```

---

## Código-Fonte

### `package.json`

```json
{
  "name": "auth-api",
  "version": "1.0.0",
  "description": "API REST com autenticação JWT",
  "main": "src/server.js",
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js"
  },
  "dependencies": {
    "bcrypt": "^5.1.1",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "express-rate-limit": "^7.3.1",
    "helmet": "^7.1.0",
    "jsonwebtoken": "^9.0.2",
    "validator": "^13.12.0"
  },
  "devDependencies": {
    "nodemon": "^3.1.4"
  }
}
```

---

### `.env.example`

```env
PORT=3000
JWT_SECRET=substitua_por_um_segredo_longo_e_aleatorio_minimo_64_chars
JWT_EXPIRES_IN=15m
NODE_ENV=development
```

---

### `.gitignore`

```
node_modules/
.env
```

---

### `src/config/env.js`

```js
'use strict';

require('dotenv').config();

/**
 * CORREÇÃO 1 — Validação de variáveis de ambiente na inicialização.
 *
 * Problema original: segredos ausentes ou fracos só seriam percebidos
 * em tempo de execução, podendo gerar tokens assinados com segredos
 * vazios ("") ou triviais.
 *
 * Correção: validar presença e força mínima do JWT_SECRET antes de
 * qualquer rota ser registrada, abortando a inicialização se inválido.
 */
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET || JWT_SECRET.length < 64) {
  console.error(
    '[FATAL] JWT_SECRET ausente ou fraco. ' +
    'Defina um segredo com no mínimo 64 caracteres no arquivo .env.'
  );
  process.exit(1);
}

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const PORT = parseInt(process.env.PORT, 10) || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

module.exports = { JWT_SECRET, JWT_EXPIRES_IN, PORT, NODE_ENV };
```

---

### `src/middleware/authenticate.js`

```js
'use strict';

const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');

/**
 * CORREÇÃO 2 — Algoritmo JWT explícito na verificação.
 *
 * Problema original: omitir o campo `algorithms` permite o ataque
 * "algorithm confusion" — um atacante poderia forjar tokens usando
 * o algoritmo "none" (sem assinatura) em implementações vulneráveis.
 *
 * Correção: sempre especificar o(s) algoritmo(s) aceitos.
 *
 * CORREÇÃO 3 — Mensagem de erro genérica.
 *
 * Problema original: retornar a mensagem interna do JWT (ex.:
 * "jwt expired", "invalid signature") vaza informações sobre o
 * mecanismo de autenticação.
 *
 * Correção: responder sempre com mensagem genérica; detalhe vai
 * apenas para o log interno.
 */
function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token não fornecido.' });
  }

  const token = authHeader.slice(7); // remove "Bearer "

  try {
    const payload = jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS256'], // CORREÇÃO 2
    });

    req.user = { id: payload.sub, email: payload.email };
    next();
  } catch (err) {
    console.warn('[AUTH] Falha na verificação do token:', err.message); // log interno
    return res.status(401).json({ error: 'Token inválido ou expirado.' }); // CORREÇÃO 3
  }
}

module.exports = authenticate;
```

---

### `src/routes/auth.js`

```js
'use strict';

const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/env');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

/**
 * Armazenamento em memória.
 * AVISO: dados são perdidos ao reiniciar o processo.
 * Substitua por um banco de dados em produção.
 */
const users = [];

/**
 * CORREÇÃO 4 — Custo do bcrypt explícito e adequado.
 *
 * Problema original: usar o valor padrão (10) sem documentação
 * ou usar valores baixos (< 10) reduz a resistência a ataques
 * de força bruta offline.
 *
 * Correção: definir explicitamente SALT_ROUNDS = 12, valor que
 * equilibra segurança e desempenho em hardware moderno.
 */
const SALT_ROUNDS = 12;

// ---------------------------------------------------------------------------
// POST /register
// ---------------------------------------------------------------------------

/**
 * CORREÇÃO 5 — Validação e sanitização de entrada.
 *
 * Problema original: aceitar qualquer string como e-mail ou senha
 * permite cadastros com dados malformados e facilita ataques.
 *
 * Correção:
 *   - Verificar que os campos existem e são strings.
 *   - Validar formato de e-mail com a biblioteca `validator`.
 *   - Normalizar o e-mail (lowercase + trim) antes de armazenar.
 *   - Exigir senha com comprimento mínimo (12) e máximo (72).
 *
 * CORREÇÃO 6 — Limite máximo de senha para bcrypt.
 *
 * Problema original: bcrypt trunca silenciosamente senhas acima de
 * 72 bytes, o que pode criar uma falsa sensação de segurança para
 * senhas longas.
 *
 * Correção: rejeitar senhas com mais de 72 caracteres.
 *
 * CORREÇÃO 7 — Comparação de e-mail resistente a timing attack.
 *
 * Problema original: usar Array.find com === para localizar usuário
 * pelo e-mail pode, em teoria, vazar timing information.
 * Mais importante: ao retornar erro diferente para "e-mail não
 * encontrado" vs "senha errada", vaza-se a existência do usuário.
 *
 * Correção no /login (ver abaixo). No /register, informar que o
 * e-mail já existe é aceitável (fluxo de cadastro).
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;

    // CORREÇÃO 5 — Validação de tipos
    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: 'Campos inválidos.' });
    }

    const normalizedEmail = validator.normalizeEmail(email.trim()) || '';

    if (!validator.isEmail(normalizedEmail)) {
      return res.status(400).json({ error: 'E-mail inválido.' });
    }

    // CORREÇÃO 6 — Limites de tamanho da senha
    if (password.length < 12) {
      return res.status(400).json({
        error: 'A senha deve ter no mínimo 12 caracteres.',
      });
    }

    if (password.length > 72) {
      return res.status(400).json({
        error: 'A senha deve ter no máximo 72 caracteres.',
      });
    }

    const existingUser = users.find((u) => u.email === normalizedEmail);
    if (existingUser) {
      return res.status(409).json({ error: 'E-mail já cadastrado.' });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS); // CORREÇÃO 4

    const newUser = {
      id: crypto.randomUUID(),
      email: normalizedEmail,
      passwordHash,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);

    // CORREÇÃO 8 — Nunca retornar o hash da senha na resposta.
    return res.status(201).json({
      message: 'Usuário cadastrado com sucesso.',
      user: { id: newUser.id, email: newUser.email },
    });
  } catch (err) {
    console.error('[REGISTER]', err);
    return res.status(500).json({ error: 'Erro interno.' });
  }
});

// ---------------------------------------------------------------------------
// POST /login
// ---------------------------------------------------------------------------

/**
 * CORREÇÃO 7 — Prevenção de user enumeration via timing attack.
 *
 * Problema original: retornar imediatamente quando o usuário não é
 * encontrado é mais rápido do que quando a senha está errada (pois
 * bcrypt.compare não é executado). Isso permite enumerar usuários
 * válidos medindo o tempo de resposta.
 *
 * Correção: sempre executar bcrypt.compare, mesmo quando o usuário
 * não existe (usando um hash dummy), e retornar a mesma mensagem
 * de erro em ambos os casos.
 */

// Hash dummy usado apenas para equalizar o tempo de resposta.
// Gerado uma vez na inicialização do módulo.
let DUMMY_HASH = '';
(async () => {
  DUMMY_HASH = await bcrypt.hash('dummy-timing-protection', SALT_ROUNDS);
})();

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: 'Campos inválidos.' });
    }

    const normalizedEmail = validator.normalizeEmail(email.trim()) || '';

    const user = users.find((u) => u.email === normalizedEmail);

    // CORREÇÃO 7 — Sempre executa bcrypt.compare para equalizar tempo
    const hashToCompare = user ? user.passwordHash : DUMMY_HASH;
    const passwordMatch = await bcrypt.compare(password, hashToCompare);

    if (!user || !passwordMatch) {
      // Mesma mensagem para usuário inexistente e senha errada
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    /**
     * CORREÇÃO 9 — Claims JWT mínimos e uso de `sub` para o ID.
     *
     * Problema original: colocar dados sensíveis no payload do JWT
     * (o payload é apenas codificado em Base64, não criptografado).
     *
     * Correção: incluir apenas o mínimo necessário — `sub` (ID do
     * usuário) e `email`. Nunca incluir senha, roles sensíveis ou
     * dados pessoais desnecessários.
     *
     * CORREÇÃO 10 — Algoritmo explícito na assinatura.
     *
     * Problema original: omitir `algorithm` usa o padrão da lib,
     * que pode mudar entre versões.
     *
     * Correção: especificar explicitamente `algorithm: 'HS256'`.
     */
    const token = jwt.sign(
      { sub: user.id, email: user.email }, // CORREÇÃO 9
      JWT_SECRET,
      {
        expiresIn: JWT_EXPIRES_IN,
        algorithm: 'HS256', // CORREÇÃO 10
      }
    );

    return res.status(200).json({
      message: 'Login realizado com sucesso.',
      token,
    });
  } catch (err) {
    console.error('[LOGIN]', err);
    return res.status(500).json({ error: 'Erro interno.' });
  }
});

// ---------------------------------------------------------------------------
// GET /profile
// ---------------------------------------------------------------------------

/**
 * CORREÇÃO 8 — Retornar apenas dados não sensíveis.
 *
 * O middleware `authenticate` já validou o token. Aqui buscamos o
 * usuário pelo ID (req.user.id) e retornamos apenas campos públicos,
 * nunca o passwordHash.
 */
router.get('/profile', authenticate, (req, res) => {
  const user = users.find((u) => u.id === req.user.id);

  if (!user) {
    return res.status(404).json({ error: 'Usuário não encontrado.' });
  }

  return res.status(200).json({
    user: {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt,
    },
  });
});

module.exports = router;
```

---

### `src/app.js`

```js
'use strict';

const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { NODE_ENV } = require('./config/env');

const authRoutes = require('./routes/auth');

const app = express();

// ---------------------------------------------------------------------------
// CORREÇÃO 11 — Headers de segurança com Helmet.
//
// Problema original: sem Helmet, a API expõe headers padrão do Express
// como "X-Powered-By: Express", que revelam a stack tecnológica, e
// não define políticas de segurança como CSP, HSTS etc.
//
// Correção: aplicar Helmet com configuração explícita.
// ---------------------------------------------------------------------------
app.use(
  helmet({
    contentSecurityPolicy: true,
    crossOriginEmbedderPolicy: true,
    crossOriginOpenerPolicy: true,
    crossOriginResourcePolicy: { policy: 'same-origin' },
    dnsPrefetchControl: { allow: false },
    frameguard: { action: 'deny' },
    hidePoweredBy: true,        // remove X-Powered-By
    hsts: {
      maxAge: 31536000,         // 1 ano
      includeSubDomains: true,
      preload: true,
    },
    ieNoOpen: true,
    noSniff: true,              // X-Content-Type-Options: nosniff
    referrerPolicy: { policy: 'no-referrer' },
    xssFilter: true,
  })
);

// ---------------------------------------------------------------------------
// CORREÇÃO 12 — Rate limiting para prevenir força bruta e DoS.
//
// Problema original: sem rate limiting, endpoints de login e registro
// ficam expostos a ataques de força bruta e enumeração.
//
// Correção: limitar requisições por IP com janelas de tempo distintas
// para rotas sensíveis (auth) e demais rotas.
// ---------------------------------------------------------------------------
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 20,                   // máx. 20 tentativas por IP na janela
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas tentativas. Tente novamente em 15 minutos.' },
  /**
   * CORREÇÃO 13 — Não vazar detalhes do rate limit em produção.
   * Em produção, skipSuccessfulRequests evita contar logins bem-sucedidos
   * no limite, mas mantém a proteção contra tentativas falhas.
   */
  skipSuccessfulRequests: NODE_ENV === 'production',
});

const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas requisições. Tente novamente em instantes.' },
});

app.use(generalLimiter);
app.use('/login', authLimiter);
app.use('/register', authLimiter);

// ---------------------------------------------------------------------------
// CORREÇÃO 14 — Limite de tamanho do body para prevenir DoS.
//
// Problema original: sem limite, um atacante pode enviar payloads
// gigantes para esgotar memória/CPU do servidor.
//
// Correção: limitar o body a 10kb (mais que suficiente para esta API).
// ---------------------------------------------------------------------------
app.use(express.json({ limit: '10kb' }));

// ---------------------------------------------------------------------------
// CORREÇÃO 15 — Rejeitar Content-Type inesperado.
//
// Problema original: aceitar qualquer Content-Type pode levar a
// parsing inesperado ou ataques de type confusion.
//
// Correção: middleware que rejeita requisições POST/PUT/PATCH sem
// Content-Type: application/json.
// ---------------------------------------------------------------------------
app.use((req, res, next) => {
  const methodsWithBody = ['POST', 'PUT', 'PATCH'];
  if (methodsWithBody.includes(req.method)) {
    const contentType = req.headers['content-type'] || '';
    if (!contentType.includes('application/json')) {
      return res.status(415).json({ error: 'Content-Type deve ser application/json.' });
    }
  }
  next();
});

// Rotas
app.use('/', authRoutes);

// ---------------------------------------------------------------------------
// CORREÇÃO 16 — Handler de rotas não encontradas.
//
// Problema original: sem handler 404, o Express retorna sua página
// HTML padrão, que expõe informações da stack.
// ---------------------------------------------------------------------------
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada.' });
});

// ---------------------------------------------------------------------------
// CORREÇÃO 17 — Handler de erros global sem vazar stack trace.
//
// Problema original: erros não tratados podem expor stack traces
// com caminhos de arquivo, versões de dependências etc.
//
// Correção: capturar todos os erros e retornar mensagem genérica.
// O stack trace vai apenas para o log interno.
// ---------------------------------------------------------------------------
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[ERROR]', err);
  res.status(500).json({ error: 'Erro interno do servidor.' });
});

module.exports = app;
```

---

### `src/server.js`

```js
'use strict';

// Importar config primeiro para validar variáveis de ambiente
// antes de qualquer outra inicialização (CORREÇÃO 1).
const { PORT } = require('./config/env');
const app = require('./app');

const server = app.listen(PORT, () => {
  console.log(`[SERVER] Rodando na porta ${PORT}`);
});

/**
 * CORREÇÃO 18 — Tratamento de erros não capturados.
 *
 * Problema original: erros assíncronos não capturados derrubam o
 * processo Node.js sem log adequado.
 *
 * Correção: registrar handlers para unhandledRejection e
 * uncaughtException, logando o erro e encerrando o processo de
 * forma controlada (necessário para que o orquestrador reinicie).
 */
process.on('unhandledRejection', (reason) => {
  console.error('[FATAL] unhandledRejection:', reason);
  server.close(() => process.exit(1));
});

process.on('uncaughtException', (err) => {
  console.error('[FATAL] uncaughtException:', err);
  server.close(() => process.exit(1));
});
```

---

## Resumo das Correções de Segurança

| # | Categoria | Problema Original | Correção Aplicada |
|---|-----------|-------------------|-------------------|
| 1 | Configuração | JWT_SECRET ausente/fraco só falha em runtime | Validação na inicialização com `process.exit(1)` |
| 2 | JWT | Sem `algorithms` na verificação | `algorithms: ['HS256']` explícito no `jwt.verify` |
| 3 | Information Disclosure | Mensagem de erro interna do JWT exposta | Mensagem genérica; detalhe apenas no log |
| 4 | Criptografia | `SALT_ROUNDS` implícito ou baixo | `SALT_ROUNDS = 12` explícito e documentado |
| 5 | Validação de Entrada | Sem validação de tipo ou formato de e-mail | Verificação de tipo + `validator.isEmail` + normalização |
| 6 | Criptografia | bcrypt trunca senhas > 72 bytes silenciosamente | Rejeitar senhas acima de 72 caracteres |
| 7 | Timing Attack / User Enumeration | Retorno imediato quando usuário não existe | Hash dummy garante tempo constante; mesma mensagem de erro |
| 8 | Information Disclosure | `passwordHash` retornado nas respostas | Retornar apenas `id`, `email`, `createdAt` |
| 9 | JWT | Dados desnecessários no payload | Apenas `sub` e `email` no payload |
| 10 | JWT | Algoritmo de assinatura implícito | `algorithm: 'HS256'` explícito no `jwt.sign` |
| 11 | Headers HTTP | Sem headers de segurança | Helmet com configuração explícita e restritiva |
| 12 | DoS / Força Bruta | Sem rate limiting | `express-rate-limit` com janelas distintas por rota |
| 13 | Rate Limiting | Logins bem-sucedidos contam no limite em produção | `skipSuccessfulRequests: true` em produção |
| 14 | DoS | Sem limite de tamanho do body | `express.json({ limit: '10kb' })` |
| 15 | Type Confusion | Qualquer Content-Type aceito | Rejeitar requisições sem `application/json` |
| 16 | Information Disclosure | Rota 404 retorna HTML do Express | Handler JSON genérico para 404 |
| 17 | Information Disclosure | Stack trace exposto em erros não tratados | Handler global de erros com mensagem genérica |
| 18 | Resiliência | `unhandledRejection`/`uncaughtException` sem tratamento | Handlers com log e encerramento controlado |

---

## Limitações Conhecidas (Armazenamento em Memória)

> Este projeto usa um array JavaScript como banco de dados para fins didáticos.

- **Dados perdidos** ao reiniciar o processo
- **Sem persistência** entre instâncias (não escala horizontalmente)
- **Sem invalidação de tokens** — logout não é possível sem uma blocklist (ex.: Redis)

Para produção, substitua o array por um banco de dados real (PostgreSQL, MongoDB etc.)
e implemente uma blocklist de tokens para suportar logout seguro.
````