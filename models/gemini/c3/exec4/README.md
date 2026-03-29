# Node.js Auth API

API REST simples com autenticação JWT, focada em segurança e boas práticas.

## Tecnologias
- Node.js
- Express
- JWT (jsonwebtoken)
- Bcryptjs (Hashing de senhas)
- Helmet (Segurança de Headers)

## Como executar localmente

1. **Clone o repositório ou copie os arquivos.**

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Configure o ambiente:**
   Crie um arquivo `.env` na raiz do projeto (conforme o exemplo fornecido no código acima) e defina seu `JWT_SECRET`.

4. **Inicie o servidor:**
   ```bash
   # Modo produção
   npm start
   
   # Modo desenvolvimento (auto-reload no Node 20+)
   npm run dev
   ```

## Como testar a API

### 1. Registrar um usuário
- **POST** `http://localhost:3000/register`
- **Body (JSON):**
  ```json
  {
    "username": "admin",
    "password": "senha_segura_123"
  }
  ```

### 2. Fazer Login
- **POST** `http://localhost:3000/login`
- **Body (JSON):** Mesmos dados acima.
- **Resposta:** Você receberá um `token`. Copie-o.

### 3. Acessar Perfil (Protegido)
- **GET** `http://localhost:3000/profile`
- **Header:** 
  - `Authorization`: `Bearer SEU_TOKEN_AQUI`

## Segurança Implementada
- **Hashing:** Senhas nunca são salvas em texto plano, usamos `bcryptjs`.
- **JWT:** Autenticação stateless com tempo de expiração configurável.
- **Helmet:** Proteção contra vulnerabilidades web comuns via HTTP headers.
- **Environment Variables:** Dados sensíveis (segredo do JWT) isolados do código.