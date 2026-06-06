import React, { useState } from "react";
import { setToken } from "../utils/auth";
import { loginWithResetSupport, resetPassword } from "../api/client";
import "./Login.css";

export default function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Password reset flow state
  const [resetMode, setResetMode] = useState(false);
  const [resetToken, setResetToken] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await loginWithResetSupport(username.toLowerCase(), password);

      if (response.requiresReset) {
        // Enter reset mode — show password change form
        setResetToken(response.resetToken);
        setResetMode(true);
        setLoading(false);
        return;
      }

      setToken(response.access_token);
      setTimeout(() => {
        if (onLoginSuccess) {
          onLoginSuccess(response.user);
        }
      }, 500);
    } catch (err) {
      const msg = err.message || "Invalid credentials";
      setError(msg);
      console.error("Login failed:", err);
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    try {
      const response = await resetPassword(resetToken, newPassword);
      setToken(response.access_token);
      setTimeout(() => {
        if (onLoginSuccess) {
          onLoginSuccess(response.user);
        }
      }, 500);
    } catch (err) {
      const msg = err.message || "Password reset failed";
      setError(msg);
      console.error("Password reset failed:", err);
      setLoading(false);
    }
  };

  if (resetMode) {
    return (
      <div className="login-container">
        <div className="login-card">
          <h1>Family Chores</h1>
          <p style={{ color: "var(--text-secondary, #ccc)", textAlign: "center", marginBottom: "20px", fontSize: "14px" }}>
            A new password is required before you can sign in.
          </p>
          <form onSubmit={handlePasswordReset} className="login-form">
            <div className="form-group">
              <label htmlFor="new-password">New Password</label>
              <input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (8+ characters)"
                disabled={loading}
                required
                minLength={8}
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirm-password">Confirm Password</label>
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                disabled={loading}
                required
              />
            </div>

            {error && <div className="error-message">{error}</div>}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary login-btn"
            >
              {loading ? "Saving..." : "Set New Password"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>Family Chores</h1>
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              disabled={loading}
              required
              inputMode="text"
              autoCapitalize="off"
              autoCorrect="off"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              disabled={loading}
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary login-btn"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
