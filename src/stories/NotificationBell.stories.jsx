import React from "react";
import NotificationBell from "../components/NotificationBell";

// Notification bell + badge contract (mapping matrix): badge sized/shaped by
// component-notification-badge-* (size 16, radius pill, padding-x), fill bound
// to the `accent` runtime slot — see docs/mapping-matrix.md in
// derekwinters/chores-web-design-tokens. Badge is hidden entirely at zero.
// Presentational (unreadCount + onClick), so no QueryClient/Router needed.

export default {
  title: "NotificationBell",
  component: NotificationBell,
};

const noop = () => {};

export const NoUnread = {
  render: () => <NotificationBell unreadCount={0} onClick={noop} />,
};

export const SingleDigit = {
  render: () => <NotificationBell unreadCount={3} onClick={noop} />,
};

export const DoubleDigit = {
  render: () => <NotificationBell unreadCount={12} onClick={noop} />,
};
