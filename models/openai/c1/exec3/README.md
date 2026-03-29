# Simple Auth API (Node.js + Express)

Uma API mínima que permite:

* **Cadastrar** usuários (`POST /register`);
* **Login** e receber um **JWT** (`POST /login`);
* Acessar uma **rota protegida** usando o token (`GET /protected`).

Os dados são mantidos apenas em memória (array JavaScript), portanto são perdidos ao reiniciar o servidor. Ideal para demonstrações ou aprendizado.

## 📦 Pré‑requisitos

- **Node.js** (v14 ou superior) instalado  
  https://nodejs.org/

## 🚀 Como rodar

```bash
# 1️⃣ Clone ou copie o projeto para sua máquina
git clone https://github.com/SEU_USUARIO/simple-auth-api.git   # opcional
cd /home/your-user/simple-auth-api

# 2️⃣ Instale as dependências
npm install

# 3️⃣ Inicie o servidor
npm start
# ou: node index.js