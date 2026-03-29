import jwt from "jsonwebtoken";
import { config } from "../config/env.js";
import { userService } from "../services/userService.js";

/**
 * Generates a signed JWT for a given user.
 * @param {object} user - Safe user object
 * @returns {string} - Signed JWT
 */
export const generateToken = (user) => {
  return jwt.sign(
    {
      sub: user.id, // 'sub' (subject) is the standard JWT claim for user ID
      email: user.email,
    },
    config.jwt.secret,
    {
      expiresIn: config.jwt.expiresIn,
      algorithm: "HS256",
    }
  );
};

/**
 * Middleware that protects routes by validating the Bearer JWT token.
 * Attaches the authenticated user to req.user on success.
 */
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Missing or malformed Authorization header",
      });
    }

    const token = authHeader.split(" ")[1];

    // Throws if token is invalid or expired
    const payload = jwt.verify(token, config.jwt.secret, {
      algorithms: ["HS256"],
    });

    // Confirm user still exists in the store
    const user = userService.findById(payload.sub);
    if (!user) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "User no longer exists",
      });
    }

    // Attach safe user data to the request
    req.user = userService.toSafeUser(user);
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Token has expired",
      });
    }

    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Invalid token",
      });
    }

    next(err);
  }
};