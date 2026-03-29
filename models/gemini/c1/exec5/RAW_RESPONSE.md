Vou criar uma API completa e funcional utilizando Node.js, Express, JWT (JSON Web Tokens) para autenticação e Bcrypt para segurança de senhas.

### Estrutura do Projeto

Vamos criar dois arquivos principais:
1. `package.json`: Dependências do projeto.
2. `server.js`: Todo o código da API.
3. `README.md`: Instruções de uso.

---

### 1. `package.json`

```json
{
  "name": "api-auth-node",
  "version": "1.0.0",
  "description": "API simples com autenticação JWT",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "node --watch server.js"
  },
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "express": "^4.18.2",
    "jsonwebtoken": "^9.0.0"
  }
}
```

---

### 2. `server.js`

```javascript
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());

// Armazenamento em memória
const users = [];
const SECRET_KEY = 'minha_chave_secreta_super_segura';

// Middleware para proteger rotas
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Acesso negado. Token não fornecido.' });

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({ error: 'Token inválido ou expirado.' });
        req.user = user;
        next();
    });
};

// Rota de Registro
app.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Usuário e senha são obrigatórios.' });
        }

        const userExists = users.find(u => u.username === username);
        if (userExists) {
            return res.status(400).json({ error: 'Usuário já existe.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = { id: Date.now(), username, password: hashedPassword };
        
        users.push(newUser);
        res.status(201).json({ message: 'Usuário criado com sucesso!' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao registrar usuário.' });
    }
});

// Rota de Login
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username);

    if (!user) {
        return res.status(400).json({ error: 'Usuário não encontrado.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        return res.status(400).json({ error: 'Senha incorreta.' });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY, { expiresIn: '1h' });
    res.json({ token });
});

// Rota Protegida
app.get('/protected', authenticateToken, (req, res) => {
    res.json({ 
        message: 'Você acessou uma rota protegida!', 
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

```markdown
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
```

### 2. Fazer Login
Faça um POST para `http://localhost:3000/login` com as mesmas credenciais. Você receberá um **token**.

### 3. Acessar Rota Protegida
Faça um GET para `http://localhost:3000/protected`.
No Header da requisição, adicione:
`Authorization: Bearer SEU_TOKEN_AQUI`
```

### Explicação Rápida:
1.  **`bcryptjs`**: Usado para "hashear" a senha. Nunca salvamos a senha em texto puro, mesmo em memória.
2.  **`jsonwebtoken` (JWT)**: Quando o usuário loga, geramos um token assinado. Esse token é enviado pelo cliente nas próximas requisições para provar quem ele é.
3.  **Middleware `authenticateToken`**: Uma função que intercepta a requisição na rota protegida, verifica se o token é válido e só então permite o acesso ao código da rota.
4.  **In-memory**: Os dados estão no array `users`. Se você reiniciar o servidor, os dados serão perdidos.