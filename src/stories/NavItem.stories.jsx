import React from "react";
import { MdDashboard, MdCheckCircle, MdPeople, MdHistory, MdSettings } from "react-icons/md";
import "../App.css";

// Sidebar nav items (App.jsx): shared values with Android's NavigationBar —
// nav-item radius radius.sm, item padding space.md; active = surface2 fill.
// Web-only component (Android uses a bottom NavigationBar), same naming
// convention as the shared set.

export default {
  title: "NavItem",
};

export const States = {
  render: () => (
    <div style={{ width: 240, background: "var(--surface)", borderRadius: "var(--radius-md)" }}>
      <nav className="sidebar-nav">
        <a className="nav-active" href="#dashboard" onClick={(e) => e.preventDefault()}>
          <MdDashboard className="nav-icon" />
          <span className="nav-label">Dashboard</span>
        </a>
        <a className="nav-btn" href="#chores" onClick={(e) => e.preventDefault()}>
          <MdCheckCircle className="nav-icon" />
          <span className="nav-label">Chores</span>
        </a>
        <a className="nav-btn" href="#people" onClick={(e) => e.preventDefault()}>
          <MdPeople className="nav-icon" />
          <span className="nav-label">People</span>
        </a>
        <a className="nav-btn" href="#log" onClick={(e) => e.preventDefault()}>
          <MdHistory className="nav-icon" />
          <span className="nav-label">Activity Log</span>
        </a>
        <a className="nav-btn" href="#settings" onClick={(e) => e.preventDefault()}>
          <MdSettings className="nav-icon" />
          <span className="nav-label">Settings</span>
        </a>
      </nav>
    </div>
  ),
};
