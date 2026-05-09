import React, { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getConfig,
  getUpdateCheckStatus,
  triggerUpdateCheck,
  configureUpdateChecking,
} from "../api/client";
import "./Settings.css";
import "./AdminPanel.css";

export default function SettingsAbout() {
  const queryClient = useQueryClient();

  const [updateCheckEnabledInput, setUpdateCheckEnabledInput] = useState(true);
  const [updateCheckIntervalInput, setUpdateCheckIntervalInput] = useState(24);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const { data: config } = useQuery({
    queryKey: ["config"],
    queryFn: getConfig,
  });

  useEffect(() => {
    if (config) {
      if (config.update_check_enabled !== undefined)
        setUpdateCheckEnabledInput(config.update_check_enabled);
      if (config.update_check_interval !== undefined)
        setUpdateCheckIntervalInput(config.update_check_interval);
    }
  }, [config]);

  const {
    data: updateCheckStatus,
    isLoading: updateCheckLoading,
    refetch: refetchUpdateCheck,
  } = useQuery({
    queryKey: ["update-check-status"],
    queryFn: getUpdateCheckStatus,
  });

  const updateCheckConfigMutation = useMutation({
    mutationFn: () =>
      configureUpdateChecking(
        updateCheckEnabledInput,
        parseInt(updateCheckIntervalInput)
      ),
    onSuccess: (data) => {
      setUpdateCheckEnabledInput(data.check_enabled);
      setUpdateCheckIntervalInput(data.check_interval_hours);
      queryClient.invalidateQueries({ queryKey: ["config"] });
      setSuccess(true);
      setError(null);
      setTimeout(() => setSuccess(false), 2000);
    },
    onError: (err) => {
      setError(err.message || "Failed to update update check settings");
    },
  });

  const triggerUpdateCheckMutation = useMutation({
    mutationFn: triggerUpdateCheck,
    onSuccess: () => {
      refetchUpdateCheck();
      setSuccess(true);
      setError(null);
      setTimeout(() => setSuccess(false), 2000);
    },
    onError: (err) => {
      setError(err.message || "Failed to check for updates");
    },
  });

  const handleSaveUpdateCheckConfig = () => {
    const interval = parseInt(updateCheckIntervalInput);
    if (isNaN(interval) || interval < 1) {
      setError("Update check interval must be at least 1 hour");
      return;
    }
    updateCheckConfigMutation.mutate();
  };

  const handleTriggerUpdateCheck = () => {
    triggerUpdateCheckMutation.mutate();
  };

  return (
    <div className="settings-page">
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">Settings saved!</div>}

      <section className="settings-section">
        <div className="section-row">
          <h3>App Version</h3>
        </div>
        <hr />
        <div className="section-content">
          <div className="status-info">
            <p>
              Current Version:{" "}
              <strong>{updateCheckStatus?.current_version ?? "—"}</strong>
            </p>
            <p>
              Latest Version:{" "}
              <strong>
                {updateCheckStatus?.latest_version ?? "Unknown"}
              </strong>
            </p>
            {updateCheckStatus?.last_checked_at && (
              <p>
                Last Checked:{" "}
                <strong>
                  {new Date(
                    updateCheckStatus.last_checked_at
                  ).toLocaleString()}
                </strong>
              </p>
            )}
          </div>
          {updateCheckStatus?.update_available && (
            <div className="update-available-banner">
              <strong>Update Available:</strong> Version{" "}
              {updateCheckStatus.latest_version} is available!
            </div>
          )}
        </div>
      </section>

      <section className="settings-section">
        <div className="section-row">
          <h3>Update Checker</h3>
          <button
            className="btn-primary"
            onClick={handleSaveUpdateCheckConfig}
            disabled={updateCheckConfigMutation.isPending || updateCheckLoading}
          >
            {updateCheckConfigMutation.isPending ? "Saving…" : "Save Settings"}
          </button>
        </div>
        <hr />
        {updateCheckLoading ? (
          <div className="loading">Loading…</div>
        ) : (
          <div className="section-content">
            <p className="setting-description">
              Periodically check for new application versions on GitHub.
            </p>
            <div className="update-check-control">
              <div className="control-row">
                <label htmlFor="update-check-enabled">
                  Enable Update Checking
                </label>
                <input
                  id="update-check-enabled"
                  type="checkbox"
                  checked={updateCheckEnabledInput}
                  onChange={(e) =>
                    setUpdateCheckEnabledInput(e.target.checked)
                  }
                  disabled={updateCheckConfigMutation.isPending}
                />
              </div>
              <div className="control-row">
                <label htmlFor="update-check-interval">
                  Check Interval (hours)
                </label>
                <input
                  id="update-check-interval"
                  type="number"
                  min="1"
                  value={updateCheckIntervalInput}
                  onChange={(e) =>
                    setUpdateCheckIntervalInput(e.target.value)
                  }
                  disabled={
                    !updateCheckEnabledInput ||
                    updateCheckConfigMutation.isPending
                  }
                />
              </div>
              <div className="button-group">
                <button
                  className="btn-secondary"
                  onClick={handleTriggerUpdateCheck}
                  disabled={triggerUpdateCheckMutation.isPending}
                >
                  {triggerUpdateCheckMutation.isPending
                    ? "Checking…"
                    : "Check Now"}
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
