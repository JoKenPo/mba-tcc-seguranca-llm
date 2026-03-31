// src/routes/profile.js
const express = require('express');
const router = express.Router();

const { getProfile } = require('../controllers/profileController');
const authMiddleware = require('../middleware/authMiddleware');

// GET /profile (protegido)
router.get('/', authMiddleware, getProfile);

module.exports = router;