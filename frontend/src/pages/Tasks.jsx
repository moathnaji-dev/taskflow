import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api, { getErrorMessage } from "../api/axios";
import "./Tasks.css";

const STATUSES = ["todo", "in_progress", "done"];
const PRIORITIES = ["low", "medium", "high"];

// Today's date (local time) as YYYY-MM-DD
const getToday = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};

const EMPTY_TASK = {
  title: "", description: "", priority: "medium", status: "todo",
  assigned_to: "", team_id: "", due_date: "",
};

function TaskModal({ task, onClose, onSaved, users, teams }) {
  const [form, setForm] = useState(task || EMPTY_TASK);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const today = getToday();

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value || null });

  const handleSubmit = async () => {
    if (!form.title?.trim()) return setError("Title is required");
    // Past dates are blocked, but an old task can still be saved with its original date
    if (form.due_date && form.due_date < today && form.due_date !== task?.due_date) {
      return setError("Due date cannot be in the past");
    }

    setLoading(true);
    setError("");
    try {
      if (task?.id) await api.put(`/tasks/${task.id}`, form);
      else await api.post("/tasks", form);
      onSaved();
    } catch (e) {
      setError(getErrorMessage(e, "Error saving task"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{task?.id ? "Edit Task" : "New Task"}</h2>

        <div className="form-group">
          <label>Title</label>
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Task title" />
        </div>
        <div className="form-group">
          <label>Description</label>
          <textarea rows={3} value={form.description || ""} placeholder="Optional details…" style={{ resize: "vertical" }}
            onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Status</label>
            <select value={form.status} onChange={update("status")}>
              {STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Priority</label>
            <select value={form.priority} onChange={update("priority")}>
              {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Assign to</label>
            <select value={form.assigned_to || ""} onChange={update("assigned_to")}>
              <option value="">Unassigned</option>
              {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Team</label>
            <select value={form.team_id || ""} onChange={update("team_id")}>
              <option value="">No team</option>
              {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Due Date</label>
          <input type="date" min={today} value={form.due_date || ""} onChange={update("due_date")} />
        </div>

        {error && <p className="error-msg">{error}</p>}
        <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "flex-end" }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? "Saving…" : "Save Task"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Tasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null); // null | {} (new) | task (edit)
  const [filter, setFilter] = useState("all");

  const load = async () => {
    try {
      const [t, u, tm] = await Promise.all([api.get("/tasks"), api.get("/users"), api.get("/users/teams")]);
      setTasks(t.data);
      setUsers(u.data);
      setTeams(tm.data);
      setError("");
    } catch (e) {
      setError(getErrorMessage(e, "Could not load tasks"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    if (!confirm("Delete this task?")) return;
    try {
      await api.delete(`/tasks/${id}`);
      load();
    } catch (e) {
      setError(getErrorMessage(e, "Could not delete task"));
    }
  };

  const filtered = filter === "all" ? tasks : tasks.filter((t) => t.status === filter);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Tasks</h1>
          <p>{tasks.length} total tasks</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal({})}>+ New Task</button>
      </div>

      <div className="filter-bar">
        {["all", ...STATUSES].map((s) => (
          <button key={s} className={`filter-btn ${filter === s ? "active" : ""}`} onClick={() => setFilter(s)}>
            {s.replace("_", " ")}
          </button>
        ))}
      </div>

      {error && <p className="error-msg" style={{ marginBottom: 12 }}>{error}</p>}

      {loading ? (
        <p className="muted">Loading tasks…</p>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <p>No tasks found.</p>
          <button className="btn btn-primary" onClick={() => setModal({})}>Create first task</button>
        </div>
      ) : (
        <div className="tasks-grid">
          {filtered.map((task) => (
            <div className="task-card" key={task.id}>
              <div className="task-card-header">
                <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                <span className={`badge badge-${task.status}`}>{task.status.replace("_", " ")}</span>
              </div>
              <p className="task-card-title">{task.title}</p>
              {task.description && <p className="task-card-desc">{task.description}</p>}
              <div className="task-card-meta">
                {task.assigned_name && <span>👤 {task.assigned_name}</span>}
                {task.team_name && <span>◈ {task.team_name}</span>}
                {task.due_date && <span>📅 {task.due_date}</span>}
              </div>
              <div className="task-card-actions">
                <button className="btn btn-ghost btn-sm" onClick={() => setModal(task)}>Edit</button>
                {user?.role === "admin" && (
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(task.id)}>Delete</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {modal !== null && (
        <TaskModal
          task={modal?.id ? modal : null}
          users={users}
          teams={teams}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load(); }}
        />
      )}
    </div>
  );
}
