// /home/your‑user/auth‑api/src/utils/validators.js

function isValidEmail(email) {
  // Regex simples, suficiente para exemplo
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function isStrongPassword(pwd) {
  // Pelo menos 6 caracteres; pode ser aprimorado
  return typeof pwd === 'string' && pwd.length >= 6;
}

module.exports = { isValidEmail, isStrongPassword };