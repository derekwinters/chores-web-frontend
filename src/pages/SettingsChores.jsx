import React, { useState, useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useBlocker } from "react-router-dom";
import { getConfig, updateConfig } from "../api/client";
import "./Settings.css";
import "./AdminPanel.css";

const DUE_HOUR_LABELS = [
  "12 AM", "1 AM", "2 AM", "3 AM", "4 AM", "5 AM",
  "6 AM", "7 AM", "8 AM", "9 AM", "10 AM", "11 AM",
  "12 PM", "1 PM", "2 PM", "3 PM", "4 PM", "5 PM",
  "6 PM", "7 PM", "8 PM", "9 PM", "10 PM", "11 PM",
];

export default function SettingsChores() {
  const queryClient = useQueryClient();

  const [dueSoonDaysInput, setDueSoonDaysInput] = useState("");
  const [dueTimeHour, setDueTimeHour] = useState(6);
  const [error, setError] = useState(null);
  const committedRef = useRef(null);

  const { data: config, isLoading: configLoading } = useQuery({
    queryKey: ["config"],
    queryFn: getConfig,
  });

  // Initialize committedRef once from API data
  useEffect(() => {
    if (config && committedRef.current === null) {
      committedRef.current = {
        dueSoonDays: String(config.due_soon_days ?? ""),
        dueTimeHour: config.due_time_hour ?? 6,
      };
      setDueSoonDaysInput(committedRef.current.dueSoonDays);
      setDueTimeHour(committedRef.current.dueTimeHour);
    }
  }, [config]);

  const isDirty =
    committedRef.current !== null &&
    (dueSoonDaysInput !== committedRef.current.dueSoonDays ||
      dueTimeHour !== committedRef.current.dueTimeHour);

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

  const saveMutation = useMutation({
    mutationFn: (data) => updateConfig(data),
    onSuccess: (data) => {
      committedRef.current = {
        dueSoonDays: String(data.due_soon_days),
        dueTimeHour: data.due_time_hour,
      };
      setDueSoonDaysInput(committedRef.current.dueSoonDays);
      setDueTimeHour(committedRef.current.dueTimeHour);
      queryClient.invalidateQueries({ queryKey: ["config"] });
      setError(null);
    },
    onError: (err) => {
      setError(err.message || "Failed to update settings");
    },
  });

  const handleSave = () => {
    const days = parseInt(dueSoonDaysInput);
    if (isNaN(days) || days < 1 || days > 365) {
      setError("Due soon threshold must be between 1 and 365 days");
      return;
    }
    saveMutation.mutate({
      due_soon_days: days,
      due_time_hour: dueTimeHour,
    });
  };

  if (configLoading) return <div className="loading">Loading settings…</div>;

  return (
    <div className="settings-page">
      {error && <div className="error-message">{error}</div>}

      <section className="settings-section">
        <div className="section-row">
          <h3>Chore Settings</h3>
          <button
            className={isDirty ? "btn-save--dirty" : "btn-save--idle"}
            onClick={handleSave}
            disabled={!isDirty || saveMutation.isPending}
          >
            {saveMutation.isPending ? "Saving…" : "Save"}
          </button>
        </div>
        <hr />
        <div className="section-content">
          <p className="setting-description">
            Set the number of days in advance to mark chores as "due soon".
          </p>
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
                disabled={saveMutation.isPending}
              />
              <span>days</span>
            </div>
          </div>
          <div className="setting-group">
            <label htmlFor="due-time-hour">Mark chores due at</label>
            <select
              id="due-time-hour"
              value={dueTimeHour}
              onChange={(e) => setDueTimeHour(parseInt(e.target.value))}
              disabled={saveMutation.isPending}
            >
              {DUE_HOUR_LABELS.map((label, hour) => (
                <option key={hour} value={hour}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>
    </div>
  );
}
