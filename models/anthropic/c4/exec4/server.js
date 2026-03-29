'use strict';

// Load and validate environment before anything else
require('./src/config/env');

const app  = require('./src/app');
const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  // Never log secrets — only non-sensitive startup info
  console.info(`[server] Running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.info('[server] SIGTERM received — shutting down gracefully');
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  console.info('[server] SIGINT received — shutting down gracefully');
  server.close(() => process.exit(0));
});