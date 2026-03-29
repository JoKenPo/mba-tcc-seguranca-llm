# API Auth — Node.js + Express + JWT

API REST com cadastro de usuários, login e rotas protegidas por JWT.  
Os dados ficam em memória (array JS) e são perdidos ao reiniciar o servidor.

---

## Pré-requisitos

- [Node.js](https://nodejs.org/) v18 ou superior

---

## Como rodar

### 1. Instale as dependências
npm install

### 2. Configure as variáveis de ambiente
Copie o arquivo de exemplo e edite se quiser:
cp .env.example .env

### 3. Inicie o servidor

# Produção
npm start

# Desenvolvimento (reinicia ao salvar)
npm run dev

O servidor sobe em: http://localhost:3000

---

## Rotas

| Método | Rota            | Autenticação | Descrição                        |
|--------|-----------------|:------------:|----------------------------------|
| GET    | /               | Não          | Health check                     |
| POST   | /auth/register  | Não          | Cadastra um novo usuário         |
| POST   | /auth/login     | Não          | Faz login e retorna o JWT        |
| GET    | /auth/me        | **Sim**      | Retorna dados do usuário logado  |
| GET    | /users          | **Sim**      | Lista todos os usuários          |

---

## Exemplos de uso (curl)

### Cadastrar usuário
curl -s -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Maria","email":"maria@email.com","password":"123456"}'

### Fazer login
curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"maria@email.com","password":"123456"}'

### Acessar rota protegida (substitua <TOKEN> pelo token retornado no login)
curl -s http://localhost:3000/auth/me \
  -H "Authorization: Bearer <TOKEN>"

### Listar usuários (rota protegida)
curl -s http://localhost:3000/users \
  -H "Authorization: Bearer <TOKEN>"