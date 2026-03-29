/**
 * Authentication Middleware
 *
 * Protects routes by verifying the Bearer JWT sent in the
 * Authorization header.  On success it attaches the decoded
 * payload to `req.user` so downstream handlers can use it.
 */

const { verifyToken } = require("../services/authService");

/**
 * Express middleware that validates a Bearer JWT.
 *
 * Expected header format:
 *   Authorization: Bearer <token>
 */
function authenticate(req, res, next) {
  const authHeader = req.headers["authorization"] || req.headers["Authorization"];

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: "Authorization header is missing.",
    });
  }

  // Header must follow the "Bearer <token>" scheme
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") {
    return res.status(401).json({
      success: false,
      message: 'Authorization header must use the "Bearer <token>" scheme.',
    });
  }

  const token = parts[1];

  try {
    const decoded = verifyToken(token);
    req.user = decoded; // { sub, email, iat, exp }
    next();
  } catch (err) {
    const isExpired = err.name === "TokenExpiredError";
    return res.status(401).json({
      success: false,
      message: isExpired ? "Token has expired." : "Invalid token.",
    });
  }
}

module.exports = { authenticate };