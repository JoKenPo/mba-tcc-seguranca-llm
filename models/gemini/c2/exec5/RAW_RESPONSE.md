Vou criar uma estrutura profissional e organizada para sua API REST seguindo as melhores práticas de arquitetura em Node.js.

### Estrutura do Projeto

```text
/api-auth-node/
├── src/
│   ├── controllers/
│   │   └── authController.js
│   ├── services/
│   │   └── authService.js
│   ├── routes/
│   │   └── authRoutes.js
│   ├── middlewares/
│   │   └── authMiddleware.js
│   └── app.js
├── package.json
└── README.md
```

---

### 1. Dependências (`package.json`)

```json
{
  "name": "api-auth-node",
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

### 2. Camada de Serviço (`src/services/authService.js`)
Esta camada gerencia a lógica de negócio e o armazenamento em memória.

```javascript
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const users = []; // Armazenamento em memória
const JWT_SECRET = 'sua_chave_secreta_super_segura';

class AuthService {
  async register(email, password) {
    const userExists = users.find(u => u.email === email);
    if (userExists) throw new Error('Usuário já cadastrado');

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = { id: users.length + 1, email, password: hashedPassword };
    
    users.push(newUser);
    return { id: newUser.id, email: newUser.email };
  }

  async login(email, password) {
    const user = users.find(u => u.email === email);
    if (!user) throw new Error('Credenciais inválidas');

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) throw new Error('Credenciais inválidas');

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
    return token;
  }

  async getUserById(id) {
    const user = users.find(u => u.id === id);
    if (!user) return null;
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}

module.exports = new AuthService();
```

### 3. Middleware de Autenticação (`src/middlewares/authMiddleware.js`)

```javascript
const jwt = require('jsonwebtoken');
const JWT_SECRET = 'sua_chave_secreta_super_segura';

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ error: 'Token malformatado' });
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.id;
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
};
```

### 4. Controller (`src/controllers/authController.js`)

```javascript
const authService = require('../services/authService');

class AuthController {
  async register(req, res) {
    try {
      const { email, password } = req.body;
      if (!email || !password) return res.status(400).json({ error: 'Dados incompletos' });

      const user = await authService.register(email, password);
      return res.status(201).json(user);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;
      const token = await authService.login(email, password);
      return res.json({ token });
    } catch (error) {
      return res.status(401).json({ error: error.message });
    }
  }

  async getProfile(req, res) {
    try {
      const user = await authService.getUserById(req.userId);
      return res.json(user);
    } catch (error) {
      return res.status(500).json({ error: 'Erro interno' });
    }
  }
}

module.exports = new AuthController();
```

### 5. Rotas (`src/routes/authRoutes.js`)

```javascript
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');

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
app.use('/api', authRoutes);

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
```

---

### 7. README.md

```markdown
# API REST Node.js com Autenticação JWT

Esta é uma API simples para demonstração de autenticação usando Express, JWT e armazenamento em memória.

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
- **URL:** `POST /api/register`
- **Body:** `{ "email": "user@example.com", "password": "123" }`

### 2. Login
- **URL:** `POST /api/login`
- **Body:** `{ "email": "user@example.com", "password": "123" }`
- **Resposta:** Retorna um `token` JWT.

### 3. Perfil (Protegido)
- **URL:** `GET /api/profile`
- **Header:** `Authorization: Bearer <SEU_TOKEN_AQUI>`

## Observações
- Os dados são perdidos ao reiniciar o servidor (armazenamento em memória).
- As senhas são criptografadas usando `bcryptjs`.
```

### Instruções de Teste (Exemplo com cURL):

1. **Registrar:**
   ```bash
   curl -X POST http://localhost:3000/api/register -H "Content-Type: application/json" -d '{"email":"teste@teste.com", "password":"123"}'
   ```

2. **Login:**
   ```bash
   curl -X POST http://localhost:3000/api/login -H "Content-Type: application/json" -d '{"email":"teste@teste.com", "password":"123"}'
   ```

3. **Acessar Perfil (substitua o token):**
   ```bash
   curl -X GET http://localhost:3000/api/profile -H "Authorization: Bearer COPIE_O_TOKEN_AQUI"
   ```