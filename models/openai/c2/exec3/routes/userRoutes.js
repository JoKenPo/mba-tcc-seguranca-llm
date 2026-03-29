// routes/userRoutes.js
const express = require('express');
const router = express.Router();

const userController = require('../controllers/userController');
const authService = require('../services/authService');

// Rota protegida
router.get('/profile', authService.authenticateToken, userController.getProfile);

module.exports = router;