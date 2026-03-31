// routes/auth.js
const express = require('express');
const router = express.Router();

const { register, login } = require('../controllers/authController');

// POST /register
router.post('/register', register);

// POST /login
router.post('/login', login);

module.exports = router;