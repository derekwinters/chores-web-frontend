import React from "react";
import { MdCheckCircle, MdSkipNext, MdEdit, MdHistory, MdDelete, MdAlarm } from "react-icons/md";

// Button styles are global (index.css, imported by .storybook/preview.js):
// pill radius, component-button padding, label-large type role.

export default {
  title: "Buttons",
};

const row = {
  display: "flex",
  alignItems: "center",
  gap: "var(--space-md)",
  flexWrap: "wrap",
};

/**
 * All .btn-* variants + disabled — pairs with the Android golden
 * buttons_primarysecondary_<theme>.png (ComponentSnapshotTest.ButtonCatalog).
 */
export const PrimarySecondary = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-lg)" }}>
      <div style={row}>
        <button className="btn-primary">Save chore</button>
        <button className="btn-secondary">Cancel</button>
      </div>
      <div style={row}>
        <button className="btn-success">Complete</button>
        <button className="btn-warning">Skip</button>
        <button className="btn-error">Delete</button>
        <button className="btn-saving" disabled>
          Saving…
        </button>
      </div>
      <div style={row}>
        <button className="btn-primary" disabled>
          Save chore
        </button>
        <button className="btn-secondary" disabled>
          Cancel
        </button>
        <button className="btn-error" disabled>
          Delete
        </button>
      </div>
    </div>
  ),
};

/**
 * Flat .icon-action buttons (in-card row): transparent background with the
 * decided tint mapping — Complete → success, Delete → error, rest text-muted.
 */
export const IconActions = {
  render: () => (
    <div
      style={{
        ...row,
        background: "var(--surface)",
        borderRadius: "var(--component-card-radius)",
        padding: "var(--space-md)",
        width: "fit-content",
      }}
    >
      <button className="icon-action success" title="Complete">
        <MdCheckCircle />
      </button>
      <button className="icon-action" title="Skip">
        <MdSkipNext />
      </button>
      <button className="icon-action" title="Mark due now">
        <MdAlarm />
      </button>
      <button className="icon-action" title="Edit">
        <MdEdit />
      </button>
      <button className="icon-action" title="History">
        <MdHistory />
      </button>
      <button className="icon-action error" title="Delete">
        <MdDelete />
      </button>
      <button className="icon-action" title="Disabled" disabled>
        <MdEdit />
      </button>
    </div>
  ),
};
