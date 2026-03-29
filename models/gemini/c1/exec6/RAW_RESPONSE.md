Vou criar uma API completa e funcional seguindo suas especificações. Utilizaremos **Express** para o servidor, **bcryptjs** para segurança de senhas e **jsonwebtoken (JWT)** para a autenticação.

### Estrutura do Projeto

Crie uma pasta para o projeto e, dentro dela, os seguintes arquivos:

1.  `package.json`
2.  `index.js`
3.  `README.md`

---

### 1. `package.json`

Este arquivo define as dependências do projeto.

```json
{
  "name": "api-auth-simples",
  "version": "1.0.0",
  "description": "API simples com Express e JWT",
  "main": "index.js",
  "scripts": {
    "start": "node index.js"
  },
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "express": "^4.18.2",
    "jsonwebtoken": "^9.0.0"
  }
}
```

---

### 2. `index.js`

Este é o código principal da API.

```javascript
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());

// Armazenamento em memória
const users = [];
const SECRET_KEY = 'sua_chave_secreta_muito_segura';

// --- ROTAS PÚBLICAS ---

// Rota de Registro
app.post('/register', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: "Usuário e senha são obrigatórios" });
    }

    const userExists = users.find(u => u.username === username);
    if (userExists) {
        return res.status(400).json({ error: "Usuário já existe" });
    }

    // Hash da senha por segurança
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newUser = { id: users.length + 1, username, password: hashedPassword };
    users.push(newUser);

    res.status(201).json({ message: "Usuário criado com sucesso" });
});

// Rota de Login
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    const user = users.find(u => u.username === username);
    if (!user) {
        return res.status(400).json({ error: "Credenciais inválidas" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        return res.status(400).json({ error: "Credenciais inválidas" });
    }

    // Geração do Token JWT (expira em 1 hora)
    const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY, { expiresIn: '1h' });

    res.json({ token });
});

// --- MIDDLEWARE DE AUTENTICAÇÃO ---

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Formato "Bearer TOKEN"

    if (!token) return res.status(401).json({ error: "Acesso negado. Token não fornecido." });

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({ error: "Token inválido ou expirado" });
        req.user = user;
        next();
    });
};

// --- ROTA PROTEGIDA ---

app.get('/profile', authenticateToken, (req, res) => {
    res.json({
        message: "Você acessou uma rota protegida!",
        user: req.user
    });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
```

---

### 3. `README.md`

Instruções para rodar o projeto.

```markdown
# API de Autenticação Simples

Esta é uma API Node.js construída com Express para demonstrar autenticação JWT.

## Como rodar o projeto

1. Certifique-se de ter o **Node.js** instalado.
2. No terminal, dentro da pasta do projeto, instale as dependências:
   ```bash
   npm install
   ```
3. Inicie o servidor:
   ```bash
   npm start
   ```
4. A API estará disponível em `http://localhost:3000`.

## Endpoints

- **POST `/register`**: Cria um novo usuário.
  - Body: `{ "username": "admin", "password": "123" }`
- **POST `/login`**: Autentica e retorna um Token JWT.
  - Body: `{ "username": "admin", "password": "123" }`
- **GET `/profile`**: Rota protegida.
  - Header: `Authorization: Bearer <SEU_TOKEN_AQUI>`
```

---

### Como testar (Passo a passo)

1.  **Registrar**: Envie um POST para `/register` com um JSON contendo usuário e senha.
2.  **Logar**: Envie um POST para `/login` com as mesmas credenciais. Você receberá um campo `token`.
3.  **Acessar Protegido**: Envie um GET para `/profile`. No cabeçalho (Header) da requisição, adicione:
    *   Chave: `Authorization`
    *   Valor: `Bearer <cole_o_token_aqui>`

Se tentar acessar o `/profile` sem o token ou com um token errado, a API retornará erro 401 ou 403.