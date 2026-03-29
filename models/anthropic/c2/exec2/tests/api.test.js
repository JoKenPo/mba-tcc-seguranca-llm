/**
 * Integration Tests
 *
 * Lightweight test suite that exercises all three endpoints without any
 * external test framework — just Node's built-in `http` module.
 *
 * Run with:  npm test
 */

const http = require("http");
const app  = require("../src/app");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let server;
let BASE_URL;

/** Sends a JSON request and resolves with { status, body }. */
function request(method, path, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;

    const options = {
      hostname: "127.0.0.1",
      port: server.address().port,
      path,
      method,
      headers: {
        "Content-Type": "application/json",
        ...(payload ? { "Content-Length": Buffer.byteLength(payload) } : {}),
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      let raw = "";
      res.on("data", (chunk) => (raw += chunk));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(raw) });
        } catch {
          resolve({ status: res.statusCode, body: raw });
        }
      });
    });

    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

// ---------------------------------------------------------------------------
// Tiny assertion helpers
// ---------------------------------------------------------------------------

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) {
    console.log(`  ✅  ${label}`);
    passed++;
  } else {
    console.error(`  ❌  ${label}`);
    failed++;
  }
}

// ---------------------------------------------------------------------------
// Test suites
// ---------------------------------------------------------------------------

async function testHealthCheck() {
  console.log("\n📋  Health Check");
  const { status, body } = await request("GET", "/");
  assert(status === 200,         "GET /  →  200 OK");
  assert(body.success === true,  "Response has success: true");
}

async function testRegister() {
  console.log("\n📋  POST /register");

  // 1. Missing fields
  let res = await request("POST", "/register", {});
  assert(res.status === 400, "Empty body  →  400");

  // 2. Invalid email
  res = await request("POST", "/register", { email: "not-an-email", password: "123456" });
  assert(res.status === 400, "Invalid email  →  400");

  // 3. Short password
  res = await request("POST", "/register", { email: "a@b.com", password: "123" });
  assert(res.status === 400, "Short password  →  400");

  // 4. Successful registration
  res = await request("POST", "/register", { email: "alice@example.com", password: "password123" });
  assert(res.status === 201,                    "Valid payload  →  201");
  assert(res.body.success === true,             "success: true");
  assert(res.body.data.user.email !== undefined,"User email present");
  assert(res.body.data.user.passwordHash === undefined, "Password hash NOT exposed");

  // 5. Duplicate email
  res = await request("POST", "/register", { email: "alice@example.com", password: "password123" });
  assert(res.status === 409, "Duplicate email  →  409");
}

async function testLogin() {
  console.log("\n📋  POST /login");

  // 1. Wrong password
  let res = await request("POST", "/login", { email: "alice@example.com", password: "wrongpass" });
  assert(res.status === 401, "Wrong password  →  401");

  // 2. Unknown email
  res = await request("POST", "/login", { email: "nobody@example.com", password: "password123" });
  assert(res.status === 401, "Unknown email  →  401");

  // 3. Successful login
  res = await request("POST", "/login", { email: "alice@example.com", password: "password123" });
  assert(res.status === 200,              "Valid credentials  →  200");
  assert(typeof res.body.data.token === "string", "Token is a string");
  assert(res.body.data.tokenType === "Bearer",    "tokenType is Bearer");

  return res.body.data.token; // pass token to next suite
}

async function testProfile(token) {
  console.log("\n📋  GET /profile");

  // 1. No token
  let res = await request("GET", "/profile");
  assert(res.status === 401, "No token  →  401");

  // 2. Malformed header
  res = await request("GET", "/profile", null, { Authorization: "InvalidScheme abc" });
  assert(res.status === 401, "Bad scheme  →  401");

  // 3. Tampered token
  res = await request("GET", "/profile", null, { Authorization: "Bearer tampered.token.here" });
  assert(res.status === 401, "Tampered token  →  401");

  // 4. Valid token
  res = await request("GET", "/profile", null, { Authorization: `Bearer ${token}` });
  assert(res.status === 200,                       "Valid token  →  200");
  assert(res.body.data.user.email === "alice@example.com", "Correct user returned");
  assert(res.body.data.user.passwordHash === undefined,    "Password hash NOT exposed");
}

async function test404() {
  console.log("\n📋  404 Handler");
  const res = await request("GET", "/nonexistent");
  assert(res.status === 404, "Unknown route  →  404");
}

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------

async function run() {
  console.log("=".repeat(50));
  console.log("  JWT Auth API — Integration Tests");
  console.log("=".repeat(50));

  // Start server on a random port
  server = app.listen(0);
  BASE_URL = `http://127.0.0.1:${server.address().port}`;
  console.log(`\n  Server started on ${BASE_URL}`);

  try {
    await testHealthCheck();
    await testRegister();
    const token = await testLogin();
    await testProfile(token);
    await test404();
  } catch (err) {
    console.error("\n[Runner] Unexpected error:", err);
    failed++;
  } finally {
    server.close();
    console.log("\n" + "=".repeat(50));
    console.log(`  Results: ${passed} passed, ${failed} failed`);
    console.log("=".repeat(50) + "\n");
    process.exit(failed > 0 ? 1 : 0);
  }
}

run();