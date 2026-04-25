import React, { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPersonColor } from "../utils/personColors";
import { getThemes, getCurrentTheme, setTheme } from "../api/client";
import { applyTheme } from "../utils/theme";
import "./UserAvatarMenu.css";

export default function UserAvatarMenu({ user, onLogout, onSettings, isAdmin = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const menuRef = useRef(null);
  const queryClient = useQueryClient();
  const color = user.color || getPersonColor(user.name);

  const { data: themes = [] } = useQuery({
    queryKey: ["themes"],
    queryFn: getThemes,
  });

  const { data: currentTheme } = useQuery({
    queryKey: ["current-theme"],
    queryFn: getCurrentTheme,
  });

  const setThemeMutation = useMutation({
    mutationFn: (themeId) => setTheme(themeId),
    onSuccess: async (data) => {
      applyTheme(data.colors);
      await queryClient.refetchQueries({ queryKey: ["current-theme"] });
    },
  });

  const handleProfile = () => {
    setShowThemePicker(true);
  };

  const handleSettings = () => {
    setIsOpen(false);
    setShowThemePicker(false);
    onSettings?.();
  };

  const handleThemeSelect = (themeId) => {
    setThemeMutation.mutate(themeId);
  };

  const handleAvatarClick = () => {
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
        setShowThemePicker(false);
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
        aria-label={`${user.name} user menu`}
      >
        <div
          className="user-avatar"
          style={{ backgroundColor: color }}
        >
          {user.name.charAt(0).toUpperCase()}
        </div>
        <span className="user-name">{user.name}</span>
      </button>

      {isOpen && !showThemePicker && (
        <div className="avatar-dropdown">
          <div className="dropdown-header">{user.name}</div>
          <button
            className="dropdown-btn"
            onClick={handleProfile}
            aria-label="Profile"
          >
            Profile
          </button>
          {isAdmin && (
            <button
              className="dropdown-btn"
              onClick={handleSettings}
              aria-label="Settings"
            >
              Settings
            </button>
          )}
          <button
            className="logout-btn"
            onClick={handleLogout}
            aria-label="Logout"
          >
            Logout
          </button>
        </div>
      )}

      {isOpen && showThemePicker && (
        <div className="avatar-dropdown theme-picker-dropdown">
          <div className="dropdown-header">Choose Theme</div>
          <div className="themes-grid">
            {themes.map((theme) => (
              <button
                key={theme.id}
                className={`theme-option ${currentTheme?.id === theme.id ? "theme-active" : ""}`}
                onClick={() => handleThemeSelect(theme.id)}
                disabled={setThemeMutation.isPending}
                title={theme.name}
              >
                <div className="theme-name">{theme.name}</div>
                <div className="theme-colors">
                  <div className="color-dot" style={{ backgroundColor: theme.colors.bg }} />
                  <div className="color-dot" style={{ backgroundColor: theme.colors.surface }} />
                  <div className="color-dot" style={{ backgroundColor: theme.colors.accent }} />
                </div>
              </button>
            ))}
          </div>
          <button
            className="dropdown-btn back-btn"
            onClick={() => setShowThemePicker(false)}
            aria-label="Back"
          >
            ← Back
          </button>
        </div>
      )}
    </div>
  );
}
