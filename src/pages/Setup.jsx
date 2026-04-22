import React, { useState } from "react";
import { login } from "../api/client";
import { setToken } from "../utils/auth";
import "./Setup.css";

export default function Setup({ onSetupSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [authEnabled, setAuthEnabled] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const response = await login(username, password);
      setToken(response.access_token);

      // Try to update config but don't fail if it does
      try {
        const { updateConfig } = await import("../api/client");
        await updateConfig({ auth_enabled: authEnabled });
      } catch (configErr) {
        console.warn("Config update failed (non-critical):", configErr);
      }

      // Reload to complete setup
      if (onSetupSuccess) {
        onSetupSuccess();
      }
    } catch (err) {
      setError(err.message || "Setup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="setup-container">
      <div className="setup-card">
        <h1>Family Chores</h1>
        <h2>Create Admin Account</h2>
        <form onSubmit={handleSubmit} className="setup-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Choose a username"
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm password"
              disabled={loading}
              required
            />
          </div>

          <div className="form-group checkbox-group">
            <label htmlFor="authEnabled" className="checkbox-label">
              <input
                id="authEnabled"
                type="checkbox"
                checked={authEnabled}
                onChange={(e) => setAuthEnabled(e.target.checked)}
                disabled={loading}
              />
              Require Authentication
            </label>
            <p className="form-hint">
              {authEnabled
                ? "Users will need to log in to access the app"
                : "The app will be accessible without authentication"}
            </p>
          </div>

          {error && <div className="error-message">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary setup-btn"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>

          <p className="setup-info">
            You are creating the first admin account. Future users will need to be added by an admin.
          </p>
        </form>
      </div>
    </div>
  );
}
