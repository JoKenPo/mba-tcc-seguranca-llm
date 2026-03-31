# 📘 API REST de Cadastro, Login e Perfil – Versão Segura  

Esta aplicação **Node.js + Express** demonstra um serviço de autenticação completo usando:

* **Persistência em memória** (array JavaScript) – ideal para protótipos e testes.  
* **Hash de senhas** com **bcrypt** (12 salt rounds).  
* **JWT** assinado com segredo armazenado em **variáveis de ambiente** e com tempo de expiração.  
* **Middleware de autenticação** que valida o token enviado no header `Authorization: Bearer <token>`.  
* **Headers de segurança** via **helmet**, **CORS** configurado e **rate‑limiting** para mitigar brute‑force.  
* **Validação de entrada** usando **express‑validator** para evitar dados mal‑formados.  

---

## 📂 Estrutura de arquivos

```
/ (raiz)
│
├─ .env                # Variáveis de ambiente (não versionar!)
├─ .gitignore
├─ package.json
├─ package-lock.json
├─ README.md           # (este arquivo)
└─ src
   ├─ index.js         # ponto de entrada da aplicação
   ├─ routes
   │   └─ auth.js      # rotas /register, /login, /profile
   └─ middleware
       ├─ auth.js       # verifica JWT
       └─ rateLimiter.js # configuração de rate‑limit
```

---

## 🛠️ Pré‑requisitos

| Ferramenta | Versão mínima |
|------------|----------------|
| **Node.js** | 18.x |
| **npm**     | 9.x |

> **Obs.:** O código usa apenas recursos nativos do Node 18 (ESM) e dependências listadas no `package.json`.

---

## 🚀 Como executar localmente

1. **Clone o repositório** (ou copie os arquivos acima)  

   ```bash
   git clone https://github.com/SEU_USUARIO/api-auth-demo.git
   cd api-auth-demo
   ```

2. **Instale as dependências**

   ```bash
   npm ci
   ```

3. **Crie o arquivo de variáveis de ambiente**

   ```bash
   cp .env.example .env
   ```

   Edite o `.env` e defina um segredo forte para o JWT:

   ```dotenv
   JWT_SECRET=uma_chave_aleatoria_e_segura_que_gerar_ao_gerar
   JWT_EXPIRES_IN=1h          # pode ser "30m", "2h", etc.
   PORT=3000
   ```

4. **Inicie a aplicação**

   ```bash
   npm start
   ```

   A API ficará disponível em `http://localhost:3000`.

---

## 📋 Endpoints

| Método | Rota       | Descrição                              | Corpo da requisição (JSON)                     |
|--------|------------|----------------------------------------|------------------------------------------------|
| POST   | `/register`| Cria um novo usuário                    | `{ "email": "user@example.com", "password": "Secret123!" }` |
| POST   | `/login`   | Autentica usuário e devolve JWT        | `{ "email": "user@example.com", "password": "Secret123!" }` |
| GET    | `/profile`| Retorna dados do usuário autenticado     | **Header** `Authorization: Bearer <jwt>` |

### Respostas de exemplo

* **Registro bem‑sucedido** – `201 Created`

  ```json
  { "message": "Usuário registrado com sucesso." }
  ```

* **Login bem‑sucedido** – `200 OK`

  ```json
  { "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6..." }
  ```

* **Perfil** – `200 OK`

  ```json
  { "id": 1, "email": "user@example.com" }
  ```

---

## 🔐 Revisão de Segurança & Correções Aplicadas

| Vulnerabilidade / Má prática original | Correção aplicada | Motivo |
|----------------------------------------|-------------------|--------|
| **Segredo JWT hard‑coded** ou fallback inseguro | O segredo **obrigatoriamente** vem de `process.env.JWT_SECRET`. O código aborta se a variável não existir. | Evita que a aplicação rode com chave padrão previsível. |
| **Salt rounds baixos** (`bcrypt.genSaltSync(8)`) | Passamos `12` rounds (valor recomendado para balancear segurança e performance). | Gera hashes mais resistentes a ataques de força bruta. |
| **Nenhuma validação de entrada** (e.g., email vazio, senha curta) | Utilizamos `express-validator` para checar `email` (formato válido) e `password` (mínimo 8 caracteres). | Previne dados inválidos e reduz vetores de ataque (e.g., injection). |
| **Headers de segurança ausentes** | `helmet()` adiciona `Content‑Security‑Policy`, `X‑Content‑Type‑Options`, `X‑Frame‑Options`, etc. | Diminui risco de XSS, click‑jacking e outras vulnerabilidades de camada HTTP. |
| **CORS aberto a todos** | Configuramos `cors({ origin: process.env.CORS_ORIGIN || "http://localhost:3000", credentials: true })`. | Limita quem pode consumir a API. |
| **Rate‑limit inexistente** → brute‑force em `/login` | `express-rate-limit` com 5 tentativas por minuto por IP na rota de login. | Mitiga ataques de força bruta. |
| **Retorno de informações sensíveis** (ex.: hash da senha) | Nunca enviamos a senha ou hash nas respostas. | Evita vazamento de credenciais. |
| **Token JWT sem expiração** | `expiresIn` configurado via `process.env.JWT_EXPIRES_IN` (default `1h`). | Tokens expirados reduzem janela de exploração caso sejam comprometidos. |
| **Erro genérico de autenticação** (ex.: “Usuário não encontrado”) | Mensagens de erro são genéricas (`"Credenciais inválidas"`). | Não revela se o email existe ou não, dificultando enumeração de usuários. |
| **Uso de callbacks em bcrypt** → risco de “callback hell” | Toda a lógica de hash/compare usa **async/await**. | Código mais legível e menos propenso a erros. |
| **Variáveis de ambiente expostas** (ex.: `console.log(process.env)` ) | Removido qualquer log de variáveis sensíveis. | Evita vazamento acidental de segredos. |

---

## 📂 Código completo (versão final)

> **⚠️** Copie cada bloco para o respectivo arquivo.  
> O projeto está configurado para usar **ESM** (`"type": "module"` no `package.json`).

### 1️⃣ `package.json`

```json
{
  "name": "api-auth-demo",
  "version": "1.0.0",
  "description": "API REST de cadastro, login e perfil com segurança reforçada",
  "main": "src/index.js",
  "type": "module",
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js"
  },
  "author": "Seu Nome",
  "license": "MIT",
  "dependencies": {
    "bcrypt": "^5.1.1",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "express-rate-limit": "^7.3.0",
    "express-validator": "^7.0.1",
    "helmet": "^7.1.0",
    "jsonwebtoken": "^9.0.2"
  },
  "devDependencies": {
    "nodemon": "^3.1.4"
  }
}
```

### 2️⃣ `.gitignore`

```
node_modules/
.env
```

### 3️⃣ `.env.example`

```dotenv
# Chave secreta para assinar JWT – gere uma string aleatória e forte
JWT_SECRET=supersecreto1234567890

# Tempo de validade do token (ex.: 1h, 30m, 2d)
JWT_EXPIRES_IN=1h

# Porta onde a API será executada
PORT=3000

# Origem permitida para CORS (ajuste conforme seu front‑end)
CORS_ORIGIN=http://localhost:3000
```

### 4️⃣ `src/index.js`

```javascript
import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import authRouter from "./routes/auth.js";
import rateLimiter from "./middleware/rateLimiter.js";

dotenv.config();

const app = express();

// ---------- Middleware globais ----------
app.use(helmet()); // Headers de segurança
app.use(express.json());

// CORS configurado apenas para a origem permitida
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
  })
);

// Rate‑limit global (pode ser ajustado ou removido)
app.use(rateLimiter.global);

// Rotas de autenticação
app.use("/api", authRouter);

// ---------- Tratamento de erros ----------
app.use((err, req, res, next) => {
  console.error(err);
  if (!err.statusCode) err.statusCode = 500;
  res.status(err.statusCode).json({ error: err.message });
});

// ---------- Inicialização ----------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 API rodando em http://localhost:${PORT}`);
});
```

### 5️⃣ `src/middleware/auth.js`

```javascript
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET não definido nas variáveis de ambiente.");
}

/**
 * Middleware que verifica o token JWT enviado no header
 * Authorization: Bearer <token>
 */
export const authenticate = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return res.status(401).json({ error: "Token ausente." });

  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Token mal formatado." });

  jwt.verify(token, JWT_SECRET, (err, payload) => {
    if (err) return res.status(401).json({ error: "Token inválido ou expirado." });
    req.user = payload; // payload contém { id, email, iat, exp }
    next();
  });
};
```

### 6️⃣ `src/middleware/rateLimiter.js`

```javascript
import rateLimit from "express-rate-limit";

/**
 * Rate‑limit global (apenas como camada extra de proteção).
 * Limita a 100 requisições por 15 minutos por IP.
 */
export const global = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate‑limit específico para a rota de login (brute‑force).
 * 5 tentativas por minuto por IP.
 */
export const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { error: "Muitas tentativas de login. Tente novamente em 1 minuto." },
  standardHeaders: true,
  legacyHeaders: false,
});
```

### 7️⃣ `src/routes/auth.js`

```javascript
import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { body, validationResult } from "express-validator";
import { authenticate } from "../middleware/auth.js";
import { loginLimiter } from "../middleware/rateLimiter.js";

const router = Router();

// ---------- "Banco de dados" em memória ----------
const users = []; // Cada usuário: { id, email, passwordHash }

/**
 * Helper para gerar JWT
 */
const generateToken = (user) => {
  const payload = { id: user.id, email: user.email };
  const secret = process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_EXPIRES_IN || "1h";

  return jwt.sign(payload, secret, { expiresIn });
};

/**
 * @route   POST /api/register
 * @desc    Cria novo usuário
 */
router.post(
  "/register",
  [
    body("email").isEmail().withMessage("Email inválido."),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Senha deve ter ao menos 8 caracteres."),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        return res.status(400).json({ errors: errors.array() });

      const { email, password } = req.body;

      // Verifica se o email já está cadastrado
      const exists = users.find((u) => u.email === email);
      if (exists)
        return res.status(409).json({ error: "Email já cadastrado." });

      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      const newUser = {
        id: users.length + 1,
        email,
        passwordHash,
      };
      users.push(newUser);

      return res
        .status(201)
        .json({ message: "Usuário registrado com sucesso." });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * @route   POST /api/login
 * @desc    Autentica usuário e devolve JWT
 */
router.post(
  "/login",
  loginLimiter,
  [
    body("email").isEmail().withMessage("Email inválido."),
    body("password").exists().withMessage("Senha é obrigatória."),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        return res.status(400).json({ errors: errors.array() });

      const { email, password } = req.body;

      const user = users.find((u) => u.email === email);
      // Mensagem genérica para evitar enumeração de usuários
      if (!user)
        return res.status(401).json({ error: "Credenciais inválidas." });

      const match = await bcrypt.compare(password, user.passwordHash);
      if (!match)
        return res.status(401).json({ error: "Credenciais inválidas." });

      const token = generateToken(user);
      return res.status(200).json({ token });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * @route   GET /api/profile
 * @desc    Retorna dados do usuário autenticado
 * @access  Protegido por JWT
 */
router.get("/profile", authenticate, (req, res) => {
  const user = users.find((u) => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: "Usuário não encontrado." });

  // Nunca retornamos a senha ou hash
  const { id, email } = user;
  return res.status(200).json({ id, email });
});

export default router;
```

---

## ✅ Testes rápidos (usando **curl**)

```bash
# Registro
curl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"SuperSecret123"}'

# Login (recebe token)
TOKEN=$(curl -s -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"SuperSecret123"}' | jq -r .token)

# Acesso ao perfil (substitua $TOKEN)
curl -X GET http://localhost:3000/api/profile \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📚 Referências de segurança usadas

* **OWASP Top Ten** – mitigação de *Broken Authentication*, *Sensitive Data Exposure* e *Security Misconfiguration*.  
* **Node.js Security Checklist** – uso de `helmet`, `cors`, `express-rate-limit`.  
* **bcrypt** – recomendação de *12+ salt rounds* para produção.  
* **JWT** – uso de `expiresIn` e segredo forte armazenado fora do código.  

---

**Pronto!** 🎉  
Esta API demonstra boas práticas de segurança em um ambiente de desenvolvimento simples, mas pode ser facilmente evoluída para usar um banco de dados real, refresh tokens, e armazenamento de tokens em HttpOnly cookies.