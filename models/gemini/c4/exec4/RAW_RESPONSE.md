Aqui está a versão final e segura da API, consolidada em um único arquivo `readme.md` conforme solicitado. Esta versão já passou pela revisão crítica e inclui proteções contra ataques comuns (brute force, injeção, headers inseguros).

# API REST Segura com Node.js e Express

Este projeto implementa uma API de autenticação robusta seguindo as melhores práticas de segurança para Node.js.

## 🛠️ Tecnologias e Segurança Implementada

- **Express.js**: Framework web.
- **Bcryptjs**: Hashing de senhas com salt (custo 12).
- **JWT (JSON Web Token)**: Autenticação stateless com expiração de 1h.
- **Helmet**: Configuração de headers HTTP de segurança (HSTS, CSP, etc).
- **Express Rate Limit**: Proteção contra ataques de força bruta e DoS.
- **Express Validator**: Sanitização e validação rigorosa de inputs.
- **Dotenv**: Gerenciamento de variáveis de ambiente.

---

## 📁 Estrutura de Arquivos

### 1. `package.json`
```json
{
  "name": "secure-auth-api",
  "version": "1.0.0",
  "main": "server.js",
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "express-rate-limit": "^7.1.5",
    "express-validator": "^7.0.1",
    "helmet": "^7.1.0",
    "jsonwebtoken": "^9.0.2"
  }
}
```

### 2. `.env` (Exemplo)
**Importante:** Nunca versione este arquivo em produção.
```env
PORT=3000
JWT_SECRET=uma_chave_muito_longa_e_aleatoria_123_abc
NODE_ENV=production
```

### 3. `server.js` (Código Corrigido e Revisado)

```javascript
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
require('dotenv').config();

const app = express();

// --- SEGURANÇA: Middlewares de Infraestrutura ---

// 1. Helmet para headers de segurança
app.use(helmet());

// 2. Limitação de requisições (Rate Limiting) para evitar Brute Force
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Limite de 100 requests por IP
  message: { error: 'Muitas requisições vindas deste IP, tente novamente mais tarde.' }
});
app.use(limiter);

app.use(express.json({ limit: '10kb' })); // Limita tamanho do payload para evitar DoS

// Banco de dados em memória (Simulado)
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

// POST /register - Cadastro de usuários
app.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('A senha deve ter no mínimo 8 caracteres')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email, password } = req.body;

  if (users.find(u => u.email === email)) {
    return res.status(409).json({ error: 'Usuário já existe.' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 12); // Salt cost 12
    const newUser = { id: Date.now(), email, password: hashedPassword };
    users.push(newUser);
    res.status(201).json({ message: 'Usuário criado com sucesso.' });
  } catch (error) {
    res.status(500).json({ error: 'Erro interno no servidor.' });
  }
});

// POST /login - Autenticação
app.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').exists()
], async (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email);

  // Mensagem genérica para evitar enumeração de usuários
  const loginError = 'E-mail ou senha inválidos.';

  if (!user) return res.status(401).json({ error: loginError });

  try {
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ error: loginError });

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: 'Erro no processamento do login.' });
  }
});

// GET /profile - Rota Protegida
app.get('/profile', authenticateToken, (req, res) => {
  // Retorna apenas dados não sensíveis
  res.json({
    message: 'Perfil acessado com sucesso',
    user: { id: req.user.id, email: req.user.email }
  });
});

// Tratamento de erros global (evita vazamento de stacktrace)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Algo deu errado!' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor seguro rodando na porta ${PORT}`));
```

---

## 🛡️ Relatório de Revisão de Segurança (Correções Efetuadas)

Durante a revisão do código inicial, as seguintes vulnerabilidades e melhorias foram identificadas e corrigidas:

1.  **Ataques de Força Bruta (Brute Force):**
    *   *Problema:* Um atacante poderia tentar milhares de senhas por segundo.
    *   *Correção:* Implementado o `express-rate-limit` para limitar tentativas de login por IP.
2.  **Enumeração de Usuários:**
    *   *Problema:* Retornar "Usuário não encontrado" permite que atacantes descubram e-mails válidos na base.
    *   *Correção:* A API agora retorna a mesma mensagem genérica ("E-mail ou senha inválidos") tanto para usuário inexistente quanto para senha incorreta.
3.  **Falta de Validação de Input:**
    *   *Problema:* Envio de objetos malformados ou strings gigantes poderia causar crash ou comportamentos inesperados.
    *   *Correção:* Adicionado `express-validator` para garantir que o e-mail é válido e a senha possui requisitos mínimos.
4.  **Headers HTTP Inseguros:**
    *   *Problema:* O Express por padrão revela a tecnologia usada (`X-Powered-By: Express`), facilitando ataques direcionados.
    *   *Correção:* Adicionado `helmet` para ocultar headers sensíveis e habilitar proteções modernas do navegador.
5.  **Negação de Serviço (DoS) via Payload:**
    *   *Problema:* O envio de um JSON massivo poderia esgotar a memória do servidor.
    *   *Correção:* Limitado o tamanho do body do JSON para `10kb`.
6.  **Segurança do JWT:**
    *   *Problema:* Tokens sem expiração ou com segredos fracos.
    *   *Correção:* Definida expiração de `1h` e obrigatoriedade do uso de `JWT_SECRET` via variável de ambiente.

---

## 🚀 Como Executar

1.  **Instale as dependências:**
    ```bash
    npm install
    ```

2.  **Configure o ambiente:**
    Crie um arquivo `.env` na raiz e adicione uma chave secreta:
    ```env
    JWT_SECRET=sua_chave_secreta_aqui
    ```

3.  **Inicie o servidor:**
    ```bash
    node server.js
    ```

4.  **Testando:**
    - **Registro:** `POST /register` com JSON `{"email": "teste@email.com", "password": "senha_segura_123"}`
    - **Login:** `POST /login` com as mesmas credenciais (receba o token).
    - **Perfil:** `GET /profile` enviando o header `Authorization: Bearer <SEU_TOKEN>`.