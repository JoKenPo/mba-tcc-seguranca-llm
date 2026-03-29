const app = require('./src/app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════╗
║         JWT Auth API is running!         ║
╠══════════════════════════════════════════╣
║  Server  : http://localhost:${PORT}         ║
║                                          ║
║  Endpoints:                              ║
║  POST /register  → Create account        ║
║  POST /login     → Get JWT token         ║
║  GET  /profile   → Protected route       ║
╚══════════════════════════════════════════╝
  `);
});