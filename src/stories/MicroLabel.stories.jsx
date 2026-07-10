import React from "react";

// .micro-label utility (index.css): typography.micro-label token role —
// label-small + weight 600 + uppercase + 0.05em tracking + text-muted.
// The recurring uppercase column/label pattern shared with Compose.

export default {
  title: "MicroLabel",
};

export const Examples = {
  render: () => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-md)",
        background: "var(--surface)",
        borderRadius: "var(--component-card-radius)",
        padding: "var(--space-lg)",
        width: "fit-content",
      }}
    >
      <span className="micro-label">Last 7 Days</span>
      <span className="micro-label">Status</span>
      <span className="micro-label">Frequency</span>
      <span className="micro-label">Assignee</span>
    </div>
  ),
};
