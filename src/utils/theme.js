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
  root.style.setProperty("--success", colors.success);
  root.style.setProperty("--warning", colors.warning);
  root.style.setProperty("--danger", colors.danger);

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
    accent: root.style.getPropertyValue("--accent"),
    success: root.style.getPropertyValue("--success"),
    warning: root.style.getPropertyValue("--warning"),
    danger: root.style.getPropertyValue("--danger"),
  };
}
