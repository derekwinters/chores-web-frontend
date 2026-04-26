import React, { useState } from "react";
import "./RedemptionModal.css";

export default function RedemptionModal({ person, onClose, onRedeemSuccess }) {
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState("input"); // input or confirm

  const availablePoints = (person?.display_points ?? person?.points) ?? 0;

  const handleAmountChange = (e) => {
    setAmount(e.target.value);
    setError("");
  };

  const handleNext = () => {
    const numAmount = Number(amount);

    if (!amount || Number.isNaN(numAmount)) {
      setError("Please enter a valid amount");
      return;
    }

    if (numAmount <= 0) {
      setError("Amount must be positive");
      return;
    }

    if (numAmount > availablePoints) {
      setError(`Amount cannot exceed available points (${availablePoints})`);
      return;
    }

    setError("");
    setStep("confirm");
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onRedeemSuccess(Number(amount));
      setLoading(false);
      onClose();
    } catch (err) {
      setLoading(false);
      setError(err.message || "Redemption failed");
    }
  };

  const handleBack = () => {
    setStep("input");
    setError("");
  };

  return (
    <div className="redemption-modal-overlay" onClick={onClose}>
      <div className="redemption-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Redeem Points</h2>
          <button className="close-btn" onClick={onClose} disabled={loading}>
            ✕
          </button>
        </div>

        <div className="modal-content">
          {step === "input" && (
            <>
              <div className="info-section">
                <p className="user-name">{person?.name}</p>
                <div className="available-points-display">
                  <div className="available-number">{availablePoints}</div>
                  <div className="available-label">Available Points</div>
                </div>
              </div>

              <div className="input-section">
                <label htmlFor="redemption-amount">Amount to Redeem</label>
                <input
                  id="redemption-amount"
                  type="number"
                  min="1"
                  max={availablePoints}
                  value={amount}
                  onChange={handleAmountChange}
                  placeholder="0"
                  disabled={loading || availablePoints === 0}
                  autoFocus
                />
              </div>

              {availablePoints === 0 && (
                <p className="no-points">No points available to redeem</p>
              )}

              {error && <p className="error-message">{error}</p>}
            </>
          )}

          {step === "confirm" && (
            <>
              <div className="confirmation-section">
                <p className="confirm-text">
                  Redeem <strong>{amount} points</strong> for <strong>{person?.name}</strong>?
                </p>
                <div className="confirm-details">
                  <p>
                    Current available: <strong>{availablePoints}</strong>
                  </p>
                  <p>
                    After redemption: <strong>{availablePoints - Number(amount)}</strong>
                  </p>
                </div>
              </div>

              {error && <p className="error-message">{error}</p>}
            </>
          )}
        </div>

        <div className="modal-footer">
          {step === "input" && (
            <>
              <button className="btn-cancel" onClick={onClose} disabled={loading}>
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleNext}
                disabled={loading || !amount || availablePoints === 0}
              >
                Next
              </button>
            </>
          )}

          {step === "confirm" && (
            <>
              <button className="btn-cancel" onClick={handleBack} disabled={loading}>
                Back
              </button>
              <button className="btn-danger" onClick={handleConfirm} disabled={loading}>
                {loading ? "Redeeming..." : "Confirm Redemption"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
