const express = require("express");
const bcrypt = require("bcryptjs");
const { all, get, run } = require("../db");
const { authenticate, requireAdmin } = require("../middleware/auth");
const { ROLES, isValidEmail } = require("../utils/validate");

const router = express.Router();
router.use(authenticate);

// ---------- Teams (declared before /:id so "teams" is not treated as an id) ----------

// GET /api/users/teams
router.get("/teams", (req, res) => {
  res.json(all("SELECT * FROM teams ORDER BY name"));
});

// POST /api/users/teams (admin)
router.post("/teams", requireAdmin, (req, res) => {
  const { name, description } = req.body || {};
  if (!name || !name.trim()) return res.status(400).json({ error: "Team name required" });
  if (get("SELECT id FROM teams WHERE LOWER(name) = LOWER(?)", [name.trim()])) {
    return res.status(409).json({ error: "Team name already exists" });
  }
  const result = run("INSERT INTO teams (name, description) VALUES (?, ?)", [name.trim(), description || null]);
  res.status(201).json({ id: result.lastInsertRowid, name: name.trim(), description });
});

// DELETE /api/users/teams/:id (admin)
router.delete("/teams/:id", requireAdmin, (req, res) => {
  if (get("SELECT id FROM users WHERE team_id = ? LIMIT 1", [req.params.id])) {
    return res.status(400).json({ error: "Cannot delete a team that still has members" });
  }
  run("UPDATE tasks SET team_id = NULL WHERE team_id = ?", [req.params.id]);
  const result = run("DELETE FROM teams WHERE id = ?", [req.params.id]);
  if (!result.changes) return res.status(404).json({ error: "Team not found" });
  res.json({ success: true });
});

// ---------- Users ----------

// GET /api/users
router.get("/", (req, res) => {
  const base = `
    SELECT u.id, u.name, u.email, u.role, u.team_id, t.name AS team_name, u.created_at
    FROM users u LEFT JOIN teams t ON u.team_id = t.id`;
  const users =
    req.user.role === "admin"
      ? all(`${base} ORDER BY u.created_at DESC, u.id DESC`)
      : all(`${base} WHERE u.team_id = ?`, [req.user.team_id ?? -1]);
  res.json(users);
});

// POST /api/users (admin) — a team is mandatory
router.post("/", requireAdmin, (req, res) => {
  const { name, email, password, role = "member", team_id } = req.body || {};
  if (!name || !name.trim() || !email || !password) return res.status(400).json({ error: "All fields required" });
  if (!isValidEmail(email)) return res.status(400).json({ error: "Invalid email format" });
  if (password.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters" });
  if (!ROLES.includes(role)) return res.status(400).json({ error: "Invalid role" });

  if (!team_id) return res.status(400).json({ error: "Team is required" });
  if (!get("SELECT id FROM teams WHERE id = ?", [Number(team_id)])) {
    return res.status(400).json({ error: "Team does not exist" });
  }
  if (get("SELECT id FROM users WHERE email = ?", [email])) {
    return res.status(409).json({ error: "Email already exists" });
  }

  const result = run(
    "INSERT INTO users (name, email, password, role, team_id) VALUES (?, ?, ?, ?, ?)",
    [name.trim(), email, bcrypt.hashSync(password, 10), role, Number(team_id)],
  );
  res.status(201).json({ id: result.lastInsertRowid, name: name.trim(), email, role, team_id: Number(team_id) });
});

// DELETE /api/users/:id (admin)
router.delete("/:id", requireAdmin, (req, res) => {
  if (Number(req.params.id) === req.user.id) {
    return res.status(400).json({ error: "Cannot delete yourself" });
  }
  run("UPDATE tasks SET assigned_to = NULL WHERE assigned_to = ?", [req.params.id]);
  const result = run("DELETE FROM users WHERE id = ?", [req.params.id]);
  if (!result.changes) return res.status(404).json({ error: "User not found" });
  res.json({ success: true });
});

module.exports = router;
