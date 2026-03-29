Vou criar uma estrutura profissional e organizada para sua API, seguindo as melhores práticas de separação de responsabilidades.

### Estrutura do Projeto
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
└── README.md
```

---

### 1. Configuração do Projeto (`package.json`)

```json
{
  "name": "node-express-jwt-api",
  "version": "1.0.0",
  "description": "API REST com Express e JWT",
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
Responsável pela manipulação dos dados (armazenamento em memória) e lógica de negócio.

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

  findUserByEmail(email) {
    return users.find(user => user.email === email);
  },

  async validatePassword(user, password) {
    return await bcrypt.compare(password, user.password);
  },

  findById(id) {
    const user = users.find(u => u.id === id);
    if (user) {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    }
    return null;
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
    return res.status(401).json({ message: 'Token não fornecido' });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.userId = decoded.id;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Token inválido ou expirado' });
  }
};

module.exports = { authMiddleware, SECRET_KEY };
```

### 4. Controladores (`src/controllers/authController.js`)

```javascript
const userService = require('../services/userService');
const jwt = require('jsonwebtoken');
const { SECRET_KEY } = require('../middleware/authMiddleware');

const authController = {
  async register(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: 'Email e senha são obrigatórios' });
      }

      if (userService.findUserByEmail(email)) {
        return res.status(400).json({ message: 'Usuário já existe' });
      }

      const user = await userService.createUser(email, password);
      res.status(201).json(user);
    } catch (error) {
      res.status(500).json({ message: 'Erro ao registrar usuário' });
    }
  },

  async login(req, res) {
    try {
      const { email, password } = req.body;
      const user = userService.findUserByEmail(email);

      if (!user || !(await userService.validatePassword(user, password))) {
        return res.status(401).json({ message: 'Credenciais inválidas' });
      }

      const token = jwt.sign({ id: user.id }, SECRET_KEY, { expiresIn: '1h' });
      res.json({ token });
    } catch (error) {
      res.status(500).json({ message: 'Erro ao realizar login' });
    }
  },

  getProfile(req, res) {
    const user = userService.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    res.json(user);
  }
};

module.exports = authController;
```

### 5. Rotas (`src/routes/authRoutes.js`)

```javascript
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/profile', authMiddleware, authController.getProfile);

module.exports = router;
```

### 6. Ponto de Entrada (`src/app.js`)

```javascript
const express = require('express');
const authRoutes = require('./routes/authRoutes');

const app = express();
const PORT = 3000;

app.use(express.json());

// Rotas
app.use('/', authRoutes);

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
```

---

### 7. README.md

```markdown
# Node.js Auth API

API REST simples com autenticação JWT e armazenamento em memória.

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

### 1. Registro de Usuário
- **URL:** `POST /register`
- **Corpo (JSON):**
  ```json
  {
    "email": "user@example.com",
    "password": "123"
  }
  ```

### 2. Login
- **URL:** `POST /login`
- **Corpo (JSON):**
  ```json
  {
    "email": "user@example.com",
    "password": "123"
  }
  ```
- **Resposta:** Retorna um `token`.

### 3. Perfil (Protegido)
- **URL:** `GET /profile`
- **Header:** `Authorization: Bearer <SEU_TOKEN_AQUI>`

## Tecnologias utilizadas
- Node.js
- Express
- JSON Web Token (JWT)
- BcryptJS (para hash de senhas)
```

### Como testar rapidamente (via terminal/curl):

1. **Registrar:**
   ```bash
   curl -X POST http://localhost:3000/register -H "Content-Type: application/json" -d '{"email":"teste@teste.com", "password":"123"}'
   ```

2. **Login:**
   ```bash
   curl -X POST http://localhost:3000/login -H "Content-Type: application/json" -d '{"email":"teste@teste.com", "password":"123"}'
   ```

3. **Perfil (substitua o token):**
   ```bash
   curl -X GET http://localhost:3000/profile -H "Authorization: Bearer COPIE_O_TOKEN_AQUI"
   ```