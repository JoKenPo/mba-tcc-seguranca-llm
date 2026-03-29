import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import validator from "validator";
import { config } from "../config/env.js";
import { findUserByEmail, createUser } from "../services/userService.js";
import { authRateLimiter } from "../middleware/security.js";

const router = Router();

// Apply strict rate limiting to all auth routes
router.use(authRateLimiter);

/**
 * POST /register
 * Registers a new user with name, email, and password.
 * Validates input, hashes the password, and stores the user.
 */
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // --- Input validation ---
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email and password are required." });
    }

    if (typeof name !== "string" || name.trim().length < 2) {
      return res.status(400).json({ error: "Name must be at least 2 characters." });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({ error: "Invalid email format." });
    }

    // Password policy: min 8 chars, at least one uppercase, one number, one symbol
    if (
      !validator.isStrongPassword(password, {
        minLength: 8,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1,
      })
    ) {
      return res.status(400).json({
        error:
          "Password must be at least 8 characters and include uppercase, lowercase, number, and symbol.",
      });
    }

    // --- Check for duplicate email ---
    if (findUserByEmail(email)) {
      // Use a generic message to avoid user enumeration
      return res.status(409).json({ error: "Registration failed. Please try again." });
    }

    // --- Hash password and persist user ---
    const hashedPassword = await bcrypt.hash(password, config.bcrypt.saltRounds);
    const user = createUser({ name, email, hashedPassword });

    return res.status(201).json({
      message: "User registered successfully.",
      user,
    });
  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
});

/**
 * POST /login
 * Authenticates a user with email and password.
 * Returns a signed JWT on success.
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // --- Input validation ---
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({ error: "Invalid email format." });
    }

    // --- Lookup user ---
    const user = findUserByEmail(email);

    // Use bcrypt.compare even if user is not found to prevent timing attacks
    const dummyHash = "$2a$12$invalidhashfortimingattackprevention000000000000000000";
    const passwordMatch = await bcrypt.compare(
      password,
      user ? user.password : dummyHash
    );

    if (!user || !passwordMatch) {
      // Generic message to avoid user enumeration
      return res.status(401).json({ error: "Invalid credentials." });
    }

    // --- Sign JWT ---
    const token = jwt.sign(
      { sub: user.id, email: user.email },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn, algorithm: "HS256" }
    );

    return res.status(200).json({
      message: "Login successful.",
      token,
      expiresIn: config.jwt.expiresIn,
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
});

export default router;