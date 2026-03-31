# API REST simples com Express, JWT e armazenamento em memória

Esta aplicação demonstra como criar uma API REST em Node.js usando **Express**, **JWT** para autenticação e **armazenamento em memória** (array JavaScript).  
Ela contém três endpoints:

| Método | Rota       | Descrição                                 |
|--------|------------|-------------------------------------------|
| POST   | `/api/register` | Cria um usuário (email + senha) |
| POST   | `/api/login`    | Autentica e devolve um token JWT |
| GET    | `/api/profile`  | Retorna os dados do usuário autenticado (token requerido) |

## 📋 Pré‑requisitos

- **Node.js** (versão 14 ou superior)
- **npm** (geralmente já vem com o Node)

## 🚀 Como rodar a aplicação

1. **Clone o repositório** (ou copie os arquivos para uma pasta vazia)

   ```bash
   git clone <url-do-repositorio> my-app
   cd my-app
   ```

2. **Instale as dependências**

   ```bash
   npm install
   ```

3. **(Opcional) Defina a secret do JWT**  
   Por padrão a aplicação usa a string `super-secret-key`.  
   Para usar outra chave, crie um arquivo `.env` na raiz:

   ```env
   JWT_SECRET=MinhaChaveSuperSecreta
   ```

   > **Importante:** o `.env` não está incluído no repositório (está no `.gitignore`).

4. **Inicie o servidor**

   ```bash
   npm start          # modo produção
   # ou
   npm run dev        # modo desenvolvimento com nodemon
   ```

   O servidor ficará escutando em `http://localhost:3000`.

## 📡 Testando os endpoints

Você pode usar **cURL**, **Postman**, **Insomnia** ou qualquer cliente HTTP.

### 1️⃣ Registro

```bash
curl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{"email":"usuario@example.com","password":"senha123"}'