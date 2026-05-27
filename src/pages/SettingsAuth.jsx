import React, { useState, useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useOutletContext, useBlocker } from "react-router-dom";
import { getConfig, updateConfig } from "../api/client";
import "./Settings.css";
import "./AdminPanel.css";

export default function SettingsAuth() {
  const { onTitleUpdate } = useOutletContext() ?? {};
  const queryClient = useQueryClient();

  const [authEnabled, setAuthEnabled] = useState(true);
  const [error, setError] = useState(null);
  const committedRef = useRef(null);

  const { data: config, isLoading: configLoading } = useQuery({
    queryKey: ["config"],
    queryFn: getConfig,
  });

  // Initialize committedRef once from API data
  useEffect(() => {
    if (config && committedRef.current === null) {
      committedRef.current = config.auth_enabled ?? true;
      setAuthEnabled(committedRef.current);
    }
  }, [config]);

  const isDirty = committedRef.current !== null && authEnabled !== committedRef.current;

  // beforeunload handler for external navigation
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  // useBlocker for in-app navigation
  const blocker = useBlocker(isDirty);

  useEffect(() => {
    if (blocker.state === "blocked") {
      const confirmed = window.confirm("You have unsaved changes. Leave this page?");
      if (confirmed) {
        blocker.proceed();
      } else {
        blocker.reset();
      }
    }
  }, [blocker]);

  const authMutation = useMutation({
    mutationFn: (data) => updateConfig(data),
    onSuccess: (data) => {
      committedRef.current = data.auth_enabled ?? authEnabled;
      setAuthEnabled(committedRef.current);
      if (data.title) onTitleUpdate?.(data.title);
      queryClient.invalidateQueries({ queryKey: ["config"] });
      setError(null);
    },
    onError: (err) => {
      setError(err.message || "Failed to update settings");
    },
  });

  const handleSave = () => {
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
            className={isDirty ? "btn-save--dirty" : "btn-save--idle"}
            onClick={handleSave}
            disabled={!isDirty || authMutation.isPending}
          >
            {authMutation.isPending ? "Saving…" : "Save"}
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
