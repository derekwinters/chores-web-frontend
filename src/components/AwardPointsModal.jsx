import React, { useState } from "react";
import "./AwardPointsModal.css";

/**
 * Admin-only modal to award one-time points to a person with a required reason.
 * `onAwardSuccess(points, reason)` performs the API call and any cache
 * invalidation; it may throw, and its message is surfaced inline.
 */
export default function AwardPointsModal({ person, onClose, onAwardSuccess }) {
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const displayName = person?.name ?? person?.username ?? "";

  const handleSubmit = async () => {
    const numAmount = Number(amount);

    if (!amount || Number.isNaN(numAmount) || !Number.isInteger(numAmount)) {
      setError("Please enter a whole number of points");
      return;
    }
    if (numAmount <= 0) {
      setError("Points must be a positive number");
      return;
    }
    if (!reason.trim()) {
      setError("A reason is required");
      return;
    }

    setError("");
    setLoading(true);
    try {
      await onAwardSuccess(numAmount, reason.trim());
      setLoading(false);
      onClose();
    } catch (err) {
      setLoading(false);
      setError(err.message || "Failed to award points");
    }
  };

  return (
    <div className="award-modal-overlay" onClick={onClose}>
      <div
        className="award-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Award points"
      >
        <div className="award-modal-header">
          <h2>Award Points</h2>
          <button
            className="award-close-btn"
            onClick={onClose}
            disabled={loading}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="award-modal-content">
          <p className="award-user-name">{displayName}</p>

          <div className="award-field">
            <label htmlFor="award-amount">Points to award</label>
            <input
              id="award-amount"
              type="number"
              min="1"
              step="1"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setError("");
              }}
              placeholder="0"
              disabled={loading}
              autoFocus
            />
          </div>

          <div className="award-field">
            <label htmlFor="award-reason">Reason</label>
            <input
              id="award-reason"
              type="text"
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setError("");
              }}
              placeholder="e.g. Helping with gardening"
              disabled={loading}
              required
            />
          </div>

          {error && (
            <p className="award-error-message" role="alert">
              {error}
            </p>
          )}
        </div>

        <div className="award-modal-footer">
          <button className="btn-cancel" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button
            className="btn-primary"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Awarding…" : "Award Points"}
          </button>
        </div>
      </div>
    </div>
  );
}
