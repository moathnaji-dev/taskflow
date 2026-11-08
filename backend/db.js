const initSqlJs = require("sql.js");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");

const IN_MEMORY = process.env.DB_PATH === ":memory:";
const DB_PATH = IN_MEMORY ? null : process.env.DB_PATH || path.join(__dirname, "taskflow.db");
let db;

function save() {
  if (IN_MEMORY) return;
  fs.writeFileSync(DB_PATH, Buffer.from(db.export()));
}

async function initDB() {
  const SQL = await initSqlJs();
  db = !IN_MEMORY && fs.existsSync(DB_PATH) ? new SQL.Database(fs.readFileSync(DB_PATH)) : new SQL.Database();

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'member',
      team_id INTEGER,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS teams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'todo',
      priority TEXT NOT NULL DEFAULT 'medium',
      assigned_to INTEGER,
      team_id INTEGER,
      created_by INTEGER NOT NULL,
      due_date TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);

  seed();
  save();
  return db;
}

function seed() {
  if (get("SELECT id FROM users WHERE email = ?", ["admin@taskflow.com"])) return;

  run("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'admin')",
    ["Admin", "admin@taskflow.com", bcrypt.hashSync("admin123", 10)]);
  const adminId = get("SELECT id FROM users WHERE email = ?", ["admin@taskflow.com"]).id;

  run("INSERT INTO teams (name, description) VALUES (?, ?)", ["Engineering", "Main engineering team"]);
  const teamId = get("SELECT id FROM teams WHERE name = ?", ["Engineering"]).id;

  run("INSERT INTO users (name, email, password, role, team_id) VALUES (?, ?, ?, 'member', ?)",
    ["Alice", "alice@taskflow.com", bcrypt.hashSync("member123", 10), teamId]);
  const aliceId = get("SELECT id FROM users WHERE email = ?", ["alice@taskflow.com"]).id;

  run("INSERT INTO tasks (title, description, priority, status, team_id, created_by) VALUES (?,?,?,?,?,?)",
    ["Setup CI/CD pipeline", "Configure GitHub Actions for deployment", "high", "in_progress", teamId, adminId]);
  run("INSERT INTO tasks (title, description, priority, status, team_id, created_by, assigned_to) VALUES (?,?,?,?,?,?,?)",
    ["Write unit tests", "Cover all API endpoints", "medium", "todo", teamId, adminId, aliceId]);
}

function all(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

function get(sql, params = []) {
  return all(sql, params)[0] || null;
}

// Runs a write statement, persists to disk, returns { lastInsertRowid, changes }
function run(sql, params = []) {
  db.run(sql, params);
  const lastInsertRowid = db.exec("SELECT last_insert_rowid()")[0].values[0][0];
  const changes = db.getRowsModified();
  save();
  return { lastInsertRowid, changes };
}

module.exports = { initDB, all, get, run };
