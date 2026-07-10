import React from "react";
import "../components/Log.css";
import "../components/ChoreList.css";
import "../pages/Chores.css";

// Pill badge contract (mapping matrix): radius.pill, 10x4 padding, fill =
// semantic @ alpha.tint (0.15), label-medium text. Decided action colors:
// completed/created → success; skipped/marked_due/reassigned → warning;
// deleted → error; else text-muted. Targets (decision 5): person →
// secondary, chore → primary. The real markup lives inside Log.jsx /
// ChoreList.jsx rows (fetch-coupled), so the catalog snapshots the same CSS
// classes on plain spans. Pairs with the Android golden
// pillbadge_variants_<theme>.png.

export default {
  title: "PillBadge",
};

const group = {
  display: "flex",
  alignItems: "center",
  gap: "var(--space-sm)",
  flexWrap: "wrap",
};

export const Variants = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-lg)", maxWidth: 640 }}>
      <span className="micro-label">Activity log — action</span>
      <div style={group}>
        <span className="action-badge action-badge--completed">Completed</span>
        <span className="action-badge action-badge--created">Created</span>
        <span className="action-badge action-badge--skipped">Skipped</span>
        <span className="action-badge action-badge--marked_due">Marked Due</span>
        <span className="action-badge action-badge--reassigned">Reassigned</span>
        <span className="action-badge action-badge--deleted">Deleted</span>
        <span className="action-badge action-badge--updated">Updated</span>
      </div>
      <span className="micro-label">Activity log — target</span>
      <div style={group}>
        <span className="target-badge target-badge--chore">chore</span>
        <span className="target-badge target-badge--user">user</span>
      </div>
      <span className="micro-label">Chore state</span>
      <div style={group}>
        <span className="chore-state-badge due">Due</span>
        <span className="chore-state-badge complete">Complete</span>
        <span className="state-pill due">due</span>
        <span className="state-pill complete">complete</span>
      </div>
    </div>
  ),
};
