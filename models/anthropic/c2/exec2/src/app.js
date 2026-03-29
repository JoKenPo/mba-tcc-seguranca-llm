/**
 * Express Application
 *
 * Configures middleware, mounts routes, and sets up global error handling.
 * Kept separate from server.js so the app can be imported in tests without
 * actually binding to a port.
 */

const express = require("express");

const authRoutes    = require("./routes/authRoutes");
const profileRoutes = require("./routes/profileRoutes");

const app = express();

// ---------------------------------------------------------------------------
// Global Middleware
// ---------------------------------------------------------------------------

// Parse incoming JSON bodies
app.use(express.json());

// Parse URL-encoded bodies (form submissions)
app.use(express.urlencoded({ extended: true }));

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

// Health-check / root
app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "JWT Auth API is running 🚀",
    version: "1.0.0",
    endpoints: {
      register: "POST /register",
      login:    "POST /login",
      profile:  "GET  /profile  (requires Bearer token)",
    },
  });
});

// Auth endpoints  →  POST /register, POST /login
app.use("/", authRoutes);

// Protected endpoints  →  GET /profile
app.use("/", profileRoutes);

// ---------------------------------------------------------------------------
// 404 Handler  (must come after all routes)
// ---------------------------------------------------------------------------
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found.",
  });
});

// ---------------------------------------------------------------------------
// Global Error Handler  (must have 4 parameters)
// ---------------------------------------------------------------------------
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error("[Unhandled Error]", err);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal server error.",
  });
});

module.exports = app;