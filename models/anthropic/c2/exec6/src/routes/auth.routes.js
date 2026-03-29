const { Router } = require('express');
const authController = require('../controllers/auth.controller');

const router = Router();

/**
 * @route  POST /register
 * @desc   Register a new user
 * @access Public
 */
router.post('/register', authController.register);

/**
 * @route  POST /login
 * @desc   Authenticate user and return JWT
 * @access Public
 */
router.post('/login', authController.login);

module.exports = router;