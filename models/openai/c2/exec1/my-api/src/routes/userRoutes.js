// src/routes/userRoutes.js
const express = require('express');
const router = express.Router();

const userController = require('../controllers/userController');
const { authenticateToken } = require('../middleware/authMiddleware');

// GET /api/profile  (apenas usuários autenticados)
router.get('/profile', authenticateToken, userController.getProfile);

module.exports = router;