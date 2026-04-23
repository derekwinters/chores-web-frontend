import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { getLog, getUserStats } from "../api/client";
import "./UserDetail.css";

const USER_ACTIVITY_ACTIONS = ["completed", "skipped", "reassigned"];

export default function UserDetail() {
  const { userName = "" } = useParams();
  const navigate = useNavigate();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["user-stats", userName],
    queryFn: () => getUserStats(userName),
    enabled: Boolean(userName),
  });

  const { data: history = [], isLoading: historyLoading } = useQuery({
    queryKey: ["log", { person: userName, actions: USER_ACTIVITY_ACTIONS }],
    queryFn: () => getLog({ person: userName, actions: USER_ACTIVITY_ACTIONS }),
    enabled: Boolean(userName),
  });

  if (statsLoading || historyLoading) return <div className="loading">Loading…</div>;

  return (
    <div className="user-detail">
      <button className="back-btn" onClick={() => navigate(-1)} aria-label="Back">
        ← Back
      </button>

      <div className="user-detail-header">
        <h1>{userName}</h1>
      </div>

      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Total Points</div>
            <div className="stat-value">{stats.total_points}</div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Last 7 Days</div>
            <div className="stat-value">{stats.points_7d}</div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Last 30 Days</div>
            <div className="stat-value">{stats.points_30d}</div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Completed</div>
            <div className="stat-value">{stats.completed_count}</div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Skipped</div>
            <div className="stat-value">{stats.skipped_count}</div>
          </div>
        </div>
      )}

      <div className="history-section">
        <h2>History</h2>
        {history.length === 0 ? (
          <p className="empty-history">No history yet</p>
        ) : (
          <div className="history-list">
            {history.map((entry) => (
              <div key={entry.id} className="history-entry">
                <div className="entry-chore">{entry.chore_name}</div>
                <div className="entry-action">{entry.action}</div>
                <div className="entry-time">
                  {new Date(entry.timestamp).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
