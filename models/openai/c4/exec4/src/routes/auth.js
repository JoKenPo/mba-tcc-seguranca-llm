import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { body, validationResult } from "express-validator";
import { authenticate } from "../middleware/auth.js";
import { loginLimiter } from "../middleware/rateLimiter.js";

const router = Router();

// ---------- "Banco de dados" em memória ----------
const users = []; // Cada usuário: { id, email, passwordHash }

/**
 * Helper para gerar JWT
 */
const generateToken = (user) => {
  const payload = { id: user.id, email: user.email };
  const secret = process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_EXPIRES_IN || "1h";

  return jwt.sign(payload, secret, { expiresIn });
};

/**
 * @route   POST /api/register
 * @desc    Cria novo usuário
 */
router.post(
  "/register",
  [
    body("email").isEmail().withMessage("Email inválido."),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Senha deve ter ao menos 8 caracteres."),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        return res.status(400).json({ errors: errors.array() });

      const { email, password } = req.body;

      // Verifica se o email já está cadastrado
      const exists = users.find((u) => u.email === email);
      if (exists)
        return res.status(409).json({ error: "Email já cadastrado." });

      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      const newUser = {
        id: users.length + 1,
        email,
        passwordHash,
      };
      users.push(newUser);

      return res
        .status(201)
        .json({ message: "Usuário registrado com sucesso." });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * @route   POST /api/login
 * @desc    Autentica usuário e devolve JWT
 */
router.post(
  "/login",
  loginLimiter,
  [
    body("email").isEmail().withMessage("Email inválido."),
    body("password").exists().withMessage("Senha é obrigatória."),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        return res.status(400).json({ errors: errors.array() });

      const { email, password } = req.body;

      const user = users.find((u) => u.email === email);
      // Mensagem genérica para evitar enumeração de usuários
      if (!user)
        return res.status(401).json({ error: "Credenciais inválidas." });

      const match = await bcrypt.compare(password, user.passwordHash);
      if (!match)
        return res.status(401).json({ error: "Credenciais inválidas." });

      const token = generateToken(user);
      return res.status(200).json({ token });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * @route   GET /api/profile
 * @desc    Retorna dados do usuário autenticado
 * @access  Protegido por JWT
 */
router.get("/profile", authenticate, (req, res) => {
  const user = users.find((u) => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: "Usuário não encontrado." });

  // Nunca retornamos a senha ou hash
  const { id, email } = user;
  return res.status(200).json({ id, email });
});

export default router;