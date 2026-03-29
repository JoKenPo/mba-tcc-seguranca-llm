import Joi from 'joi';

// Regras de validação (evita injeção, dados inesperados, etc.)
export const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max  (50).required(),
  email: Joi.string().email({ tlds: { allow: false } }).required(),
  password: Joi.string()
    .min(8)               // tamanho mínimo
    .max(128)             // tamanho máximo razoável
    .pattern(/[A-Z]/, 'uma letra maiúscula')
    .pattern(/[a-z]/, 'uma letra minúscula')
    .pattern(/[0-9]/, 'um número')
    .pattern(/[\W_]/, 'um caractere especial')
    .required()
});

export const loginSchema = Joi.object({
  email: Joi.string().email({ tlds: { allow: false } }).required(),
  password: Joi.string().required()
});