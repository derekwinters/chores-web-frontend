import React, { useState, useRef, useEffect } from "react";
import { getPersonColor } from "../utils/personColors";
import "./UserAvatarMenu.css";

export default function UserAvatarMenu({ user, onLogout, onSettings, directSettings = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const color = user.color || getPersonColor(user.name);

  const handleSettings = () => {
    setIsOpen(false);
    onSettings?.();
  };

  const handleAvatarClick = () => {
    if (directSettings) {
      onSettings?.();
    } else {
      setIsOpen(!isOpen);
    }
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    setIsOpen(false);
    onLogout();
  };

  return (
    <div className="user-avatar-menu" ref={menuRef}>
      <button
        className="user-avatar-btn"
        onClick={handleAvatarClick}
        aria-label={directSettings ? "Settings" : `${user.name} user menu`}
      >
        <div
          className="user-avatar"
          style={{ backgroundColor: color }}
        >
          {user.name.charAt(0).toUpperCase()}
        </div>
        <span className="user-name">{user.name}</span>
      </button>

      {!directSettings && isOpen && (
        <div className="avatar-dropdown">
          <div className="dropdown-header">{user.name}</div>
          <button
            className="dropdown-btn"
            onClick={handleSettings}
            aria-label="Settings"
          >
            Settings
          </button>
          <button
            className="logout-btn"
            onClick={handleLogout}
            aria-label="Logout"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
