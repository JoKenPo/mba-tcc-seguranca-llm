'use strict';

const { body, validationResult } = require('express-validator');

/**
 * Política de senha:
 * - Mínimo 12 caracteres
 * - Pelo menos 1 maiúscula, 1 minúscula, 1 número, 1 especial
 *
 * Justificativa: NIST SP 800-63B recomenda comprimento sobre complexidade,
 * mas complexidade mínima ainda é útil para evitar senhas triviais.
 */
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{12,}$/;

const registerValidators = [
  body('email')
    .isEmail()
    .withMessage('Email inválido')
    .normalizeEmail() // Sanitiza: lowercase, remove pontos em gmail, etc.
    .isLength({ max: 254 }) // RFC 5321: limite de email
    .withMessage('Email muito longo'),

  body('password')
    .isString()
    .withMessage('Senha deve ser uma string')
    .isLength({ min: 12, max: 128 })
    .withMessage('Senha deve ter entre 12 e 128 caracteres')
    .matches(PASSWORD_REGEX)
    .withMessage(
      'Senha deve conter pelo menos: 1 maiúscula, 1 minúscula, 1 número e 1 caractere especial'
    ),
];

const loginValidators = [
  body('email')
    .isEmail()
    .withMessage('Email inválido')
    .normalizeEmail(),

  body('password')
    .isString()
    .withMessage('Senha inválida')
    .isLength({ min: 1, max: 128 })
    .withMessage('Senha inválida'),
];

const refreshValidators = [
  body('refreshToken')
    .isString()
    .withMessage('Refresh token inválido')
    .isLength({ min: 1, max: 512 })
    .withMessage('Refresh token inválido'),
];

/**
 * Middleware que verifica erros de validação e retorna 422 se houver.
 * Retorna mensagens genéricas para não vazar lógica interna.
 */
function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      error: 'Dados inválidos',
      // Retorna apenas o primeiro erro por campo para não dar informação excessiva
      details: errors.array({ onlyFirstError: true }).map((e) => ({
        field: e.path,
        message: e.msg,
      })),
    });
  }
  next();
}

module.exports = {
  registerValidators,
  loginValidators,
  refreshValidators,
  handleValidationErrors,
};