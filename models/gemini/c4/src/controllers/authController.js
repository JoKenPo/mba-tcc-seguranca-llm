const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { z } = require("zod");
const config = require("../config/env");
const User = require("../models/userModel");

const registerSchema = z.object({
  email: z.string().email(),
  password: z
    .string()
    .min(12, "Password must be at least 12 characters long")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(
      /[^A-Za-z0-9]/,
      "Password must contain at least one special character",
    ),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

exports.register = async (req, res) => {
  try {
    // 1. Validate Input
    const result = registerSchema.safeParse(req.body);
    if (!result.success) {
      return res
        .status(400)
        .json({ error: "Validation failed", details: result.error.errors });
    }
    const { email, password } = result.data;

    // 2. Check if user exists
    if (User.findByEmail(email)) {
      return res.status(409).json({ error: "User already registered" });
    }

    // 3. Hash Password (work factor 12)
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 4. Save User
    const newUser = {
      id: Date.now().toString(),
      email,
      password: hashedPassword,
    };
    User.create(newUser);

    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.login = async (req, res) => {
  try {
    // 1. Validate Input
    const result = loginSchema.safeParse(req.body);
    if (!result.success) {
      // Return generic error to avoid enumeration
      return res.status(401).json({ error: "Invalid email or password" });
    }
    const { email, password } = result.data;

    // 2. Find User
    const user = User.findByEmail(email);
    if (!user) {
      // Fake hash comparison to prevent timing attacks (variable response time)
      await bcrypt.compare(
        password,
        "$2b$12$......................................................",
      );
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // 3. Verify Password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // 4. Generate Token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      config.JWT_SECRET,
      { expiresIn: "1h", algorithm: "HS256" }, // Explicit algorithm
    );

    res.json({ token });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getProfile = (req, res) => {
  // req.user is populated by middleware
  res.json({
    message: "This is a protected route",
    user: {
      userId: req.user.userId,
      email: req.user.email,
    },
  });
};
