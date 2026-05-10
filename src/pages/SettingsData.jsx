import React, { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { getLogRetention, setLogRetention } from "../api/client";
import ExportImport from "../components/ExportImport";
import "./Settings.css";
import "./AdminPanel.css";

export default function SettingsData() {
  const [retentionInput, setRetentionInput] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const { data: retentionData, isLoading: retentionLoading } = useQuery({
    queryKey: ["log-retention"],
    queryFn: getLogRetention,
  });

  useEffect(() => {
    if (retentionData?.retention_days !== undefined) {
      setRetentionInput(String(retentionData.retention_days));
    }
  }, [retentionData]);

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

  const handleSaveRetention = () => {
    const days = parseInt(retentionInput);
    if (isNaN(days) || days < 1) {
      setError("Days must be a number greater than 0");
      return;
    }
    retentionMutation.mutate(days);
  };

  return (
    <div className="settings-page">
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">Settings saved!</div>}

      <section className="settings-section">
        <div className="section-row">
          <h3>Export &amp; Import</h3>
        </div>
        <hr />
        <ExportImport />
      </section>

      <section className="settings-section">
        <div className="section-row">
          <h3>Log Retention</h3>
          <button
            className="btn-primary"
            onClick={handleSaveRetention}
            disabled={retentionMutation.isPending || retentionLoading}
          >
            {retentionMutation.isPending ? "Saving…" : "Save"}
          </button>
        </div>
        <hr />
        {retentionLoading ? (
          <div className="loading">Loading…</div>
        ) : (
          <div className="section-content">
            <p className="setting-description">
              Automatically delete log entries older than the specified number of days.
            </p>
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
            </div>
          </div>
        )}
      </section>

      <section className="settings-section">
        <div className="section-row">
          <h3>Data Management</h3>
        </div>
        <hr />
        <div className="section-content">
          <p className="setting-description">
            Directly modify or remove records in specific database tables.
          </p>
          <div className="data-management-entry">
            <Link to="/settings/data/pointslog">Points Log</Link>
            {" — Modify or remove records for recently completed chores."}
          </div>
        </div>
      </section>
    </div>
  );
}
