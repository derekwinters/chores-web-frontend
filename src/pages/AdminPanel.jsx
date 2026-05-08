import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getLogRetention, setLogRetention, getConfig, updateConfig } from "../api/client";
import "./AdminPanel.css";

export default function AdminPanel() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [retentionInput, setRetentionInput] = useState("");
  const [dueSoonDaysInput, setDueSoonDaysInput] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const { data: retentionData, isLoading: retentionLoading } = useQuery({
    queryKey: ["log-retention"],
    queryFn: getLogRetention,
    onSuccess: (data) => {
      setRetentionInput(String(data.retention_days));
    },
  });

  const { data: configData, isLoading: configLoading } = useQuery({
    queryKey: ["config"],
    queryFn: getConfig,
    onSuccess: (data) => {
      setDueSoonDaysInput(String(data.due_soon_days));
    },
  });

  const retentionMutation = useMutation({
    mutationFn: (days) => setLogRetention(parseInt(days)),
    onSuccess: (data) => {
      setRetentionInput(String(data.retention_days));
      setSuccess(true);
      setError(null);
      setTimeout(() => setSuccess(false), 2000);
    },
    onError: (err) => {
      setError(err.message || "Failed to update log retention");
    },
  });

  const dueSoonDaysMutation = useMutation({
    mutationFn: (days) => updateConfig({ due_soon_days: parseInt(days) }),
    onSuccess: (data) => {
      setDueSoonDaysInput(String(data.due_soon_days));
      setSuccess(true);
      setError(null);
      setTimeout(() => setSuccess(false), 2000);
    },
    onError: (err) => {
      setError(err.message || "Failed to update due soon threshold");
    },
  });

  const handleSaveRetention = () => {
    const days = parseInt(retentionInput);
    if (isNaN(days) || days < 1) {
      setError("Days must be a number greater than 0");
      return;
    }
    retentionMutation.mutate(days);
  };

  const handleSaveDueSoonDays = () => {
    const days = parseInt(dueSoonDaysInput);
    if (isNaN(days) || days < 1 || days > 365) {
      setError("Due soon threshold must be between 1 and 365 days");
      return;
    }
    dueSoonDaysMutation.mutate(days);
  };

  if (!user?.is_admin) {
    return (
      <div className="admin-denied">
        <h2>Access Denied</h2>
        <p>You must be an administrator to access this page.</p>
        <button className="btn-primary" onClick={() => navigate("/")}>
          Go Home
        </button>
      </div>
    );
  }

  return (
    <div className="admin-panel">
      <h2>Admin Panel</h2>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">Settings saved!</div>}

      <section className="admin-section">
        <h3>Database</h3>
        <p>Database administration tools coming soon.</p>
      </section>

      <section className="admin-section">
        <h3>System</h3>
        <p>System administration tools coming soon.</p>
      </section>

      <section className="admin-section">
        <h3>Log Retention</h3>
        <p>Automatically delete log entries older than the specified number of days.</p>
        {retentionLoading ? (
          <div className="loading">Loading…</div>
        ) : (
          <div className="retention-control">
            <label htmlFor="retention-days">Keep logs for</label>
            <div className="retention-input-group">
              <input
                id="retention-days"
                type="number"
                min="1"
                value={retentionInput}
                onChange={(e) => setRetentionInput(e.target.value)}
                disabled={retentionMutation.isPending}
              />
              <span>days</span>
            </div>
            <button
              className="btn-primary"
              onClick={handleSaveRetention}
              disabled={retentionMutation.isPending}
            >
              {retentionMutation.isPending ? "Saving…" : "Save"}
            </button>
          </div>
        )}
      </section>

      <section className="admin-section">
        <h3>Due Soon Threshold</h3>
        <p>Set the number of days in advance to mark chores as "due soon".</p>
        {configLoading ? (
          <div className="loading">Loading…</div>
        ) : (
          <div className="retention-control">
            <label htmlFor="due-soon-days">Notify when due in</label>
            <div className="retention-input-group">
              <input
                id="due-soon-days"
                type="number"
                min="1"
                max="365"
                value={dueSoonDaysInput}
                onChange={(e) => setDueSoonDaysInput(e.target.value)}
                disabled={dueSoonDaysMutation.isPending}
              />
              <span>days</span>
            </div>
            <button
              className="btn-primary"
              onClick={handleSaveDueSoonDays}
              disabled={dueSoonDaysMutation.isPending}
            >
              {dueSoonDaysMutation.isPending ? "Saving…" : "Save"}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
