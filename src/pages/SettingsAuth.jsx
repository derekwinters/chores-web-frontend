import React, { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useOutletContext } from "react-router-dom";
import { getConfig, updateConfig } from "../api/client";
import { useSaveStatus } from "../hooks/useSaveStatus";
import "./Settings.css";
import "./AdminPanel.css";

export default function SettingsAuth() {
  const { onTitleUpdate } = useOutletContext() ?? {};
  const queryClient = useQueryClient();

  const [authEnabled, setAuthEnabled] = useState(true);
  const [error, setError] = useState(null);
  const { saveStatus, saveBtnClass, triggerSaving, triggerSuccess, triggerError } = useSaveStatus();

  const { data: config, isLoading: configLoading } = useQuery({
    queryKey: ["config"],
    queryFn: getConfig,
  });

  useEffect(() => {
    if (config) {
      if (config.auth_enabled !== undefined) setAuthEnabled(config.auth_enabled);
    }
  }, [config]);

  const authMutation = useMutation({
    mutationFn: (data) => updateConfig(data),
    onSuccess: (data) => {
      if (data.title) onTitleUpdate?.(data.title);
      queryClient.invalidateQueries({ queryKey: ["config"] });
      triggerSuccess();
      setError(null);
    },
    onError: (err) => {
      triggerError();
      setError(err.message || "Failed to update settings");
    },
  });

  const handleSave = () => {
    triggerSaving();
    authMutation.mutate({ auth_enabled: authEnabled });
  };

  if (configLoading) return <div className="loading">Loading settings…</div>;

  return (
    <div className="settings-page">
      {error && <div className="error-message">{error}</div>}

      <section className="settings-section">
        <div className="section-row">
          <h3>Authentication</h3>
          <button
            className={saveBtnClass}
            onClick={handleSave}
            disabled={authMutation.isPending}
          >
            {saveStatus === "saving" ? "Saving…" : saveStatus === "success" ? "Saved" : "Save"}
          </button>
        </div>
        <hr />
        <div className="section-content">
          <div className="setting-group">
            <label htmlFor="auth-enabled" className="checkbox-label">
              <input
                id="auth-enabled"
                type="checkbox"
                checked={authEnabled}
                onChange={(e) => setAuthEnabled(e.target.checked)}
                disabled={authMutation.isPending}
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
      </section>
    </div>
  );
}
