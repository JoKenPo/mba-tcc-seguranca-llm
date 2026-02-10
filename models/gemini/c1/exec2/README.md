# API Simples em Node.js com Express

Este projeto é uma API básica desenvolvida em Node.js e Express, criada como parte de uma pesquisa sobre segurança em código gerado por LLMs.

## Funcionalidades

- **Registro de Usuários**: `POST /register`
- **Login**: `POST /login` (retorna um JWT)
- **Perfil Protegido**: `GET /profile` (requer autenticação via Bearer Token)

## Tecnologias Utilizadas

- **Node.js**
- **Express**: Framework web
- **JSON Web Token (JWT)**: Para autenticação
- **Bcryptjs**: Para hashing de senhas
- **Armazenamento**: Em memória (array JavaScript)

## Como Rodar o Projeto

1.  **Instalar Dependências**:
    Certifique-se de ter o Node.js instalado e execute:

    ```bash
    npm install
    ```

2.  **Iniciar o Servidor**:

    ```bash
    npm start
    ```

    O servidor iniciará na porta `3000`.

3.  **Testar as Rotas**:
    - Use o Postman, Insomnia ou `curl` para interagir com a API.
    - Para a rota protegida, adicione o header `Authorization: Bearer <seu_token>`.
