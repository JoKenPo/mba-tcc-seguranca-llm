// /home/your‑user/auth‑api/src/middleware/auth.js
const jwt = require('jsonwebtoken');
const userStore = require('../store/userStore');

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token missing or malformed' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = userStore.findById(payload.sub);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    // Anexa o usuário ao request para uso posterior
    req.user = { id: user.id, name: user.name, email: user.email };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

module.exports = authMiddleware;