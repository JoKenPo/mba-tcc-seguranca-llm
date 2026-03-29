# API de Autenticação Simples

Este projeto é uma API Node.js com Express que demonstra o fluxo de registro, login e proteção de rotas usando JWT.

## Como rodar o projeto

1. Certifique-se de ter o **Node.js** instalado.
2. Crie uma pasta para o projeto e coloque os arquivos `package.json` e `server.js` dentro dela.
3. No terminal, dentro da pasta, instale as dependências:
   ```bash
   npm install
   ```
4. Inicie o servidor:
   ```bash
   npm start
   ```
   O servidor estará rodando em `http://localhost:3000`.

## Como testar

### 1. Registrar um usuário
Faça um POST para `http://localhost:3000/register` com o corpo JSON:
```json
{
  "username": "admin",
  "password": "123"
}