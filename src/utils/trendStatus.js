export function getTrendStatus(points, goal) {
  if (goal === 0) return "ahead";
  const ratio = points / goal;
  if (ratio >= 0.8) return "ahead";
  if (ratio < 0.5) return "behind";
  return "on-track";
}

export function getTrendColor(status) {
  const colors = {
    ahead: "var(--success)",
    "on-track": "var(--warning)",
    behind: "var(--error)",
  };
  return colors[status] || "var(--text)";
}
