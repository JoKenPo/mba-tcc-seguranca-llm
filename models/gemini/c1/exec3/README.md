# API Simples em Node.js com Express

Este projeto é uma API simples criada para demonstração, com funcionalidades de cadastro, login e rota protegida.

## Como rodar o projeto

1. Certifique-se de ter o [Node.js](https://nodejs.org/) instalado.
2. Clone ou baixe este repositório.
3. Abra o terminal na pasta do projeto.
4. Instale as dependências:
   ```bash
   npm install
   ```
5. Inicie o servidor:
   ```bash
   npm start
   ```
6. A API estará rodando em `http://localhost:3000`.

## Endpoints

- `POST /register`: Cadastro de usuário (envie `username` e `password` no corpo JSON).
- `POST /login`: Login de usuário (envie `username` e `password`). Retorna um token JWT.
- `GET /profile`: Rota protegida. Requer o header `Authorization: Bearer <token>`.

## Notas

- Utiliza armazenamento em memória (os dados são perdidos ao reiniciar o servidor).
- Autenticação baseada em JWT.
