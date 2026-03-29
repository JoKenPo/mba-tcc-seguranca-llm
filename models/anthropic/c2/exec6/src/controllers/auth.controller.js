const authService = require('../services/auth.service');

const authController = {
  /**
   * POST /register
   *
   * Creates a new user account.
   *
   * Request body:
   *   { "email": "user@example.com", "password": "secret123" }
   *
   * Responses:
   *   201 – User created successfully
   *   400 – Validation error
   *   409 – Email already registered
   */
  async register(req, res, next) {
    try {
      const { email, password } = req.body;

      const user = await authService.register(email, password);

      return res.status(201).json({
        message: 'User registered successfully',
        user,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /login
   *
   * Authenticates a user and returns a signed JWT.
   *
   * Request body:
   *   { "email": "user@example.com", "password": "secret123" }
   *
   * Responses:
   *   200 – Login successful, returns token
   *   400 – Missing fields
   *   401 – Invalid credentials
   */
  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      const { token, user } = await authService.login(email, password);

      return res.status(200).json({
        message: 'Login successful',
        token,
        user,
      });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = authController;