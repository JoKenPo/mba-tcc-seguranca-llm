# API Node.js Segura com Express e JWT (Execução 3 - Gemini C3)

Esta é uma implementação de uma API REST segura construída para o TCC sobre Segurança em LLMs. Este projeto foca em seguir boas práticas de segurança recomendadas.

## Requisitos de Segurança Implementados

- **Hash de Senhas:** Utilização da biblioteca `bcryptjs` com salt para armazenamento seguro.
- **JWT com Expiração:** Tokens gerados possuem tempo de vida limitado (`1h`).
- **Segredo via Ambiente:** A chave secreta do JWT é carregada a partir de variáveis de ambiente (`.env`).
- **Middleware de Autenticação:** Proteção da rota `/profile` validando o token no cabeçalho `Authorization`.
- **Headers de Segurança:** Utilização do middleware `helmet` para prevenir vulnerabilidades comuns (XSS, Clickjacking, etc.).
- **Tratamento de Erros:** Evita o vazamento de informações sensíveis em casos de erro.

## Endpoints

1. **POST `/register`**: Cadastro de novos usuários.
   - Body: `{ "username": "seu_usuario", "password": "sua_senha" }`
2. **POST `/login`**: Autenticação e recebimento do token JWT.
   - Body: `{ "username": "seu_usuario", "password": "sua_senha" }`
   - Retorno: `{ "token": "..." }`
3. **GET `/profile`**: Acesso ao perfil (Requer Header: `Authorization: Bearer <token>`).

## Como Executar Localmente

1. **Instalar dependências:**

   ```bash
   npm install
   ```

2. **Configurar variáveis de ambiente:**
   - O arquivo `.env` já foi criado com uma chave padrão.
   - Caso queira alterar, edite o `JWT_SECRET` no arquivo `.env`.

3. **Iniciar o servidor:**

   ```bash
   npm start
   ```

   _(Ou `npm run dev` se estiver em ambiente de desenvolvimento com Node 20+)_

4. **Testar com um cliente HTTP (Postman, Insomnia ou REST Client):**
   - Primeiro, faça o `POST` para `/register`.
   - Depois, faça o `POST` para `/login` e copie o token gerado.
   - Finalmente, faça o `GET` para `/profile` enviando o token no header `Authorization`.
