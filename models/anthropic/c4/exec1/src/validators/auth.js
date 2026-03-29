// src/validators/auth.js
'use strict';

const { body, validationResult } = require('express-validator');

/**
 * Regras de validação para o cadastro.
 *
 * Por que validar e sanitizar?
 * - Validação garante que apenas dados no formato esperado sejam processados.
 * - Sanitização (trim, escape, normalizeEmail) remove caracteres que poderiam
 *   ser usados em ataques de injeção ou causar comportamento inesperado.
 */
const registerRules = [
  body('name')
    .trim()
    .notEmpty().withMessage('Nome é obrigatório.')
    .isLength({ min: 2, max: 100 }).withMessage('Nome deve ter entre 2 e 100 caracteres.')
    // Permite apenas letras (incluindo acentuadas) e espaços simples.
    .matches(/^[\p{L}\s]+$/u).withMessage('Nome deve conter apenas letras e espaços.')
    // Escapa caracteres HTML para prevenir XSS caso o valor seja exibido em algum template.
    .escape(),

  body('email')
    .trim()
    .notEmpty().withMessage('E-mail é obrigatório.')
    .isEmail().withMessage('E-mail inválido.')
    // normalizeEmail converte para minúsculas e remove variações (ex: Gmail dots).
    // Isso garante consistência no armazenamento e evita cadastros duplicados disfarçados.
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Senha é obrigatória.')
    .isLength({ min: 8 }).withMessage('Senha deve ter no mínimo 8 caracteres.')
    // Exige complexidade mínima: maiúscula, minúscula, número e símbolo.
    // Senhas fracas são a principal causa de comprometimento de contas.
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+$/)
    .withMessage('Senha deve conter maiúscula, minúscula, número e símbolo.'),
];

/**
 * Regras de validação para o login.
 * Mais permissivas que o cadastro para não revelar o formato esperado.
 */
const loginRules = [
  body('email')
    .trim()
    .notEmpty().withMessage('E-mail é obrigatório.')
    .isEmail().withMessage('E-mail inválido.')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Senha é obrigatória.')
    // Limite máximo para prevenir ataques de DoS via bcrypt com senhas enormes.
    // bcrypt processa apenas os primeiros 72 bytes; senhas maiores são truncadas silenciosamente.
    .isLength({ max: 128 }).withMessage('Senha inválida.'),
];

/**
 * Middleware que verifica os resultados da validação.
 * Retorna 422 com os erros encontrados, sem processar a requisição.
 *
 * Por que 422 e não 400?
 * 400 (Bad Request) indica que o servidor não entendeu a requisição.
 * 422 (Unprocessable Entity) indica que a requisição foi entendida,
 * mas os dados não passaram na validação semântica — mais preciso aqui.
 */
function validate(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).json({
      message: 'Dados inválidos.',
      errors: errors.array().map((e) => ({
        field: e.path,
        message: e.msg,
      })),
    });
  }

  next();
}

module.exports = { registerRules, loginRules, validate };