/**
 * Server Entry Point
 *
 * Imports the configured Express app and starts listening on the
 * port defined in the environment configuration.
 */

const app    = require("./app");
const config = require("./config/env");

const PORT = config.port;

const server = app.listen(PORT, () => {
  console.log("=".repeat(50));
  console.log(`  JWT Auth API`);
  console.log("=".repeat(50));
  console.log(`  Status  : Running`);
  console.log(`  Port    : ${PORT}`);
  console.log(`  URL     : http://localhost:${PORT}`);
  console.log("-".repeat(50));
  console.log(`  POST    http://localhost:${PORT}/register`);
  console.log(`  POST    http://localhost:${PORT}/login`);
  console.log(`  GET     http://localhost:${PORT}/profile`);
  console.log("=".repeat(50));
});

// Graceful shutdown on SIGTERM / SIGINT (e.g. Ctrl+C or Docker stop)
function shutdown(signal) {
  console.log(`\n[Server] Received ${signal}. Shutting down gracefully…`);
  server.close(() => {
    console.log("[Server] HTTP server closed.");
    process.exit(0);
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT",  () => shutdown("SIGINT"));