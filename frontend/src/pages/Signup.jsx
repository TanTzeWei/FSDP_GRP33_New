import { useState, useContext } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import "../auth.css";
import { AuthContext } from "../context/AuthContext";
import { ToastContext } from "../context/ToastContext";

function Signup() {
  const [name, setName] = useState("");
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
      // DEV: post directly to backend server running on port 3000.
      // In production use an env var (VITE_API_BASE) or a proxy instead.
      const res = await axios.post("http://localhost:3000/signup", { name, email, password });
      setLoading(false);
      // auto-login user and navigate home
      const token = res.data?.token;
      const user = res.data?.user;
      // Token will be stored by AuthContext.login
      login({ user, token });
      showToast(res.data?.message || "Signup successful!", { type: "success" });
      navigate("/");
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.message || "Signup failed");
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
      <div className="signup-container">
        <h2>Create Account</h2>
        <p className="form-subtitle">Join us today</p>
        <form onSubmit={handleSubmit}>
          {error && <div className="error">{error}</div>}

          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              id="name"
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

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
            {loading ? "Signing up..." : "Sign Up"}
          </button>
        </form>

        <div className="divider">
          <span>OR</span>
        </div>

        <button className="guest-btn" onClick={handleGuestLogin}>
          👤 Continue as Guest
        </button>

        <p className="form-footer">
          Already have an account? <Link to="/login">Login here</Link>
        </p>
      </div>
    </div>
  );
}

export default Signup;
