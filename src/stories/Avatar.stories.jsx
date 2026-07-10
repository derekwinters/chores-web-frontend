import React from "react";
import Avatar from "../components/Avatar";

// Avatar contract (mapping matrix): circle, accent fill, bold initial;
// avatar.md 32 (top-bar menu) / 44 (user card) / avatar.hero 128.

export default {
  title: "Avatar",
};

export const Sizes = {
  render: () => (
    <div style={{ display: "flex", alignItems: "flex-end", gap: "var(--space-lg)" }}>
      <Avatar name="Derek" size={32} />
      <Avatar name="Alice" size={44} />
      <Avatar name="Quinn" size={128} />
      <Avatar name="" size={44} />
    </div>
  ),
};
