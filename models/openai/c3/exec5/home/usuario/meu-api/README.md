# API REST de Cadastro, Login e Perfil (Node.js + Express)

Esta é uma implementação mínima, porém segura, de uma API que permite:

| Método | Rota      | Descrição                     | Protegida? |
|--------|-----------|------------------------------|------------|
| POST   | `/register` | Cria um novo usuário          | ❌ |
| POST   | `/login`    | Autentica e devolve JWT       | ❌ |
| GET    | `/profile`  | Retorna dados do usuário logado | ✅ (Bearer token) |

## 📋 Requisitos

- **Node.js** (versão 18 ou superior)
- **npm** (ou **yarn**)

## 🚀 Instalação e execução

1. **Clone ou copie o projeto** para o diretório desejado:

   ```bash
   cd /home/usuario
   git clone <url-do-repositorio> meu-api   # ou simplesmente copie os arquivos
   cd meu-api
   ```

2. **Instale as dependências**:

   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente**:

   Crie um arquivo `.env` na raiz do projeto (já incluído como exemplo) e defina:

   ```dotenv
   JWT_SECRET=seuSegredoSuperSecreto
   JWT_EXPIRES_IN=1h          # tempo de validade do token
   PORT=3000                  # opcional
   ```

   > **Importante:** Nunca compartilhe o valor de `JWT_SECRET`. Em produção, use um gerenciador de segredos.

4. **Inicie a API**:

   - Modo desenvolvimento (recarrega ao mudar arquivos):

     ```bash
     npm run dev
     ```

   - Modo produção:

     ```bash
     npm start
     ```

   A aplicação ficará disponível em `http://localhost:3000`.

## 📡 Testando as rotas

Você pode usar **cURL**, **Postman**, **Insomnia** ou qualquer cliente HTTP.

### 1️⃣ Registro

```bash
curl -X POST http://localhost:3000/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Ana Silva","email":"ana@example.com","password":"senhaForte123"}'