# API REST simples com Node.js, Express e JWT

Esta é uma API mínima que demonstra:

- Registro de usuários (`POST /api/register`)
- Login retornando um token JWT (`POST /api/login`)
- Acesso a recurso protegido (`GET /api/profile`)
- Persistência em memória (array JavaScript)
- Estrutura de projeto organizada (routes, controllers, services, middleware)

## 📋 Pré‑requisitos

- **Node.js** (versão 14 ou superior)
- **npm** (geralmente vem junto com o Node)

## 🚀 Instalação e execução

1. **Clone o repositório** (ou copie os arquivos para uma pasta)

   ```bash
   git clone <url-do-repositorio> my-api
   cd my-api
   ```

2. **Instale as dependências**

   ```bash
   npm install
   ```

3. **Inicie a aplicação**

   - Modo desenvolvimento (recarrega ao salvar arquivos):

     ```bash
     npm run dev
     ```

   - Modo produção:

     ```bash
     npm start
     ```

   O servidor será iniciado na porta **3000** (ou na porta definida pela variável de ambiente `PORT`).

4. **Teste os endpoints**

   Você pode usar o **cURL**, **Postman**, **Insomnia**, ou qualquer cliente HTTP.

   ### Registro

   ```bash
   curl -X POST http://localhost:3000/api/register \
        -H "Content-Type: application/json" \
        -d '{"email":"usuario@example.com","password":"senha123"}'
   ```

   ### Login (recebe o token)

   ```bash
   curl -X POST http://localhost:3000/api/login \
        -H "Content-Type: application/json" \
        -d '{"email":"usuario@example.com","password":"senha123"}'
   ```

   Resposta esperada:

   ```json
   { "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6..." }
   ```

   ### Acesso ao perfil (rota protegida)

   Substitua `<TOKEN>` pelo token retornado no login.

   ```bash
   curl -X GET http://localhost:3000/api/profile \
        -H "Authorization: Bearer <TOKEN>"
   ```

   Resposta esperada:

   ```json
   {
     "profile": {
       "id": 1,
       "email": "usuario@example.com"
     }
   }
   ```

## 🛠️ Observações

- **Persistência**: Os usuários são armazenados apenas em memória. Ao reiniciar o servidor, todos os dados são perdidos. Para produção, substitua o `userService` por um banco de dados real.
- **Segurança**: A chave secreta do JWT está hard‑coded (`sua_chave_secreta_aleatoria`). Em ambientes reais, use variáveis de ambiente (`process.env.JWT_SECRET`).
- **Validação**: Este exemplo contém validações básicas. Considere usar bibliotecas como `express-validator` para regras mais robustas.

## 📄 Licença

Este projeto está licenciado sob a licença MIT – sinta‑se livre para usar, modificar e distribuir.
