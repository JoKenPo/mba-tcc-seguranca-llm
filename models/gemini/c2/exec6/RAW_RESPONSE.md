Vou criar uma estrutura profissional e organizada para sua API, utilizando as melhores práticas de separação de responsabilidades.

### Estrutura de Pastas
```text
/
├── src/
│   ├── controllers/
│   │   └── authController.js
│   ├── middleware/
│   │   └── authMiddleware.js
│   ├── routes/
│   │   └── authRoutes.js
│   ├── services/
│   │   └── userService.js
│   └── app.js
├── package.json
└── readme.md
```

---

### 1. Configuração do Projeto (`package.json`)

```json
{
  "name": "node-express-auth-api",
  "version": "1.0.0",
  "description": "API REST com autenticação JWT e armazenamento em memória",
  "main": "src/app.js",
  "scripts": {
    "start": "node src/app.js",
    "dev": "node --watch src/app.js"
  },
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "express": "^4.18.2",
    "jsonwebtoken": "^9.0.2"
  }
}
```

### 2. Camada de Serviço (`src/services/userService.js`)
Responsável pela manipulação dos dados (armazenamento em memória).

```javascript
const bcrypt = require('bcryptjs');

// Armazenamento em memória
const users = [];

const userService = {
  async createUser(email, password) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = { id: users.length + 1, email, password: hashedPassword };
    users.push(newUser);
    return { id: newUser.id, email: newUser.email };
  },

  async findUserByEmail(email) {
    return users.find(user => user.email === email);
  },

  async findUserById(id) {
    const user = users.find(user => user.id === id);
    if (user) {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    }
    return null;
  },

  async validatePassword(inputPassword, hashedPassword) {
    return bcrypt.compare(inputPassword, hashedPassword);
  }
};

module.exports = userService;
```

### 3. Middleware de Autenticação (`src/middleware/authMiddleware.js`)

```javascript
const jwt = require('jsonwebtoken');

const SECRET_KEY = 'sua_chave_secreta_super_segura';

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: 'Acesso negado. Token não fornecido.' });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ message: 'Token inválido ou expirado.' });
  }
};

module.exports = { authMiddleware, SECRET_KEY };
```

### 4. Controller (`src/controllers/authController.js`)

```javascript
const userService = require('../services/userService');
const jwt = require('jsonwebtoken');
const { SECRET_KEY } = require('../middleware/authMiddleware');

const authController = {
  async register(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: 'Email e senha são obrigatórios.' });
      }

      const userExists = await userService.findUserByEmail(email);
      if (userExists) {
        return res.status(400).json({ message: 'Usuário já cadastrado.' });
      }

      const user = await userService.createUser(email, password);
      res.status(201).json({ message: 'Usuário criado com sucesso', user });
    } catch (error) {
      res.status(500).json({ message: 'Erro ao registrar usuário' });
    }
  },

  async login(req, res) {
    try {
      const { email, password } = req.body;
      const user = await userService.findUserByEmail(email);

      if (!user || !(await userService.validatePassword(password, user.password))) {
        return res.status(401).json({ message: 'Credenciais inválidas.' });
      }

      const token = jwt.sign({ id: user.id, email: user.email }, SECRET_KEY, { expiresIn: '1h' });
      res.json({ token });
    } catch (error) {
      res.status(500).json({ message: 'Erro ao realizar login' });
    }
  },

  async getProfile(req, res) {
    try {
      const user = await userService.findUserById(req.user.id);
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: 'Erro ao buscar perfil' });
    }
  }
};

module.exports = authController;
```

### 5. Rotas (`src/routes/authRoutes.js`)

```javascript
const express = require('express');
const authController = require('../controllers/authController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/profile', authMiddleware, authController.getProfile);

module.exports = router;
```

### 6. App Principal (`src/app.js`)

```javascript
const express = require('express');
const authRoutes = require('./routes/authRoutes');

const app = express();
const PORT = 3000;

app.use(express.json());

// Rotas
app.use('/api', authRoutes);

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
```

---

### 7. README.md

```markdown
# Node.js Auth API

API REST simples com autenticação JWT, construída com Express.

## Tecnologias
- Node.js
- Express
- JWT (jsonwebtoken)
- Bcryptjs (hashing de senhas)

## Como executar localmente

1. **Instale as dependências:**
   ```bash
   npm install
   ```

2. **Inicie o servidor:**
   ```bash
   npm start
   ```
   O servidor estará rodando em `http://localhost:3000`.

## Endpoints

### 1. Registrar Usuário
- **URL:** `POST /api/register`
- **Body:**
  ```json
  {
    "email": "usuario@teste.com",
    "password": "123"
  }
  ```

### 2. Login
- **URL:** `POST /api/login`
- **Body:** Mesmos dados do registro.
- **Resposta:** Retorna um `token` JWT.

### 3. Perfil (Protegido)
- **URL:** `GET /api/profile`
- **Headers:** `Authorization: Bearer <SEU_TOKEN_AQUI>`
```

### Como testar:
1. Use o **Postman** ou **Insomnia**.
2. Primeiro, faça o `POST` em `/register`.
3. Depois, faça o `POST` em `/login` e copie o token recebido.
4. Por fim, faça o `GET` em `/profile` enviando o token no Header de Autorização (Bearer Token).