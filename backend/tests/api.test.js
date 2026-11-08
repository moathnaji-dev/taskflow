// Run with: npm test   (uses Node's built-in test runner, in-memory database)
process.env.DB_PATH = ":memory:";
const test = require("node:test");
const assert = require("node:assert/strict");
const { initDB } = require("../db");
const createApp = require("../app");

let server, base, adminToken, memberToken, teamId;

const api = async (method, path, body, token) => {
  const res = await fetch(base + path, {
    method,
    headers: { "Content-Type": "application/json", ...(token && { Authorization: `Bearer ${token}` }) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, data: await res.json() };
};
const login = async (email, password) => (await api("POST", "/api/auth/login", { email, password })).data.token;
const futureDate = (days) => new Date(Date.now() + days * 864e5).toISOString().slice(0, 10);

test.before(async () => {
  await initDB();
  server = createApp().listen(0);
  base = `http://localhost:${server.address().port}`;
  adminToken = await login("admin@taskflow.com", "admin123");
  memberToken = await login("alice@taskflow.com", "member123");
  teamId = (await api("GET", "/api/users/teams", null, adminToken)).data[0].id;
});
test.after(() => server.close());

test("login: valid, wrong password, empty, bad email", async () => {
  assert.ok(adminToken);
  assert.equal((await api("POST", "/api/auth/login", { email: "admin@taskflow.com", password: "x" })).status, 401);
  assert.equal((await api("POST", "/api/auth/login", {})).status, 400);
  assert.equal((await api("POST", "/api/auth/login", { email: "bad", password: "x" })).status, 400);
});

test("public register endpoint no longer exists", async () => {
  const r = await api("POST", "/api/auth/register", { name: "x", email: "x@x.com", password: "123456", role: "admin" });
  assert.equal(r.status, 404);
});

test("protected routes require a token", async () => {
  assert.equal((await api("GET", "/api/tasks")).status, 401);
});

test("task: past due date is rejected, today/future accepted", async () => {
  const past = await api("POST", "/api/tasks", { title: "t", due_date: "2020-01-01" }, adminToken);
  assert.equal(past.status, 400);
  assert.match(past.data.error, /past/i);
  assert.equal((await api("POST", "/api/tasks", { title: "t", due_date: futureDate(0) }, adminToken)).status, 201);
  assert.equal((await api("POST", "/api/tasks", { title: "t", due_date: futureDate(5) }, adminToken)).status, 201);
});

test("task: missing title, invalid status/priority rejected", async () => {
  assert.equal((await api("POST", "/api/tasks", { title: "  " }, adminToken)).status, 400);
  assert.equal((await api("POST", "/api/tasks", { title: "t", status: "bogus" }, adminToken)).status, 400);
  assert.equal((await api("POST", "/api/tasks", { title: "t", priority: "bogus" }, adminToken)).status, 400);
});

test("task: member cannot delete, admin can", async () => {
  const { data } = await api("POST", "/api/tasks", { title: "to delete" }, adminToken);
  assert.equal((await api("DELETE", `/api/tasks/${data.id}`, null, memberToken)).status, 403);
  assert.equal((await api("DELETE", `/api/tasks/${data.id}`, null, adminToken)).status, 200);
  assert.equal((await api("DELETE", `/api/tasks/${data.id}`, null, adminToken)).status, 404);
});

test("task: member cannot edit a task outside their team", async () => {
  const { data } = await api("POST", "/api/tasks", { title: "admin private" }, adminToken); // no team, not assigned
  assert.equal((await api("PUT", `/api/tasks/${data.id}`, { title: "hacked" }, memberToken)).status, 403);
});

test("user: team is required", async () => {
  const base = { name: "Bob", email: "bob@test.com", password: "secret1" };
  assert.equal((await api("POST", "/api/users", base, adminToken)).status, 400);
  assert.equal((await api("POST", "/api/users", { ...base, team_id: 9999 }, adminToken)).status, 400);
  assert.equal((await api("POST", "/api/users", { ...base, team_id: teamId }, adminToken)).status, 201);
});

test("user: duplicate email, bad email, short password, invalid role", async () => {
  const ok = { name: "C", password: "secret1", team_id: teamId };
  assert.equal((await api("POST", "/api/users", { ...ok, email: "bob@test.com" }, adminToken)).status, 409);
  assert.equal((await api("POST", "/api/users", { ...ok, email: "nope" }, adminToken)).status, 400);
  assert.equal((await api("POST", "/api/users", { ...ok, email: "c@test.com", password: "123" }, adminToken)).status, 400);
  assert.equal((await api("POST", "/api/users", { ...ok, email: "c@test.com", role: "root" }, adminToken)).status, 400);
});

test("user: member cannot create users; admin cannot delete themselves", async () => {
  const body = { name: "D", email: "d@test.com", password: "secret1", team_id: teamId };
  assert.equal((await api("POST", "/api/users", body, memberToken)).status, 403);
  const adminId = (await api("GET", "/api/users", null, adminToken)).data.find((u) => u.role === "admin").id;
  assert.equal((await api("DELETE", `/api/users/${adminId}`, null, adminToken)).status, 400);
});

test("team: cannot delete a team that still has members", async () => {
  assert.equal((await api("DELETE", `/api/users/teams/${teamId}`, null, adminToken)).status, 400);
});
