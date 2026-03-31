# 📘 README – API REST Segura em Node.js (Express)

> **Objetivo** – API mínima para cadastro, login e acesso autenticado usando armazenamento em memória, com boas práticas de segurança.  
> **Tecnologias** – Node.js, Express, bcrypt, jsonwebtoken, dotenv, helmet, cors, express‑rate-limit, express‑validator.

---

## 📂 Estrutura do Projeto

```
/api-secure/
│
├─ .env                 # Variáveis de ambiente (não versionar)
├─ .env.example         # Exemplo de .env
├─ package.json
├─ package-lock.json
│
├─ src/
│   ├─ app.js           # Entrada da aplicação
│   ├─ routes/
│   │   └─ auth.js      # Rotas /register, /login, /profile
│   ├─ middleware/
│   │   ├─ auth.js      # Verificação do JWT
│   │   └─ errorHandler.js # Tratamento centralizado de erros
│   └─ utils/
│       └─ validators.js   # Validação de entrada (express‑validator)
│
└─ README.md            # Este documento
```

---

## 🚀 Como Executar Localmente

1. **Clone o repositório** (ou copie a estrutura acima)  

   ```bash
   git clone https://github.com/youruser/api-secure.git
   cd api-secure
   ```

2. **Instale as dependências**

   ```bash
   npm ci
   ```

3. **Crie o arquivo `.env`** a partir do exemplo  

   ```bash
   cp .env.example .env
   ```

   Edite `.env` e defina um segredo forte para o JWT:

   ```dotenv
   JWT_SECRET=uma_chave_aleatoria_e_segura_123!
   JWT_EXPIRES_IN=1h
   BCRYPT_SALT_ROUNDS=12
   PORT=3000
   ```

4. **Inicie a aplicação**

   ```bash
   npm start
   ```

   A API ficará disponível em `http://localhost:3000`.

---

## 📋 Endpoints

| Método | Rota      | Descrição                              | Corpo da Requisição (JSON)                     |
|--------|-----------|----------------------------------------|-------------------------------------------------|
| POST   | /register | Cria um novo usuário                    | `{ "email": "user@example.com", "password": "Secret123!" }` |
| POST   | /login    | Autentica usuário e devolve JWT         | `{ "email": "user@example.com", "password": "Secret123!" }` |
| GET    | /profile  | Retorna dados do usuário autenticado    | **Header** `Authorization: Bearer <token>`       |

> **Obs.** O armazenamento é volátil (array em memória). Em produção troque por um banco de dados persistente.

---

## 🔐 Medidas de Segurança Implementadas (e correções)

| Vulnerabilidade / Má prática | Como foi corrigida |
|------------------------------|--------------------|
| **Senha em texto plano** | Uso de **bcrypt** com `BCRYPT_SALT_ROUNDS` configurável via `.env`. |
| **Segredo JWT hard‑coded** | O segredo vem exclusivamente de `process.env.JWT_SECRET`. A aplicação aborta se a variável não estiver definida. |
| **Algoritmo JWT inseguro (`none`)** | Força o algoritmo **HS256** ao assinar/verificar tokens. |
| **Token sem expiração** | `JWT_EXPIRES_IN` (ex.: `1h`) definido via `.env`. |
| **Headers de segurança ausentes** | Integração do **helmet** para definir `Content‑Security‑Policy`, `X‑Content‑Type‑Options`, `X‑Frame‑Options`, etc. |
| **CORS aberto** | Configurado com **cors** permitindo apenas origens confiáveis (por padrão `*` em dev, mas pode ser restringido). |
| **Rate‑limiting ausente** | **express‑rate-limit** limita a 100 requisições por IP a cada 15 min, mitigando brute‑force. |
| **Validação de entrada insuficiente** | `express-validator` verifica e sanitiza `email` e `password`, rejeitando dados mal‑formados. |
| **Exposição de stack trace** | Middleware de erro centralizado oculta detalhes internos em produção (`NODE_ENV=production`). |
| **Retorno de hash de senha** | Nunca enviamos o hash ao cliente; apenas `email` e `id` são retornados. |
| **Uso de `var` ou `let` desnecessário** | Código usa `const`/`let` de forma adequada, evitando hoisting inesperado. |
| **Falha ao tratar promessas rejeitadas** | Todas as rotas async são envolvidas em `try/catch` e encaminhadas ao middleware de erro. |
| **Armazenamento em memória não thread‑safe** | Comentado que é apenas para demonstração; em produção usar DB. |
| **Ausência de política de SameSite/HttpOnly em cookies** | Não usamos cookies; o token é passado via header `Authorization`. Se precisar de cookies, recomenda‑se `httpOnly`, `secure`, `sameSite=strict`. |

---

## 📂 Código Fonte (corrigido)

### `package.json`

```json
{
  "name": "api-secure",
  "version": "1.0.0",
  "description": "API REST simples com registro, login e perfil usando segurança básica",
  "main": "src/app.js",
  "type": "module",
  "scripts": {
    "start": "node src/app.js",
    "dev": "nodemon src/app.js"
  },
  "author": "Your Name",
  "license": "MIT",
  "dependencies": {
    "bcrypt": "^5.1.0",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "express-rate-limit": "^7.2.0",
    "express-validator": "^7.0.1",
    "helmet": "^7.1.0",
    "jsonwebtoken": "^9.0.2"
  },
  "devDependencies": {
    "nodemon": "^3.1.4"
  }
}
```

### `.env.example`

```dotenv
# ------------------------------
#   Configurações de Segurança
# ------------------------------
JWT_SECRET=YOUR_STRONG_RANDOM_SECRET
JWT_EXPIRES_IN=1h          # ex.: 1h, 30m, 2d
BCRYPT_SALT_ROUNDS=12

# Porta da aplicação
PORT=3000
```

### `src/app.js`

```javascript
import express from 'express';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import authRouter from './routes/auth.js';
import errorHandler from './middleware/errorHandler.js';

// Carrega variáveis de ambiente
dotenv.config();

const {
  PORT = 3000,
  JWT_SECRET,
  JWT_EXPIRES_IN,
  BCRYPT_SALT_ROUNDS,
} = process.env;

// Validação mínima das variáveis críticas
if (!JWT_SECRET) {
  console.error('❌ ERRO: JWT_SECRET não definido no .env');
  process.exit(1);
}
if (!JWT_EXPIRES_IN) {
  console.error('❌ ERRO: JWT_EXPIRES_IN não definido no .env');
  process.exit(1);
}
if (!BCRYPT_SALT_ROUNDS) {
  console.error('❌ ERRO: BCRYPT_SALT_ROUNDS não definido no .env');
  process.exit(1);
}

const app = express();

// Middlewares globais
app.use(helmet());                     // Headers de segurança
app.use(cors({ origin: '*' }));        // Ajuste em produção
app.use(express.json());               // Parse JSON

// Rate limiting (100 req/15min por IP)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Rotas
app.use('/', authRouter);

// Tratamento de erros (deve ser o último middleware)
app.use(errorHandler);

// Inicia o servidor
app.listen(PORT, () => {
  console.info(`🚀 API rodando em http://localhost:${PORT}`);
});
```

### `src/routes/auth.js`

```javascript
import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import authMiddleware from '../middleware/auth.js';
import { validateRegister, validateLogin } from '../utils/validators.js';

const router = Router();

// Armazenamento em memória (não persistente)
const users = []; // Cada usuário: { id, email, passwordHash }

/**
 * @route   POST /register
 * @desc    Cria novo usuário
 */
router.post(
  '/register',
  validateRegister,
  async (req, res, next) => {
    try {
      // Validação de campos
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      // Verifica duplicidade
      const exists = users.find((u) => u.email === email);
      if (exists) {
        return res.status(409).json({ message: 'Email já cadastrado' });
      }

      // Hash da senha
      const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10);
      const passwordHash = await bcrypt.hash(password, saltRounds);

      const newUser = {
        id: users.length + 1,
        email,
        passwordHash,
      };
      users.push(newUser);

      // Não retornamos a senha nem o hash
      return res.status(201).json({ id: newUser.id, email: newUser.email });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * @route   POST /login
 * @desc    Autentica usuário e devolve JWT
 */
router.post(
  '/login',
  validateLogin,
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;
      const user = users.find((u) => u.email === email);
      if (!user) {
        // Não revelamos se o email existe ou não
        return res.status(401).json({ message: 'Credenciais inválidas' });
      }

      const match = await bcrypt.compare(password, user.passwordHash);
      if (!match) {
        return res.status(401).json({ message: 'Credenciais inválidas' });
      }

      const payload = { sub: user.id, email: user.email };
      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
        algorithm: 'HS256',
      });

      return res.json({ token });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * @route   GET /profile
 * @desc    Retorna dados do usuário autenticado
 * @access  Protegido (Bearer token)
 */
router.get('/profile', authMiddleware, (req, res) => {
  // O middleware já adicionou `req.user`
  const user = users.find((u) => u.id === req.user.sub);
  if (!user) {
    return res.status(404).json({ message: 'Usuário não encontrado' });
  }

  return res.json({ id: user.id, email: user.email });
});

export default router;
```

### `src/middleware/auth.js`

```javascript
import jwt from 'jsonwebtoken';

/**
 * Middleware que verifica o token JWT enviado no header
 * Authorization: Bearer <token>
 */
export default function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token ausente ou mal formatado' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256'],
    });
    // Anexa informações do usuário ao request
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token inválido ou expirado' });
  }
}
```

### `src/middleware/errorHandler.js`

```javascript
/**
 * Tratamento centralizado de erros.
 * Em produção (NODE_ENV=production) não expõe stack trace.
 */
export default function errorHandler(err, req, res, _next) {
  console.error(err); // Log interno

  const status = err.status || 500;
  const response = {
    message: err.message || 'Erro interno do servidor',
  };

  if (process.env.NODE_ENV !== 'production') {
    response.stack = err.stack;
  }

  res.status(status).json(response);
}
```

### `src/utils/validators.js`

```javascript
import { body } from 'express-validator';

/**
 * Validação para registro:
 * - email válido
 * - senha com pelo menos 8 caracteres, contendo letras e números
 */
export const validateRegister = [
  body('email')
    .isEmail()
    .withMessage('Formato de email inválido')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Senha deve ter no mínimo 8 caracteres')
    .matches(/[a-z]/i)
    .withMessage('Senha deve conter ao menos uma letra')
    .matches(/[0-9]/)
    .withMessage('Senha deve conter ao menos um número')
    .trim(),
];

/**
 * Validação para login:
 * - email válido
 * - senha não vazia
 */
export const validateLogin = [
  body('email')
    .isEmail()
    .withMessage('Formato de email inválido')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Senha é obrigatória')
    .trim(),
];
```

---

## 🛡️ Como Testar a Segurança (quick checklist)

1. **Tente registrar duas vezes o mesmo e‑mail** → Deve retornar `409 Conflict`.
2. **Envie login com senha errada** → Deve retornar `401 Unauthorized` sem indicar se o e‑mail existe.
3. **Acesse `/profile` sem token** → `401 Unauthorized`.
4. **Acesse `/profile` com token expirado** → `401 Unauthorized`.
5. **Faça mais de 100 requisições em 15 min** → Receberá `429 Too Many Requests`.
6. **Verifique os headers** → `helmet` adiciona `X‑Content‑Type‑Options`, `X‑Frame‑Options`, `Strict-Transport-Security`, etc.

---

## 📦 Próximos Passos (para produção)

- Substituir o array em memória por um banco de dados (PostgreSQL, MongoDB, etc.).
- Configurar CORS restrito a domínios confiáveis.
- Habilitar HTTPS (TLS) e definir `secure: true` em cookies, caso os use.
- Implementar refresh tokens ou rotação de chaves JWT.
- Adicionar monitoramento e logging estruturado (p. ex. Winston, Pino).
- Executar análise estática (ESLint, SonarQube) e testes de penetração.

---

**Pronto!** 🎉  
A API está pronta para ser usada em desenvolvimento e serve como base segura para evoluir a um ambiente de produção. Boa codificação!