import React, { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useOutletContext } from "react-router-dom";
import { getConfig, updateConfig } from "../api/client";
import { useSaveStatus } from "../hooks/useSaveStatus";
import "./Settings.css";
import "./AdminPanel.css";

const COMMON_TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Australia/Sydney",
];

export default function SettingsGeneral() {
  const { onTitleUpdate } = useOutletContext() ?? {};
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [timezone, setTimezone] = useState("UTC");
  const [error, setError] = useState(null);
  const titleSave = useSaveStatus();
  const timezoneSave = useSaveStatus();

  const { data: config, isLoading: configLoading } = useQuery({
    queryKey: ["config"],
    queryFn: getConfig,
  });

  useEffect(() => {
    if (config) {
      if (config.title) setTitle(config.title);
      if (config.timezone) setTimezone(config.timezone);
    }
  }, [config]);

  const titleMutation = useMutation({
    mutationFn: (data) => updateConfig(data),
    onSuccess: (data) => {
      setTitle(data.title);
      onTitleUpdate?.(data.title);
      queryClient.invalidateQueries({ queryKey: ["config"] });
      titleSave.triggerSuccess();
      setError(null);
    },
    onError: (err) => {
      titleSave.triggerError();
      setError(err.message || "Failed to update settings");
    },
  });

  const timezoneMutation = useMutation({
    mutationFn: (data) => updateConfig(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["config"] });
      timezoneSave.triggerSuccess();
      setError(null);
    },
    onError: (err) => {
      timezoneSave.triggerError();
      setError(err.message || "Failed to update settings");
    },
  });

  const handleSaveTitle = () => {
    if (!title.trim()) {
      setError("Title cannot be empty");
      return;
    }
    titleSave.triggerSaving();
    titleMutation.mutate({ title, timezone });
  };

  const handleSaveTimezone = () => {
    timezoneSave.triggerSaving();
    timezoneMutation.mutate({ title, timezone });
  };

  if (configLoading) return <div className="loading">Loading settings…</div>;

  return (
    <div className="settings-page">
      {error && <div className="error-message">{error}</div>}

      <section className="settings-section">
        <div className="section-row">
          <h3>App Title</h3>
          <button
            className={titleSave.saveBtnClass}
            onClick={handleSaveTitle}
            disabled={titleMutation.isPending}
          >
            {titleSave.saveStatus === "saving" ? "Saving…" : titleSave.saveStatus === "success" ? "Saved" : "Save"}
          </button>
        </div>
        <hr />
        <div className="section-content">
          <div className="setting-group">
            <label htmlFor="app-title">App Title</label>
            <input
              id="app-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={titleMutation.isPending}
              placeholder="Enter app title"
            />
          </div>
        </div>
      </section>

      <section className="settings-section">
        <div className="section-row">
          <h3>Date &amp; Time</h3>
          <button
            className={timezoneSave.saveBtnClass}
            onClick={handleSaveTimezone}
            disabled={timezoneMutation.isPending}
          >
            {timezoneSave.saveStatus === "saving" ? "Saving…" : timezoneSave.saveStatus === "success" ? "Saved" : "Save"}
          </button>
        </div>
        <hr />
        <div className="section-content">
          <div className="setting-group">
            <label htmlFor="timezone">Timezone</label>
            <select
              id="timezone"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              disabled={timezoneMutation.isPending}
            >
              {COMMON_TIMEZONES.map((tz) => {
                const offset = new Date().toLocaleString("en-US", {
                  timeZone: tz,
                  timeZoneName: "shortOffset",
                }).split(" ").pop();
                return (
                  <option key={tz} value={tz}>
                    {tz} ({offset})
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      </section>

    </div>
  );
}
