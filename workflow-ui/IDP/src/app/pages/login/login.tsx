import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./login.css";

const Login: React.FC = () => {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    // Hardcoded credentials
    if (username === "admin" && password === "admin123") {
      sessionStorage.setItem("isAuthenticated", "true");
      navigate("/dashboard");
    } else {
      setError("Invalid username or password");
    }
  };

  return (
    <div className="login-container">
      {/* LEFT PANEL */}
      <div className="left-panel">
        <div className="left-content">
          <h1 className="brand-title">Intelligent Document Processing</h1>
          <p className="brand-subtitle">
            AI-powered document understanding for smarter automation
          </p>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="right-panel">
        <div className="login-card">
          <h2 className="title">Sign In</h2>

          <form onSubmit={handleLogin}>
            <label className="input-label">Username</label>
            <input
              type="text"
              className="input-box"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
            />

            <label className="input-label mt-4">Password</label>
            <input
              type="password"
              className="input-box"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
            />

            {error && <p className="error-text">{error}</p>}

            <button type="submit" className="signin-btn">
              Sign In
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
