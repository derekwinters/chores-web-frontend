import React, { useState, useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useOutletContext, useBlocker } from "react-router-dom";
import { getConfig, updateConfig } from "../api/client";
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
  const committedRef = useRef(null);

  const { data: config, isLoading: configLoading } = useQuery({
    queryKey: ["config"],
    queryFn: getConfig,
  });

  // Initialize committedRef once from API data
  useEffect(() => {
    if (config && committedRef.current === null) {
      committedRef.current = {
        title: config.title ?? "",
        timezone: config.timezone ?? "UTC",
      };
      setTitle(committedRef.current.title);
      setTimezone(committedRef.current.timezone);
    }
  }, [config]);

  const isDirty =
    committedRef.current !== null &&
    (title !== committedRef.current.title || timezone !== committedRef.current.timezone);

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
        title: data.title ?? title,
        timezone: data.timezone ?? timezone,
      };
      setTitle(committedRef.current.title);
      setTimezone(committedRef.current.timezone);
      onTitleUpdate?.(committedRef.current.title);
      queryClient.invalidateQueries({ queryKey: ["config"] });
      setError(null);
    },
    onError: (err) => {
      setError(err.message || "Failed to update settings");
    },
  });

  const handleSave = () => {
    if (!title.trim()) {
      setError("Title cannot be empty");
      return;
    }
    saveMutation.mutate({ title, timezone });
  };

  if (configLoading) return <div className="loading">Loading settings…</div>;

  return (
    <div className="settings-page">
      {error && <div className="error-message">{error}</div>}

      <h2>General</h2>

      <section className="settings-section">
        <h3>App Title</h3>
        <hr />
        <div className="section-content">
          <div className="setting-group">
            <label htmlFor="app-title">App Title</label>
            <input
              id="app-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={saveMutation.isPending}
              placeholder="Enter app title"
            />
          </div>
        </div>
      </section>

      <section className="settings-section">
        <h3>Date &amp; Time</h3>
        <hr />
        <div className="section-content">
          <div className="setting-group">
            <label htmlFor="timezone">Timezone</label>
            <select
              id="timezone"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              disabled={saveMutation.isPending}
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

      <div className="save-actions">
        <button
          className={isDirty ? "btn-save--dirty" : "btn-save--idle"}
          onClick={handleSave}
          disabled={!isDirty || saveMutation.isPending}
        >
          {saveMutation.isPending ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}
