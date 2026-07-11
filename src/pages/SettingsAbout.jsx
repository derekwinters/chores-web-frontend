import React, { useState, useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useBlocker } from "react-router-dom";
import {
  getConfig,
  getUpdateCheckStatus,
  triggerUpdateCheck,
  configureUpdateChecking,
  getBackendVersion,
} from "../api/client";
import { checkForUpdate } from "../utils/appVersion";
import "./Settings.css";
import "./AdminPanel.css";

const PROJECT_LINKS = [
  {
    label: "chores-web-docs",
    href: "https://github.com/derekwinters/chores-web-docs",
  },
  {
    label: "Frontend Releases",
    href: "https://github.com/derekwinters/chores-web-frontend/releases",
  },
  {
    label: "Backend Releases",
    href: "https://github.com/derekwinters/chores-web-backend/releases",
  },
];

export default function SettingsAbout() {
  const queryClient = useQueryClient();

  const [updateCheckEnabledInput, setUpdateCheckEnabledInput] = useState(true);
  const [updateCheckIntervalInput, setUpdateCheckIntervalInput] = useState(24);
  const [error, setError] = useState(null);
  const committedRef = useRef(null);

  const { data: config } = useQuery({
    queryKey: ["config"],
    queryFn: getConfig,
  });

  // Initialize committedRef once from API data
  useEffect(() => {
    if (config && committedRef.current === null) {
      committedRef.current = {
        enabled: config.update_check_enabled ?? true,
        interval: config.update_check_interval ?? 24,
      };
      setUpdateCheckEnabledInput(committedRef.current.enabled);
      setUpdateCheckIntervalInput(committedRef.current.interval);
    }
  }, [config]);

  const isDirty =
    committedRef.current !== null &&
    (updateCheckEnabledInput !== committedRef.current.enabled ||
      String(updateCheckIntervalInput) !== String(committedRef.current.interval));

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

  const {
    data: updateCheckStatus,
    isLoading: updateCheckLoading,
    refetch: refetchUpdateCheck,
  } = useQuery({
    queryKey: ["update-check-status"],
    queryFn: getUpdateCheckStatus,
  });

  // Client-side "is this frontend build out of date" check, entirely
  // decoupled from the backend — see chores-web-frontend#31. Cached in
  // localStorage internally (see utils/appVersion.js), so this is cheap to
  // run on every mount.
  const { data: appVersionInfo } = useQuery({
    queryKey: ["app-version-check"],
    queryFn: () => checkForUpdate(),
    retry: false,
  });

  // Backend's own version, from its public /version endpoint. Degrades
  // gracefully (see the isError branch in render) rather than blocking the
  // page if the backend predates this endpoint or is unreachable.
  const { data: backendVersion, isError: backendVersionIsError } = useQuery({
    queryKey: ["backend-version"],
    queryFn: getBackendVersion,
    retry: false,
  });

  const updateCheckConfigMutation = useMutation({
    mutationFn: () =>
      configureUpdateChecking(
        updateCheckEnabledInput,
        parseInt(updateCheckIntervalInput)
      ),
    onSuccess: (data) => {
      committedRef.current = {
        enabled: data.check_enabled,
        interval: data.check_interval_hours,
      };
      setUpdateCheckEnabledInput(committedRef.current.enabled);
      setUpdateCheckIntervalInput(committedRef.current.interval);
      queryClient.invalidateQueries({ queryKey: ["config"] });
      setError(null);
    },
    onError: (err) => {
      setError(err.message || "Failed to update update check settings");
    },
  });

  const triggerUpdateCheckMutation = useMutation({
    mutationFn: triggerUpdateCheck,
    onSuccess: () => {
      refetchUpdateCheck();
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

      <section className="settings-section">
        <div className="section-row">
          <h3>App Version</h3>
        </div>
        <hr />
        <div className="section-content">
          <div className="status-info">
            <p>
              Current Version:{" "}
              <strong>{appVersionInfo?.currentVersion ?? "—"}</strong>
            </p>
            <p>
              Latest Version:{" "}
              <strong>{appVersionInfo?.latestVersion ?? "Unknown"}</strong>
            </p>
            {appVersionInfo?.checkedAt && (
              <p>
                Last Checked:{" "}
                <strong>
                  {new Date(appVersionInfo.checkedAt).toLocaleString()}
                </strong>
              </p>
            )}
          </div>
          {appVersionInfo?.updateAvailable && (
            <div className="update-available-banner">
              <strong>Update Available:</strong> Version{" "}
              {appVersionInfo.latestVersion} is available!
            </div>
          )}
        </div>
      </section>

      <section className="settings-section">
        <div className="section-row">
          <h3>Backend Version</h3>
        </div>
        <hr />
        <div className="section-content">
          <div className="status-info backend-version-panel">
            <p>
              Version:{" "}
              <strong>
                {backendVersionIsError ? "unknown" : backendVersion?.version ?? "unknown"}
              </strong>
            </p>
            <p>
              Update Status:{" "}
              <strong>
                {backendVersionIsError || !backendVersion
                  ? "unsupported check"
                  : backendVersion.update_available
                    ? "update available"
                    : "up to date"}
              </strong>
            </p>
            {!backendVersionIsError && backendVersion?.latest_version && (
              <p>
                Latest Version: <strong>{backendVersion.latest_version}</strong>
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="settings-section">
        <div className="section-row">
          <h3>Update Checker</h3>
          <button
            className={isDirty ? "btn-save--dirty" : "btn-save--idle"}
            onClick={handleSaveUpdateCheckConfig}
            disabled={!isDirty || updateCheckConfigMutation.isPending || updateCheckLoading}
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
              Periodically check for new server (backend) versions on GitHub.
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

      <section className="settings-section">
        <div className="section-row">
          <h3>Project Links</h3>
        </div>
        <hr />
        <div className="section-content">
          <ul className="about-links">
            {PROJECT_LINKS.map((link) => (
              <li key={link.href}>
                <a href={link.href} target="_blank" rel="noopener noreferrer">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
