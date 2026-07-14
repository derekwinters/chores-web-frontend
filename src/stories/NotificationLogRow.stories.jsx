import React from "react";
import "../pages/Notifications.css";

// Notification log-row contract (mapping matrix): rows use
// component-notification-log-row-* (padding, radius); unread rows carry the
// accent unread bar (unread-bar-width, 4px) and an accent tint at
// unread-fill-alpha composited over surface — fill bound to the `accent`
// runtime slot per docs/mapping-matrix.md in
// derekwinters/chores-web-design-tokens. The live markup lives in
// pages/Notifications.jsx (fetch-coupled), so the catalog snapshots the same
// CSS classes on plain divs, as PillBadge.stories.jsx does.

export default {
  title: "NotificationLogRow",
};

function Row({ state, title, body }) {
  return (
    <div className={`notification-log-row notification-log-row--${state}`}>
      <div className="notification-log-row-main">
        <div className="notification-log-row-header">
          <span className="notification-log-row-title">{title}</span>
          <span className="notification-log-row-state micro-label">
            {state.charAt(0).toUpperCase() + state.slice(1)}
          </span>
        </div>
        <p className="notification-log-row-body">{body}</p>
        <time className="notification-log-row-time">Apr 20, 2026, 10:00 AM</time>
      </div>
      {state === "unread" && (
        <button type="button" className="btn-secondary notification-log-row-ack">
          Acknowledge
        </button>
      )}
    </div>
  );
}

export const States = {
  render: () => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-md)",
        maxWidth: 640,
      }}
    >
      <Row
        state="unread"
        title="Dishes are due"
        body="Your chore “Dishes” is due today."
      />
      <Row
        state="acknowledged"
        title="Trash is due"
        body="Your chore “Trash” is due today."
      />
      <Row
        state="dismissed"
        title="Vacuum is due"
        body="Your chore “Vacuum” is due today."
      />
    </div>
  ),
};
