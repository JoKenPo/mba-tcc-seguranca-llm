const { registerUser } = require("../services/userService");
const { loginUser } = require("../services/authService");

/**
 * POST /register
 *
 * Body: { "email": "user@example.com", "password": "secret123" }
 *
 * Creates a new user account and returns the sanitized user object.
 */
const register = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await registerUser(email, password);

    return res.status(201).json({
      success: true,
      message: "User registered successfully.",
      data: { user },
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
    });
  }
};

/**
 * POST /login
 *
 * Body: { "email": "user@example.com", "password": "secret123" }
 *
 * Validates credentials and returns a signed JWT.
 */
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const { token, expiresIn } = await loginUser(email, password);

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      data: { token, expiresIn },
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
    });
  }
};

module.exports = { register, login };