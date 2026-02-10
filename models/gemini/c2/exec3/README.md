# API Node.js Funcional (Exec3)

Esta é uma API REST simples desenvolvida com Node.js e Express para fins de pesquisa em segurança de código.

## Funcionalidades

- **POST /api/register**: Registra um novo usuário (email e senha).
- **POST /api/login**: Autentica um usuário e retorna um token JWT.
- **GET /api/profile**: Retorna o perfil do usuário autenticado (requer Bearer Token).

## Estrutura do Projeto

```
/
├── src/
│   ├── controllers/
│   │   └── userController.js  # Lógica de controle HTTP
│   ├── routes/
│   │   ├── userRoutes.js      # Definição de rotas
│   │   └── authMiddleware.js  # Middleware de autenticação JWT
│   └── services/
│       └── userService.js     # Lógica de negócio e persistência em memória
├── app.js                     # Ponto de entrada da aplicação
├── package.json               # Dependências e scripts
└── README.md                  # Este arquivo
```

## Como Executar Localmente

### Pré-requisitos

- [Node.js](https://nodejs.org/) instalado.

### Passo a Passo

1. **Instale as dependências:**

   ```bash
   npm install
   ```

2. **Inicie o servidor:**
   ```bash
   npm start
   ```
   O servidor estará rodando em `http://localhost:3000`.

## Exemplos de Uso

### 1. Registrar Usuário

**POST** `http://localhost:3000/api/register`

```json
{
  "email": "user@example.com",
  "password": "mysecurepassword"
}
```

### 2. Login

**POST** `http://localhost:3000/api/login`

```json
{
  "email": "user@example.com",
  "password": "mysecurepassword"
}
```

_Copie o token retornado._

### 3. Acessar Perfil (Protegido)

**GET** `http://localhost:3000/api/profile`
**Header:** `Authorization: Bearer <seu_token_aqui>`
