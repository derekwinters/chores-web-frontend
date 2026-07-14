import React from "react";
import "../pages/Preferences.css";

// Human-readable labels for known notification types. Unknown types fall back
// to a humanized version of the key, so a new backend event type renders
// without a client change (rows are derived from the map's keys).
const TYPE_LABELS = {
  chore_due: "Chore due",
};

function labelFor(type) {
  if (TYPE_LABELS[type]) return TYPE_LABELS[type];
  return type
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Presentational notification-preferences control. Props in, callbacks out —
 * no data fetching (the page owns the query/mutation), so it renders in
 * Storybook without a QueryClient.
 *
 * @param {Object} preferences per-type map, e.g. { chore_due: true }
 * @param {(type: string, enabled: boolean) => void} onToggle single-row toggle
 * @param {(enabled: boolean) => void} onToggleAll global toggle (writes all types)
 * @param {boolean} disabled disables every control (e.g. while saving)
 */
export default function NotificationPreferences({
  preferences,
  onToggle,
  onToggleAll,
  disabled = false,
}) {
  const types = Object.keys(preferences);
  // Global reads as "on" iff every type is enabled; the backend has no
  // separate global flag, so the page maps this to writing every type.
  const allEnabled = types.length > 0 && types.every((type) => preferences[type]);

  return (
    <div className="notification-prefs">
      <label className="notification-toggle-row notification-toggle-row--global">
        <span className="notification-toggle-label">Enable notifications</span>
        <input
          type="checkbox"
          role="switch"
          className="notification-toggle"
          checked={allEnabled}
          disabled={disabled}
          onChange={(e) => onToggleAll(e.target.checked)}
        />
      </label>

      {types.map((type) => (
        <label key={type} className="notification-toggle-row">
          <span className="notification-toggle-label">{labelFor(type)}</span>
          <input
            type="checkbox"
            role="switch"
            className="notification-toggle"
            checked={!!preferences[type]}
            disabled={disabled}
            onChange={(e) => onToggle(type, e.target.checked)}
          />
        </label>
      ))}
    </div>
  );
}
