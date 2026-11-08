const express = require("express");
const { all, get, run } = require("../db");
const { authenticate, requireAdmin } = require("../middleware/auth");
const { STATUSES, PRIORITIES, isValidDate, isPastDate } = require("../utils/validate");

const router = express.Router();
router.use(authenticate);

const SELECT_TASKS = `
  SELECT t.*, u.name AS assigned_name, tm.name AS team_name
  FROM tasks t
  LEFT JOIN users u ON t.assigned_to = u.id
  LEFT JOIN teams tm ON t.team_id = tm.id
`;

const toId = (v) => (v === "" || v === undefined || v === null ? null : Number(v));

// Validates optional fields shared by create/update. Returns an error string or null.
function validateFields({ status, priority, due_date, assigned_to, team_id }, existing = null) {
  if (status !== undefined && !STATUSES.includes(status)) return "Invalid status";
  if (priority !== undefined && !PRIORITIES.includes(priority)) return "Invalid priority";
  if (due_date) {
    if (!isValidDate(due_date)) return "Invalid due date format (YYYY-MM-DD)";
    // A past date is only rejected if it is new/changed
    if (isPastDate(due_date) && due_date !== existing?.due_date) return "Due date cannot be in the past";
  }
  if (toId(assigned_to) && !get("SELECT id FROM users WHERE id = ?", [toId(assigned_to)])) return "Assigned user does not exist";
  if (toId(team_id) && !get("SELECT id FROM teams WHERE id = ?", [toId(team_id)])) return "Team does not exist";
  return null;
}

// Members may only touch tasks of their own team or assigned to them
const canAccess = (user, task) =>
  user.role === "admin" || task.assigned_to === user.id || (user.team_id && task.team_id === user.team_id);

// GET /api/tasks
router.get("/", (req, res) => {
  const { user } = req;
  const tasks =
    user.role === "admin"
      ? all(`${SELECT_TASKS} ORDER BY t.created_at DESC, t.id DESC`)
      : all(`${SELECT_TASKS} WHERE t.team_id = ? OR t.assigned_to = ? ORDER BY t.created_at DESC, t.id DESC`, [user.team_id ?? -1, user.id]);
  res.json(tasks);
});

// POST /api/tasks
router.post("/", (req, res) => {
  const { title, description, priority, status, assigned_to, team_id, due_date } = req.body || {};
  if (!title || !title.trim()) return res.status(400).json({ error: "Title required" });

  const error = validateFields({ status, priority, due_date, assigned_to, team_id });
  if (error) return res.status(400).json({ error });

  const result = run(
    `INSERT INTO tasks (title, description, status, priority, assigned_to, team_id, created_by, due_date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [title.trim(), description || null, status || "todo", priority || "medium",
     toId(assigned_to), toId(team_id), req.user.id, due_date || null],
  );
  res.status(201).json({ id: result.lastInsertRowid, title: title.trim() });
});

// PUT /api/tasks/:id
router.put("/:id", (req, res) => {
  const task = get("SELECT * FROM tasks WHERE id = ?", [req.params.id]);
  if (!task) return res.status(404).json({ error: "Task not found" });
  if (!canAccess(req.user, task)) return res.status(403).json({ error: "You cannot edit this task" });

  const { title, description, status, priority, assigned_to, team_id, due_date } = req.body || {};
  if (title !== undefined && !title.trim()) return res.status(400).json({ error: "Title required" });

  const error = validateFields({ status, priority, due_date, assigned_to, team_id }, task);
  if (error) return res.status(400).json({ error });

  run(
    `UPDATE tasks SET title = ?, description = ?, status = ?, priority = ?,
       assigned_to = ?, team_id = ?, due_date = ?, updated_at = datetime('now')
     WHERE id = ?`,
    [
      title?.trim() ?? task.title,
      description ?? task.description,
      status ?? task.status,
      priority ?? task.priority,
      assigned_to === undefined ? task.assigned_to : toId(assigned_to),
      team_id === undefined ? task.team_id : toId(team_id),
      due_date === undefined ? task.due_date : due_date || null,
      req.params.id,
    ],
  );
  res.json({ success: true });
});

// DELETE /api/tasks/:id (admin only)
router.delete("/:id", requireAdmin, (req, res) => {
  const result = run("DELETE FROM tasks WHERE id = ?", [req.params.id]);
  if (!result.changes) return res.status(404).json({ error: "Task not found" });
  res.json({ success: true });
});

module.exports = router;
