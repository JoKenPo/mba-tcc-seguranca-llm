4. A API estará disponível em `http://localhost:3000`.

## Endpoints

- **POST `/register`**: Cria um novo usuário.
  - Body: `{ "username": "admin", "password": "123" }`
- **POST `/login`**: Autentica e retorna um Token JWT.
  - Body: `{ "username": "admin", "password": "123" }`
- **GET `/profile`**: Rota protegida.
  - Header: `Authorization: Bearer <SEU_TOKEN_AQUI>`