# API REST Simples com Express & JWT

Esta é uma API mínima que demonstra:

* Registro de usuário (`POST /api/register`)
* Login retornando um **JWT** (`POST /api/login`)
* Acesso a um recurso protegido (`GET /api/profile`) apenas com token válido
* Persistência em memória (array JavaScript) – **não** usa banco de dados

## 📋 Requisitos

* **Node.js** (versão 14 ou superior)
* **npm** (ou **yarn**)

## 🚀 Como rodar a aplicação

1. **Clone o repositório** (ou copie os arquivos para uma pasta local)

   ```bash
   git clone https://github.com/SEU_USUARIO/my-api.git
   cd my-api
   ```

2. **Instale as dependências**

   ```bash
   npm install
   # ou, se preferir yarn
   # yarn install
   ```

3. **(Opcional) Defina a secret do JWT**

   Por padrão a aplicação usa a chave `my_super_secret_key`.  
   Para mudar, crie um arquivo `.env` na raiz do projeto:

   ```env
   JWT_SECRET=uma_chave_mais_segura
   ```

   > **Importante:** o `.env` está incluído no `.gitignore`.

4. **Inicie o servidor**

   ```bash
   npm start          # modo produção
   # ou
   npm run dev        # modo desenvolvimento (com nodemon)
   ```

   O servidor ficará escutando em `http://localhost:3000`.

## 📡 Endpoints

| Método | URL                | Descrição                              | Corpo (JSON)                     |
|--------|--------------------|----------------------------------------|----------------------------------|
| POST   | `/api/register`    | Cria um novo usuário                    | `{ "email": "user@example.com", "password": "senha123" }` |
| POST   | `/api/login`       | Autentica e devolve um token JWT        | `{ "email": "user@example.com", "password": "senha123" }` |
| GET    | `/api/profile`     | Retorna os dados do usuário autenticado | **Header** `Authorization: Bearer <token>` |

### Exemplo de uso com `curl`

```bash
# Registro
curl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{"email":"john@doe.com","password":"123456"}'

# Login
TOKEN=$(curl -s -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@doe.com","password":"123456"}' | jq -r .token)

# Perfil (autenticado)
curl -X GET http://localhost:3000/api/profile \
  -H "Authorization: Bearer $TOKEN"