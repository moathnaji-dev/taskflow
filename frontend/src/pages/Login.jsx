import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { getErrorMessage } from "../api/axios";
import "./Login.css";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!EMAIL_RE.test(form.email)) return setError("Please enter a valid email");
    if (!form.password) return setError("Password is required");

    setLoading(true);
    try {
      await login(form.email.trim(), form.password);
      navigate("/");
    } catch (err) {
      setError(getErrorMessage(err, "Login failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <button className="btn btn-ghost btn-sm theme-toggle-floating" onClick={toggleTheme}>
        {theme === "dark" ? "☀ Light" : "☾ Dark"}
      </button>

      <div className="login-card">
        <div className="login-brand">
          <span className="brand-icon-lg">T</span>
          <h1>TaskFlow</h1>
          <p>Sign in to your workspace</p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label>Email</label>
            <input type="email" placeholder="you@company.com" value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" placeholder="••••••••" value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
          {error && <p className="error-msg">{error}</p>}
          <button className="btn btn-primary" style={{ width: "100%", marginTop: 8, justifyContent: "center" }} disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <div className="login-hint">
          <p>Demo accounts</p>
          <code>admin@taskflow.com / admin123</code>
          <code>alice@taskflow.com / member123</code>
        </div>
      </div>
    </div>
  );
}
