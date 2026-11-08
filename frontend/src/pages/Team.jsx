import { useEffect, useState } from "react";
import api, { getErrorMessage } from "../api/axios";
import "./Team.css";

export default function Team() {
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedTeam, setSelectedTeam] = useState(null);

  useEffect(() => {
    Promise.all([api.get("/users"), api.get("/users/teams"), api.get("/tasks")])
      .then(([u, t, tk]) => {
        setUsers(u.data);
        setTeams(t.data);
        setTasks(tk.data);
        if (t.data.length > 0) setSelectedTeam(t.data[0].id);
      })
      .catch((e) => setError(getErrorMessage(e, "Could not load team data")))
      .finally(() => setLoading(false));
  }, []);

  const teamMembers = users.filter((u) => u.team_id === selectedTeam);
  const teamTasks = tasks.filter((t) => t.team_id === selectedTeam);
  const memberTasks = (id) => tasks.filter((t) => t.assigned_to === id);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Team</h1>
          <p>{users.length} members across {teams.length} teams</p>
        </div>
      </div>

      {error && <p className="error-msg">{error}</p>}

      {/* Team taskbar */}
      <div className="team-taskbar">
        {teams.map((t) => (
          <button key={t.id} className={`team-tab ${selectedTeam === t.id ? "active" : ""}`} onClick={() => setSelectedTeam(t.id)}>
            <span className="team-tab-icon">{t.name[0]}</span>
            {t.name}
            <span className="team-tab-count">{users.filter((u) => u.team_id === t.id).length}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <p className="muted">Loading…</p>
      ) : selectedTeam ? (
        <div className="team-content">
          <div className="members-panel">
            <h2 className="panel-title">Members</h2>
            {teamMembers.length === 0 ? (
              <p className="muted" style={{ fontSize: 13 }}>No members in this team.</p>
            ) : (
              teamMembers.map((m) => {
                const mt = memberTasks(m.id);
                return (
                  <div className="member-card" key={m.id}>
                    <div className="member-avatar">{m.name[0]}</div>
                    <div className="member-info">
                      <p className="member-name">{m.name}</p>
                      <p className="member-email">{m.email}</p>
                      <p className="member-stats">{mt.length} tasks · {mt.filter((t) => t.status === "done").length} done</p>
                    </div>
                    <span className={`badge badge-${m.role}`}>{m.role}</span>
                  </div>
                );
              })
            )}
          </div>

          <div className="team-tasks-panel">
            <h2 className="panel-title">Team Tasks ({teamTasks.length})</h2>
            {teamTasks.length === 0 ? (
              <p className="muted" style={{ fontSize: 13 }}>No tasks assigned to this team.</p>
            ) : (
              teamTasks.map((task) => (
                <div className="team-task-row" key={task.id}>
                  <div className="ttask-left">
                    <span className={`badge badge-${task.status}`}>{task.status.replace("_", " ")}</span>
                    <p className="ttask-title">{task.title}</p>
                  </div>
                  <div className="ttask-right">
                    {task.assigned_name && <span className="ttask-assignee">👤 {task.assigned_name}</span>}
                    <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        <p className="muted">No teams found.</p>
      )}
    </div>
  );
}
