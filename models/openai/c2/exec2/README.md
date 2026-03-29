# API REST em Node.js (Express) – Usuários e JWT

## 📋 Descrição

Esta API demonstra um fluxo básico de autenticação:

| Endpoint          | Método | Descrição                              |
|-------------------|--------|----------------------------------------|
| `/register`       | POST   | Cria um usuário (email + senha)        |
| `/login`          | POST   | Valida credenciais e devolve um JWT    |
| `/profile`        | GET    | Retorna os dados do usuário autenticado |

A persistência é **em memória** (array JavaScript) – ideal para protótipos ou testes.

## 🛠️ Requisitos

- **Node.js** (versão >= 14)
- **npm** (ou **yarn**)

## 🚀 Como executar

```bash
# 1️⃣ Clone o repositório (ou copie os arquivos)
git clone <url-do-repositorio>
cd rest-api-node

# 2️⃣ Instale as dependências
npm install          # ou: yarn install

# 3️⃣ Inicie a aplicação
npm start            # modo produção
# ou
npm run dev          # modo desenvolvimento (com nodemon)

# 4️⃣ A API ficará disponível em http://localhost:3000