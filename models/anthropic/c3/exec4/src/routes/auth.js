import { Router } from "express";
import jwt from "jsonwebtoken";
import validator from "validator";
import { config } from "../config/env.js";
import { createUser, verifyCredentials } from "../services/userService.js";
import { authRateLimiter } from "../middleware/security.js";

const router = Router();

/**
 * Validates registration input fields.
 * Returns an array of error messages (empty if valid).
 */
function validateRegisterInput({ name, email, password }) {
  const errors = [];

  if (!name || typeof name !== "string" || name.trim().length < 2) {
    errors.push("Name must be at least 2 characters long");
  }

  if (name && name.trim().length > 100) {
    errors.push("Name must be at most 100 characters long");
  }

  if (!email || !validator.isEmail(email)) {
    errors.push("A valid email address is required");
  }

  if (!password || password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }

  if (password && password.length > 128) {
    errors.push("Password must be at most 128 characters long");
  }

  // Require at least one letter and one number
  if (password && !/(?=.*[a-zA-Z])(?=.*\d)/.test(password)) {
    errors.push("Password must contain at least one letter and one number");
  }

  return errors;
}

/**
 * Generates a signed JWT for the given user.
 * Uses sub (subject) claim as the user ID per JWT spec.
 */
function generateToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      name: user.name,
    },
    config.jwt.secret,
    {
      expiresIn: config.jwt.expiresIn,
      algorithm: "HS256",
    }
  );
}

/**
 * POST /register
 * Creates a new user account.
 */
router.post("/register", authRateLimiter, async (req, res) => {
  const { name, email, password } = req.body;

  const errors = validateRegisterInput({ name, email, password });
  if (errors.length > 0) {
    return res.status(400).json({ error: "Validation failed", details: errors });
  }

  try {
    const user = await createUser({ name, email, password });
    const token = generateToken(user);

    return res.status(201).json({
      message: "Account created successfully",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
      token,
      expiresIn: config.jwt.expiresIn,
    });
  } catch (error) {
    if (error.code === "EMAIL_TAKEN") {
      // 409 Conflict — resource already exists
      return res.status(409).json({ error: "Email already registered" });
    }

    console.error("Register error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /login
 * Authenticates a user and returns a JWT.
 */
router.post("/login", authRateLimiter, async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const user = await verifyCredentials(email, password);

    if (!user) {
      // Use a generic message to prevent user enumeration
      return res.status(401).json({
        error: "Invalid credentials",
        message: "Email or password is incorrect",
      });
    }

    const token = generateToken(user);

    return res.status(200).json({
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      token,
      expiresIn: config.jwt.expiresIn,
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;