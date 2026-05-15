import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getThemes, getDefaultTheme, setDefaultTheme, saveTheme, deleteTheme, renameTheme, updateTheme } from "../api/client";
import { DEFAULT_THEME_COLORS } from "../utils/theme";
import "./ThemeSettings.css";

const DEFAULT_THEME_IDS = ["dark", "light", "charcoal", "paper", "pink", "frog"];

const FULL_HEX_RE = /^#[0-9a-fA-F]{6}$/;
function isValidHex(val) {
  return FULL_HEX_RE.test(val);
}
const PROTECTED_THEME_IDS = ["dark", "light"];
const PREVIEW_COLORS = ["primary", "secondary", "accent", "bg"];

export default function ThemeSettings() {
  const queryClient = useQueryClient();
  const [customizing, setCustomizing] = useState(false);
  const [customizingTheme, setCustomizingTheme] = useState(null); // Track which theme is being edited
  const [customName, setCustomName] = useState("");
  const [customColors, setCustomColors] = useState({});
  const [hexInputs, setHexInputs] = useState({});
  const [error, setError] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [renameTarget, setRenameTarget] = useState(null);
  const [renameName, setRenameName] = useState("");

  const { data: themes = [], isLoading: themesLoading } = useQuery({
    queryKey: ["themes"],
    queryFn: getThemes,
  });

  const { data: defaultTheme, isLoading: defaultLoading, refetch: refetchDefaultTheme } = useQuery({
    queryKey: ["default-theme"],
    queryFn: getDefaultTheme,
  });

  const setDefaultThemeMutation = useMutation({
    mutationFn: (themeId) => setDefaultTheme(themeId),
    onSuccess: async () => {
      await refetchDefaultTheme();
      // Also invalidate default-theme-info so the Preferences page label stays fresh
      queryClient.invalidateQueries({ queryKey: ["default-theme-info"] });
      setError(null);
    },
    onError: (err) => {
      setError(err.message || "Failed to set default theme");
    },
  });

  const saveThemeMutation = useMutation({
    mutationFn: (data) => saveTheme(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["themes"] });
      queryClient.invalidateQueries({ queryKey: ["default-theme"] });
      setCustomizing(false);
      setCustomizingTheme(null);
      setCustomName("");
      setCustomColors({});
      setHexInputs({});
      setError(null);
    },
    onError: (err) => {
      setError(err.message || "Failed to save theme");
    },
  });

  const updateThemeMutation = useMutation({
    mutationFn: ({ themeId, name, colors }) => updateTheme(themeId, { name, colors }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["themes"] });
      queryClient.invalidateQueries({ queryKey: ["default-theme"] });
      setCustomizing(false);
      setCustomizingTheme(null);
      setCustomName("");
      setCustomColors({});
      setHexInputs({});
      setError(null);
    },
    onError: (err) => {
      setError(err.message || "Failed to update theme");
    },
  });

  const deleteThemeMutation = useMutation({
    mutationFn: (themeId) => deleteTheme(themeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["themes"] });
      queryClient.invalidateQueries({ queryKey: ["default-theme"] });
      setDeleteTarget(null);
      setError(null);
    },
    onError: (err) => {
      setError(err.message || "Failed to delete theme");
    },
  });

  const renameThemeMutation = useMutation({
    mutationFn: ({ themeId, name }) => renameTheme(themeId, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["themes"] });
      setRenameTarget(null);
      setRenameName("");
      setError(null);
    },
    onError: (err) => {
      setError(err.message || "Failed to rename theme");
    },
  });

  const handleCustomize = (theme = null) => {
    const themeToCustomize = theme || defaultTheme;
    if (themeToCustomize?.colors) {
      setCustomColors({ ...themeToCustomize.colors });
      setHexInputs({ ...themeToCustomize.colors });
      setCustomName(theme ? themeToCustomize.name : `${themeToCustomize.name} Custom`);
      setCustomizingTheme(theme ? themeToCustomize.id : null);
      setCustomizing(true);
    }
  };

  const handleCopyTheme = (theme) => {
    if (theme?.colors) {
      setCustomColors({ ...theme.colors });
      setHexInputs({ ...theme.colors });
      setCustomName(`${theme.name} Copy`);
      setCustomizingTheme(null);
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

    if (customizingTheme) {
      // Editing existing custom theme
      updateThemeMutation.mutate({
        themeId: customizingTheme,
        name: customName,
        colors: customColors,
      });
    } else {
      // Creating new custom theme
      saveThemeMutation.mutate({ name: customName, colors: customColors });
    }
  };

  const handleRenameSubmit = () => {
    if (!renameName.trim()) {
      setError("Theme name cannot be empty");
      return;
    }
    renameThemeMutation.mutate({ themeId: renameTarget.id, name: renameName });
  };

  if (themesLoading || defaultLoading) return <div className="loading">Loading themes…</div>;

  return (
    <div className="theme-settings">
      <h3>Themes</h3>

      {error && <div className="error-message">{error}</div>}

      {!customizing ? (
        <>
          <p className="theme-description">
            Default theme used for users who have not set a personal preference.
          </p>

          <div className="themes-list">
            {themes.map((theme) => {
              const isProtected = PROTECTED_THEME_IDS.includes(theme.id);
              const isBuiltIn = DEFAULT_THEME_IDS.includes(theme.id);
              const isCustom = !isBuiltIn;
              return (
                <div key={theme.id} className={`theme-card-wrapper ${defaultTheme?.id === theme.id ? "active" : ""}`}>
                  <button
                    className={`theme-card ${defaultTheme?.id === theme.id ? "theme-active" : ""}`}
                    onClick={() => setDefaultThemeMutation.mutate(theme.id)}
                    disabled={setDefaultThemeMutation.isPending}
                  >
                    <div className="theme-name">{theme.name}</div>
                    <div className="theme-preview">
                      {PREVIEW_COLORS.map((colorKey) => (
                        <div
                          key={colorKey}
                          className="color-sample"
                          style={{ backgroundColor: theme.colors[colorKey] }}
                        />
                      ))}
                    </div>
                    <div className="theme-actions">
                      {isCustom && (
                        <button
                          className="action-btn edit-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCustomize(theme);
                          }}
                          title="Edit theme"
                          aria-label={`Edit ${theme.name}`}
                        >
                          <span className="material-icons">edit</span>
                        </button>
                      )}
                      <button
                        className="action-btn copy-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyTheme(theme);
                        }}
                        title="Copy theme"
                        aria-label={`Copy ${theme.name}`}
                      >
                        <span className="material-icons">content_copy</span>
                      </button>
                      {isCustom && (
                        <>
                          <button
                            className="action-btn rename-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              setRenameTarget(theme);
                              setRenameName(theme.name);
                            }}
                            title="Rename theme"
                            aria-label={`Rename ${theme.name}`}
                          >
                            <span className="material-icons">drive_file_rename_outline</span>
                          </button>
                          <button
                            className="action-btn delete-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteTarget(theme);
                            }}
                            title="Delete theme"
                            aria-label={`Delete ${theme.name}`}
                          >
                            <span className="material-icons">delete</span>
                          </button>
                        </>
                      )}
                    </div>
                  </button>
                </div>
              );
            })}
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button className="btn-primary" onClick={() => handleCustomize()}>
              Customize Current Theme
            </button>
          </div>
        </>
      ) : (
        <div className="theme-editor">
          <input
            type="text"
            placeholder="Theme name"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            disabled={saveThemeMutation.isPending || updateThemeMutation.isPending}
          />

          <div className="color-inputs">
            {["bg", "surface", "surface2", "accent", "primary", "secondary", "success", "warning", "error"].map((key) => (
              <div key={key} className="color-input-group">
                <label htmlFor={`color-text-${key}`}>{key.charAt(0).toUpperCase() + key.slice(1)}</label>
                <div className="color-input-row">
                  <input
                    id={`color-text-${key}`}
                    type="text"
                    value={hexInputs[key] ?? customColors[key] ?? DEFAULT_THEME_COLORS[key]}
                    onChange={(e) => {
                      const raw = e.target.value;
                      const val = raw.startsWith("#") ? raw : `#${raw}`;
                      setHexInputs((prev) => ({ ...prev, [key]: val }));
                      if (isValidHex(val)) {
                        handleColorChange(key, val.toLowerCase());
                      }
                    }}
                    disabled={saveThemeMutation.isPending || updateThemeMutation.isPending}
                    placeholder="#rrggbb"
                    maxLength={7}
                    spellCheck={false}
                    aria-label={`${key} hex`}
                  />
                  <input
                    id={`color-${key}`}
                    type="color"
                    value={customColors[key] || DEFAULT_THEME_COLORS[key]}
                    onChange={(e) => {
                      const val = e.target.value;
                      handleColorChange(key, val);
                      setHexInputs((prev) => ({ ...prev, [key]: val }));
                    }}
                    disabled={saveThemeMutation.isPending || updateThemeMutation.isPending}
                    aria-label={`${key} picker`}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="editor-actions">
            <button
              className="btn-primary"
              onClick={handleSaveCustom}
              disabled={saveThemeMutation.isPending || updateThemeMutation.isPending}
            >
              {customizingTheme ? "Update Theme" : "Save Theme"}
            </button>
            <button
              className="btn-secondary"
              onClick={() => {
                setCustomizing(false);
                setCustomizingTheme(null);
                setHexInputs({});
              }}
              disabled={saveThemeMutation.isPending || updateThemeMutation.isPending}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {renameTarget && (
        <div className="modal-overlay" onClick={() => !renameThemeMutation.isPending && setRenameTarget(null)}>
          <div className="modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Rename theme</h2>
              <button
                className="modal-close btn-secondary"
                onClick={() => setRenameTarget(null)}
                disabled={renameThemeMutation.isPending}
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <input
                type="text"
                placeholder="New theme name"
                value={renameName}
                onChange={(e) => setRenameName(e.target.value)}
                disabled={renameThemeMutation.isPending}
                autoFocus
              />
              <div className="confirm-actions">
                <button
                  className="btn-secondary"
                  onClick={() => setRenameTarget(null)}
                  disabled={renameThemeMutation.isPending}
                >
                  Cancel
                </button>
                <button
                  className="btn-primary"
                  onClick={handleRenameSubmit}
                  disabled={renameThemeMutation.isPending}
                >
                  {renameThemeMutation.isPending ? "Renaming…" : "Rename"}
                </button>
              </div>
            </div>
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
                  className="btn-error"
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
