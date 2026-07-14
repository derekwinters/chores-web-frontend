import React from "react";
import NotificationPreferences from "../components/NotificationPreferences";

// Presentational component — props in, callbacks out — so no QueryClient is
// needed (the Preferences page owns the react-query wiring). Rows are derived
// from the preferences map's keys.

export default {
  title: "NotificationPreferences",
};

const noop = () => {};

export const AllEnabled = {
  render: () => (
    <NotificationPreferences
      preferences={{ chore_due: true }}
      onToggle={noop}
      onToggleAll={noop}
    />
  ),
};

export const PartiallyDisabled = {
  render: () => (
    <NotificationPreferences
      preferences={{ chore_due: false, weekly_summary: true }}
      onToggle={noop}
      onToggleAll={noop}
    />
  ),
};

export const DisabledWhileSaving = {
  render: () => (
    <NotificationPreferences
      preferences={{ chore_due: true }}
      onToggle={noop}
      onToggleAll={noop}
      disabled
    />
  ),
};
