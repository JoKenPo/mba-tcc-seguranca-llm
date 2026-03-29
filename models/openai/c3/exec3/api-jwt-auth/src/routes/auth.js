const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { findByUsername, createUser } = require('../utils/users');

const router = express.Router();

/**
 * @route POST /register
 * @desc Registra um novo usuário
 * @body { username: string, password: string }
 */
router.post('/register', async (req, res) => {
  const { username, password } = req.body;

  // Valida entrada mínima
  if (!username || !password) {
    return res.status(400).json({ error: 'username e password são obrigatórios' });
  }

  // Verifica se já existe
  if (findByUsername(username)) {
    return res.status(409).json({ error: 'Usuário já existe' });
  }

  // Hash da senha (12 salt rounds – balance entre segurança e performance)
  const passwordHash = await bcrypt.hash(password, 12);

  const user = createUser(username, passwordHash);

  // Não devolve a senha nem o hash
  return res.status(201).json({ id: user.id, username: user.username });
});

/**
 * @route POST /login
 * @desc Autentica usuário e devolve JWT
 * @body { username: string, password: string }
 */
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  // Validação básica
  if (!username || !password) {
    return res.status(400).json({ error: 'username e password são obrigatórios' });
  }

  const user = findByUsername(username);
  if (!user) {
    // Não revela se o usuário existe ou não
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }

  const passwordMatch = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatch) {
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }

  // Cria payload mínimo: sub (subject) = id do usuário
  const payload = { sub: user.id };

  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  });

  return res.json({ token });
});

module.exports = router;