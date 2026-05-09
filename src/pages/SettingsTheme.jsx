import React from "react";
import ThemeSettings from "../components/ThemeSettings";
import "./Settings.css";

export default function SettingsTheme() {
  return (
    <div className="settings-page">
      <section className="settings-section">
        <h3>Theme</h3>
        <hr />
        <ThemeSettings />
      </section>
    </div>
  );
}
