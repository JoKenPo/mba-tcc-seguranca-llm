const userService = require('../services/userService');
const jwt = require('jsonwebtoken');
const { SECRET_KEY } = require('../middleware/authMiddleware');

const authController = {
  async register(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: 'Email e senha são obrigatórios' });
      }

      if (userService.findUserByEmail(email)) {
        return res.status(400).json({ message: 'Usuário já existe' });
      }

      const user = await userService.createUser(email, password);
      res.status(201).json(user);
    } catch (error) {
      res.status(500).json({ message: 'Erro ao registrar usuário' });
    }
  },

  async login(req, res) {
    try {
      const { email, password } = req.body;
      const user = userService.findUserByEmail(email);

      if (!user || !(await userService.validatePassword(user, password))) {
        return res.status(401).json({ message: 'Credenciais inválidas' });
      }

      const token = jwt.sign({ id: user.id }, SECRET_KEY, { expiresIn: '1h' });
      res.json({ token });
    } catch (error) {
      res.status(500).json({ message: 'Erro ao realizar login' });
    }
  },

  getProfile(req, res) {
    const user = userService.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    res.json(user);
  }
};

module.exports = authController;