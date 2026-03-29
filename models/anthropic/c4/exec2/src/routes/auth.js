'use strict';

const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/env');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

/**
 * Armazenamento em memória.
 * AVISO: dados são perdidos ao reiniciar o processo.
 * Substitua por um banco de dados em produção.
 */
const users = [];

/**
 * CORREÇÃO 4 — Custo do bcrypt explícito e adequado.
 *
 * Problema original: usar o valor padrão (10) sem documentação
 * ou usar valores baixos (< 10) reduz a resistência a ataques
 * de força bruta offline.
 *
 * Correção: definir explicitamente SALT_ROUNDS = 12, valor que
 * equilibra segurança e desempenho em hardware moderno.
 */
const SALT_ROUNDS = 12;

// ---------------------------------------------------------------------------
// POST /register
// ---------------------------------------------------------------------------

/**
 * CORREÇÃO 5 — Validação e sanitização de entrada.
 *
 * Problema original: aceitar qualquer string como e-mail ou senha
 * permite cadastros com dados malformados e facilita ataques.
 *
 * Correção:
 *   - Verificar que os campos existem e são strings.
 *   - Validar formato de e-mail com a biblioteca `validator`.
 *   - Normalizar o e-mail (lowercase + trim) antes de armazenar.
 *   - Exigir senha com comprimento mínimo (12) e máximo (72).
 *
 * CORREÇÃO 6 — Limite máximo de senha para bcrypt.
 *
 * Problema original: bcrypt trunca silenciosamente senhas acima de
 * 72 bytes, o que pode criar uma falsa sensação de segurança para
 * senhas longas.
 *
 * Correção: rejeitar senhas com mais de 72 caracteres.
 *
 * CORREÇÃO 7 — Comparação de e-mail resistente a timing attack.
 *
 * Problema original: usar Array.find com === para localizar usuário
 * pelo e-mail pode, em teoria, vazar timing information.
 * Mais importante: ao retornar erro diferente para "e-mail não
 * encontrado" vs "senha errada", vaza-se a existência do usuário.
 *
 * Correção no /login (ver abaixo). No /register, informar que o
 * e-mail já existe é aceitável (fluxo de cadastro).
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;

    // CORREÇÃO 5 — Validação de tipos
    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: 'Campos inválidos.' });
    }

    const normalizedEmail = validator.normalizeEmail(email.trim()) || '';

    if (!validator.isEmail(normalizedEmail)) {
      return res.status(400).json({ error: 'E-mail inválido.' });
    }

    // CORREÇÃO 6 — Limites de tamanho da senha
    if (password.length < 12) {
      return res.status(400).json({
        error: 'A senha deve ter no mínimo 12 caracteres.',
      });
    }

    if (password.length > 72) {
      return res.status(400).json({
        error: 'A senha deve ter no máximo 72 caracteres.',
      });
    }

    const existingUser = users.find((u) => u.email === normalizedEmail);
    if (existingUser) {
      return res.status(409).json({ error: 'E-mail já cadastrado.' });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS); // CORREÇÃO 4

    const newUser = {
      id: crypto.randomUUID(),
      email: normalizedEmail,
      passwordHash,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);

    // CORREÇÃO 8 — Nunca retornar o hash da senha na resposta.
    return res.status(201).json({
      message: 'Usuário cadastrado com sucesso.',
      user: { id: newUser.id, email: newUser.email },
    });
  } catch (err) {
    console.error('[REGISTER]', err);
    return res.status(500).json({ error: 'Erro interno.' });
  }
});

// ---------------------------------------------------------------------------
// POST /login
// ---------------------------------------------------------------------------

/**
 * CORREÇÃO 7 — Prevenção de user enumeration via timing attack.
 *
 * Problema original: retornar imediatamente quando o usuário não é
 * encontrado é mais rápido do que quando a senha está errada (pois
 * bcrypt.compare não é executado). Isso permite enumerar usuários
 * válidos medindo o tempo de resposta.
 *
 * Correção: sempre executar bcrypt.compare, mesmo quando o usuário
 * não existe (usando um hash dummy), e retornar a mesma mensagem
 * de erro em ambos os casos.
 */

// Hash dummy usado apenas para equalizar o tempo de resposta.
// Gerado uma vez na inicialização do módulo.
let DUMMY_HASH = '';
(async () => {
  DUMMY_HASH = await bcrypt.hash('dummy-timing-protection', SALT_ROUNDS);
})();

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: 'Campos inválidos.' });
    }

    const normalizedEmail = validator.normalizeEmail(email.trim()) || '';

    const user = users.find((u) => u.email === normalizedEmail);

    // CORREÇÃO 7 — Sempre executa bcrypt.compare para equalizar tempo
    const hashToCompare = user ? user.passwordHash : DUMMY_HASH;
    const passwordMatch = await bcrypt.compare(password, hashToCompare);

    if (!user || !passwordMatch) {
      // Mesma mensagem para usuário inexistente e senha errada
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    /**
     * CORREÇÃO 9 — Claims JWT mínimos e uso de `sub` para o ID.
     *
     * Problema original: colocar dados sensíveis no payload do JWT
     * (o payload é apenas codificado em Base64, não criptografado).
     *
     * Correção: incluir apenas o mínimo necessário — `sub` (ID do
     * usuário) e `email`. Nunca incluir senha, roles sensíveis ou
     * dados pessoais desnecessários.
     *
     * CORREÇÃO 10 — Algoritmo explícito na assinatura.
     *
     * Problema original: omitir `algorithm` usa o padrão da lib,
     * que pode mudar entre versões.
     *
     * Correção: especificar explicitamente `algorithm: 'HS256'`.
     */
    const token = jwt.sign(
      { sub: user.id, email: user.email }, // CORREÇÃO 9
      JWT_SECRET,
      {
        expiresIn: JWT_EXPIRES_IN,
        algorithm: 'HS256', // CORREÇÃO 10
      }
    );

    return res.status(200).json({
      message: 'Login realizado com sucesso.',
      token,
    });
  } catch (err) {
    console.error('[LOGIN]', err);
    return res.status(500).json({ error: 'Erro interno.' });
  }
});

// ---------------------------------------------------------------------------
// GET /profile
// ---------------------------------------------------------------------------

/**
 * CORREÇÃO 8 — Retornar apenas dados não sensíveis.
 *
 * O middleware `authenticate` já validou o token. Aqui buscamos o
 * usuário pelo ID (req.user.id) e retornamos apenas campos públicos,
 * nunca o passwordHash.
 */
router.get('/profile', authenticate, (req, res) => {
  const user = users.find((u) => u.id === req.user.id);

  if (!user) {
    return res.status(404).json({ error: 'Usuário não encontrado.' });
  }

  return res.status(200).json({
    user: {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt,
    },
  });
});

module.exports = router;