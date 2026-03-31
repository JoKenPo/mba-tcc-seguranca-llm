// src/services/auth.service.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const SECRET_KEY = process.env.JWT_SECRET || 'my_super_secret_key';
const EXPIRATION = '1h'; // 1 hora

/**
 * Gera um token JWT contendo o payload informado.
 * @param {Object} payload
 * @returns {string}
 */
exports.generateToken = (payload) => {
  return jwt.sign(payload, SECRET_KEY, { expiresIn: EXPIRATION });
};

/**
 * Verifica o token enviado no header Authorization.
 * Se válido, adiciona `req.user` e chama next().
 */
exports.verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ message: 'Token não fornecido' });
  }

  const token = authHeader.split(' ')[1]; // Espera "Bearer <token>"
  if (!token) {
    return res.status(401).json({ message: 'Token mal formatado' });
  }

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Token inválido ou expirado' });
    }
    req.user = decoded; // { id, email, iat, exp }
    next();
  });
};

/**
 * Compara senha em texto puro com o hash armazenado.
 * @param {string} plain
 * @param {string} hash
 * @returns {Promise<boolean>}
 */
exports.comparePassword = (plain, hash) => {
  return bcrypt.compare(plain, hash);
};