const express = require('express');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

/**
 * @route GET /profile
 * @desc Retorna informações do usuário autenticado
 * @access Protegido por JWT
 */
router.get('/profile', authMiddleware, (req, res) => {
  // req.user foi preenchido pelo middleware
  res.json({
    id: req.user.id,
    username: req.user.username,
    message: 'Este é um recurso protegido.',
  });
});

module.exports = router;