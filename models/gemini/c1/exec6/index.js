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