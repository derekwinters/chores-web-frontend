import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getNotifications, ackNotification } from "../api/client";
import Toast from "../components/Toast";
import "./Notifications.css";

// Derive a display state from the notification's server timestamps. Dismissal
// is terminal, then acknowledgement, else unread. The log fetch retains
// acknowledged and dismissed rows (include_dismissed=true); the server never
// returns pre-dismissed rows to a client, so anything here was seen at least
// once.
function stateOf(n) {
  if (n.dismissed_at) return "dismissed";
  if (n.acknowledged_at) return "acknowledged";
  return "unread";
}

const STATE_LABELS = {
  unread: "Unread",
  acknowledged: "Acknowledged",
  dismissed: "Dismissed",
};

export default function Notifications() {
  const queryClient = useQueryClient();
  const [toast, setToast] = useState(null); // null | { message, variant }

  // Distinct query key from the badge poll so acknowledged/dismissed items are
  // retained in the log view. Newest-first ordering is the server's (backend#39).
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications", "log"],
    queryFn: () => getNotifications({ include_dismissed: true }),
  });

  const ackMutation = useMutation({
    mutationFn: (id) => ackNotification(id),
    // Prefix invalidation refreshes both the badge poll (["notifications"]) and
    // this log query (["notifications", "log"]) so the count and row state move
    // together. Ack is idempotent server-side; a 404 surfaces via the toast.
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (err) =>
      setToast({
        message: err.message || "Failed to acknowledge notification",
        variant: "error",
      }),
  });

  return (
    <div className="notifications-page">
      <div className="page-header">
        <h1>Notifications</h1>
      </div>

      {isLoading ? (
        <div className="loading">Loading…</div>
      ) : notifications.length === 0 ? (
        <p className="notifications-empty">You have no notifications.</p>
      ) : (
        <div className="notification-log-list">
          {notifications.map((n) => {
            const state = stateOf(n);
            return (
              <div
                key={n.id}
                className={`notification-log-row notification-log-row--${state}`}
              >
                <div className="notification-log-row-main">
                  <div className="notification-log-row-header">
                    <span className="notification-log-row-title">{n.title}</span>
                    <span className="notification-log-row-state micro-label">
                      {STATE_LABELS[state]}
                    </span>
                  </div>
                  {n.body && (
                    <p className="notification-log-row-body">{n.body}</p>
                  )}
                  {n.created_at && (
                    <time
                      className="notification-log-row-time"
                      dateTime={n.created_at}
                    >
                      {new Date(n.created_at).toLocaleString()}
                    </time>
                  )}
                </div>
                {state === "unread" && (
                  <button
                    type="button"
                    className="btn-secondary notification-log-row-ack"
                    onClick={() => ackMutation.mutate(n.id)}
                    disabled={ackMutation.isPending}
                  >
                    Acknowledge
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {toast && (
        <Toast
          message={toast.message}
          variant={toast.variant}
          onDone={() => setToast(null)}
        />
      )}
    </div>
  );
}
