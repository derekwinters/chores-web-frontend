import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getThemes, getCurrentTheme, getDefaultThemeInfo, setTheme, clearPersonalTheme } from "../api/client";
import { applyTheme } from "../utils/theme";
import "./Preferences.css";

const PREVIEW_COLORS = ["primary", "secondary", "accent", "bg"];

export default function Preferences() {
  const queryClient = useQueryClient();

  const { data: themes = [], isLoading: themesLoading } = useQuery({
    queryKey: ["themes"],
    queryFn: getThemes,
  });

  const { data: currentTheme, isLoading: currentLoading } = useQuery({
    queryKey: ["current-theme"],
    queryFn: getCurrentTheme,
  });

  const { data: defaultThemeInfo, isLoading: defaultInfoLoading } = useQuery({
    queryKey: ["default-theme-info"],
    queryFn: getDefaultThemeInfo,
  });

  const setThemeMutation = useMutation({
    mutationFn: (themeId) => setTheme(themeId),
    onSuccess: async (data) => {
      applyTheme(data.colors);
      await queryClient.refetchQueries({ queryKey: ["current-theme"] });
    },
  });

  const clearThemeMutation = useMutation({
    mutationFn: clearPersonalTheme,
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ["current-theme"] });
      // Re-apply the default theme colors visually
      if (defaultThemeInfo) {
        const defaultTheme = themes.find((t) => t.id === defaultThemeInfo.id);
        if (defaultTheme) {
          applyTheme(defaultTheme.colors);
        }
      }
    },
  });

  const isPending = setThemeMutation.isPending || clearThemeMutation.isPending;

  if (themesLoading || currentLoading || defaultInfoLoading) {
    return <div className="loading">Loading preferences...</div>;
  }

  // The "Default" card is active when the user has no personal theme set
  const isDefaultActive = currentTheme && !currentTheme.is_personal;
  const defaultCardLabel = defaultThemeInfo
    ? `Default (${defaultThemeInfo.name})`
    : "Default";

  return (
    <div className="preferences-page">
      <div className="page-header">
        <h1>Preferences</h1>
      </div>

      <section className="preferences-section">
        <h2 className="preferences-section-heading">Theme</h2>
        <hr className="preferences-section-rule" />
        <p className="preferences-description">
          Choose your personal theme. This applies only to your account.
        </p>

        <div className="preferences-themes-list">
          {/* Default card — clears personal preference so the site default applies */}
          <button
            className={`preferences-theme-card preferences-theme-card--default ${isDefaultActive ? "preferences-theme-active" : ""}`}
            onClick={() => clearThemeMutation.mutate()}
            disabled={isPending}
            aria-pressed={isDefaultActive}
          >
            <div className="preferences-theme-name">{defaultCardLabel}</div>
            <div className="preferences-theme-preview">
              {defaultThemeInfo &&
                PREVIEW_COLORS.map((colorKey) => {
                  const defaultTheme = themes.find((t) => t.id === defaultThemeInfo.id);
                  return (
                    <div
                      key={colorKey}
                      className="preferences-color-sample"
                      style={{
                        backgroundColor: defaultTheme ? defaultTheme.colors[colorKey] : "transparent",
                      }}
                    />
                  );
                })}
            </div>
          </button>

          {themes.map((theme) => (
            <button
              key={theme.id}
              className={`preferences-theme-card ${currentTheme?.is_personal && currentTheme?.id === theme.id ? "preferences-theme-active" : ""}`}
              onClick={() => setThemeMutation.mutate(theme.id)}
              disabled={isPending}
              aria-pressed={currentTheme?.is_personal && currentTheme?.id === theme.id}
            >
              <div className="preferences-theme-name">{theme.name}</div>
              <div className="preferences-theme-preview">
                {PREVIEW_COLORS.map((colorKey) => (
                  <div
                    key={colorKey}
                    className="preferences-color-sample"
                    style={{ backgroundColor: theme.colors[colorKey] }}
                  />
                ))}
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
