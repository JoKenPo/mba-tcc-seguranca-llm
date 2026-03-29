/**
 * Auth Controller
 *
 * Handles HTTP concerns for authentication endpoints:
 *   POST /register
 *   POST /login
 *
 * Business logic lives in the service layer; this controller is
 * responsible only for parsing requests and shaping responses.
 */

const userService = require("../services/userService");
const authService = require("../services/authService");

// ---------------------------------------------------------------------------
// POST /register
// ---------------------------------------------------------------------------

/**
 * Registers a new user.
 *
 * Request body:
 *   { "email": "user@example.com", "password": "secret123" }
 *
 * Responses:
 *   201 – User created successfully.
 *   409 – Email already registered.
 *   500 – Unexpected server error.
 */
async function register(req, res) {
  try {
    const { email, password } = req.body;

    const newUser = await userService.createUser(email, password);

    return res.status(201).json({
      success: true,
      message: "User registered successfully.",
      data: { user: newUser },
    });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: err.message || "An unexpected error occurred.",
    });
  }
}

// ---------------------------------------------------------------------------
// POST /login
// ---------------------------------------------------------------------------

/**
 * Authenticates a user and returns a JWT.
 *
 * Request body:
 *   { "email": "user@example.com", "password": "secret123" }
 *
 * Responses:
 *   200 – Login successful, token returned.
 *   401 – Invalid credentials.
 *   500 – Unexpected server error.
 */
async function login(req, res) {
  try {
    const { email, password } = req.body;

    const user = await userService.validateCredentials(email, password);
    const token = authService.generateToken(user);

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      data: {
        token,
        tokenType: "Bearer",
        expiresIn: "1h",
        user,
      },
    });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: err.message || "An unexpected error occurred.",
    });
  }
}

module.exports = { register, login };