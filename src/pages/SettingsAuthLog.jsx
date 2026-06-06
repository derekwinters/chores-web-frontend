import React, { useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { MdFilterList } from "react-icons/md";
import { getAuthLog } from "../api/client";
import "../components/Log.css";

const ACTION_OPTIONS = [
  { value: "", label: "All actions" },
  { value: "login_succeeded", label: "Login succeeded" },
  { value: "login_failed", label: "Login failed" },
  { value: "password_changed", label: "Password changed" },
  { value: "password_reset", label: "Password reset" },
  { value: "user_created", label: "User created" },
];

const PAGE_SIZE = 20;

function actionLabel(action) {
  const match = ACTION_OPTIONS.find((o) => o.value === action);
  return match ? match.label : action;
}

function formatTimestamp(ts) {
  return new Date(ts).toLocaleString();
}

export default function SettingsAuthLog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [page, setPage] = useState(0);

  const filters = (() => {
    const f = {};
    const username = searchParams.get("username");
    const action = searchParams.get("action");
    const start_date = searchParams.get("start_date");
    const end_date = searchParams.get("end_date");

    if (username) f.username = username;
    if (action) f.action = action;
    if (start_date && /^\d{4}-\d{2}-\d{2}$/.test(start_date)) f.start_date = start_date;
    if (end_date && /^\d{4}-\d{2}-\d{2}$/.test(end_date)) f.end_date = end_date;

    return f;
  })();

  const { data: entries = [], isLoading, isError, error } = useQuery({
    queryKey: ["auth-log", filters],
    queryFn: () => getAuthLog(filters),
  });

  const handleFilterChange = useCallback((key, value) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) {
        next.set(key, value);
      } else {
        next.delete(key);
      }
      return next;
    });
    setPage(0);
  }, [setSearchParams]);

  const handleClearFilters = () => {
    setSearchParams({});
    setPage(0);
  };

  return (
    <div className="log">
      <div className="page-header">
        <h2>Auth Event Log</h2>
        <button
          className="btn-secondary"
          onClick={() => setFiltersExpanded(!filtersExpanded)}
          title={filtersExpanded ? "Hide filters" : "Show filters"}
        >
          <MdFilterList className="action-icon" />
          <span className="action-text">{filtersExpanded ? "Hide filters" : "Show filters"}</span>
        </button>
      </div>

      {filtersExpanded && (
        <div className="log-filters">
          <div className="filter-group">
            <label htmlFor="filter-auth-user">Filter by username</label>
            <input
              id="filter-auth-user"
              type="search"
              autoComplete="off"
              value={searchParams.get("username") || ""}
              onChange={(e) => handleFilterChange("username", e.target.value)}
              placeholder="Filter by username"
            />
          </div>

          <div className="filter-group">
            <label htmlFor="filter-action">Filter by action</label>
            <select
              id="filter-action"
              value={searchParams.get("action") || ""}
              onChange={(e) => handleFilterChange("action", e.target.value)}
            >
              {ACTION_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="filter-start-date">Start date</label>
            <input
              id="filter-start-date"
              type="date"
              value={searchParams.get("start_date") || ""}
              onChange={(e) => handleFilterChange("start_date", e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label htmlFor="filter-end-date">End date</label>
            <input
              id="filter-end-date"
              type="date"
              value={searchParams.get("end_date") || ""}
              onChange={(e) => handleFilterChange("end_date", e.target.value)}
            />
          </div>

          <button className="btn-secondary" onClick={handleClearFilters}>
            Clear filters
          </button>
        </div>
      )}

      {isError && <div className="error-state">{error.message}</div>}

      <div className="log-entries">
        {isLoading ? (
          <div className="loading">Loading auth log…</div>
        ) : isError ? null : entries.length === 0 ? (
          <div className="empty-state">No auth events found.</div>
        ) : (
          <>
            <table className="log-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Username</th>
                  <th>Action</th>
                  <th>Changed By</th>
                </tr>
              </thead>
              <tbody>
                {entries.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE).map((entry) => (
                  <tr key={entry.id}>
                    <td>{formatTimestamp(entry.timestamp)}</td>
                    <td>{entry.username}</td>
                    <td>{actionLabel(entry.action)}</td>
                    <td>{entry.changed_by ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="log-pagination">
              <button
                className="btn-secondary"
                onClick={() => setPage(page - 1)}
                disabled={page === 0}
              >
                ← Previous
              </button>
              <span className="page-info">
                Page {page + 1} of {Math.ceil(entries.length / PAGE_SIZE)}
              </span>
              <button
                className="btn-secondary"
                onClick={() => setPage(page + 1)}
                disabled={(page + 1) * PAGE_SIZE >= entries.length}
              >
                Next →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
