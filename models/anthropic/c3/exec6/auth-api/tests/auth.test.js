'use strict';

process.env.JWT_SECRET = 'test-secret-key-that-is-long-enough-32chars';
process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../src/app');
const userStore = require('../src/store/userStore');

// ─── Test Data ────────────────────────────────────────────────────────────────

const validUser = {
  name: 'Jane Doe',
  email: 'jane@example.com',
  password: 'SecurePass1!',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function registerUser(overrides = {}) {
  return request(app)
    .post('/register')
    .send({ ...validUser, ...overrides });
}

async function loginUser(email = validUser.email, password = validUser.password) {
  return request(app).post('/login').send({ email, password });
}

// ─── Setup / Teardown ─────────────────────────────────────────────────────────

beforeEach(() => {
  userStore._clear();
});

// ─── POST /register ───────────────────────────────────────────────────────────

describe('POST /register', () => {
  it('should register a new user and return 201 with token', async () => {
    const res = await registerUser();

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('token');
    expect(res.body.data.user).toMatchObject({
      name: validUser.name,
      email: validUser.email,
    });
  });

  it('should not expose the password hash in the response', async () => {
    const res = await registerUser();

    expect(res.body.data.user).not.toHaveProperty('passwordHash');
    expect(res.body.data.user).not.toHaveProperty('password');
  });

  it('should return 409 when email is already registered', async () => {
    await registerUser();
    const res = await registerUser();

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('should return 400 for missing name', async () => {
    const res = await registerUser({ name: '' });

    expect(res.status).toBe(400);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([expect.stringContaining('Name')])
    );
  });

  it('should return 400 for invalid email', async () => {
    const res = await registerUser({ email: 'not-an-email' });

    expect(res.status).toBe(400);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([expect.stringContaining('email')])
    );
  });

  it('should return 400 for weak password (too short)', async () => {
    const res = await registerUser({ password: 'short' });

    expect(res.status).toBe(400);
    expect(res.body.errors.length).toBeGreaterThan(0);
  });

  it('should return 400 for password without uppercase', async () => {
    const res = await registerUser({ password: 'nouppercase1!' });

    expect(res.status).toBe(400);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([expect.stringContaining('uppercase')])
    );
  });

  it('should return 400 for password without special character', async () => {
    const res = await registerUser({ password: 'NoSpecial123' });

    expect(res.status).toBe(400);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([expect.stringContaining('special character')])
    );
  });

  it('should normalise email to lowercase', async () => {
    const res = await registerUser({ email: 'JANE@EXAMPLE.COM' });

    expect(res.status).toBe(201);
    expect(res.body.data.user.email).toBe('jane@example.com');
  });
});

// ─── POST /login ──────────────────────────────────────────────────────────────

describe('POST /login', () => {
  beforeEach(async () => {
    await registerUser();
  });

  it('should return 200 and a token for valid credentials', async () => {
    const res = await loginUser();

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('token');
  });

  it('should return 401 for wrong password', async () => {
    const res = await loginUser(validUser.email, 'WrongPass1!');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should return 401 for non-existent email', async () => {
    const res = await loginUser('ghost@example.com', validUser.password);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should return 400 for missing credentials', async () => {
    const res = await request(app).post('/login').send({});

    expect(res.status).toBe(400);
  });

  it('should not expose the password hash in the response', async () => {
    const res = await loginUser();

    expect(res.body.data.user).not.toHaveProperty('passwordHash');
  });
});

// ─── GET /profile ─────────────────────────────────────────────────────────────

describe('GET /profile', () => {
  let token;

  beforeEach(async () => {
    await registerUser();
    const loginRes = await loginUser();
    token = loginRes.body.data.token;
  });

  it('should return 200 and user profile with valid token', async () => {
    const res = await request(app)
      .get('/profile')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user).to