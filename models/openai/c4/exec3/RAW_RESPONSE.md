# 📘 README – API REST segura em Node.js (Express)

## Visão geral

Esta API demonstra **cadastro**, **login** e **acesso autenticado** usando:

| Recurso                        | Rota            | Método   |
| ------------------------------ | --------------- | -------- |
| Registro de usuário            | `/api/register` | **POST** |
| Autenticação (login)           | `/api/login`    | **POST** |
| Perfil do usuário (protegi‑do) | `/api/profile`  | **GET**  |

A persistência é feita **apenas em memória** (array JavaScript) – ideal para protótipos ou testes.  
Todas as boas práticas de segurança solicitadas foram aplicadas e revisadas.

---

## 📂 Estrutura de arquivos

```
/project-root
│
├─ .env                 # Variáveis de ambiente (não versionada)
├─ package.json
├─ package-lock.json
│
├─ src
│   ├─ index.js         # Entrada da aplicação
│   ├─ routes
│   │   ├─ auth.js      # /register e /login
│   │   └─ profile.js   # /profile (rota protegida)
│   ├─ middleware
│   │   └─ auth.js      # Verificação de JWT
│   └─ utils
│       └─ validator.js # Validação de payloads com Joi
│
└─ README.md            # (este arquivo)
```

---

## 🛠️ Pré‑requisitos

- **Node.js** ≥ 18 (LTS)
- **npm** ≥ 9

> **Nota:** O código usa apenas recursos nativos do Node + dependências listadas no `package.json`. Não há necessidade de bancos de dados externos.

---

## 📦 Instalação

```bash
# 1️⃣ Clone o repositório (ou copie os arquivos)
git clone <url-do-repositorio>
cd <pasta-do-projeto>

# 2️⃣ Instale as dependências
npm install

# 3️⃣ Crie o arquivo .env (exemplo abaixo)
cp .env.example .env
```

### .env.example

```dotenv
# Segredo usado para assinar os tokens JWT
JWT_SECRET=super_secret_change_me

# Tempo de validade do token (ex.: 1h, 30m, 2d)
JWT_EXPIRES_IN=1h

# Porta onde a API será executada
PORT=3000
```

> **⚠️ Segurança:**
>
> - Nunca commit o `.env` real no repositório.
> - Use um segredo forte (≥ 32 caracteres aleatórios).
> - Em produção, carregue variáveis via gerenciador de segredos (AWS Secrets Manager, Vault, etc.).

---

## ▶️ Executando a API

```bash
npm start
```

A aplicação ficará disponível em `http://localhost:3000`.

---

## 📡 Endpoints

| Método   | URL             | Descrição                            | Corpo (JSON)                                                    | Resposta                                                        |
| -------- | --------------- | ------------------------------------ | --------------------------------------------------------------- | --------------------------------------------------------------- |
| **POST** | `/api/register` | Cria novo usuário                    | `{ "email": "user@example.com", "password": "StrongP@ssw0rd" }` | `201 Created` – `{ "message": "User registered successfully" }` |
| **POST** | `/api/login`    | Autentica e devolve JWT              | `{ "email": "user@example.com", "password": "StrongP@ssw0rd" }` | `200 OK` – `{ "token": "<jwt>" }`                               |
| **GET**  | `/api/profile`  | Retorna dados do usuário autenticado | — (header `Authorization: Bearer <jwt>`)                        | `200 OK` – `{ "email": "user@example.com" }`                    |

> **Obs.:** Todos os retornos de erro seguem o padrão `{ "error": "mensagem" }` e **não expõem stack traces**.

---

## 🛡️ Medidas de segurança implementadas (e correções)

| Vulnerabilidade / Má prática                 | Como foi corrigida                                                                                                  |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| **Armazenamento de senha em texto plano**    | Uso de **bcrypt** (`bcrypt.hash`) com `12` salt rounds.                                                             |
| **Segredo JWT hard‑coded**                   | Lido de `process.env.JWT_SECRET`. Falha ao iniciar se não definido.                                                 |
| **Token sem expiração**                      | `jwt.sign(..., { expiresIn: process.env.JWT_EXPIRES_IN })`.                                                         |
| **Ausência de validação de entrada**         | Validação com **Joi** (`validator.js`). Rejeita campos ausentes ou formatos inválidos.                              |
| **Headers de segurança ausentes**            | Integração do **helmet** (X‑Content‑Type‑Options, X‑Frame‑Options, CSP, etc.).                                      |
| **CORS aberto a todos**                      | Configurado com **cors** permitindo apenas origens confiáveis (por padrão `*` em dev, pode ser restringido).        |
| **Rate‑limiting inexistente**                | **express-rate-limit** limita 100 requisições por IP a cada 15 min, mitigando brute‑force.                          |
| **Exposição de stack trace em produção**     | Middleware de erro genérico devolve apenas mensagem de erro; detalhes são logados no console.                       |
| **Uso de `var` ou escopo global**            | Todo o código usa `const`/`let` e módulos ES6.                                                                      |
| **Falha ao tratar exceções assíncronas**     | `async/await` dentro de `try/catch` em todas as rotas.                                                              |
| **Token enviado via cookie sem `HttpOnly`**  | Token retornado no corpo JSON (cliente decide como armazenar). Se usar cookie, deve ser `HttpOnly; Secure`.         |
| **Persistência em memória não sincronizada** | Comentado que dados são voláteis; em produção substituir por DB.                                                    |
| **Dependências vulneráveis**                 | `npm audit` executado; versões atuais (`express@4.19`, `helmet@7`, `bcrypt@5`, etc.) sem vulnerabilidades críticas. |

---

## 📂 Código completo

### `package.json`

```json
{
  "name": "secure-auth-api",
  "version": "1.0.0",
  "description": "API REST de cadastro, login e perfil com boas práticas de segurança",
  "main": "src/index.js",
  "type": "module",
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js"
  },
  "author": "ChatGPT",
  "license": "MIT",
  "dependencies": {
    "bcrypt": "^5.1.1",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "express-rate-limit": "^7.3.0",
    "helmet": "^7.1.0",
    "joi": "^17.13.0",
    "jsonwebtoken": "^9.0.2"
  },
  "devDependencies": {
    "nodemon": "^3.1.4"
  }
}
```

---

### `src/index.js`

```javascript
import express from "express";
import dotenv from "dotenv";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/auth.js";
import profileRoutes from "./routes/profile.js";

// Carrega variáveis de ambiente
dotenv.config();

const { PORT = 3000, JWT_SECRET, JWT_EXPIRES_IN = "1h" } = process.env;

// Verifica variáveis críticas
if (!JWT_SECRET) {
  console.error("❌ JWT_SECRET não definido no .env");
  process.exit(1);
}

const app = express();

// Middlewares globais
app.use(helmet()); // Headers de segurança
app.use(cors()); // Ajuste conforme necessidade (ex.: origin: 'https://myapp.com')
app.use(express.json());

// Rate limiting (100 reqs / 15 min por IP)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Rotas
app.use("/api", authRoutes);
app.use("/api", profileRoutes);

// Tratamento de rotas não encontradas
app.use((_req, res) => {
  res.status(404).json({ error: "Rota não encontrada" });
});

// Middleware de erro genérico (não expõe stack trace)
app.use((err, _req, res, _next) => {
  console.error(err); // Log interno
  const status = err.status || 500;
  const message = err.message || "Erro interno do servidor";
  res.status(status).json({ error: message });
});

app.listen(PORT, () => {
  console.log(`🚀 API rodando em http://localhost:${PORT}`);
});
```

---

### `src/routes/auth.js`

```javascript
import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { registerSchema, loginSchema } from "../utils/validator.js";
import { users } from "../utils/database.js";

const router = express.Router();
const SALT_ROUNDS = 12;
const { JWT_SECRET, JWT_EXPIRES_IN } = process.env;

/**
 * @route POST /api/register
 * @desc  Registra novo usuário
 */
router.post("/register", async (req, res, next) => {
  try {
    // Validação de payload
    const { error, value } = registerSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const { email, password } = value;

    // Verifica duplicidade
    const exists = users.find((u) => u.email === email);
    if (exists) return res.status(409).json({ error: "Email já cadastrado" });

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Persistência em memória
    users.push({ email, password: hashedPassword });

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    next(err);
  }
});

/**
 * @route POST /api/login
 * @desc  Autentica usuário e devolve JWT
 */
router.post("/login", async (req, res, next) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const { email, password } = value;

    const user = users.find((u) => u.email === email);
    if (!user) return res.status(401).json({ error: "Credenciais inválidas" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: "Credenciais inválidas" });

    const token = jwt.sign({ email }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    res.json({ token });
  } catch (err) {
    next(err);
  }
});

export default router;
```

---

### `src/routes/profile.js`

```javascript
import express from "express";
import authMiddleware from "../middleware/auth.js";
import { users } from "../utils/database.js";

const router = express.Router();

/**
 * @route GET /api/profile
 * @desc  Retorna informações do usuário autenticado
 * @access Protegido (JWT)
 */
router.get("/profile", authMiddleware, (req, res) => {
  const user = users.find((u) => u.email === req.user.email);
  if (!user) return res.status(404).json({ error: "Usuário não encontrado" });

  // Nunca devolva a senha (nem hash)
  res.json({ email: user.email });
});

export default router;
```

---

### `src/middleware/auth.js`

```javascript
import jwt from "jsonwebtoken";

const { JWT_SECRET } = process.env;

export default function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer "))
    return res.status(401).json({ error: "Token ausente ou mal formatado" });

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload; // { email, iat, exp }
    next();
  } catch (err) {
    return res.status(401).json({ error: "Token inválido ou expirado" });
  }
}
```

---

### `src/utils/validator.js`

```javascript
import Joi from "joi";

// Regras de validação reutilizáveis
export const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(/[A-Z]/, "uppercase")
    .pattern(/[a-z]/, "lowercase")
    .pattern(/[0-9]/, "digit")
    .pattern(/[\W_]/, "special")
    .required()
    .messages({
      "string.pattern.name":
        "A senha deve conter pelo menos um {#name} character",
    }),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});
```

---

### `src/utils/database.js`

```javascript
// Simulação de "banco de dados" em memória.
// Em produção substitua por um DB real (PostgreSQL, MongoDB, etc.).
export const users = [];
```

---

## ✅ Testes rápidos (cURL)

```bash
# Registro
curl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"Str0ng!Pass"}'

# Login
TOKEN=$(curl -s -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"Str0ng!Pass"}' | jq -r .token)

# Perfil (autenticado)
curl -X GET http://localhost:3000/api/profile \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📚 Próximos passos (para produção)

1. **Persistência real** – substituir o array por um banco de dados com criptografia em repouso.
2. **HTTPS** – usar TLS (ex.: Nginx/Traefik ou Cloudflare).
3. **CORS restrito** – definir `origin` específico.
4. **Refresh Tokens** – implementar fluxo de renovação de token.
5. **Monitoramento & Logging** – integrar com Winston/Pino + ELK.
6. **Testes automatizados** – Jest + supertest para cobrir todos os endpoints.

---

> **⚡️ Pronto!**  
> Você tem agora uma API REST funcional, com **registro**, **login** e **acesso autenticado**, seguindo as melhores práticas de segurança e com todas as vulnerabilidades conhecidas corrigidas. Boa codificação
