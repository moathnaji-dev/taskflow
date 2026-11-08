import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import "./Layout.css";

const navClass = ({ isActive }) => `nav-item ${isActive ? "active" : ""}`;

export default function Layout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="layout">
      {/* Sidebar taskbar: navigation + admin controls */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="brand-icon">T</span>
          <span className="brand-name">TaskFlow</span>
        </div>

        <div className="sidebar-section">
          <p className="sidebar-label">Navigation</p>
          <NavLink to="/" end className={navClass}><span className="nav-icon">⊞</span> Dashboard</NavLink>
          <NavLink to="/tasks" className={navClass}><span className="nav-icon">✓</span> My Tasks</NavLink>
          <NavLink to="/team" className={navClass}><span className="nav-icon">◈</span> Team</NavLink>
        </div>

        {user?.role === "admin" && (
          <div className="sidebar-section">
            <p className="sidebar-label">Admin</p>
            <NavLink to="/admin" className={navClass}><span className="nav-icon">⚙</span> Control Panel</NavLink>
          </div>
        )}

        <div className="sidebar-footer">
          <div className="user-card">
            <div className="user-avatar">{user?.name?.[0]?.toUpperCase()}</div>
            <div className="user-info">
              <p className="user-name">{user?.name}</p>
              <p className="user-role">{user?.role}</p>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm theme-toggle" onClick={toggleTheme}>
            {theme === "dark" ? "☀ Light mode" : "☾ Dark mode"}
          </button>
          <button className="btn btn-ghost btn-sm logout-btn" onClick={handleLogout}>→ Sign out</button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
