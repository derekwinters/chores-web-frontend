import React, { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getConfig, updateConfig } from "../api/client";
import { useSaveStatus } from "../hooks/useSaveStatus";
import "./Settings.css";
import "./AdminPanel.css";

export default function SettingsChores() {
  const queryClient = useQueryClient();

  const [dueSoonDaysInput, setDueSoonDaysInput] = useState("");
  const [error, setError] = useState(null);
  const { saveStatus, saveBtnClass, triggerSaving, triggerSuccess, triggerError } = useSaveStatus();

  const { data: config, isLoading: configLoading } = useQuery({
    queryKey: ["config"],
    queryFn: getConfig,
  });

  useEffect(() => {
    if (config) {
      if (config.due_soon_days !== undefined) setDueSoonDaysInput(String(config.due_soon_days));
    }
  }, [config]);

  const dueSoonDaysMutation = useMutation({
    mutationFn: (days) => updateConfig({ due_soon_days: parseInt(days) }),
    onSuccess: (data) => {
      setDueSoonDaysInput(String(data.due_soon_days));
      queryClient.invalidateQueries({ queryKey: ["config"] });
      triggerSuccess();
      setError(null);
    },
    onError: (err) => {
      triggerError();
      setError(err.message || "Failed to update due soon threshold");
    },
  });

  const handleSaveDueSoonDays = () => {
    const days = parseInt(dueSoonDaysInput);
    if (isNaN(days) || days < 1 || days > 365) {
      setError("Due soon threshold must be between 1 and 365 days");
      return;
    }
    triggerSaving();
    dueSoonDaysMutation.mutate(days);
  };

  if (configLoading) return <div className="loading">Loading settings…</div>;

  return (
    <div className="settings-page">
      {error && <div className="error-message">{error}</div>}

      <section className="settings-section">
        <div className="section-row">
          <h3>Due Soon Threshold</h3>
          <button
            className={saveBtnClass}
            onClick={handleSaveDueSoonDays}
            disabled={dueSoonDaysMutation.isPending}
          >
            {saveStatus === "saving" ? "Saving…" : saveStatus === "success" ? "Saved" : "Save"}
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
                disabled={dueSoonDaysMutation.isPending}
              />
              <span>days</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
