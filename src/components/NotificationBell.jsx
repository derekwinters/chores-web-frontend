import React from "react";
import { MdNotifications } from "react-icons/md";
import "./NotificationBell.css";

/**
 * Presentational top-bar bell with an unread-count badge. Props in, callback
 * out — no data fetching (AppContent owns the poll via useNotifications), so it
 * renders in Storybook without a QueryClient or Router.
 *
 * Badge styling comes from the notification component tokens
 * (--component-notification-badge-*, design-tokens 0.4.0) and binds its fill to
 * the existing `accent` runtime slot per the mapping-matrix color contract in
 * derekwinters/chores-web-design-tokens (no new "info" slot — one event type in
 * v1). The badge is hidden entirely when there is nothing unread.
 *
 * @param {number} unreadCount count of unacknowledged notifications
 * @param {() => void} onClick invoked on click (AppContent navigates to /notifications)
 */
export default function NotificationBell({ unreadCount = 0, onClick }) {
  const hasUnread = unreadCount > 0;

  return (
    <button
      type="button"
      className="notification-bell"
      onClick={onClick}
      aria-label={
        hasUnread ? `Notifications, ${unreadCount} unread` : "Notifications"
      }
    >
      <MdNotifications />
      {hasUnread && (
        <span className="notification-bell-badge" aria-hidden="true">
          {unreadCount}
        </span>
      )}
    </button>
  );
}
