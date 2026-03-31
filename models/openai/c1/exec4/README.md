# API Simples de Usuários (Node.js + Express)

Esta é uma API mínima que demonstra:

* Cadastro de usuários (`/register`);
* Login e geração de **JWT** (`/login`);
* Acesso a rota protegida usando token (`/protected`).

Os dados são armazenados apenas em memória (array JavaScript).  
Ideal para aprendizado ou prototipagem rápida.

---

## 📋 Pré‑requisitos

* **Node.js** (versão 14 ou superior)  
* **npm** (geralmente vem junto com o Node)

---

## 🚀 Como rodar

```bash
# 1️⃣ Clone o repositório (ou copie os arquivos para uma pasta)
git clone <url-do-repo> user-api
cd user-api

# 2️⃣ Instale as dependências
npm install

# 3️⃣ (Opcional) Defina variáveis de ambiente
#    - JWT_SECRET: chave secreta usada para assinar os tokens
#    - PORT: porta onde o servidor ficará escutando (padrão 3000)
export JWT_SECRET=mysupersecret
export PORT=4000   # se quiser mudar a porta

# 4️⃣ Inicie o servidor
npm start
# ou, para desenvolvimento com reload automático:
npm run dev