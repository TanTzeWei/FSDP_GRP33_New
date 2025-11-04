import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import "../auth.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
  // DEV: post directly to backend server. Use env var or proxy in production/dev proxy.
  const res = await axios.post("http://localhost:3000/login", { email, password });
      const token = res.data?.token;
      if (token) {
        // store token locally for authenticated requests
        localStorage.setItem("authToken", token);
      }
      setLoading(false);
      // optional success message
      // navigate to home or dashboard (adjust as needed)
      navigate("/");
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="auth-container">
      <div className="login-container">
        <h2>Welcome Back</h2>
        <p className="form-subtitle">Sign in to your account</p>
        <form onSubmit={handleSubmit}>
      {error && <div className="error">{error}</div>}

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" disabled={loading}>
            {loading && <span className="loading-spinner"></span>}
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="form-footer">
          Don't have an account? <Link to="/signup">Sign up here</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
