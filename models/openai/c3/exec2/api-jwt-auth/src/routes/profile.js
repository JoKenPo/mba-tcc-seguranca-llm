// src/routes/profile.js
const express = require('express');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

/**
 * @route GET /profile
 * @desc Retorna os dados do usuário autenticado
 * @access Protegido (Bearer token)
 */
router.get('/profile', authenticateToken, (req, res) => {
  // `req.user` foi preenchido pelo middleware
  res.json({ profile: req.user });
});

module.exports = router;