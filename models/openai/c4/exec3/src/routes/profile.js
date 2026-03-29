import express from 'express';
import authMiddleware from '../middleware/auth.js';
import { users } from '../utils/database.js';

const router = express.Router();

/**
 * @route GET /api/profile
 * @desc  Retorna informações do usuário autenticado
 * @access Protegido (JWT)
 */
router.get('/profile', authMiddleware, (req, res) => {
  const user = users.find((u) => u.email === req.user.email);
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });

  // Nunca devolva a senha (nem hash)
  res.json({ email: user.email });
});

export default router;