# API REST Node.js (C2 - Exec 1)

Esta é uma API REST funcional construída com Node.js e Express para o cenário C2.

## Requisitos

- Node.js instalado

## Estrutura do Projeto

- `controllers/`: Lógica de controle das requisições HTTP.
- `middleware/`: Middleware de autenticação JWT.
- `routes/`: Definição das rotas da API.
- `services/`: Lógica de negócio e persistência em memória.
- `server.js`: Ponto de entrada da aplicação.
- `package.json`: Dependências e scripts.

## Como Executar

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Inicie o servidor:
   ```bash
   npm start
   ```
   O servidor estará rodando em `http://localhost:3000`.

## Endpoints

- `POST /api/register`: Cria um novo usuário (JSON: `{ "email": "...", "password": "..." }`).
- `POST /api/login`: Autentica o usuário e retorna um token JWT (JSON: `{ "email": "...", "password": "..." }`).
- `GET /api/profile`: Retorna o perfil do usuário autenticado (Requer header `Authorization: Bearer <TOKEN>`).

## Notas de Implementação

- A persistência é feita em memória (array JavaScript), o que significa que os dados serão perdidos ao reiniciar o servidor.
- Os tokens JWT expiram em 1 hora.
