
## ⚙️ Pré‑requisitos

* **Node.js** (v14 ou superior)
* **npm** (ou **yarn**)

## 🚀 Como rodar a aplicação

1. **Clone o repositório** (ou copie os arquivos para uma pasta vazia)

   ```bash
   git clone <url-do-repositorio> project
   cd project
   ```

2. **Instale as dependências**

   ```bash
   npm install
   # ou, se preferir yarn
   # yarn install
   ```

3. **Inicie o servidor**

   ```bash
   npm start
   # ou, em modo desenvolvimento com hot‑reload
   # npm run dev
   ```

   O servidor ficará escutando em `http://localhost:3000`.

## 📌 Endpoints

| Método | Rota       | Descrição                              | Corpo (JSON)                     | Header de Autorização |
|--------|------------|----------------------------------------|----------------------------------|-----------------------|
| POST   | /register  | Cria um novo usuário                   | `{ "email": "...", "password": "..." }` | — |
| POST   | /login     | Autentica e devolve um JWT             | `{ "email": "...", "password": "..." }` | — |
| GET    | /profile   | Retorna os dados do usuário autenticado| —                                | `Authorization: Bearer <token>` |

### Exemplo de fluxo

```bash
# 1️⃣ Registro
curl -X POST http://localhost:3000/register \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"senha123"}'

# 2️⃣ Login (recebe token)
TOKEN=$(curl -s -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"senha123"}' | jq -r .token)

# 3️⃣ Acesso ao perfil
curl -X GET http://localhost:3000/profile \
  -H "Authorization: Bearer $TOKEN"