import jwt from "jsonwebtoken";
import { config } from "../config/env.js";
import { findUserById } from "../services/userService.js";

/**
 * Authentication middleware.
 * Validates the Bearer token from the Authorization header,
 * looks up the user, and attaches them to req.user.
 * Returns 401 if the token is missing, invalid, or expired.
 */
export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "Access denied. No token provided.",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    const user = findUserById(decoded.sub);

    if (!user) {
      return res.status(401).json({ error: "User not found." });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired." });
    }

    return res.status(401).json({ error: "Invalid token." });
  }
}