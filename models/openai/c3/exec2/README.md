# API REST com Registro, Login e Autenticação JWT

Esta é uma API mínima construída com **Node.js**, **Express**, **bcrypt** e **JWT**.  
Os usuários são armazenados em memória (array) – ideal para demonstrações ou testes rápidos.

## 📋 Requisitos

- **Node.js** (versão 18 ou superior)
- **npm** (ou **yarn**)

## 🚀 Instalação

```bash
# 1️⃣ Clone o repositório (ou copie os arquivos)
git clone https://github.com/seu-usuario/api-jwt-auth.git
cd api-jwt-auth

# 2️⃣ Instale as dependências
npm install          # ou: yarn install

# 3️⃣ Crie o arquivo de variáveis de ambiente
cp .env.example .env

# 4️⃣ Edite o .env e defina um segredo forte
#    Exemplo:
#    JWT_SECRET=SuperSecretKey123!
#    JWT_EXPIRES_IN=1h
#    PORT=3000