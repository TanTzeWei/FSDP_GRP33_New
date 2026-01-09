import { useState, useContext } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import "../auth.css";
import { AuthContext } from "../context/AuthContext";
import { ToastContext } from "../context/ToastContext";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const { showToast } = useContext(ToastContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
  // DEV: post directly to backend server. Use env var or proxy in production/dev proxy.
      const res = await axios.post("http://localhost:3000/login", { email, password });
      const token = res.data?.token;
      const user = res.data?.user;
      if (token) {
        // token will be stored together with user by AuthContext.login
      }
  // store user+token in auth context/localStorage
      login({ user, token });
      setLoading(false);
      // show success toast and navigate to role-based dashboard
      showToast(res.data?.message || "Login successful!", { type: "success", duration: 2500 });
      // role-based routing
      // Stall owners should go to the Stall Owner Dashboard page
      const role = user?.role || (user?.is_stall_owner ? 'stall_owner' : 'customer');
      if (role === 'admin') return navigate('/dashboard/admin');
      if (role === 'stall_owner') return navigate('/stall/dashboard');
      return navigate('/');
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.message || "Login failed");
    }
  };

  const handleGuestLogin = () => {
    // Create a guest user object
    const guestUser = {
      userId: 'guest',
      name: 'Guest User',
      email: 'guest@hawkerhub.com',
      isGuest: true
    };
    
    // Login as guest (no token needed)
    login({ user: guestUser, token: null });
    showToast("Welcome, Guest! Browse our menu.", { type: "success", duration: 2500 });
    navigate("/");
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

        <div className="divider">
          <span>OR</span>
        </div>

        <button className="guest-btn" onClick={handleGuestLogin}>
          👤 Continue as Guest
        </button>

        <p className="form-footer">
          Don't have an account? <Link to="/signup">Sign up here</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
