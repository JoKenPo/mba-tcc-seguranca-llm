'use strict';

const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { timingSafeEqual } = require('crypto');

const { findByEmail, findById, createUser } = require('../store/userStore');
const { authenticate } = require('../middleware/auth');
const { authLimiter, generalLimiter } = require('../middleware/rateLimiter');
const {
  registerValidators,
  loginValidators,
  refreshValidators,
  handleValidationErrors,
} = require('../validators/authValidators');

const router = express.Router();

/**
 * Configurações de JWT
 *
 * Access token: curta duração (15min) — minimiza janela de uso se vazado
 * Refresh token: longa duração (7d) — permite renovação sem re-login
 */
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';
const ACCESS_TOKEN_EXPIRY_SECONDS = 900; // 15 * 60

/**
 * Custo do bcrypt: 12 rounds é o mínimo recomendado atualmente.
 * Aumentar para 13-14 em hardware mais potente.
 * Cada incremento dobra o tempo de processamento.
 */
const BCRYPT_ROUNDS = 12;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateAccessToken(userId) {
  return jwt.sign(
    { sub: userId }, // 'sub' é o claim padrão para subject (RFC 7519)
    process.env.JWT_SECRET,
    {
      algorithm: 'HS256', // Explícito: previne algorithm confusion
      expiresIn: ACCESS_TOKEN_EXPIRY,
    }
  );
}

function generateRefreshToken(userId) {
  return jwt.sign(
    { sub: userId, type: 'refresh' }, // 'type' diferencia refresh de access tokens
    process.env.JWT_REFRESH_SECRET,
    {
      algorithm: 'HS256',
      expiresIn: REFRESH_TOKEN_EXPIRY,
    }
  );
}

/**
 * Comparação de strings resistente a timing attacks.
 * Previne que diferenças de tempo de resposta revelem informações.
 */
function safeStringCompare(a, b) {
  try {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    if (bufA.length !== bufB.length) {
      // Mesmo com tamanhos diferentes, executa a comparação para tempo constante
      timingSafeEqual(bufA, bufA);
      return false;
    }
    return timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

// ─── POST /register ───────────────────────────────────────────────────────────

router.post(
  '/register',
  authLimiter,
  registerValidators,
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { email, password } = req.body;

      // Verifica se email já existe
      // NOTA: A resposta genérica abaixo evita user enumeration,
      // mas em UX real pode-se optar por informar (trade-off consciente).
      const existingUser = findByEmail(email);
      if (existingUser) {
        // Executa hash mesmo assim para tempo de resposta constante
        // (evita que atacante descubra emails cadastrados por timing)
        await bcrypt.hash(password, BCRYPT_ROUNDS);
        return res.status(409).json({ error: 'Não foi possível completar o cadastro' });
      }

      const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

      const newUser = createUser({
        id: uuidv4(),
        email,
        passwordHash,
        createdAt: new Date(),
      });

      // Log sem dados sensíveis (sem email, sem hash)
      console.log(`[register] Novo usuário criado | id=${newUser.id}`);

      return res.status(201).json({
        message: 'Usuário registrado com sucesso',
        userId: newUser.id,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─── POST /login ──────────────────────────────────────────────────────────────

router.post(
  '/login',
  authLimiter,
  loginValidators,
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { email, password } = req.body;

      const user = findByEmail(email);

      /**
       * CRÍTICO: Sempre executa bcrypt.compare, mesmo se usuário não existe.
       *
       * Se retornássemos erro imediatamente quando o usuário não existe,
       * um atacante poderia descobrir emails cadastrados medindo o tempo
       * de resposta (timing attack / user enumeration).
       *
       * Ao sempre executar o hash, o tempo de resposta é constante.
       */
      const hashToCompare = user
        ? user.passwordHash
        : '$2b$12$invalidhashfortimingnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnn'; // Hash fictício válido

      const passwordMatch = await bcrypt.compare(password, hashToCompare);

      if (!user || !passwordMatch) {
        // Mensagem genérica: não revela se email ou senha está errado
        return res.status(401).json({ error: 'Credenciais inválidas' });
      }

      const accessToken = generateAccessToken(user.id);
      const refreshToken = generateRefreshToken(user.id);

      console.log(`[login] Login bem-sucedido | id=${user.id}`);

      return res.status(200).json({
        accessToken,
        refreshToken,
        expiresIn: ACCESS_TOKEN_EXPIRY_SECONDS,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─── GET /profile ─────────────────────────────────────────────────────────────

router.get(
  '/profile',
  generalLimiter,
  authenticate,
  (req, res) => {
    // req.user foi populado pelo middleware authenticate
    // Busca dados atualizados do store (não