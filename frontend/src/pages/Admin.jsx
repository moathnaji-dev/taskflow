import { useEffect, useState } from "react";
import api, { getErrorMessage } from "../api/axios";
import "./Admin.css";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function UserModal({ onClose, onSaved, teams }) {
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "member", team_id: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.email || !form.password) return setError("All fields required");
    if (!EMAIL_RE.test(form.email)) return setError("Please enter a valid email");
    if (form.password.length < 6) return setError("Password must be at least 6 characters");
    if (!form.team_id) return setError("Please select a team"); // a user must belong to a team

    setLoading(true);
    setError("");
    try {
      await api.post("/users", { ...form, name: form.name.trim(), team_id: Number(form.team_id) });
      onSaved();
    } catch (e) {
      setError(getErrorMessage(e, "Error creating user"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Add User</h2>
        <div className="form-group">
          <label>Full Name</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Jane Doe" />
        </div>
        <div className="form-group">
          <label>Email</label>
          <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="jane@company.com" />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="At least 6 characters" />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Role</label>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="form-group">
            <label>Team</label>
            <select value={form.team_id} onChange={(e) => setForm({ ...form, team_id: e.target.value })}>
              <option value="">Select a team</option>
              {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        </div>
        {teams.length === 0 && <p className="error-msg">Create a team first before adding users.</p>}
        {error && <p className="error-msg">{error}</p>}
        <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "flex-end" }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? "Creating…" : "Create User"}
          </button>
        </div>
      </div>
    </div>
  );
}

function TeamModal({ onClose, onSaved }) {
  const [form, setForm] = useState({ name: "", description: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!form.name.trim()) return setError("Team name required");
    setLoading(true);
    setError("");
    try {
      await api.post("/users/teams", form);
      onSaved();
    } catch (e) {
      setError(getErrorMessage(e, "Error creating team"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>New Team</h2>
        <div className="form-group">
          <label>Team Name</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Engineering" />
        </div>
        <div className="form-group">
          <label>Description</label>
          <textarea rows={2} value={form.description} style={{ resize: "vertical" }} placeholder="What does this team do?"
            onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        {error && <p className="error-msg">{error}</p>}
        <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "flex-end" }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? "Creating…" : "Create Team"}
          </button>
        </div>
      </div>
    </div>
  );
}

const Dash = () => <span style={{ color: "var(--text3)" }}>—</span>;

export default function Admin() {
  const [tab, setTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null);

  const load = async () => {
    try {
      const [u, t, tk] = await Promise.all([api.get("/users"), api.get("/users/teams"), api.get("/tasks")]);
      setUsers(u.data);
      setTeams(t.data);
      setTasks(tk.data);
      setError("");
    } catch (e) {
      setError(getErrorMessage(e, "Could not load data"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const remove = (url, label) => async () => {
    if (!confirm(`Delete this ${label}?`)) return;
    try {
      await api.delete(url);
      load();
    } catch (e) {
      setError(getErrorMessage(e, `Could not delete ${label}`));
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Admin Control Panel</h1>
          <p>Manage users, teams, and tasks</p>
        </div>
      </div>

      <div className="admin-stats">
        <div className="admin-stat"><span className="admin-stat-num">{users.length}</span><span className="admin-stat-label">Users</span></div>
        <div className="admin-stat"><span className="admin-stat-num">{teams.length}</span><span className="admin-stat-label">Teams</span></div>
        <div className="admin-stat"><span className="admin-stat-num">{tasks.length}</span><span className="admin-stat-label">Tasks</span></div>
        <div className="admin-stat"><span className="admin-stat-num">{tasks.filter((t) => t.status === "done").length}</span><span className="admin-stat-label">Completed</span></div>
      </div>

      <div className="admin-tabs">
        {["users", "teams", "tasks"].map((t) => (
          <button key={t} className={`admin-tab ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {error && <p className="error-msg" style={{ marginBottom: 12 }}>{error}</p>}

      {loading ? (
        <p className="muted">Loading…</p>
      ) : (
        <div className="card">
          {tab === "users" && (
            <>
              <div className="panel-header">
                <span>{users.length} users</span>
                <button className="btn btn-primary btn-sm" onClick={() => setModal("user")}>+ Add User</button>
              </div>
              <div className="table-wrap">
                <table className="admin-table">
                  <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Team</th><th>Joined</th><th></th></tr></thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id}>
                        <td><div className="table-user"><div className="table-avatar">{u.name[0]}</div>{u.name}</div></td>
                        <td>{u.email}</td>
                        <td><span className={`badge badge-${u.role}`}>{u.role}</span></td>
                        <td>{u.team_name || <Dash />}</td>
                        <td style={{ color: "var(--text2)", fontSize: 12 }}>{u.created_at?.slice(0, 10)}</td>
                        <td><button className="btn btn-danger btn-sm" onClick={remove(`/users/${u.id}`, "user")}>Delete</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {tab === "teams" && (
            <>
              <div className="panel-header">
                <span>{teams.length} teams</span>
                <button className="btn btn-primary btn-sm" onClick={() => setModal("team")}>+ New Team</button>
              </div>
              <div className="table-wrap">
                <table className="admin-table">
                  <thead><tr><th>Team</th><th>Description</th><th>Members</th><th>Tasks</th><th></th></tr></thead>
                  <tbody>
                    {teams.map((t) => (
                      <tr key={t.id}>
                        <td><div className="table-user"><div className="table-avatar" style={{ borderRadius: 6 }}>{t.name[0]}</div>{t.name}</div></td>
                        <td style={{ color: "var(--text2)" }}>{t.description || "—"}</td>
                        <td>{users.filter((u) => u.team_id === t.id).length}</td>
                        <td>{tasks.filter((tk) => tk.team_id === t.id).length}</td>
                        <td><button className="btn btn-danger btn-sm" onClick={remove(`/users/teams/${t.id}`, "team")}>Delete</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {tab === "tasks" && (
            <>
              <div className="panel-header"><span>{tasks.length} tasks</span></div>
              <div className="table-wrap">
                <table className="admin-table">
                  <thead><tr><th>Title</th><th>Status</th><th>Priority</th><th>Assigned To</th><th>Team</th><th>Due</th><th></th></tr></thead>
                  <tbody>
                    {tasks.map((t) => (
                      <tr key={t.id}>
                        <td style={{ fontWeight: 500 }}>{t.title}</td>
                        <td><span className={`badge badge-${t.status}`}>{t.status.replace("_", " ")}</span></td>
                        <td><span className={`badge badge-${t.priority}`}>{t.priority}</span></td>
                        <td>{t.assigned_name || <Dash />}</td>
                        <td>{t.team_name || <Dash />}</td>
                        <td style={{ color: "var(--text2)", fontSize: 12 }}>{t.due_date || "—"}</td>
                        <td><button className="btn btn-danger btn-sm" onClick={remove(`/tasks/${t.id}`, "task")}>Delete</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {modal === "user" && <UserModal teams={teams} onClose={() => setModal(null)} onSaved={() => { setModal(null); load(); }} />}
      {modal === "team" && <TeamModal onClose={() => setModal(null)} onSaved={() => { setModal(null); load(); }} />}
    </div>
  );
}
