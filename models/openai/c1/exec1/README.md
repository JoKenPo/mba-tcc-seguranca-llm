# Simple Auth API (Node.js + Express)

Uma API mínima que demonstra:

* Cadastro de usuários (`/register`)
* Login com geração de JWT (`/login`)
* Rota protegida que exige token (`/protected`)

> **Importante:** os usuários são armazenados apenas em memória (array). Em produção use um banco de dados real e mantenha o segredo do JWT em variáveis de ambiente.

## 📋 Pré‑requisitos

* **Node.js** (versão 14 ou superior)  
  Verifique com `node -v`.

* **npm** (já vem com o Node)  

## 🚀 Como rodar

1. **Clone ou copie o projeto** para uma pasta local.

   ```bash
   git clone https://github.com/seu-usuario/simple-auth-api.git
   cd simple-auth-api
   ```

2. **Instale as dependências**

   ```bash
   npm install
   ```

3. **Inicie o servidor**

   - Modo desenvolvimento (recarrega ao mudar arquivos):

     ```bash
     npm run dev
     ```

   - Modo produção:

     ```bash
     npm start
     ```

   O servidor ficará escutando em `http://localhost:3000`.

## 📡 Testando a API

Você pode usar **cURL**, **Postman**, **Insomnia**, ou qualquer cliente HTTP.

### 1️⃣ Registrar um usuário

```bash
curl -X POST http://localhost:3000/register \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","password":"secret123"}'