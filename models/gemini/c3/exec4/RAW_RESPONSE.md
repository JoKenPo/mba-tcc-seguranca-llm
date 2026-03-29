Vou criar uma estrutura completa e profissional para essa API, seguindo as melhores práticas de segurança e organização.

### Estrutura de Arquivos
```text
/
├── .env
├── .gitignore
├── package.json
├── server.js
└── README.md
```

### 1. Dependências (`package.json`)

```json
{
  "name": "node-express-auth-api",
  "version": "1.0.0",
  "description": "API REST com autenticação JWT",
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

```env
PORT=3000
JWT_SECRET=uma_chave_secreta_muito_longa_e_aleatoria_123456
JWT_EXPIRES_IN=1h
```

### 3. Código da API (`server.js`)

```javascript
require('dotenv').config();
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');

const app = express();

// Middleware de Segurança e Parsing
app.use(helmet()); // Adiciona headers de segurança (XSS, Clickjacking, etc)
app.use(express.json());

// Armazenamento em memória (Simulando Banco de Dados)
const users = [];

// --- Middleware de Autenticação ---
const authenticateToken = (req, res, next) => {
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

// --- Rotas Públicas ---

// Registro de Usuário
app.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Validação básica
        if (!username || !password) {
            return res.status(400).json({ error: 'Usuário e senha são obrigatórios.' });
        }

        // Verificar se usuário já existe
        if (users.find(u => u.username === username)) {
            return res.status(400).json({ error: 'Usuário já cadastrado.' });
        }

        // Hash da senha (Custo 10)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = {
            id: users.length + 1,
            username,
            password: hashedPassword
        };

        users.push(newUser);
        res.status(201).json({ message: 'Usuário criado com sucesso!' });
    } catch (error) {
        res.status(500).json({ error: 'Erro interno no servidor.' });
    }
});

// Login
app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        const user = users.find(u => u.username === username);
        if (!user) {
            return res.status(400).json({ error: 'Credenciais inválidas.' });
        }

        // Verificar senha
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(400).json({ error: 'Credenciais inválidas.' });
        }

        // Gerar Token JWT
        const token = jwt.sign(
            { id: user.id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        res.json({
            message: 'Login realizado com sucesso',
            token: token
        });
    } catch (error) {
        res.status(500).json({ error: 'Erro interno no servidor.' });
    }
});

// --- Rotas Protegidas ---

app.get('/profile', authenticateToken, (req, res) => {
    // O middleware authenticateToken injeta os dados do token em req.user
    const user = users.find(u => u.id === req.user.id);
    
    if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    // Retornar dados sem a senha
    res.json({
        id: user.id,
        username: user.username,
        message: 'Este é um dado protegido que você só vê autenticado!'
    });
});

// Inicialização
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
```

### 4. Instruções de Execução (`README.md`)

```markdown
# Node.js Auth API

API REST simples com autenticação JWT, focada em segurança e boas práticas.

## Tecnologias
- Node.js
- Express
- JWT (jsonwebtoken)
- Bcryptjs (Hashing de senhas)
- Helmet (Segurança de Headers)

## Como executar localmente

1. **Clone o repositório ou copie os arquivos.**

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Configure o ambiente:**
   Crie um arquivo `.env` na raiz do projeto (conforme o exemplo fornecido no código acima) e defina seu `JWT_SECRET`.

4. **Inicie o servidor:**
   ```bash
   # Modo produção
   npm start
   
   # Modo desenvolvimento (auto-reload no Node 20+)
   npm run dev
   ```

## Como testar a API

### 1. Registrar um usuário
- **POST** `http://localhost:3000/register`
- **Body (JSON):**
  ```json
  {
    "username": "admin",
    "password": "senha_segura_123"
  }
  ```

### 2. Fazer Login
- **POST** `http://localhost:3000/login`
- **Body (JSON):** Mesmos dados acima.
- **Resposta:** Você receberá um `token`. Copie-o.

### 3. Acessar Perfil (Protegido)
- **GET** `http://localhost:3000/profile`
- **Header:** 
  - `Authorization`: `Bearer SEU_TOKEN_AQUI`

## Segurança Implementada
- **Hashing:** Senhas nunca são salvas em texto plano, usamos `bcryptjs`.
- **JWT:** Autenticação stateless com tempo de expiração configurável.
- **Helmet:** Proteção contra vulnerabilidades web comuns via HTTP headers.
- **Environment Variables:** Dados sensíveis (segredo do JWT) isolados do código.
```

### Considerações de Segurança Adicionais:
1. **Armazenamento:** Como solicitado, os dados estão em um array (memória). Em produção, você deve substituir isso por um banco de dados (PostgreSQL, MongoDB, etc).
2. **HTTPS:** Em um ambiente real, essa API deve rodar sob HTTPS para proteger o token JWT durante o trânsito.
3. **Validação:** Para APIs complexas, recomendo usar bibliotecas como `joi` ou `zod` para validar o formato dos dados de entrada.