import React, { useState, useEffect, useRef } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, useBlocker } from "react-router-dom";
import { getLogRetention, setLogRetention } from "../api/client";
import ExportImport from "../components/ExportImport";
import "./Settings.css";
import "./AdminPanel.css";

export default function SettingsData() {
  const [retentionInput, setRetentionInput] = useState("");
  const [error, setError] = useState(null);
  const committedRef = useRef(null);

  const { data: retentionData, isLoading: retentionLoading } = useQuery({
    queryKey: ["log-retention"],
    queryFn: getLogRetention,
  });

  // Initialize committedRef once from API data
  useEffect(() => {
    if (retentionData?.retention_days !== undefined && committedRef.current === null) {
      committedRef.current = String(retentionData.retention_days);
      setRetentionInput(committedRef.current);
    }
  }, [retentionData]);

  const isDirty = committedRef.current !== null && retentionInput !== committedRef.current;

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

  const retentionMutation = useMutation({
    mutationFn: (days) => setLogRetention(parseInt(days)),
    onSuccess: (data) => {
      committedRef.current = String(data.retention_days);
      setRetentionInput(committedRef.current);
      setError(null);
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
            className={isDirty ? "btn-save--dirty" : "btn-save--idle"}
            onClick={handleSaveRetention}
            disabled={!isDirty || retentionMutation.isPending || retentionLoading}
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
