import { body } from 'express-validator';

/**
 * Validação para registro:
 * - email válido
 * - senha com pelo menos 8 caracteres, contendo letras e números
 */
export const validateRegister = [
  body('email')
    .isEmail()
    .withMessage('Formato de email inválido')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Senha deve ter no mínimo 8 caracteres')
    .matches(/[a-z]/i)
    .withMessage('Senha deve conter ao menos uma letra')
    .matches(/[0-9]/)
    .withMessage('Senha deve conter ao menos um número')
    .trim(),
];

/**
 * Validação para login:
 * - email válido
 * - senha não vazia
 */
export const validateLogin = [
  body('email')
    .isEmail()
    .withMessage('Formato de email inválido')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Senha é obrigatória')
    .trim(),
];