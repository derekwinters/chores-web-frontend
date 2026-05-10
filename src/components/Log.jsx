import React, { useState, useCallback, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { MdFilterList } from "react-icons/md";
import { getLog, getPeople, getChores } from "../api/client";
import "./Log.css";

const ACTIONS = ["completed", "skipped", "reassigned", "created", "deleted", "updated", "marked_due"];

const PAGE_SIZE = 20;

// Breakpoint detection (log table needs 850px to comfortably show 5 columns)
const BREAKPOINT_MOBILE = 850;

function useBreakpoint() {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth < BREAKPOINT_MOBILE;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < BREAKPOINT_MOBILE);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return isMobile;
}

function LogRow({ entry, isMobile, formatTimestamp, colSpan }) {
  const [expanded, setExpanded] = useState(false);

  const targetType = entry.chore_name.startsWith("Person:") ? "user" : "chore";
  const targetName = entry.chore_name.replace("Person: ", "");
  const fullTimestamp = new Date(entry.timestamp).toLocaleString();

  const handleClick = () => {
    setExpanded((prev) => !prev);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setExpanded((prev) => !prev);
    }
  };

  return (
    <>
      <tr
        className={`log-table-row${expanded ? " expanded" : ""}`}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        aria-expanded={expanded}
        style={expanded ? { display: "none" } : undefined}
      >
        <td className="log-timestamp">{formatTimestamp(entry.timestamp)}</td>
        <td className="log-action">
          <span className="action-badge">{entry.action}</span>
        </td>
        {!isMobile && (
          <td className="log-target-type">
            <span className="target-badge">{targetType}</span>
          </td>
        )}
        {!isMobile && (
          <td className="log-actor">{entry.person}</td>
        )}
        {!isMobile && (
          <td className="log-assignee">{entry.assignee ?? ""}</td>
        )}
        <td className="log-target">{targetName}</td>
      </tr>

      {expanded && (
        <tr
          className="log-detail-row"
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          aria-expanded={expanded}
        >
          <td colSpan={colSpan} className="log-detail-cell">
            <div className="log-detail-content">
              <div className="detail-item">
                <span className="detail-label">Timestamp</span>
                <span className="detail-value">{fullTimestamp}</span>
              </div>

              <div className="detail-item">
                <span className="detail-label">Action</span>
                <span className="detail-value">{entry.action}</span>
              </div>

              <div className="detail-item">
                <span className="detail-label">Target Type</span>
                <span className="detail-value">{targetType}</span>
              </div>

              <div className="detail-item">
                <span className="detail-label">Actor</span>
                <span className="detail-value">{entry.person}</span>
              </div>

              <div className="detail-item">
                <span className="detail-label">Target</span>
                <span className="detail-value">{targetName}</span>
              </div>

              {entry.reassigned_to && (
                <div className="detail-item">
                  <span className="detail-label">Reassigned To</span>
                  <span className="detail-value">{entry.reassigned_to}</span>
                </div>
              )}

              {entry.assignee && (
                <div className="detail-item">
                  <span className="detail-label">Assignee</span>
                  <span className="detail-value">{entry.assignee}</span>
                </div>
              )}

              {entry.field_name && (
                <div className="detail-item">
                  <span className="detail-label">Field</span>
                  <span className="detail-value">{entry.field_name}</span>
                </div>
              )}

              {entry.old_value !== undefined && entry.old_value !== null && (
                <div className="detail-item">
                  <span className="detail-label">Old Value</span>
                  <span className="detail-value">{entry.old_value}</span>
                </div>
              )}

              {entry.new_value !== undefined && entry.new_value !== null && (
                <div className="detail-item">
                  <span className="detail-label">New Value</span>
                  <span className="detail-value">{entry.new_value}</span>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function Log() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [page, setPage] = useState(0);
  const isMobile = useBreakpoint();

  const filters = (() => {
    const f = {};
    const person = searchParams.get("person");
    const chore_id = searchParams.get("chore_id");
    const action = searchParams.get("action");
    const start_date = searchParams.get("start_date");
    const end_date = searchParams.get("end_date");

    if (person) f.person = person;
    if (chore_id && /^\d+$/.test(chore_id)) f.chore_id = chore_id;
    if (action) f.action = action;
    if (start_date && /^\d{4}-\d{2}-\d{2}$/.test(start_date)) f.start_date = start_date;
    if (end_date && /^\d{4}-\d{2}-\d{2}$/.test(end_date)) f.end_date = end_date;

    return f;
  })();

  const { data: logEntries = [], isLoading: logLoading } = useQuery({
    queryKey: ["log", filters],
    queryFn: () => getLog(filters),
  });

  const { data: people = [] } = useQuery({
    queryKey: ["people"],
    queryFn: getPeople,
  });

  const { data: chores = [] } = useQuery({
    queryKey: ["chores"],
    queryFn: getChores,
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

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    // On mobile, show time-only; on tablet/desktop, show full date and time
    if (isMobile) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    return date.toLocaleString();
  };

  // Number of visible columns (for colSpan on detail rows)
  const colSpan = isMobile ? 3 : 6;

  return (
    <div className="log">
      <div className="page-header">
        <h2>Log</h2>
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
          <label htmlFor="filter-person">Filter by person</label>
          <select
            id="filter-person"
            value={searchParams.get("person") || ""}
            onChange={(e) => handleFilterChange("person", e.target.value)}
          >
            <option value="">All people</option>
            <option value="system">System</option>
            <option value="schedule">Schedule</option>
            {people.map((p) => (
              <option key={p.id} value={p.name}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="filter-chore">Filter by chore</label>
          <select
            id="filter-chore"
            value={searchParams.get("chore_id") || ""}
            onChange={(e) => handleFilterChange("chore_id", e.target.value)}
          >
            <option value="">All chores</option>
            {chores.map((c) => (
              <option key={c.unique_id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="filter-action">Filter by action</label>
          <select
            id="filter-action"
            value={searchParams.get("action") || ""}
            onChange={(e) => handleFilterChange("action", e.target.value)}
          >
            <option value="">All actions</option>
            {ACTIONS.map((a) => (
              <option key={a} value={a}>
                {a.charAt(0).toUpperCase() + a.slice(1)}
              </option>
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

      <div className="log-entries">
        {logLoading ? (
          <div className="loading">Loading log…</div>
        ) : logEntries.length === 0 ? (
          <div className="empty-state">No log entries match your filters.</div>
        ) : (
          <>
            <table className="log-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action</th>
                  {!isMobile && <th>Target Type</th>}
                  {!isMobile && <th>Actor</th>}
                  {!isMobile && <th>Assignee</th>}
                  <th>Target</th>
                </tr>
              </thead>
              <tbody>
                {logEntries.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE).map((entry) => (
                  <LogRow
                    key={entry.id}
                    entry={entry}
                    isMobile={isMobile}
                    formatTimestamp={formatTimestamp}
                    colSpan={colSpan}
                  />
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
                Page {page + 1} of {Math.ceil(logEntries.length / PAGE_SIZE)}
              </span>
              <button
                className="btn-secondary"
                onClick={() => setPage(page + 1)}
                disabled={(page + 1) * PAGE_SIZE >= logEntries.length}
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
