import React, { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { getConfig, updateConfig } from "../api/client";
import ThemeSettings from "../components/ThemeSettings";
import ExportImport from "../components/ExportImport";
import "./Settings.css";

const COMMON_TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Australia/Sydney",
];

export default function Settings({ onTitleUpdate }) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [authEnabled, setAuthEnabled] = useState(true);
  const [timezone, setTimezone] = useState("UTC");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const { data: config, isLoading } = useQuery({
    queryKey: ["config"],
    queryFn: getConfig,
  });

  useEffect(() => {
    if (config?.title) {
      setTitle(config.title);
    }
    if (config?.auth_enabled !== undefined) {
      setAuthEnabled(config.auth_enabled);
    }
    if (config?.timezone) {
      setTimezone(config.timezone);
    }
  }, [config]);

  const updateMutation = useMutation({
    mutationFn: (data) => updateConfig(data),
    onSuccess: (data) => {
      setTitle(data.title);
      onTitleUpdate?.(data.title);
      queryClient.invalidateQueries({ queryKey: ["config"] });
      setSuccess(true);
      setError(null);
      setTimeout(() => setSuccess(false), 2000);
    },
    onError: (err) => {
      setError(err.message || "Failed to update settings");
    },
  });

  const handleSave = () => {
    if (!title.trim()) {
      setError("Title cannot be empty");
      return;
    }
    updateMutation.mutate({ title, auth_enabled: authEnabled, timezone });
  };

  if (isLoading) return <div className="loading">Loading settings…</div>;

  return (
    <div className="settings-page">
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">Settings saved!</div>}

      <section className="settings-section">
        <h3>General</h3>
        <div className="setting-group">
          <label htmlFor="app-title">App Title</label>
          <div className="input-group">
            <input
              id="app-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={updateMutation.isPending}
              placeholder="Enter app title"
            />
            <button
              className="btn-primary"
              onClick={handleSave}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </section>

      <section className="settings-section">
        <h3>Auth</h3>
        <div className="setting-group">
          <label htmlFor="auth-enabled" className="checkbox-label">
            <input
              id="auth-enabled"
              type="checkbox"
              checked={authEnabled}
              onChange={(e) => setAuthEnabled(e.target.checked)}
              disabled={updateMutation.isPending}
            />
            Require Authentication
          </label>
          <p className="setting-description">
            {authEnabled
              ? "Users must log in to access the app"
              : "App is accessible without authentication"}
          </p>
        </div>
        {authEnabled && (
          <div className="setting-group">
            <label>Admin Panel</label>
            <Link to="/admin" className="btn-secondary">
              Admin Tools
            </Link>
          </div>
        )}
      </section>

      <section className="settings-section">
        <h3>Date & Time</h3>
        <div className="setting-group">
          <label htmlFor="timezone">Timezone</label>
          <select
            id="timezone"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            disabled={updateMutation.isPending}
          >
            {COMMON_TIMEZONES.map((tz) => {
              const offset = new Date().toLocaleString('en-US', { timeZone: tz, timeZoneName: 'shortOffset' }).split(' ').pop();
              return (
                <option key={tz} value={tz}>
                  {tz} ({offset})
                </option>
              );
            })}
          </select>
          <button
            className="btn-primary"
            onClick={handleSave}
            disabled={updateMutation.isPending || !title.trim()}
            style={{ marginTop: "0.5rem", width: "fit-content" }}
          >
            {updateMutation.isPending ? "Saving…" : "Save"}
          </button>
        </div>
      </section>

      <section className="settings-section">
        <h3>Theme</h3>
        <ThemeSettings />
      </section>

      <section className="settings-section">
        <h3>Data Management</h3>
        <ExportImport />
      </section>
    </div>
  );
}
