import React, { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { MdFilterList } from "react-icons/md";
import { getLog, getPeople, getChores } from "../api/client";
import "./Log.css";

const ACTIONS = ["completed", "skipped", "reassigned", "created", "deleted", "updated"];

const PAGE_SIZE = 20;

export default function Log() {
  const [filters, setFilters] = useState({});
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [page, setPage] = useState(0);

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
    setFilters((prev) => ({
      ...prev,
      [key]: value || undefined,
    }));
    setPage(0);
  }, []);

  const handleClearFilters = () => {
    setFilters({});
    setPage(0);
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

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
            value={filters.person || ""}
            onChange={(e) => handleFilterChange("person", e.target.value)}
          >
            <option value="">All people</option>
            <option value="system">System</option>
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
            value={filters.chore_id || ""}
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
            value={filters.action || ""}
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
            value={filters.start_date || ""}
            onChange={(e) => handleFilterChange("start_date", e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label htmlFor="filter-end-date">End date</label>
          <input
            id="filter-end-date"
            type="date"
            value={filters.end_date || ""}
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
                  <th>Target Type</th>
                  <th>Actor</th>
                  <th>Target</th>
                  <th>Content</th>
                </tr>
              </thead>
              <tbody>
                {logEntries.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE).map((entry) => {
                  const targetType = entry.chore_name.startsWith("Person:") ? "user" : "chore";
                  const targetName = entry.chore_name.replace("Person: ", "");
                  let content = "—";
                  if (entry.field_name) {
                    content = `${entry.field_name}: ${entry.old_value} → ${entry.new_value}`;
                  } else if (entry.reassigned_to) {
                    content = `Reassigned to ${entry.reassigned_to}`;
                  }

                  return (
                    <tr key={entry.id} className="log-table-row">
                      <td className="log-timestamp">{formatTimestamp(entry.timestamp)}</td>
                      <td className="log-action">
                        <span className="action-badge">
                          {entry.action}
                        </span>
                      </td>
                      <td className="log-target-type">
                        <span className="target-badge">{targetType}</span>
                      </td>
                      <td className="log-actor">{entry.person}</td>
                      <td className="log-target">{targetName}</td>
                      <td className="log-content">{content}</td>
                    </tr>
                  );
                })}
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
