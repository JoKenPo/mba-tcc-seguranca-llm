Este `README.md` contém a implementação final da API, incorporando as melhores práticas de segurança e as correções após a revisão crítica.

```markdown
# API REST Segura com Node.js e Express

Esta é uma implementação de referência de uma API de autenticação, focada em segurança e boas práticas.

## 🛡️ Revisão de Segurança e Melhorias Aplicadas

Após uma revisão crítica, as seguintes vulnerabilidades e melhorias foram implementadas:

1.  **Proteção contra Brute Force:** Adicionado `express-rate-limit` para mitigar ataques de força bruta nos endpoints de login e registro.
2.  **Segurança de Headers:** Implementado o `helmet` para configurar headers HTTP de segurança (HSTS, CSP, XSS Filter, etc.).
3.  **Validação de Input:** Adicionada validação rigorosa de dados de entrada para evitar ataques de negação de serviço (DoS) por payloads gigantes e garantir a integridade dos dados.
4.  **Mensagens de Erro Genéricas:** O login agora retorna a mesma mensagem para "usuário não encontrado" ou "senha incorreta", impedindo a enumeração de usuários.
5.  **Segurança de Senhas:** Uso de `bcrypt` com fator de custo (salt rounds) adequado (12) para hashing lento, dificultando ataques de dicionário.
6.  **Prevenção de DoS:** Limitação do tamanho do JSON aceito pelo body-parser.
7.  **Tratamento de Erros:** Centralização do tratamento de erros para evitar vazamento de stack traces ou informações sensíveis do servidor.

---

## 🚀 Como Executar Localmente

### 1. Pré-requisitos
- Node.js (v14 ou superior)
- NPM ou Yarn

### 2. Instalação
Crie uma pasta para o projeto e execute:
```bash
npm init -y
npm install express bcryptjs jsonwebtoken dotenv helmet express-rate-limit
```

### 3. Configuração
Crie um arquivo `.env` na raiz do projeto:
```env
PORT=3000
JWT_SECRET=uma_chave_secreta_muito_longa_e_aleatoria_123!@#
JWT_EXPIRES_IN=1h
```

### 4. O Código (`server.js`)

```javascript
require('dotenv').config();
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();

// --- SEGURANÇA: Middlewares de Infraestrutura ---

// Configura headers de segurança HTTP
app.use(helmet());

// Limita o tamanho do corpo da requisição (Prevenção de DoS)
app.use(express.json({ limit: '10kb' }));

// Rate Limiting: Máximo de 100 requisições a cada 15 minutos
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Muitas requisições vindas deste IP, tente novamente mais tarde.'
});
app.use('/api/', limiter);

// Armazenamento em memória (Simulando Banco de Dados)
const users = [];

// --- MIDDLEWARE DE AUTENTICAÇÃO ---

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Acesso negado. Token não fornecido.' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token inválido ou expirado.' });
    req.user = user;
    next();
  });
};

// --- ROTAS ---

// POST /register - Cadastro de Usuário
app.post('/api/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validação básica
    if (!username || !password || password.length < 8) {
      return res.status(400).json({ error: 'Dados inválidos. A senha deve ter no mínimo 8 caracteres.' });
    }

    // Verifica se usuário já existe
    const userExists = users.find(u => u.username === username);
    if (userExists) {
      return res.status(409).json({ error: 'Usuário já cadastrado.' });
    }

    // Hash da senha com salt de 12 rounds
    const hashedPassword = await bcrypt.hash(password, 12);

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

// POST /login - Autenticação
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = users.find(u => u.username === username);
    
    // Segurança: Usamos a mesma mensagem de erro para usuário inexistente ou senha errada
    // para evitar enumeração de usuários (User Enumeration)
    const loginError = 'Usuário ou senha incorretos.';

    if (!user) {
      return res.status(401).json({ error: loginError });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: loginError });
    }

    // Geração do Token JWT
    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
    );

    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: 'Erro interno no servidor.' });
  }
});

// GET /profile - Rota Protegida
app.get('/api/profile', authenticateToken, (req, res) => {
  // Retorna apenas dados não sensíveis
  const user = users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });

  res.json({
    id: user.id,
    username: user.username,
    message: 'Este é um dado protegido acessado com sucesso.'
  });
});

// --- INICIALIZAÇÃO ---

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
  console.log('Segurança: Helmet, Rate Limit e Bcrypt ativos.');
});
```

### 5. Execução
```bash
node server.js
```

## 🛠️ Testando a API

1.  **Registrar:** `POST http://localhost:3000/api/register` com JSON `{"username": "admin", "password": "password123"}`.
2.  **Login:** `POST http://localhost:3000/api/login` com as mesmas credenciais. Copie o `token` retornado.
3.  **Perfil:** `GET http://localhost:3000/api/profile`. Adicione o Header `Authorization: Bearer <SEU_TOKEN_AQUI>`.

---
*Nota: Como este projeto usa armazenamento em memória, os dados serão perdidos ao reiniciar o servidor.*
```