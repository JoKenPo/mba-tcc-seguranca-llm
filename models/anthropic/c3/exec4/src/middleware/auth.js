import jwt from "jsonwebtoken";
import { config } from "../config/env.js";
import { findUserById } from "../services/userService.js";

/**
 * Extracts the Bearer token from the Authorization header.
 * Returns null if the header is missing or malformed.
 */
function extractBearerToken(authHeader) {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.slice(7); // Remove "Bearer " prefix
}

/**
 * Authentication middleware.
 * Validates the JWT and attaches the user to req.user.
 * Rejects requests with missing, expired, or invalid tokens.
 */
export async function authenticate(req, res, next) {
  const token = extractBearerToken(req.headers.authorization);

  if (!token) {
    return res.status(401).json({
      error: "Authentication required",
      message: "Provide a valid Bearer token in the Authorization header",
    });
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret, {
      algorithms: ["HS256"], // Explicitly whitelist algorithm to prevent alg:none attacks
    });

    // Verify the user still exists in the store
    const user = findUserById(decoded.sub);
    if (!user) {
      return res.status(401).json({
        error: "User not found",
        message: "The token references a user that no longer exists",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        error: "Token expired",
        message: "Your session has expired, please log in again",
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        error: "Invalid token",
        message: "The provided token is invalid",
      });
    }

    // Unexpected error — don't leak details
    console.error("JWT verification error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}