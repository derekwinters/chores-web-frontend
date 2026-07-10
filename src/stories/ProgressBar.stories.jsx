import React from "react";
import ProgressBar from "../components/ProgressBar";
import "../components/UserCard.css";

// Goal progress bars as used in UserCard (accent fill, pill track).

export default {
  title: "ProgressBar",
};

export const Levels = {
  render: () => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-lg)",
        maxWidth: 320,
        background: "var(--surface)",
        borderRadius: "var(--component-card-radius)",
        padding: "var(--space-lg)",
      }}
    >
      <div>
        <div className="micro-label">Last 7 Days</div>
        <ProgressBar value={3} max={10} color="var(--accent)" />
      </div>
      <div>
        <div className="micro-label">Last 30 Days</div>
        <ProgressBar value={24} max={30} color="var(--accent)" />
      </div>
      <div>
        <div className="micro-label">Goal met</div>
        <ProgressBar value={30} max={30} color="var(--success)" />
      </div>
    </div>
  ),
};
