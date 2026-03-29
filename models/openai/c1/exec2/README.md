# Simple Auth API (Node.js + Express)

API mínima que permite:

* **Cadastro** de usuários (`POST /register`)
* **Login** e obtenção de JWT (`POST /login`)
* Acesso a **rota protegida** (`GET /protected`) usando o token.

Os dados são armazenados apenas em memória (array JavaScript).  
Ideal para demonstrações ou testes rápidos.

## Requisitos

* **Node.js** (versão 14 ou superior)
* **npm** (vem com o Node)

## Instalação

```bash
# 1️⃣ Clone ou copie o projeto
git clone https://github.com/seu-usuario/simple-auth-api.git
cd simple-auth-api

# 2️⃣ Instale as dependências
npm install