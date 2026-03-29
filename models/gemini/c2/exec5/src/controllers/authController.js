const authService = require('../services/authService');

class AuthController {
  async register(req, res) {
    try {
      const { email, password } = req.body;
      if (!email || !password) return res.status(400).json({ error: 'Dados incompletos' });

      const user = await authService.register(email, password);
      return res.status(201).json(user);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;
      const token = await authService.login(email, password);
      return res.json({ token });
    } catch (error) {
      return res.status(401).json({ error: error.message });
    }
  }

  async getProfile(req, res) {
    try {
      const user = await authService.getUserById(req.userId);
      return res.json(user);
    } catch (error) {
      return res.status(500).json({ error: 'Erro interno' });
    }
  }
}

module.exports = new AuthController();