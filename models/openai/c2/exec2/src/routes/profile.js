// src/routes/profile.js
const express = require('express');
const { getProfile } = require('../controllers/profileController');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

// Todas as rotas abaixo exigem autenticação
router.use(authenticateToken);

router.get('/', getProfile);

module.exports = router;