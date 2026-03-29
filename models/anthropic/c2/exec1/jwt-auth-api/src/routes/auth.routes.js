const { Router } = require('express');
const authController = require('../controllers/auth.controller');

const router = Router();

/**
 * @route  POST /register
 * @desc   Cria um novo usuário
 * @access Public
 * @body   { email: string, password: string }
 */
router.post('/register', authController.register);

/**
 * @route  POST /login
 * @desc   Autentica o usuário e retorna um token JWT
 * @access Public
 * @body   { email: string, password: string }
 */
router.post('/login', authController.login);

module.exports = router;