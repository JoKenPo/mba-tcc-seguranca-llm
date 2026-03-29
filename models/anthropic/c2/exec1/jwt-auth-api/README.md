# 🔐 JWT Auth API

API REST construída com **Node.js** e **Express** que implementa autenticação via **JWT (JSON Web Token)** com persistência em memória.

---

## 📁 Estrutura do Projeto

```
jwt-auth-api/
├── src/
│   ├── config/
│   │   └── jwt.config.js          # Configurações do JWT (secret, expiração)
│   ├── controllers/
│   │   ├── auth.controller.js     # Lógica de registro e login
│   │   └── profile.controller.js  # Lógica do perfil autenticado
│   ├── database/
│   │   └── inMemoryDb.js          # Banco de dados em memória (array JS)
│   ├── middleware/
│   │   └── auth.middleware.js     # Validação do token JWT
│   ├── routes/
│   │   ├── auth.routes.js         # Rotas públicas: /register e /login
│   │   └── profile.routes.js      # Rota protegida: /profile
│   └── app.js                     # Configuração do Express
├── server.js                      # Ponto de entrada da aplicação
├── package.json
└── README.md
```

---

## ⚙️ Pré-requisitos

- [Node.js](https://nodejs.org/) **v18+** (para suporte nativo a `crypto.randomUUID()`)
- [npm](https://www.npmjs.com/) v8+

---

## 🚀 Instalação e Execução

### 1. Clone ou acesse o diretório do projeto

```bash
cd jwt-auth-api
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Inicie o servidor

**Modo produção:**
```bash
npm start
```

**Modo desenvolvimento** (reinicia automaticamente ao salvar):
```bash
npm run dev
```

O servidor estará disponível em: **http://localhost:3000**

---

## 🔑 Variáveis de Ambiente (Opcionais)

| Variável        | Padrão                                  | Descrição                        |
|-----------------|-----------------------------------------|----------------------------------|
| `PORT`          | `3000`                                  | Porta do servidor                |
| `JWT_SECRET`    | `super_secret_key_change_in_production` | Chave secreta para assinar o JWT |
| `JWT_EXPIRES_IN`| `1h`                                    | Tempo de expiração do token      |

**Exemplo com variáveis customizadas:**
```bash
PORT=8080 JWT_SECRET=minha_chave_secreta JWT_EXPIRES_IN=2h npm start
```

---

## 📡 Endpoints

### `POST /register` — Criar usuário

**Body (JSON):**
```json
{
  "email": "usuario@exemplo.com",
  "password": "senha123"
}
```

**Resposta de sucesso `201`:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "a1b2c3d4-...",
    "email": "usuario@exemplo.com",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Possíveis erros:**

| Status | Mensagem                                          |
|--------|---------------------------------------------------|
| `400`  | `Email and password are required`                 |
| `400`  | `Invalid email format`                            |
| `400`  | `Password must be at least 6 characters long`     |
| `409`  | `Email already registered`                        |

---

### `POST /login` — Autenticar usuário

**Body (JSON):**
```json
{
  "email": "usuario@exemplo.com",
  "password": "senha123"
}
```

**Resposta de sucesso `200`:**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "a1b2c3d4-...",
    "email": "usuario@exemplo.com",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Possíveis erros:**

| Status | Mensagem                          |
|--------|-----------------------------------|
| `400`  | `Email and password are required` |
| `401`  | `Invalid email or password`       |

---

### `GET /profile` — Perfil do usuário autenticado

**Header obrigatório:**
```
Authorization: Bearer <token_obtido_no_login>
```

**Resposta de sucesso `200`:**
```json
{
  "message": "Profile retrieved successfully",
  "user": {
    "id": "a1b2c3d4-...",
    "email": "usuario@exemplo.com",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Possíveis erros:**

| Status | Mensagem                                                                 |
|--------|--------------------------------------------------------------------------|
| `401`  | `Authorization header missing or malformed. Use: Bearer <token>`         |
| `401`  | `Your session has expired. Please log in again.`                         |
| `401`  | `The provided token is invalid.`                                         |
| `404`  | `User not found`                                                         |

---

## 🧪 Testando com cURL

### 1. Registrar um usuário
```bash
curl -X POST http://localhost:3000/register \
  -H "Content-Type: application/json" \
  -d '{"email": "joao@exemplo.com", "password": "senha123"}'
```

### 2. Fazer login e capturar o token
```bash
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{"email": "joao@exemplo.com", "password": "senha123"}'
```

### 3. Acessar o perfil com o token
```bash
curl -X GET http://localhost:3000/profile \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

---

## 🧪 Testando com Postman ou Insomnia

1. **Importe** as requisições manualmente ou use a coleção abaixo.
2. Após o login, copie o valor de `token` da resposta.
3. Na requisição `GET /profile`, adicione o header:
   - **Key:** `Authorization`
   - **Value:** `Bearer <token_copiado>`

---

## 🔄 Fluxo Completo

```
┌─────────────┐     POST /register      ┌─────────────┐
│   Cliente   │ ──────────────────────► │   Servidor  │
│             │ ◄────────────────────── │             │
│             │   201 + dados do user   │             │
│             │                         │             │
│             │     POST /login         │             │
│             │ ──────────────────────► │             │
│             │ ◄────────────────────── │             │
│             │   200 + JWT token       │             │
│             │                         │             │
│             │  GET /profile           │             │
│             │  Authorization: Bearer  │             │
│             │ ──────────────────────► │ [Middleware]│
│             │ ◄────────────────────── │  valida JWT │
│             │   200 + perfil          │             │
└─────────────┘                         └─────────────┘
```

---

## 🛡️ Decisões de Segurança

| Prática                  | Implementação                                              |
|--------------------------|------------------------------------------------------------|
| Hash de senhas           | `bcryptjs` com 10 salt rounds                              |
| Token JWT                | Assinado com `HS256`, expira em 1h por padrão              |
| Mensagem de erro genérica| Login retorna `Invalid email or password` (sem revelar qual campo está errado) |
| Senha nunca exposta      | Respostas da API nunca incluem o campo `password`          |
| E-mail normalizado       | Armazenado e comparado em lowercase                        |

---

## ⚠️ Limitações (Ambiente de Desenvolvimento)

- Os dados são **perdidos ao reiniciar** o servidor (armazenamento em memória).
- Para produção, substitua `inMemoryDb.js` por um banco de dados real (PostgreSQL, MongoDB, etc.).
- Troque `JWT_SECRET` por uma chave forte e segura via variável de ambiente.