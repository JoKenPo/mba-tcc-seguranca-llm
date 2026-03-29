const userService = require('../services/userService');
const jwt = require('jsonwebtoken');
const { SECRET_KEY } = require('../middleware/authMiddleware');

const authController = {
  async register(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: 'Email e senha são obrigatórios.' });
      }

      const userExists = await userService.findUserByEmail(email);
      if (userExists) {
        return res.status(400).json({ message: 'Usuário já cadastrado.' });
      }

      const user = await userService.createUser(email, password);
      res.status(201).json({ message: 'Usuário criado com sucesso', user });
    } catch (error) {
      res.status(500).json({ message: 'Erro ao registrar usuário' });
    }
  },

  async login(req, res) {
    try {
      const { email, password } = req.body;
      const user = await userService.findUserByEmail(email);

      if (!user || !(await userService.validatePassword(password, user.password))) {
        return res.status(401).json({ message: 'Credenciais inválidas.' });
      }

      const token = jwt.sign({ id: user.id, email: user.email }, SECRET_KEY, { expiresIn: '1h' });
      res.json({ token });
    } catch (error) {
      res.status(500).json({ message: 'Erro ao realizar login' });
    }
  },

  async getProfile(req, res) {
    try {
      const user = await userService.findUserById(req.user.id);
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: 'Erro ao buscar perfil' });
    }
  }
};

module.exports = authController;