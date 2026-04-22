import React, { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getConfig, updateConfig } from "../api/client";
import "./AppSettings.css";

export default function AppSettings({ onTitleUpdate }) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [authEnabled, setAuthEnabled] = useState(true);
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
    updateMutation.mutate({ title, auth_enabled: authEnabled });
  };

  if (isLoading) return <div className="loading">Loading settings…</div>;

  return (
    <div className="app-settings">
      <h3>App Settings</h3>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">Settings saved!</div>}

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
    </div>
  );
}
