// src/routes/auth.js
'use strict';

const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const rateLimit = require('express-rate-limit');

const { JWT_SECRET, JWT_EXPIRES_IN, BCRYPT_ROUNDS } = require('../config');
const { findUserByEmail, findUserById, createUser } = require('../store/users');
const { authenticate } = require('../middleware/auth');
const { registerRules, loginRules, validate } = require('../validators/auth');

const router = express.Router();

/**
 * Rate limiting para rotas sensíveis.
 *
 * Por que limitar /login e /register?
 * - /login: previne ataques de força bruta e credential stuffing.
 * - /register: previne criação massiva de contas (spam, abuso de recursos).
 *
 * Configuração conservadora: 10 tentativas a cada 15 minutos por IP.
 * Ajuste conforme o perfil de uso legítimo da sua aplicação.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10,
  // standardHeaders: true envia os headers RateLimit-* (RFC 6585) na resposta,
  // permitindo que clientes legítimos saibam quando podem tentar novamente.
  standardHeaders: true,
  // legacyHeaders: false remove os headers X-RateLimit-* deprecados.
  legacyHeaders: false,
  message: {
    message: 'Muitas tentativas. Tente novamente em 15 minutos.',
  },
  // skipSuccessfulRequests: true não conta requisições bem-sucedidas no limite.
  // Útil para /login: apenas falhas consomem a cota, não logins legítimos.
  skipSuccessfulRequests: true,
});

// ---------------------------------------------------------------------------
// POST /register
// ---------------------------------------------------------------------------

/**
 * Cadastra um novo usuário.
 *
 * Segurança:
 * - Senha é hasheada com bcrypt (custo 12) antes de armazenar.
 * - O hash nunca é retornado na resposta.
 * - E-mail duplicado retorna 409, mas sem revelar dados do usuário existente.
 */
router.post('/register', authLimiter, registerRules, validate, async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = findUserByEmail(email);
    if (existingUser) {
      // 409 Conflict indica que o recurso já existe.
      // Não retorne dados do usuário existente (ex: data de criação).
      return res.status(409).json({ message: 'E-mail já cadastrado.' });
    }

    /**
     * Por que bcrypt com custo 12?
     *
     * O custo (work factor) determina quantas iterações o algoritmo executa.
     * Cada incremento dobra o tempo de processamento.
     * Custo 12 leva ~250ms em hardware moderno — aceitável para UX,
     * mas caro o suficiente para tornar ataques de força bruta inviáveis.
     *
     * NUNCA armazene senhas em texto claro, MD5, SHA-1 ou SHA-256 simples.
     * Esses algoritmos são rápidos demais para hashing de senhas.
     */
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const newUser = createUser({
      id: uuidv4(),
      name,
      email,
      passwordHash,
    });

    // 201 Created com os dados do usuário (sem o hash).
    return res.status(201).json({
      message: 'Usuário criado com sucesso.',
      user: newUser,
    });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// POST /login
// ---------------------------------------------------------------------------

/**
 * Autentica um usuário e retorna um JWT.
 *
 * Segurança:
 * - Mensagem de erro genérica para e-mail ou senha inválidos.
 *   Diferenciar os dois casos permitiria enumeração de usuários cadastrados.
 * - bcrypt.compare é usado mesmo quando o usuário não existe (dummy hash)
 *   para garantir tempo de resposta constante e evitar timing attacks.
 * - O JWT é assinado com algoritmo explícito (HS256).
 */

// Hash fictício usado quando o usuário não existe.
// Garante que bcrypt.compare sempre execute, evitando timing attacks
// que revelariam se um e-mail está cadastrado ou não.
const DUMMY_HASH = '$2b$12$invalidhashusedtopreventimaginarytimingattacksXXXXXXXXXX';

router.post('/login', authLimiter, loginRules, validate, async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = findUserByEmail(email);

    /**
     * Por que sempre executar bcrypt.compare?
     *
     * Se retornássemos imediatamente quando o usuário não existe,
     * um atacante poderia medir o tempo de resposta:
     * - Resposta rápida → e-mail não cadastrado
     * - Resposta lenta  → e-mail cadastrado (bcrypt está rodando)
     *
     * Ao sempre executar o compare (com hash fictício quando necessário),
     * o tempo de resposta é similar nos dois casos.
     */
    const hashToCompare = user ? user.passwordHash : DUMMY_HASH;
    const passwordMatch = await bcrypt.compare(password, hashToCompare);

    if (!user || !passwordMatch) {
      // Mensagem genérica: não revele se foi o e-mail ou a senha que falhou.
      return res.status(401).json({ message: 'Credenciais inválidas.' });
    }

    /**
     * Estrutura do payload JWT:
     * - sub (subject): ID do usuário — campo padrão do RFC 7519 para identificar o sujeito.
     * - iat (issued at): adicionado automaticamente pelo jsonwebtoken.
     * - exp (expires at): adicionado automaticamente com base em JWT_EXPIRES_IN.
     *
     * Não inclua dados sensíveis no payload (senha, hash, dados financeiros).
     * O payload é codificado em Base64, não criptografado — qualquer um pode lê-lo.
     *
     * Por que algorithm: 'HS256' explícito?
     * Previne o ataque "alg: none" onde um token sem assinatura seria aceito.
     */
    const token = jwt.sign(
      { sub: user.id },
      JWT_SECRET,
      {
        algorithm: 'HS256',
        expiresIn: JWT_EXPIRES_IN,
      }
    );

    return res.status(200).json({
      message: 'Login realizado com sucesso.',
      token,
    });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// GET /profile
// ---------------------------------------------------------------------------

/**
 * Retorna os dados do usuário autenticado.
 * O middleware `authenticate` garante que apenas usuários com JWT válido acessem esta rota.
 */
router.get('/profile', authenticate, (req, res) => {
  // req.user é populado pelo middleware authenticate (sem o hash da senha).
  return res.status(200).json({ user: req.user });
});

module.exports = router;