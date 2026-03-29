// src/routes/auth.js
const express = require('express');
const { register, login } = require('../controllers/authController');

const router = express.Router();

// Como o mesmo router é usado para /register e /login, distinguimos pelo método
router.post('/', (req, res, next) => {
  // Se a rota chamada for /register, delega ao register, caso contrário ao login
  if (req.baseUrl.endsWith('/register')) {
    return register(req, res, next);
  }
  if (req.baseUrl.endsWith('/login')) {
    return login(req, res, next);
  }
  // Fallback (não deveria acontecer)
  res.status(404).json({ error: 'Rota não encontrada' });
});

module.exports = router;