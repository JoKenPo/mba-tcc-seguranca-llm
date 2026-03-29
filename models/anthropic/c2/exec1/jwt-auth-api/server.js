const app = require('./src/app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log('╔════════════════════════════════════════╗');
  console.log(`║   🚀 Server running on port ${PORT}        ║`);
  console.log('║   📋 Available endpoints:              ║');
  console.log('║      POST /register                    ║');
  console.log('║      POST /login                       ║');
  console.log('║      GET  /profile                     ║');
  console.log('╚════════════════════════════════════════╝');
});