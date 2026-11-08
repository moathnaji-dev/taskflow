const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { get } = require("../db");
const { JWT_SECRET } = require("../middleware/auth");
const { isValidEmail } = require("../utils/validate");

const router = express.Router();

// POST /api/auth/login
// (Public registration was removed on purpose: only admins create users via /api/users)
router.post("/login", (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "Email and password required" });
  if (!isValidEmail(email)) return res.status(400).json({ error: "Invalid email format" });

  const user = get("SELECT * FROM users WHERE email = ?", [email]);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const payload = { id: user.id, name: user.name, email: user.email, role: user.role, team_id: user.team_id };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
  res.json({ token, user: payload });
});

module.exports = router;
