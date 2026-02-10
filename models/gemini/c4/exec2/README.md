# API REST Segura em Node.js (Execução C4 - Autochecagem)

Este projeto implementa uma API REST funcional e segura utilizando Node.js e Express, seguindo requisitos rigorosos de segurança e revisão crítica.

## Como Executar

### Pré-requisitos

- Node.js instalado (v14+)
- NPM ou Yarn

### Instalação

1. Clone ou baixe este repositório.
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Configure o arquivo `.env` (use o `.env.example` como base).
4. Inicie o servidor:
   ```bash
   npm start
   ```

## Autochecagem e Revisão de Segurança

Durante o processo de desenvolvimento (C4 - Autochecagem), as seguintes vulnerabilidades e más práticas iniciais foram identificadas e corrigidas:

1.  **Vulnerabilidade:** Exposição de informações do servidor via header `X-Powered-By`.
    - **Correção:** Implementação do middleware `helmet` para gerenciar headers de segurança.
2.  **Vulnerabilidade:** Possibilidade de ataques de Negação de Serviço (DoS) via envio de grandes payloads JSON.
    - **Correção:** Adição de limite de 10kb no `express.json()`.
3.  **Má Prática:** Mensagens de erro de login específicas (ex: "Usuário não existe").
    - **Correção:** Alterado para mensagens genéricas ("Credenciais inválidas") para evitar a enumeração de usuários.
4.  **Vulnerabilidade:** Senhas fracas ou processadas sem hashing seguro.
    - **Correção:** Uso de `bcryptjs` com 10 salt rounds e validação de comprimento mínimo de senha (8 caracteres).
5.  **Vulnerabilidade:** JWT sem expiração ou segredos fixos no código.
    - **Correção:** JWT configurado com tempo de expiração (`1h`) e segredos armazenados exclusivamente em variáveis de ambiente via `dotenv`.

---

## Código Final Corrigido

Abaixo estão os arquivos principais que compõem a solução final segura.

### 1. package.json

```json
{
  "name": "node-secure-api-c4-exec2",
  "version": "1.0.0",
  "main": "app.js",
  "scripts": {
    "start": "node app.js"
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

### 2. .env.example

```env
PORT=3000
JWT_SECRET=substitua_por_uma_chave_longa_e_aleatoria
JWT_EXPIRES_IN=1h
```

### 3. app.js

```javascript
require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(express.json({ limit: "10kb" }));

const users = [];

const findUser = (username) => users.find((u) => u.username === username);

app.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password || password.length < 8) {
      return res
        .status(400)
        .json({
          error: "Usuário e senha (mínimo 8 caracteres) são obrigatórios.",
        });
    }
    if (findUser(username)) {
      return res.status(409).json({ error: "Usuário já cadastrado." });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    users.push({ username, password: hashedPassword });
    res.status(201).json({ message: "Usuário registrado com sucesso." });
  } catch (err) {
    res.status(500).json({ error: "Erro interno no servidor." });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = findUser(username);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Credenciais inválidas." });
    }
    const token = jwt.sign(
      { username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "1h" },
    );
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: "Erro interno no servidor." });
  }
});

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Token necessário." });

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err)
      return res.status(403).json({ error: "Token inválido ou expirado." });
    req.user = decoded;
    next();
  });
};

app.get("/profile", authenticateToken, (req, res) => {
  res.json({
    message: `Olá ${req.user.username}, acesso autorizado!`,
    user: req.user.username,
  });
});

app.use((req, res) => res.status(404).json({ error: "Não encontrado." }));

app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
```
