Vou criar uma API REST robusta seguindo as melhores práticas de segurança para Node.js.

### Estrutura do Projeto

```text
/
├── .env                # Variáveis de ambiente (Segredo JWT)
├── .gitignore          # Arquivos ignorados pelo Git
├── package.json        # Dependências e scripts
├── server.js           # Ponto de entrada e rotas
├── authMiddleware.js   # Middleware de proteção de rotas
└── README.md           # Instruções de execução
```

### 1. Dependências (`package.json`)

```json
{
  "name": "node-express-auth-api",
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

### 2. Middleware de Autenticação (`authMiddleware.js`)

Este arquivo verifica se o token JWT enviado no header `Authorization` é válido.

```javascript
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Formato "Bearer TOKEN"

  if (!token) {
    return res.status(401).json({ error: 'Acesso negado. Token não fornecido.' });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(403).json({ error: 'Token inválido ou expirado.' });
  }
};
```

### 3. Servidor Principal (`server.js`)

Aqui implementamos a lógica de registro, login e a rota protegida.

```javascript
require('dotenv').config();
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');
const authMiddleware = require('./authMiddleware');

const app = express();

// Middlewares de Segurança e Parsing
app.use(helmet()); // Adiciona headers de segurança (XSS, Clickjacking, etc)
app.use(express.json());

// Armazenamento em memória (Simulando Banco de Dados)
const users = [];

// --- ROTAS PÚBLICAS ---

// Registro de Usuário
app.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
    }

    if (users.find(u => u.email === email)) {
      return res.status(400).json({ error: 'Usuário já existe.' });
    }

    // Hash da senha (Salt rounds = 10)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = {
      id: users.length + 1,
      email,
      password: hashedPassword
    };

    users.push(newUser);
    res.status(201).json({ message: 'Usuário criado com sucesso!' });
  } catch (err) {
    res.status(500).json({ error: 'Erro interno no servidor.' });
  }
});

// Login
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(400).json({ error: 'E-mail ou senha inválidos.' });
    }

    // Validação da senha
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'E-mail ou senha inválidos.' });
    }

    // Geração do Token JWT com expiração de 1 hora
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.header('Authorization', token).json({
      message: 'Login realizado com sucesso',
      token: token
    });
  } catch (err) {
    res.status(500).json({ error: 'Erro interno no servidor.' });
  }
});

// --- ROTA PROTEGIDA ---

app.get('/profile', authMiddleware, (req, res) => {
  // O middleware injeta os dados do token em req.user
  const user = users.find(u => u.id === req.user.id);
  
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });

  res.json({
    message: 'Dados do perfil acessados com sucesso',
    user: {
      id: user.id,
      email: user.email,
      info: "Este é um dado protegido que só usuários logados vêem."
    }
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
```

### 4. Configuração de Ambiente (`.env`)

Crie este arquivo na raiz do projeto:

```env
JWT_SECRET=uma_chave_secreta_muito_longa_e_aleatoria_123
PORT=3000
```

---

### 5. README.md

```markdown
# Auth API Node.js + Express

API REST simples com autenticação JWT, criptografia de senha e headers de segurança.

## Como executar localmente

1. **Instale as dependências:**
   ```bash
   npm install
   ```

2. **Configure as variáveis de ambiente:**
   Crie um arquivo `.env` na raiz e adicione:
   ```env
   JWT_SECRET=sua_chave_secreta_aqui
   PORT=3000
   ```

3. **Inicie o servidor:**
   ```bash
   npm start
   ```
   O servidor estará rodando em `http://localhost:3000`.

## Endpoints

### 1. Registro (`POST /register`)
Cria um novo usuário.
- **Body (JSON):** `{ "email": "user@example.com", "password": "123" }`

### 2. Login (`POST /login`)
Autentica e retorna um token JWT.
- **Body (JSON):** `{ "email": "user@example.com", "password": "123" }`
- **Resposta:** Retorna um `token` que deve ser usado nas próximas requisições.

### 3. Perfil (`GET /profile`) - **ROTA PROTEGIDA**
Retorna dados do usuário logado.
- **Header:** `Authorization: Bearer <SEU_TOKEN_AQUI>`

## Segurança Implementada
- **Helmet:** Proteção contra vulnerabilidades web comuns via headers HTTP.
- **BcryptJS:** As senhas nunca são salvas em texto puro, apenas o hash.
- **JWT:** Autenticação stateless com tempo de expiração (1 hora).
- **Variáveis de Ambiente:** Segredos sensíveis fora do código fonte.
```

### Como testar:
1. Use o **Postman** ou **Insomnia**.
2. Primeiro, faça um POST em `/register`.
3. Depois, faça um POST em `/login` e copie o `token` recebido.
4. Por fim, faça um GET em `/profile`, vá na aba "Auth", selecione "Bearer Token" e cole o token para visualizar os dados protegidos.