import React from "react";
import "../components/ChoreForm.css";

// Form-field contract (mapping matrix "TextField"): radius.xs,
// component-form-field padding, outlined style, 3px accent focus ring @
// alpha.tint-subtle, uppercase micro labels. Outlined is the only allowed
// text-field style on both platforms. Pairs with the Android golden
// textfield_outlined_<theme>.png (filled + empty-with-label).

export default {
  title: "TextField",
};

export const Outlined = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-lg)", maxWidth: 400 }}>
      <div className="form-row">
        <label htmlFor="tf-filled">Name</label>
        <input id="tf-filled" type="text" defaultValue="Take out trash" />
      </div>
      <div className="form-row">
        <label htmlFor="tf-focused">Points</label>
        {/* autoFocus → the 3px accent focus ring; the visual-regression
            script hides the caret so this stays deterministic. */}
        <input id="tf-focused" type="number" defaultValue={5} autoFocus />
      </div>
      <div className="form-row">
        <label htmlFor="tf-empty">Assignee</label>
        <input id="tf-empty" type="text" placeholder="Unassigned" />
      </div>
      <div className="form-error">Name is required.</div>
    </div>
  ),
};
