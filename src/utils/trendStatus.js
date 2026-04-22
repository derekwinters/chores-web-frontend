export function getTrendStatus(points, goal) {
  if (goal === 0) return "ahead";
  const ratio = points / goal;
  if (ratio >= 0.8) return "ahead";
  if (ratio < 0.5) return "behind";
  return "on-track";
}

export function getTrendColor(status) {
  const colors = {
    ahead: "#3db87a",
    "on-track": "#e8a930",
    behind: "#e05c6a",
  };
  return colors[status] || "#dce8f5";
}
