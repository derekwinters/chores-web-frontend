import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getThemes, getCurrentTheme, setTheme, saveTheme, deleteTheme } from "../api/client";
import { applyTheme } from "../utils/theme";
import "./ThemeSettings.css";

const DEFAULT_THEME_IDS = ["dark", "light", "charcoal", "paper", "pink", "frog"];

export default function ThemeSettings() {
  const queryClient = useQueryClient();
  const [customizing, setCustomizing] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customColors, setCustomColors] = useState({});
  const [error, setError] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data: themes = [], isLoading: themesLoading } = useQuery({
    queryKey: ["themes"],
    queryFn: getThemes,
  });

  const { data: currentTheme, isLoading: currentLoading, refetch: refetchCurrentTheme } = useQuery({
    queryKey: ["current-theme"],
    queryFn: getCurrentTheme,
  });

  useEffect(() => {
    if (currentTheme?.colors) {
      applyTheme(currentTheme.colors);
    }
  }, [currentTheme]);

  const setThemeMutation = useMutation({
    mutationFn: (themeId) => setTheme(themeId),
    onSuccess: async (data) => {
      applyTheme(data.colors);
      await refetchCurrentTheme();
      setError(null);
    },
    onError: (err) => {
      setError(err.message || "Failed to set theme");
    },
  });

  const saveThemeMutation = useMutation({
    mutationFn: (data) => saveTheme(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["themes"] });
      queryClient.invalidateQueries({ queryKey: ["current-theme"] });
      setCustomizing(false);
      setCustomName("");
      setCustomColors({});
      setError(null);
    },
    onError: (err) => {
      setError(err.message || "Failed to save theme");
    },
  });

  const deleteThemeMutation = useMutation({
    mutationFn: (themeId) => deleteTheme(themeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["themes"] });
      queryClient.invalidateQueries({ queryKey: ["current-theme"] });
      setDeleteTarget(null);
      setError(null);
    },
    onError: (err) => {
      setError(err.message || "Failed to delete theme");
    },
  });

  const handleCustomize = () => {
    if (currentTheme?.colors) {
      setCustomColors({ ...currentTheme.colors });
      setCustomName(`${currentTheme.name} Custom`);
      setCustomizing(true);
    }
  };

  const handleColorChange = (key, value) => {
    setCustomColors((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveCustom = () => {
    if (!customName.trim()) {
      setError("Theme name cannot be empty");
      return;
    }
    saveThemeMutation.mutate({ name: customName, colors: customColors });
  };

  if (themesLoading || currentLoading) return <div className="loading">Loading themes…</div>;

  return (
    <div className="theme-settings">
      <h3>Themes</h3>

      {error && <div className="error-message">{error}</div>}

      {!customizing ? (
        <>
          <div className="themes-list">
            {themes.map((theme) => {
              const isCustom = !DEFAULT_THEME_IDS.includes(theme.id);
              return (
                <div key={theme.id} className={`theme-card-wrapper ${currentTheme?.id === theme.id ? "active" : ""}`}>
                  <button
                    className={`theme-card ${currentTheme?.id === theme.id ? "theme-active" : ""}`}
                    onClick={() => setThemeMutation.mutate(theme.id)}
                    disabled={setThemeMutation.isPending}
                  >
                    <div className="theme-name">{theme.name}</div>
                    <div className="theme-preview">
                      <div className="color-sample" style={{ backgroundColor: theme.colors.bg }} />
                      <div className="color-sample" style={{ backgroundColor: theme.colors.surface }} />
                      <div className="color-sample" style={{ backgroundColor: theme.colors.accent }} />
                    </div>
                  </button>
                  {isCustom && (
                    <button
                      className="theme-delete-btn btn-danger btn-xs"
                      onClick={() => setDeleteTarget(theme)}
                      disabled={deleteThemeMutation.isPending}
                      aria-label={`Delete ${theme.name}`}
                    >
                      🗑️
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <button className="btn-primary" onClick={handleCustomize}>
            Customize Current Theme
          </button>
        </>
      ) : (
        <div className="theme-editor">
          <input
            type="text"
            placeholder="Theme name"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            disabled={saveThemeMutation.isPending}
          />

          <div className="color-inputs">
            {["bg", "surface", "accent", "success", "warning", "danger"].map((key) => (
              <div key={key} className="color-input-group">
                <label htmlFor={`color-${key}`}>{key.charAt(0).toUpperCase() + key.slice(1)}</label>
                <input
                  id={`color-${key}`}
                  type="color"
                  value={customColors[key] || "#000000"}
                  onChange={(e) => handleColorChange(key, e.target.value)}
                  disabled={saveThemeMutation.isPending}
                />
              </div>
            ))}
          </div>

          <div className="editor-actions">
            <button
              className="btn-primary"
              onClick={handleSaveCustom}
              disabled={saveThemeMutation.isPending}
            >
              Save Theme
            </button>
            <button
              className="btn-secondary"
              onClick={() => setCustomizing(false)}
              disabled={saveThemeMutation.isPending}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="modal-overlay" onClick={() => !deleteThemeMutation.isPending && setDeleteTarget(null)}>
          <div className="modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Delete theme?</h2>
              <button
                className="modal-close btn-secondary"
                onClick={() => setDeleteTarget(null)}
                disabled={deleteThemeMutation.isPending}
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p>Delete <strong>{deleteTarget.name}</strong>? This action cannot be undone.</p>
              <div className="confirm-actions">
                <button
                  className="btn-secondary"
                  onClick={() => setDeleteTarget(null)}
                  disabled={deleteThemeMutation.isPending}
                >
                  Cancel
                </button>
                <button
                  className="btn-danger"
                  onClick={() => deleteThemeMutation.mutate(deleteTarget.id)}
                  disabled={deleteThemeMutation.isPending}
                >
                  {deleteThemeMutation.isPending ? "Deleting…" : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
