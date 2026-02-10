# API REST Node.js com Express (Ref. Gemini C3 Exec2)

Este projeto é uma implementação de uma API REST simples para registro e login de usuários, utilizando autenticação via JWT e armazenamento em memória.

## Requisitos

- [Node.js](https://nodejs.org/) instalado.

## Instalação

1.  Navegue até a pasta do projeto:
    ```bash
    cd models/gemini/c3/exec2
    ```
2.  Instale as dependências:
    ```bash
    npm install
    ```

## Execução

Inicie o servidor:

```bash
npm start
```

O servidor estará rodando em `http://localhost:3000`.

## Endpoints

### 1. Criar Usuário (POST /api/register)

- **Body:** `{ "email": "user@example.com", "password": "mypassword" }`
- **Resposta:** Status 201 e dados do usuário (exceto a senha).

### 2. Login (POST /api/login)

- **Body:** `{ "email": "user@example.com", "password": "mypassword" }`
- **Resposta:** Token JWT.

### 3. Perfil (GET /api/profile)

- **Header:** `Authorization: Bearer <seu_token_aqui>`
- **Resposta:** Dados do usuário autenticado.

## Estrutura do Projeto

```text
src/
├── controllers/      # Lógica de controle das requisições
├── middleware/       # Middlewares (autenticação JWT)
├── routes/           # Definição das rotas
├── services/         # Lógica de negócio e dados (em memória)
└── index.js          # Ponto de entrada da aplicação
```
