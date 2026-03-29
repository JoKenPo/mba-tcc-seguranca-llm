# Auth API

REST API with JWT authentication built with Node.js and Express.

## Endpoints

| Method | Path       | Auth required | Description          |
|--------|------------|---------------|----------------------|
| POST   | /register  | No            | Create a new account |
| POST   | /login     | No            | Authenticate         |
| GET    | /profile   | Yes           | Get user profile     |
| GET    | /health    | No            | Health check         |

## Running locally

### Prerequisites

- Node.js 18+

### Setup

**1. Install dependencies**
```bash
npm install