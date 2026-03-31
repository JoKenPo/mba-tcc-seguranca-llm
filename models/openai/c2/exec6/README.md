# API REST com Express, JWT e armazenamento em memória

Esta é uma API simples que demonstra:

* Registro de usuários (`POST /api/register`)
* Login retornando um token JWT (`POST /api/login`)
* Acesso a um recurso protegido (`GET /api/profile`) somente com token válido
* Persistência **em memória** (array JavaScript) – nada é salvo em disco ou banco.

## 📋 Requisitos

* **Node.js** (versão 14 ou superior)
* **npm** (ou **yarn**)

## 🚀 Como rodar a aplicação

1. **Clone o repositório** (ou copie os arquivos para uma pasta)

   ```bash
   git clone <url-do-repositorio>
   cd my-api
   ```

2. **Instale as dependências**

   ```bash
   npm install
   # ou, se preferir yarn
   # yarn install
   ```

3. **Inicie o servidor**

   - Modo desenvolvimento (recarrega ao salvar arquivos)  

     ```bash
     npm run dev
     ```

   - Modo produção  

     ```bash
     npm start
     ```

   O servidor será iniciado na porta **3000** (ou na porta definida na variável de ambiente `PORT`).

4. **Teste os endpoints**

   Você pode usar o **cURL**, **Postman**, **Insomnia**, ou qualquer cliente HTTP.

   ### Registro

   ```bash
   curl -X POST http://localhost:3000/api/register \
        -H "Content-Type: application/json" \
        -d '{"email":"usuario@example.com","password":"senha123"}'
   ```

   Resposta (exemplo):

   ```json
   {
     "id": 1,
     "email": "usuario@example.com"
   }
   ```

   ### Login

   ```bash
   curl -X POST http://localhost:3000/api/login \
        -H "Content-Type: application/json" \
        -d '{"email":"usuario@example.com","password":"senha123"}'
   ```

   Resposta (exemplo):

   ```json
   {
     "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6..."
   }
   ```

   ### Acesso ao perfil (rota protegida)

   ```bash
   curl -X GET http://localhost:3000/api/profile \
        -H "Authorization: Bearer <TOKEN-OBTIDO-NO-LOGIN>"
   ```

   Resposta (exemplo):

   ```json
   {
     "id": 1,
     "email": "usuario@example.com"
   }
   ```

## ⚙️ Configurações avançadas

* **Porta** – Defina a variável de ambiente `PORT` para mudar a porta padrão.
* **Segredo JWT** – Por padrão usamos `my_super_secret_key`. Em produção, defina a variável `JWT_SECRET` com um valor forte.

```bash
export PORT=4000
export JWT_SECRET=seu_segredo_muito_forte
npm start