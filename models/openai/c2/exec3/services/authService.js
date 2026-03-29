// services/authService.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const userService = require('./userService');

const JWT_SECRET = process.env.JWT_SECRET || 'my_super_secret_key';
const JWT_EXPIRES_IN = '1h';

/**
 * Autentica usuário e gera token JWT.
 * @param {string} email
 * @param {string} password - texto puro
 * @returns {string} token JWT
 */
async function login(email, password) {
  const user = userService.findByEmail(email);
  if (!user) {
    throw new Error('Credenciais inválidas');
  }

  const passwordMatch = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatch) {
    throw new Error('Credenciais inválidas');
  }

  const payload = { sub: user.id, email: user.email };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  return token;
}

/**
 * Middleware que verifica o token JWT.
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ message: 'Token não fornecido' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Token inválido ou expirado' });
    }
    // Anexa informações do usuário ao request
    req.user = { id: decoded.sub, email: decoded.email };
    next();
  });
}

module.exports = {
  login,
  authenticateToken,
};