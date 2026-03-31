// routes/profile.js
const express = require('express');
const router = express.Router();

const { getProfile } = require('../controllers/profileController');
const { authenticateToken } = require('../services/authService');

// GET /profile (protected)
router.get('/profile', authenticateToken, getProfile);

module.exports = router;