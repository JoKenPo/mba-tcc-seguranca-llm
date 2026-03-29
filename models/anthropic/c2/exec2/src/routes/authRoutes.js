/**
 * Auth Routes
 *
 * Mounts authentication endpoints under the prefix defined in app.js.
 *
 *   POST /register  – create a new account
 *   POST /login     – obtain a JWT
 */

const { Router } = require("express");
const { register, login } = require("../controllers/authController");
const { validateAuthBody } = require("../middleware/validateMiddleware");

const router = Router();

// POST /register
router.post("/register", validateAuthBody, register);

// POST /login
router.post("/login", validateAuthBody, login);

module.exports = router;