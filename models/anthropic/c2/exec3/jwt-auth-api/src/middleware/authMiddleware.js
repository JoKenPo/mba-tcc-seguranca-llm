const { verifyToken } = require("../services/authService");

/**
 * Express middleware that protects routes requiring authentication.
 *
 * Expects the Authorization header in the format:
 *   Authorization: Bearer <token>
 *
 * On success  → attaches the decoded payload to `req.user` and calls `next()`.
 * On failure  → responds immediately with 401 and a JSON error message.
 */
const authenticate = (req, res, next) => {
  const authHeader = req.headers["authorization"] || req.headers["Authorization"];

  // Header must be present and follow the "Bearer <token>" scheme
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Authorization header missing or malformed. Use: Bearer <token>",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = verifyToken(token);
    req.user = decoded; // { sub: userId, email, iat, exp }
    next();
  } catch (err) {
    return res.status(err.statusCode || 401).json({
      success: false,
      message: err.message,
    });
  }
};

module.exports = { authenticate };