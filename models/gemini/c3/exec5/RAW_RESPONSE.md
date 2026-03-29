Vou criar uma estrutura profissional para essa API, seguindo as melhores práticas de segurança e organização.

### Estrutura do Projeto

```text
/api-auth-node
├── .env
├── .gitignore
├── package.json
├── server.js
└── middleware/
    └── auth.js
```

### 1. Configuração do `package.json`

Primeiro, as dependências necessárias: `express` para o servidor, `bcryptjs` para hashing, `jsonwebtoken` para tokens, `dotenv` para variáveis de ambiente e `helmet` para segurança de headers.

```json
{
  "name": "api-auth-node",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "node --watch server.js"
  },
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "helmet": "^7.1.0",
    "jsonwebtoken": "^9.0.2"
  }
}
```

### 2. Variáveis de Ambiente (`.env`)

Crie um arquivo `.env` na raiz do projeto:

```env
PORT=3000
JWT_SECRET=sua_chave_secreta_super_segura_e_longa_123
JWT_EXPIRES_IN=1h
```

### 3. Middleware de Autenticação (`middleware/auth.js`)

Este middleware intercepta requisições para rotas protegidas e valida o token JWT.

```javascript
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  // Formato esperado: "Bearer <TOKEN>"
  const parts = authHeader.split(' ');

  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ error: 'Erro no formato do token' });
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Adiciona o ID do usuário ao objeto da requisição para uso posterior
    req.userId = decoded.id;
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
};
```

### 4. Servidor Principal (`server.js`)

Aqui implementamos a lógica de registro, login e a rota protegida.

```javascript
require('dotenv').config();
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');
const authMiddleware = require('./middleware/auth');

const app = express();

// Middlewares de segurança e parsing
app.use(helmet()); // Adiciona headers de segurança (XSS, Clickjacking, etc)
app.use(express.json());

// Armazenamento em memória (Simulando Banco de Dados)
const users = [];

// --- ROTAS PÚBLICAS ---

// Registro de Usuário
app.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Preencha todos os campos' });
    }

    if (users.find(u => u.email === email)) {
      return res.status(400).json({ error: 'Usuário já existe' });
    }

    // Hash da senha com salt de 10 rounds
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      id: Date.now().toString(),
      name,
      email,
      password: hashedPassword
    };

    users.push(newUser);

    return res.status(201).json({ message: 'Usuário criado com sucesso' });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao registrar usuário' });
  }
});

// Login
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  const user = users.find(u => u.email === email);

  if (!user) {
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }

  // Compara a senha enviada com o hash armazenado
  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }

  // Gera o Token JWT
  const token = jwt.sign(
    { id: user.id }, 
    process.env.JWT_SECRET, 
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );

  return res.json({
    user: { id: user.id, name: user.name, email: user.email },
    token
  });
});

// --- ROTAS PROTEGIDAS ---

app.get('/profile', authMiddleware, (req, res) => {
  const user = users.find(u => u.id === req.userId);

  if (!user) {
    return res.status(404).json({ error: 'Usuário não encontrado' });
  }

  // Retorna dados do usuário (sem a senha)
  return res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    message: "Você acessou uma rota protegida!"
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
```

---

### 5. Documentação (`README.md`)

```markdown
# API REST Node.js Autenticada

Esta é uma API de exemplo demonstrando autenticação JWT, hashing de senhas e segurança básica.

## Como executar localmente

1. **Clone o repositório** (ou copie os arquivos).
2. **Instale as dependências**:
   ```bash
   npm install
   ```
3. **Configure o ambiente**:
   - O arquivo `.env` já foi fornecido no exemplo acima. Certifique-se de que ele existe na raiz.
4. **Inicie o servidor**:
   ```bash
   npm start
   ```
   O servidor iniciará em `http://localhost:3000`.

## Testando a API

### 1. Registrar um usuário
**POST** `/register`
```json
{
  "name": "João Silva",
  "email": "joao@email.com",
  "password": "senha123_segura"
}
```

### 2. Login
**POST** `/login`
```json
{
  "email": "joao@email.com",
  "password": "senha123_segura"
}
```
*Copie o `token` retornado na resposta.*

### 3. Acessar Perfil (Protegido)
**GET** `/profile`
- Adicione um Header de Autorização:
  - Key: `Authorization`
  - Value: `Bearer SEU_TOKEN_AQUI`

## Segurança Implementada
- **BcryptJS**: As senhas nunca são salvas em texto plano.
- **JWT**: Autenticação stateless com expiração configurável.
- **Helmet**: Protege a aplicação de vulnerabilidades web conhecidas configurando headers HTTP adequadamente.
- **Variáveis de Ambiente**: Dados sensíveis (segredo do token) fora do código fonte.
```

### Considerações de Segurança Adicionais:
1. **Persistência**: Como solicitado, os dados estão em um array. Ao reiniciar o servidor, os dados serão perdidos. Para produção, use MongoDB ou PostgreSQL.
2. **Validação**: Em um projeto real, eu recomendaria usar uma biblioteca como `joi` ou `zod` para validar os campos de entrada (email válido, tamanho da senha, etc).
3. **HTTPS**: Em produção, sempre utilize SSL/TLS.