// src/routes/profile.routes.js
const express = require('express');
const router = express.Router();

const profileController = require('../controllers/profile.controller');
const authMiddleware = require('../services/auth.service').verifyToken;

// Rota protegida
router.get('/profile', authMiddleware, profileController.getProfile);

module.exports = router;