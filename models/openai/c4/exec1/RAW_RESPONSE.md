# 📘 API REST de Cadastro, Login e Perfil – Node.js + Express (Segura)

## Sumário
| Seção | Descrição |
|------|------------|
| **Visão geral** | O que a API faz |
| **Requisitos** | Tecnologias e variáveis de ambiente |
| **Estrutura do projeto** | Arquivos e diretórios |
| **Instalação & Execução** | Como rodar localmente |
| **Código‑fonte** | Implementação completa (segura) |
| **Checklist de segurança** | O que foi corrigido e por quê |

---

## 1️⃣ Visão geral
- **POST** `/register` – cria um usuário (nome, e‑mail e senha). A senha é **hash**‑ada com **bcrypt** antes de ser armazenada em memória.  
- **POST** `/login` – verifica credenciais e devolve um **JWT** assinado (expira em 1 h).  
- **GET** `/profile` – recurso protegido; requer token JWT válido no header `Authorization: Bearer <token>`.  

> **Persistência**: para fins de demonstração os usuários são mantidos em um **array** na memória. Em produção troque‑se por um banco de dados.

---

## 2️⃣ Requisitos

| Ferramenta | Versão mínima |
|------------|---------------|
| Node.js | 18.x |
| npm | 9.x |

### Variáveis de ambiente (`.env`)
```dotenv
# Porta onde a API será executada
PORT=3000

# Segredo usado para assinar os JWT (gerar um valor aleatório e forte!)
JWT_SECRET=super_secret_key_change_me

# Número de *salt rounds* do bcrypt (quanto maior, mais seguro, porém mais custoso)
BCRYPT_SALT_ROUNDS=12
```

> **Importante:** nunca commit‑e o arquivo `.env`. Ele deve ficar fora do versionamento (adicione ao `.gitignore`).

---

## 3️⃣ Estrutura do projeto

```
/api-secure
│
├─ .env                # (não versionado) variáveis de ambiente
├─ .gitignore
├─ package.json
├─ README.md           # (este arquivo)
│
└─ src
   ├─ index.js         # ponto de entrada
   ├─ routes.js        # rotas da API
   ├─ middleware
   │   ├─ auth.js      # validação do JWT
   │   └─ rateLimiter.js
   └─ utils
       └─ validators.js # validação de payloads com Joi
```

---

## 4️⃣ Instalação & Execução

```bash
# 1️⃣ Clone o repositório (ou copie os arquivos)
git clone https://github.com/your‑username/api-secure.git
cd api-secure

# 2️⃣ Instale as dependências
npm install

# 3️⃣ Crie o .env (exemplo acima) e preencha os valores
cp .env.example .env   # se houver um exemplo

# 4️⃣ Inicie a API
npm start
```

A API ficará disponível em `http://localhost:3000`.

---

## 5️⃣ Código‑fonte (corrigido e seguro)

> **Todas as vulnerabilidades conhecidas foram tratadas** (hash de senha, validação de entrada, cabeçalhos de segurança, limitação de taxa, uso correto do JWT, etc.).

### `package.json`

```json
{
  "name": "api-secure",
  "version": "1.0.0",
  "description": "API REST de cadastro, login e perfil com boas práticas de segurança",
  "main": "src/index.js",
  "type": "module",
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js"
  },
  "author": "Your Name",
  "license": "MIT",
  "dependencies": {
    "bcrypt": "^5.1.1",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "express-rate-limit": "^7.4.0",
    "helmet": "^7.1.0",
    "joi": "^17.13.1",
    "jsonwebtoken": "^9.0.2"
  },
  "devDependencies": {
    "nodemon": "^3.1.4"
  }
}
```

### `src/index.js`

```js
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './routes.js';
import rateLimiter from './middleware/rateLimiter.js';

// Carrega variáveis de ambiente
dotenv.config();

const app = express();

// ---------- Middleware globais ----------
app.use(helmet());                     // Cabeçalhos de segurança
app.use(cors({                         // CORS restrito (ajuste conforme necessidade)
  origin: '*',                         // Em produção, defina a origem permitida
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());               // Parse JSON
app.use(rateLimiter);                  // Limita requisições por IP

// ---------- Rotas ----------
app.use('/api', routes);

// ---------- Tratamento de erros não capturados ----------
app.use((err, req, res, next) => {
  console.error(err);
  if (!res.headersSent) {
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ---------- Inicialização ----------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 API rodando em http://localhost:${PORT}`);
});
```

### `src/routes.js`

```js
import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { registerSchema, loginSchema } from './utils/validators.js';
import authMiddleware from './middleware/auth.js';

const router = Router();

// ---------- "Banco" em memória ----------
const users = []; // Cada usuário: { id, name, email, passwordHash }

// ---------- Helpers ----------
const generateToken = (payload) => {
  const secret = process.env.JWT_SECRET;
  const expiresIn = '1h'; // 1 hora
  return jwt.sign(payload, secret, { expiresIn });
};

// ---------- Rotas ----------
/**
 * @route POST /api/register
 * @desc Cria novo usuário
 */
router.post('/register', async (req, res) => {
  const { error, value } = registerSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const { name, email, password } = value;

  // Verifica se o e‑mail já está cadastrado
  if (users.find(u => u.email === email)) {
    return res.status(409).json({ error: 'E‑mail já cadastrado' });
  }

  // Hash da senha (salt rounds configurável)
  const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS) || 12;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  const newUser = {
    id: users.length + 1,
    name,
    email,
    passwordHash
  };
  users.push(newUser);

  // Não devolvemos a senha nem o hash
  const { passwordHash: _, ...userWithoutPass } = newUser;
  res.status(201).json({ user: userWithoutPass });
});

/**
 * @route POST /api/login
 * @desc Autentica usuário e devolve JWT
 */
router.post('/login', async (req, res) => {
  const { error, value } = loginSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const { email, password } = value;
  const user = users.find(u => u.email === email);
  if (!user) return res.status(401).json({ error: 'Credenciais inválidas' });

  const passwordMatch = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatch) return res.status(401).json({ error: 'Credenciais inválidas' });

  const token = generateToken({ sub: user.id, name: user.name, email: user.email });
  res.json({ token });
});

/**
 * @route GET /api/profile
 * @desc Retorna dados do usuário autenticado
 * @access Protegido (Bearer token)
 */
router.get('/profile', authMiddleware, (req, res) => {
  // O middleware já inseriu `req.user` (payload do JWT)
  const user = users.find(u => u.id === req.user.sub);
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });

  const { passwordHash: _, ...userWithoutPass } = user;
  res.json({ profile: userWithoutPass });
});

export default router;
```

### `src/middleware/auth.js`

```js
import jwt from 'jsonwebtoken';

/**
 * Middleware que valida o token JWT enviado no header:
 *   Authorization: Bearer <token>
 * Se válido, anexa o payload decodificado em `req.user`.
 */
export default function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token ausente ou mal formatado' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const secret = process.env.JWT_SECRET;
    const payload = jwt.verify(token, secret);
    req.user = payload; // ex.: { sub, name, email, iat, exp }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
}
```

### `src/middleware/rateLimiter.js`

```js
import rateLimit from 'express-rate-limit';

// Limita a 100 requisições por 15 minutos por IP (ajuste conforme necessidade)
export default rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas requisições, tente novamente mais tarde.' }
});
```

### `src/utils/validators.js`

```js
import Joi from 'joi';

// Regras de validação (evita injeção, dados inesperados, etc.)
export const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max  (50).required(),
  email: Joi.string().email({ tlds: { allow: false } }).required(),
  password: Joi.string()
    .min(8)               // tamanho mínimo
    .max(128)             // tamanho máximo razoável
    .pattern(/[A-Z]/, 'uma letra maiúscula')
    .pattern(/[a-z]/, 'uma letra minúscula')
    .pattern(/[0-9]/, 'um número')
    .pattern(/[\W_]/, 'um caractere especial')
    .required()
});

export const loginSchema = Joi.object({
  email: Joi.string().email({ tlds: { allow: false } }).required(),
  password: Joi.string().required()
});
```

### `.gitignore`

```
node_modules/
.env
```

---

## 6️⃣ Checklist de Segurança (o que foi corrigido)

| Vulnerabilidade / Má prática | Como foi tratada |
|------------------------------|------------------|
| **Armazenamento de senha em texto plano** | Uso de **bcrypt** com salt configurável (`BCRYPT_SALT_ROUNDS`). |
| **Segredo JWT hard‑coded** | Lido de `process.env.JWT_SECRET`; `.env` não versionado. |
| **JWT sem expiração** | `expiresIn: '1h'` (tempo curto, renovável). |
| **Falha de validação de entrada** | **Joi** valida `register` e `login`; impede injeção e dados mal‑formados. |
| **Headers de segurança ausentes** | `helmet()` adiciona CSP, X‑Content‑Type‑Options, HSTS, etc. |
| **CORS aberto** | Configurado para aceitar qualquer origem apenas para demo; em produção deve‑se especificar domínios confiáveis. |
| **Ataques de força/brute‑force** | `express-rate-limit` limita requisições por IP (100/15 min). |
| **Exposição de stack trace** | Tratamento genérico de erros (`500`) sem revelar detalhes internos. |
| **Leak de hash de senha na resposta** | Ao retornar usuário, o campo `passwordHash` é removido. |
| **Uso de `any` ou `req.body` sem sanitização** | Validação estrita com Joi antes de qualquer lógica. |
| **Token JWT enviado via cookie sem `httpOnly`** | Optamos por **Authorization header**; evita vazamento via scripts. |
| **Variáveis de ambiente não carregadas** | `dotenv.config()` garante que `process.env` esteja disponível. |
| **Dependências vulneráveis** | Versões atuais (até 2026) são especificadas; recomenda‑se rodar `npm audit` periodicamente. |
| **Código síncrono que bloqueia o event loop** | Todas as operações de hash são **async** (`await bcrypt.hash/compare`). |
| **Possível DoS por payload grande** | `express.json()` usa limite padrão (100kb). Pode‑se ajustar se necessário. |

---

## ✅ Pronto!

Com as práticas acima, a API está **pronta para uso em desenvolvimento** e já incorpora as principais defesas contra vulnerabilidades comuns. Para produção, lembre‑se de:

1. Trocar o armazenamento em memória por um banco de dados real (ex.: PostgreSQL, MongoDB).  
2. Restringir o CORS a domínios confiáveis.  
3. Habilitar HTTPS (TLS) e, se usar cookies, marcar `Secure` e `httpOnly`.  
4. Rotacionar o `JWT_SECRET` periodicamente e invalidar tokens antigos (ex.: blacklist ou short‑lived refresh tokens).  

Boa codificação!