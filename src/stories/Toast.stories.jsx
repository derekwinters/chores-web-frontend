import React from "react";
import Toast from "../components/Toast";

// Toast/Snackbar contract (mapping matrix): slide-up + fade duration.md,
// radius.md (component-toast-radius), elevation.3. Renders fixed at the
// bottom of the viewport — one variant per story so they don't overlap.

export default {
  title: "Toast",
  parameters: { layout: "fullscreen" },
};

const noop = () => {};

export const Default = {
  render: () => (
    <div style={{ height: "100vh" }}>
      <Toast message="Chore completed" onDone={noop} />
    </div>
  ),
};

export const Error = {
  render: () => (
    <div style={{ height: "100vh" }}>
      <Toast message="Failed to save chore" variant="error" onDone={noop} />
    </div>
  ),
};
