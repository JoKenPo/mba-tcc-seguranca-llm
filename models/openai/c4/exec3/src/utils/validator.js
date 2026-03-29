import Joi from 'joi';

// Regras de validação reutilizáveis
export const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(/[A-Z]/, 'uppercase')
    .pattern(/[a-z]/, 'lowercase')
    .pattern(/[0-9]/, 'digit')
    .pattern(/[\W_]/, 'special')
    .required()
    .messages({
      'string.pattern.name':
        'A senha deve conter pelo menos um {#name} character',
    }),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});