const authService = require('../services/auth.service');

/**
 * Controller responsável pelo registro de novos usuários.
 *
 * POST /register
 * Body: { email: string, password: string }
 */
async function register(req, res) {
  try {
    const { email, password } = req.body;

    const result = await authService.registerUser(email, password);

    return res.status(201).json({
      message: 'User registered successfully',
      ...result,
    });
  } catch (err) {
    const status = err.statusCode || 500;
    return res.status(status).json({ error: err.message });
  }
}

/**
 * Controller responsável pelo login e emissão do token JWT.
 *
 * POST /login
 * Body: { email: string, password: string }
 */
async function login(req, res) {
  try {
    const { email, password } = req.body;

    const result = await authService.loginUser(email, password);

    return res.status(200).json({
      message: 'Login successful',
      ...result,
    });
  } catch (err) {
    const status = err.statusCode || 500;
    return res.status(status).json({ error: err.message });
  }
}

module.exports = { register, login };