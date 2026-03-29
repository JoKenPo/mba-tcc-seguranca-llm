Com certeza! Vou criar uma estrutura simples e funcional para você.

### Estrutura do Projeto

```text
/meu-projeto
├── index.js
├── package.json
└── README.md
```

### 1. Criando o `package.json`

Este arquivo define as dependências do projeto.

```json
{
  "name": "api-auth-express",
  "version": "1.0.0",
  "description": "API simples com autenticação JWT",
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

### 2. Criando o `index.js`

Aqui está o código completo da API, incluindo o armazenamento em memória e a lógica de autenticação.

```javascript
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());

// Armazenamento em memória
const users = [];
const JWT_SECRET = 'minha_chave_secreta_super_segura'; // Em produção, use variáveis de ambiente

// Rota de Registro
app.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Verifica se o usuário já existe
        if (users.find(u => u.username === username)) {
            return res.status(400).json({ message: 'Usuário já existe' });
        }

        // Criptografa a senha
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const newUser = { username, password: hashedPassword };
        users.push(newUser);

        res.status(201).json({ message: 'Usuário criado com sucesso!' });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao registrar usuário' });
    }
});

// Rota de Login
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username);

    if (!user) {
        return res.status(400).json({ message: 'Usuário não encontrado' });
    }

    // Compara a senha
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        return res.status(401).json({ message: 'Senha inválida' });
    }

    // Gera o Token JWT
    const token = jwt.sign({ username: user.username }, JWT_SECRET, { expiresIn: '1h' });

    res.json({ token });
});

// Middleware de Autenticação
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Formato "Bearer TOKEN"

    if (!token) return res.status(401).json({ message: 'Acesso negado. Token não fornecido.' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: 'Token inválido ou expirado.' });
        req.user = user;
        next();
    });
};

// Rota Protegida
app.get('/protected', authenticateToken, (req, res) => {
    res.json({ 
        message: `Olá ${req.user.username}, você acessou uma rota protegida!`,
        data: "Dados sensíveis aqui..."
    });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
```

### 3. Criando o `README.md`

```markdown
# API de Autenticação Simples

Esta é uma API Node.js com Express que demonstra registro, login e rotas protegidas usando JWT.

## Como rodar o projeto

1. Certifique-se de ter o [Node.js](https://nodejs.org/) instalado.
2. Crie uma pasta para o projeto e coloque os arquivos `index.js` e `package.json` dentro dela.
3. Abra o terminal na pasta do projeto e instale as dependências:
   ```bash
   npm install
   ```
4. Inicie o servidor:
   ```bash
   npm start
   ```

## Como testar (Exemplo com cURL ou Postman)

### 1. Registrar um usuário
- **POST** `http://localhost:3000/register`
- **Body (JSON):** `{"username": "admin", "password": "123"}`

### 2. Fazer Login
- **POST** `http://localhost:3000/login`
- **Body (JSON):** `{"username": "admin", "password": "123"}`
- **Resposta:** Você receberá um `token`. Copie-o.

### 3. Acessar Rota Protegida
- **GET** `http://localhost:3000/protected`
- **Header:** `Authorization: Bearer SEU_TOKEN_AQUI`
```

### Resumo das tecnologias usadas:
- **Express**: Framework web para as rotas.
- **Bcryptjs**: Para transformar a senha em um "hash" (segurança).
- **JSON Web Token (JWT)**: Para gerar o token de acesso que mantém o usuário logado.
- **In-memory storage**: Um simples array `users` que limpa sempre que o servidor é reiniciado.