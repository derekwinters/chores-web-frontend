import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import "./SettingsLayout.css";

const SETTINGS_NAV = [
  { path: "/settings/general", label: "General" },
  { path: "/settings/auth", label: "Auth" },
  { path: "/settings/chores", label: "Chores" },
  { path: "/settings/theme", label: "Theme" },
  { path: "/settings/data", label: "Data" },
  { path: "/settings/about", label: "About" },
];

export default function SettingsLayout({ onTitleUpdate }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user?.is_admin) {
    return (
      <div className="admin-denied">
        <h2>Access Denied</h2>
        <p>You must be an administrator to access this page.</p>
        <button className="btn-primary" onClick={() => navigate("/")}>
          Go Home
        </button>
      </div>
    );
  }

  return (
    <div className="settings-layout">
      <nav className="settings-subnav">
        <h2 className="settings-subnav-heading">Settings</h2>
        <hr className="settings-subnav-rule" />
        <ul>
          {SETTINGS_NAV.map(({ path, label }) => (
            <li key={path}>
              <NavLink
                to={path}
                className={({ isActive }) =>
                  isActive ? "subnav-link subnav-link--active" : "subnav-link"
                }
              >
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <div className="settings-content">
        <Outlet context={{ onTitleUpdate }} />
      </div>
    </div>
  );
}
