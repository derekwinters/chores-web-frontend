import React, { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { getLog, getUserStats, getPeople, getRedemptionHistory, redeemPoints } from "../api/client";
import RedemptionModal from "../components/RedemptionModal";
import "./UserDetail.css";

const USER_ACTIVITY_ACTIONS = ["completed", "skipped", "reassigned"];

export default function UserDetail() {
  const { userName = "" } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showRedemptionModal, setShowRedemptionModal] = useState(false);

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

  const { data: people = [] } = useQuery({
    queryKey: ["people"],
    queryFn: getPeople,
  });

  const personId = useMemo(() => {
    const person = people.find((p) => p.name === userName);
    return person?.id;
  }, [people, userName]);

  const { data: redemptions = [], isLoading: redemptionsLoading } = useQuery({
    queryKey: ["redemptions", personId],
    queryFn: () => getRedemptionHistory(personId),
    enabled: Boolean(personId),
  });

  const handleRedeemSuccess = async (amount) => {
    await redeemPoints(personId, amount);
    queryClient.invalidateQueries({ queryKey: ["user-stats", userName] });
    queryClient.invalidateQueries({ queryKey: ["redemptions", personId] });
    setShowRedemptionModal(false);
  };

  if (statsLoading || historyLoading || redemptionsLoading) return <div className="loading">Loading…</div>;

  return (
    <div className="user-detail">
      <button className="back-btn" onClick={() => navigate(-1)} aria-label="Back">
        ← Back
      </button>

      <div className="user-detail-header">
        <h1>{userName}</h1>
      </div>

      {stats && (
        <>
          <div className="stats-grid">
            <div className="stat-card total-earned-card">
              <div className="stat-label">Available</div>
              <div className="stat-value">{stats.display_points ?? stats.total_points}</div>
              {stats.display_points > 0 && (
                <button className="redeem-btn" onClick={() => setShowRedemptionModal(true)}>
                  Redeem Points
                </button>
              )}
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
              <div className="stat-label">Redeemed</div>
              <div className="stat-value">{stats.points_redeemed ?? 0}</div>
            </div>

            <div className="stat-card">
              <div className="stat-label">Completed</div>
              <div className="stat-value">{stats.completed_count}</div>
            </div>
          </div>
        </>
      )}

      <div className="history-section">
        <h2>Chore Activity</h2>
        {history.length === 0 ? (
          <p className="empty-history">No activity yet</p>
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

      <div className="redemption-section">
        <h2>Redemption History</h2>
        {redemptions.length === 0 ? (
          <p className="empty-history">No redemptions yet</p>
        ) : (
          <div className="redemption-list">
            {redemptions.map((entry) => (
              <div key={entry.id} className="redemption-entry">
                <div className="redemption-amount">{entry.amount} points</div>
                <div className="redemption-redeemed-by">by {entry.redeemed_by}</div>
                <div className="redemption-time">
                  {new Date(entry.timestamp).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showRedemptionModal && stats && (
        <RedemptionModal
          person={stats}
          onClose={() => setShowRedemptionModal(false)}
          onRedeemSuccess={handleRedeemSuccess}
        />
      )}
    </div>
  );
}
