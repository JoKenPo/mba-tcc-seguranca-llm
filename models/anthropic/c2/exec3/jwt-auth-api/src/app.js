const express = require("express");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

// ── Global Middleware ──────────────────────────────────────────────────────────

// Parse incoming JSON request bodies
app.use(express.json());

// Parse URL-encoded bodies (form submissions)
app.use(express.urlencoded({ extended: true }));

// Basic request logger for development visibility
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ── Routes ─────────────────────────────────────────────────────────────────────
app.use("/", authRoutes); // POST /register  |  POST /login
app.use("/", userRoutes); // GET  /profile

// ── Health Check ───────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "API is running.",
    timestamp: new Date().toISOString(),
  });
});

// ── 404 Handler ────────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found.",
  });
});

// ── Global Error Handler ───────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error("[Unhandled Error]", err);
  res.status(500).json({
    success: false,
    message: "Internal server error.",
  });
});

// ── Start Server ───────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 JWT Auth API running on http://localhost:${PORT}`);
  console.log(`   Environment : ${process.env.NODE_ENV || "development"}`);
  console.log(`   Press Ctrl+C to stop.\n`);
});

module.exports = app; // exported for potential testing use