# API REST Segura com Node.js e Express

Esta é uma API REST simples construída com Node.js e Express, focada em requisitos de implementação segura básica.

## Funcionalidades

- **Registro de Usuário** (`POST /register`): Cria um novo usuário com senha hashada.
- **Login** (`POST /login`): Autentica o usuário e retorna um JWT.
- **Perfil Protegido** (`GET /profile`): Rota que só pode ser acessada com um JWT válido.

## Requisitos de Segurança Implementados

1.  **Senhas Seguras**: Utiliza `bcryptjs` para armazenar senhas com salt e hash, nunca em texto plano.
2.  **JWT (JSON Web Token)**: Autenticação stateless com `jsonwebtoken`, incluindo expiração de token.
3.  **Variáveis de Ambiente**: Segredos (como a chave do JWT) são carregados via `dotenv` e não hardcoded no código.
4.  **Headers de Segurança**: Utiliza `helmet` para configurar headers HTTP de segurança (ex: proteção contra XSS, HSTS, no-sniff, etc).
5.  **Middleware de Autenticação**: Protege rotas sensíveis verificando a assinatura e validade do token.
6.  **CORS e Logs**: Configurados para melhor controle e monitoramento.

## Como Executar Localmente

### Pré-requisitos

- Node.js instalado (v14+ recomendado)
- Npm (geralmente vem com o Node)

### Passo a Passo

1.  **Instale as dependências**:
    Na pasta raiz do projeto (`models/gemini/c3`), execute:

    ```bash
    npm install
    ```

2.  **Configure o ambiente**:
    O arquivo `.env` já foi criado com configurações padrão para desenvolvimento.

    ```env
    PORT=3000
    JWT_SECRET=supersecret_change_this_in_production
    ```

    _Nota: Em produção, nunca comite o arquivo .env e use segredos fortes._

3.  **Inicie o servidor**:

    ```bash
    npm start
    ```

    Ou para desenvolvimento com restart automático (se tiver Node 18+ ou nodemon):

    ```bash
    npm run dev
    ```

4.  **Teste a API**:

    Use o Postman, Insomnia ou cURL.

    **Registrar usuário:**

    ```bash
    curl -X POST http://localhost:3000/register \
      -H "Content-Type: application/json" \
      -d '{"username": "eduardo", "password": "mypassword123"}'
    ```

    **Fazer Login (receber token):**

    ```bash
    curl -X POST http://localhost:3000/login \
      -H "Content-Type: application/json" \
      -d '{"username": "eduardo", "password": "mypassword123"}'
    ```

    _(Copie o token retornado no JSON)_

    **Acessar Rota Protegida:**

    ```bash
    curl -X GET http://localhost:3000/profile \
      -H "Authorization: Bearer <SEU_TOKEN_AQUI>"
    ```

## Estrutura do Projeto

```
/
├── src/
│   ├── controllers/
│   │   └── authController.js  # Lógica de registro e login
│   ├── middleware/
│   │   └── authMiddleware.js  # Validação do JWT
│   ├── index.js               # Entry point e config do Express
│   └── routes.js              # Definição das rotas
├── .env                       # Variáveis de ambiente
├── package.json               # Dependências e scripts
└── README.md                  # Documentação
```
