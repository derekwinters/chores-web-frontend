export const DEFAULT_THEME_COLORS = {
  bg: "#f0ede6",
  surface: "#faf8f3",
  surface2: "#f0ede6",
  accent: "#b8860b",
  primary: "#8b6914",
  secondary: "#7a7a6a",
  success: "#558b2f",
  warning: "#e0860b",
  error: "#d32f2f",
};

function getBrightness(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000;
}

export function applyTheme(colors) {
  const root = document.documentElement;
  root.style.setProperty("--bg", colors.bg);
  root.style.setProperty("--surface", colors.surface);
  root.style.setProperty("--surface2", colors.surface2);
  root.style.setProperty("--accent", colors.accent);
  root.style.setProperty("--primary", colors.primary);
  root.style.setProperty("--secondary", colors.secondary);
  root.style.setProperty("--success", colors.success);
  root.style.setProperty("--warning", colors.warning);
  root.style.setProperty("--error", colors.error);

  // Keep *-rgb vars in sync so rgba(var(--*-rgb), alpha) patterns work
  const syncRgb = (varName, hex) => {
    if (!hex) return;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    root.style.setProperty(varName, `${r},${g},${b}`);
  };
  syncRgb("--error-rgb", colors.error);
  syncRgb("--success-rgb", colors.success);
  syncRgb("--accent-rgb", colors.accent);
  syncRgb("--warning-rgb", colors.warning);

  const bgBrightness = getBrightness(colors.bg);
  if (bgBrightness > 128) {
    root.style.setProperty("--text", "#1a1a1a");
    root.style.setProperty("--text-muted", "#555555");
  } else {
    root.style.setProperty("--text", "#dce8f5");
    root.style.setProperty("--text-muted", "#7899b8");
  }
}

export function getCurrentThemeColors() {
  const root = document.documentElement;
  return {
    bg: root.style.getPropertyValue("--bg"),
    surface: root.style.getPropertyValue("--surface"),
    surface2: root.style.getPropertyValue("--surface2"),
    accent: root.style.getPropertyValue("--accent"),
    primary: root.style.getPropertyValue("--primary"),
    secondary: root.style.getPropertyValue("--secondary"),
    success: root.style.getPropertyValue("--success"),
    warning: root.style.getPropertyValue("--warning"),
    error: root.style.getPropertyValue("--error"),
  };
}
