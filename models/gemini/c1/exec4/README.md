# API de Autenticação Simples

Esta é uma API Node.js com Express que demonstra registro, login e rotas protegidas usando JWT.

## Como rodar o projeto

1. Certifique-se de ter o [Node.js](https://nodejs.org/) instalado.
2. Crie uma pasta para o projeto e coloque os arquivos `index.js` e `package.json` dentro dela.
3. Abra o terminal na pasta do projeto e instale as dependências:
   ```bash
   npm install
   ```
4. Inicie o servidor:
   ```bash
   npm start
   ```

## Como testar (Exemplo com cURL ou Postman)

### 1. Registrar um usuário
- **POST** `http://localhost:3000/register`
- **Body (JSON):** `{"username": "admin", "password": "123"}`

### 2. Fazer Login
- **POST** `http://localhost:3000/login`
- **Body (JSON):** `{"username": "admin", "password": "123"}`
- **Resposta:** Você receberá um `token`. Copie-o.

### 3. Acessar Rota Protegida
- **GET** `http://localhost:3000/protected`
- **Header:** `Authorization: Bearer SEU_TOKEN_AQUI`