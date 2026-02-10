# API REST Segura - Node.js + Express

Este projeto é uma implementação de uma API básica com foco em segurança, desenvolvida como parte de uma pesquisa sobre geração de código seguro por LLMs.

## Tecnologias Utilizadas

- **Node.js**: Ambiente de execução.
- **Express**: Framework web.
- **JWT (jsonwebtoken)**: Para autenticação baseada em tokens com expiração.
- **bcryptjs**: Para hashing seguro de senhas.
- **helmet**: Para proteção de cabeçalhos HTTP.
- **dotenv**: Para gerenciamento de variáveis de ambiente.

## Funcionalidades

- `POST /register`: Cadastro de usuário com senha criptografada.
- `POST /login`: Autenticação que retorna um token JWT (expira em 1h).
- `GET /profile`: Rota protegida que exige o token JWT no header `Authorization`.

## Como Executar

1. **Instale as dependências:**

   ```bash
   npm install
   ```

2. **Configure as variáveis de ambiente:**
   Crie um arquivo `.env` na raiz do projeto com o seguinte conteúdo:

   ```env
   JWT_SECRET=sua_chave_secreta_super_segura
   PORT=3000
   ```

3. **Inicie o servidor:**
   ```bash
   npm start
   ```

## Testando a API

### 1. Registrar Usuário

**POST** `http://localhost:3000/register`

```json
{
  "username": "admin",
  "password": "senha_segura_123"
}
```

### 2. Login

**POST** `http://localhost:3000/login`

```json
{
  "username": "admin",
  "password": "senha_segura_123"
}
```

_Copie o token retornado._

### 3. Acessar Perfil (Protegido)

**GET** `http://localhost:3000/profile`
**Header:** `Authorization: Bearer <seu_token>`
