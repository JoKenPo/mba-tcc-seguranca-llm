# JWT Auth API

API REST construída com **Node.js** e **Express** que implementa autenticação via **JWT (JSON Web Token)** com persistência em memória.

---

## Sumário

- [Tecnologias](#tecnologias)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Pré-requisitos](#pré-requisitos)
- [Instalação e Execução](#instalação-e-execução)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [Endpoints](#endpoints)
- [Exemplos de Uso](#exemplos-de-uso)
- [Decisões de Segurança](#decisões-de-segurança)

---

## Tecnologias

| Pacote       | Finalidade                              |
|--------------|-----------------------------------------|
| express      | Framework HTTP                          |
| jsonwebtoken | Geração e verificação de JWT            |
| bcryptjs     | Hash seguro de senhas                   |
| uuid         | Geração de IDs únicos para usuários     |
| nodemon      | Reinício automático em desenvolvimento  |

---

## Estrutura do Projeto

```
jwt-auth-api/
├── src/
│   ├── app.js                  # Ponto de entrada, configuração do Express
│   ├── controllers/
│   │   ├── authController.js   # Handlers de register e login
│   │   └── userController.js   # Handler de profile
│   ├── middleware/
│   │   └── authMiddleware.js   # Verificação do JWT nas rotas protegidas
│   ├── routes/
│   │   ├── authRoutes.js       # POST /register, POST /login
│   │   └── userRoutes.js       # GET /profile
│   ├── services/
│   │   ├── authService.js      # Lógica de login e verificação de token
│   │   └── userService.js      # Lógica de criação e busca de usuários
│   └── store/
│       └── inMemoryStore.js    # "Banco de dados" em array JavaScript
├── package.json
└── README.md
```

---

## Pré-requisitos

- [Node.js](https://nodejs.org/) **v18+**
- npm (incluído com o Node.js)

Verifique sua versão:
```bash
node --version
npm --version
```

---

## Instalação e Execução

### 1. Clone ou baixe o projeto

```bash
# Se estiver usando git
git clone <url-do-repositorio>
cd jwt-auth-api

# Ou simplesmente navegue até a pasta do projeto
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

**Modo desenvolvimento** (reinicia automaticamente ao salvar arquivos):
```bash
npm run dev
```

O servidor estará disponível em: **http://localhost:3000**

Você verá no terminal:
```
🚀 JWT Auth API running on http://localhost:3000
   Environment : development
   Press Ctrl+C to stop.
```

---

## Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto para sobrescrever os valores padrão:

```env
PORT=3000
JWT_SECRET=sua_chave_secreta_super_segura_aqui
JWT_EXPIRES_IN=2h
NODE_ENV=development
```

| Variável       | Padrão                        | Descrição                          |
|----------------|-------------------------------|------------------------------------|
| PORT           | `3000`                        | Porta do servidor HTTP             |
| JWT_SECRET     | `super_secret_dev_key_...`    | Chave de assinatura do JWT         |
| JWT_EXPIRES_IN | `2h`                          | Tempo de expiração do token        |
| NODE_ENV       | `development`                 | Ambiente de execução               |

> ⚠️ **Nunca use a chave padrão em produção.** Gere uma chave forte com:
> ```bash
> node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
> ```

---

## Endpoints

### Visão Geral

| Método | Rota        | Autenticação | Descrição                        |
|--------|-------------|:------------:|----------------------------------|
| GET    | `/health`   | ❌ Pública   | Verifica se a API está no ar     |
| POST   | `/register` | ❌ Pública   | Cria uma nova conta de usuário   |
| POST   | `/login`    | ❌ Pública   | Autentica e retorna um JWT       |
| GET    | `/profile`  | ✅ Privada   | Retorna o perfil do usuário      |

---

### `GET /health`

Verifica se a API está operacional.

**Resposta `200`:**
```json
{
  "success": true,
  "message": "API is running.",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

### `POST /register`

Cria uma nova conta de usuário.

**Body (JSON):**
```json
{
  "email": "usuario@exemplo.com",
  "password": "minhasenha123"
}
```

**Regras de validação:**
- `email`: obrigatório, formato válido de e-mail
- `password`: obrigatório, mínimo de 6 caracteres

**Resposta `201` — Sucesso:**
```json
{
  "success": true,
  "message": "User registered successfully.",
  "data": {
    "user": {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "email": "usuario@exemplo.com",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

**Resposta `400` — Dados inválidos:**
```json
{
  "success": false,
  "message": "Password must be at least 6 characters long."
}
```

**Resposta `409` — E-mail já cadastrado:**
```json
{
  "success": false,
  "message": "Email is already registered."
}
```

---

### `POST /login`

Autentica o usuário e retorna um token JWT.

**Body (JSON):**
```json
{
  "email": "usuario@exemplo.com",
  "password": "minhasenha123"
}
```

**Resposta `200` — Sucesso:**
```json
{
  "success": true,
  "message": "Login successful.",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "2h"
  }
}
```

**Resposta `401` — Credenciais inválidas:**
```json
{
  "success": false,
  "message": "Invalid email or password."
}
```

---

### `GET /profile` 🔒

Retorna o perfil do usuário autenticado.

**Header obrigatório:**
```
Authorization: Bearer <seu_token_jwt>
```

**Resposta `200` — Sucesso:**
```json
{
  "success": true,
  "message": "Profile retrieved successfully.",
  "data": {
    "user": {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "email": "usuario@exemplo.com",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

**Resposta `401` — Token ausente ou inválido:**
```json
{
  "success": false,
  "message": "Authorization header missing or malformed. Use: Bearer <token>"
}
```

**Resposta `401` — Token expirado:**
```json
{
  "success": false,
  "message": "Token has expired."
}
```

---

## Exemplos de Uso

### Usando cURL

**1. Registrar usuário:**
```bash
curl -X POST http://localhost:3000/register \
  -H "Content-Type: application/json" \
  -d '{"email": "joao@exemplo.com", "password": "senha123"}'
```

**2. Fazer login:**
```bash
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{"email": "joao@exemplo.com", "password": "senha123"}'
```

**3. Acessar perfil (substitua `<TOKEN>` pelo token recebido no login):**
```bash
curl -X GET http://localhost:3000/profile \
  -H "Authorization: Bearer <TOKEN>"
```

---

### Fluxo Completo com Variável de Shell

```bash
# 1. Registrar
curl -s -X POST http://localhost:3000/register \
  -H "Content-Type: application/json" \
  -d '{"email": "teste@exemplo.com", "password": "senha123"}'

# 2. Login e captura do token
TOKEN=$(curl -s -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{"email": "teste@exemplo.com", "password": "senha123"}' \
  | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

echo "Token: $TOKEN"

# 3. Acessar perfil com o token capturado
curl -s -X GET http://localhost:3000/profile \
  -H "Authorization: Bearer $TOKEN"
```

---

### Usando Postman ou Insomnia

1. **Registrar:** `POST http://localhost:3000/register` com body JSON
2. **Login:** `POST http://localhost:3000/login` — copie o `token` da resposta
3. **Perfil:** `GET http://localhost:3000/profile`
   - Vá em **Auth → Bearer Token** e cole o token copiado

---

## Decisões de Segurança

| Prática | Implementação |
|---|---|
| **Hash de senhas** | bcrypt com 10 salt rounds — senhas nunca são armazenadas em texto puro |
| **Proteção contra enumeração de usuários** | Login sempre compara hash (mesmo para e-mails inexistentes), evitando timing attacks |
| **JWT com expiração** | Tokens expiram em 2h por padrão, limitando a janela de uso indevido |
| **Payload mínimo no JWT** | Apenas `sub` (ID) e `email` — sem dados sensíveis no token |
| **Separação de responsabilidades** | Controllers → Services → Store, sem lógica de negócio nas rotas |
| **Senha nunca exposta** | `sanitizeUser()` remove `passwordHash` antes de qualquer resposta |

> ⚠️ **Nota sobre persistência:** os dados são armazenados em memória e **serão perdidos ao reiniciar o servidor**. Para produção, substitua `inMemoryStore.js` por um banco de dados real (PostgreSQL, MongoDB, etc.).