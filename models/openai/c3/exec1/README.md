# Auth API (Node.js + Express)

A **REST API** minimalista que demonstra cadastro, login e acesso a rotas protegidas usando:

* **Express** – framework HTTP
* **bcrypt** – hash seguro de senhas
* **JWT** – token de autenticação com expiração
* **Helmet** – cabeçalhos de segurança
* **Armazenamento em memória** (array) – apenas para demonstração / testes

> **⚠️** Em produção troque o armazenamento em memória por um banco de dados real e use HTTPS.

---

## 📋 Requisitos

* Node.js **v18** ou superior
* npm **v9** ou superior (ou yarn)

---

## 🚀 Como rodar localmente

1. **Clone o repositório** (ou copie os arquivos para uma pasta)

   ```bash
   git clone https://github.com/your‑username/auth-api.git
   cd auth-api
   ```

2. **Instale as dependências**

   ```bash
   npm install
   # ou, se preferir yarn
   # yarn install
   ```

3. **Configure as variáveis de ambiente**

   Copie o exemplo e ajuste o segredo do JWT:

   ```bash
   cp .env.example .env
   ```

   Edite o arquivo `.env` e coloque um valor forte para `JWT_SECRET`.

4. **Inicie a aplicação**

   ```bash
   npm run dev      # usa nodemon, recarrega ao mudar arquivos
   # ou
   npm start        # modo produção (sem hot‑reload)
   ```

   O servidor ficará escutando em `http://localhost:3000` (ou na porta definida em `.env`).

5. **Teste os endpoints**

   Você pode usar **cURL**, **Postman**, **Insomnia** ou qualquer cliente HTTP.

   ### Register (cadastro)

   ```bash
   curl -X POST http://localhost:3000/api/register \
        -H "Content-Type: application/json" \
        -d '{"name":"Ana","email":"ana@example.com","password":"secret123"}'
   ```

   ### Login (obter token)

   ```bash
   curl -X POST http://localhost:3000/api/login \
        -H "Content-Type: application/json" \
        -d '{"email":"ana@example.com","password":"secret123"}'
   ```

   Resposta (exemplo):

   ```json
   { "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6..." }
   ```

   ### Profile (rota protegida)

   ```bash
   curl http://localhost:3000/api/profile \
        -H "Authorization: Bearer <TOKEN>"
   ```

   Substitua `<TOKEN>` pelo valor retornado no login.

---

## 🛡️ Segurança incorporada

| Recurso | Como está implementado |
|---------|------------------------|
| **Hash de senha** | `bcrypt` com 12 *salt rounds* |
| **JWT** | Assinado com segredo vindo de `process.env.JWT_SECRET` e expira (`process.env.JWT_EXPIRES_IN`, default `1h`) |
| **Middleware de autenticação** | Verifica o header `Authorization: Bearer <token>` e rejeita solicitações inválidas |
| **Headers de segurança** | `helmet()` adiciona `Content‑Security‑Policy`, `X‑Content‑Type‑Options`, `X‑Frame‑Options`, etc. |
| **Desabilita X‑Powered‑By** | `app.disable('x-powered-by')` |
| **Validações básicas** | E‑mail formatado, senha mínima 6 caracteres, checagem de usuário já existente |
| **Nenhum dado sensível enviado** | Nunca retornamos o hash da senha nem o segredo do JWT |

---

## 📦 Estrutura de diretórios
