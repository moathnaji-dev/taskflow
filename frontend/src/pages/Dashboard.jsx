import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api, { getErrorMessage } from "../api/axios";
import "./Dashboard.css";

export default function Dashboard() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/tasks")
      .then((r) => setTasks(r.data))
      .catch((e) => setError(getErrorMessage(e, "Could not load tasks")))
      .finally(() => setLoading(false));
  }, []);

  const count = (status) => tasks.filter((t) => t.status === status).length;
  const recent = tasks.slice(0, 5);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Good day, {user?.name}</h1>
          <p>Here's what's happening across your workspace.</p>
        </div>
      </div>

      {error && <p className="error-msg">{error}</p>}

      <div className="stats-grid">
        <div className="stat-card"><p className="stat-label">Total Tasks</p><p className="stat-value">{tasks.length}</p></div>
        <div className="stat-card"><p className="stat-label">To Do</p><p className="stat-value muted">{count("todo")}</p></div>
        <div className="stat-card"><p className="stat-label">In Progress</p><p className="stat-value accent">{count("in_progress")}</p></div>
        <div className="stat-card"><p className="stat-label">Completed</p><p className="stat-value success">{count("done")}</p></div>
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Recent Tasks</h2>
        {loading ? (
          <p className="muted">Loading…</p>
        ) : recent.length === 0 ? (
          <p className="muted">No tasks yet. Create one!</p>
        ) : (
          recent.map((t) => (
            <div className="task-row" key={t.id}>
              <div>
                <p className="task-title-sm">{t.title}</p>
                <p style={{ fontSize: 12, color: "var(--text3)" }}>{t.team_name || "No team"}</p>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <span className={`badge badge-${t.status}`}>{t.status.replace("_", " ")}</span>
                <span className={`badge badge-${t.priority}`}>{t.priority}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
