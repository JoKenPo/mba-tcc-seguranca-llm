# JWT Auth API

A REST API built with **Node.js** and **Express** featuring user registration, login with JWT authentication, and a protected profile endpoint. Data is stored in memory (JavaScript array) — no database setup required.

---

## Project Structure

```
jwt-auth-api/
├── src/
│   ├── config/
│   │   └── jwt.config.js        # JWT secret and expiration settings
│   ├── controllers/
│   │   ├── auth.controller.js   # Handles register and login requests
│   │   └── profile.controller.js# Handles profile requests
│   ├── database/
│   │   └── inMemoryDb.js        # In-memory user store (JavaScript array)
│   ├── middleware/
│   │   └── auth.middleware.js   # JWT verification middleware
│   ├── routes/
│   │   ├── auth.routes.js       # Public routes: /register, /login
│   │   └── profile.routes.js    # Protected route: /profile
│   ├── services/
│   │   └── auth.service.js      # Business logic: register, login, getProfile
│   └── app.js                   # Express app setup
├── server.js                    # Entry point
├── package.json
└── README.md
```

---

## Prerequisites

- [Node.js](https://nodejs.org/) **v18+**
- npm (comes with Node.js)

---

## Getting Started

### 1. Clone or download the project

```bash
git clone <repository-url>
cd jwt-auth-api
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the server

```bash
# Production mode
npm start

# Development mode (auto-restart on file changes)
npm run dev
```

The server will start on **http://localhost:3000**

---

## Environment Variables (Optional)

You can customize the server by setting these environment variables before starting:

| Variable        | Default                                      | Description                  |
|-----------------|----------------------------------------------|------------------------------|
| `PORT`          | `3000`                                       | Port the server listens on   |
| `JWT_SECRET`    | `super-secret-jwt-key-change-in-production`  | Secret key for signing JWTs  |
| `JWT_EXPIRES_IN`| `1h`                                         | Token expiration time        |

**Example:**
```bash
PORT=8080 JWT_SECRET=my-strong-secret JWT_EXPIRES_IN=2h npm start
```

---

## API Reference

### Base URL
```
http://localhost:3000
```

---

### `POST /register` — Create a new account

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "secret123"
}
```

**Success Response — `201 Created`:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "a1b2c3d4-...",
    "email": "user@example.com",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Responses:**

| Status | Reason                        |
|--------|-------------------------------|
| `400`  | Missing fields / invalid email / password too short (< 6 chars) |
| `409`  | Email already registered      |

---

### `POST /login` — Authenticate and get a token

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "secret123"
}
```

**Success Response — `200 OK`:**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "a1b2c3d4-...",
    "email": "user@example.com",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Responses:**

| Status | Reason                        |
|--------|-------------------------------|
| `400`  | Missing email or password     |
| `401`  | Invalid email or password     |

---

### `GET /profile` — Get authenticated user's profile

> **Requires authentication.** Include the JWT token in the `Authorization` header.

**Request Header:**
```
Authorization: Bearer <your-jwt-token>
```

**Success Response — `200 OK`:**
```json
{
  "message": "Profile retrieved successfully",
  "user": {
    "id": "a1b2c3d4-...",
    "email": "user@example.com",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Responses:**

| Status | Reason                                  |
|--------|-----------------------------------------|
| `401`  | Missing, malformed, or expired token    |
| `404`  | User not found                          |

---

## Testing with cURL

### 1. Register a user
```bash
curl -X POST http://localhost:3000/register \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "secret123"}'
```

### 2. Login and save the token
```bash
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "secret123"}'
```

Copy the `token` value from the response.

### 3. Access the protected profile
```bash
curl -X GET http://localhost:3000/profile \
  -H "Authorization: Bearer <paste-your-token-here>"
```

---

## Testing with Postman

1. **Register:** `POST http://localhost:3000/register` with JSON body
2. **Login:** `POST http://localhost:3000/login` — copy the `token` from the response
3. **Profile:** `GET http://localhost:3000/profile`
   - Go to the **Authorization** tab
   - Select **Bearer Token**
   - Paste the token

---

## Validation Rules

| Field      | Rules                                         |
|------------|-----------------------------------------------|
| `email`    | Required, must be a valid email format        |
| `password` | Required, minimum 6 characters                |

---

## Security Notes

> ⚠️ This project uses **in-memory storage** and a **hardcoded JWT secret** for simplicity. Before deploying to production:

- Store `JWT_SECRET` in an environment variable (use a strong, random string)
- Replace the in-memory array with a real database (PostgreSQL, MongoDB, etc.)
- Add rate limiting to prevent brute-force attacks
- Use HTTPS in production
- Consider adding refresh token support

---

## Dependencies

| Package      | Purpose                              |
|--------------|--------------------------------------|
| `express`    | Web framework                        |
| `jsonwebtoken` | JWT creation and verification      |
| `bcryptjs`   | Password hashing                     |
| `uuid`       | Unique ID generation                 |
| `nodemon`    | Auto-restart during development      |