import { getToken, clearToken } from "../utils/auth";

const BASE = import.meta.env.VITE_API_URL ?? "/api/v1";

// Fallback error messages for HTTP status codes
const STATUS_CODE_FALLBACK = {
  400: "Invalid input — check your values",
  401: "Session expired, please log in",
  403: "You don't have permission to do that",
  404: "Not found",
  409: "Already exists",
  422: "Invalid input — check your values",
  500: "Something went wrong. Please try again.",
  503: "Service unavailable, please try again later",
};

async function request(method, path, body) {
  const headers = {};

  if (body) {
    headers["Content-Type"] = "application/json";
  }

  const token = getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    if (res.status === 401) {
      clearToken();
    }
    // Use backend detail if available, otherwise use status code fallback
    const errorMessage = detail.detail ?? STATUS_CODE_FALLBACK[res.status] ?? `Error: ${res.statusText}`;
    throw new Error(errorMessage);
  }
  if (res.status === 204) return null;
  return res.json();
}

// Chores
export const getChores = () => request("GET", "/chores");
export const createChore = (data) => request("POST", "/chores", data);
export const updateChore = (id, data) => request("PUT", `/chores/${id}`, data);
export const deleteChore = (id) => request("DELETE", `/chores/${id}`);

export const completeChore = (id, completedBy) =>
  request("POST", `/chores/${id}/complete`, completedBy ? { completed_by: completedBy } : {});
export const skipChore = (id) => request("POST", `/chores/${id}/skip`);
export const skipReassignChore = (id, assignee) =>
  request("POST", `/chores/${id}/skip-reassign`, { assignee: assignee ?? null });
export const reassignChore = (id, assignee) =>
  request("POST", `/chores/${id}/reassign`, { assignee });
export const markDueChore = (id) => request("POST", `/chores/${id}/mark-due`);

// People
export const getPeople = () => request("GET", "/people");
export const createPerson = (name, password) => {
  const username = name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  return request("POST", "/people", { name, username, password });
};
export const updatePerson = (id, data) => request("PUT", `/people/${id}`, data);
export const deletePerson = (id) => request("DELETE", `/people/${id}`);
export const getRedemptionHistory = (personId) => request("GET", `/people/${personId}/redemptions`);

// Points
export const getLeaderboard = () => request("GET", "/points");
export const getPointsSummary = () => request("GET", "/points/summary");
export const getPersonHistory = (person) => request("GET", `/points/${person}`);

// One-time admin point award (chores-web-backend#13). ADMIN-ONLY: non-admins
// get 403. `person` is the recipient's username. Appends a Points Log Credit
// and a `points_awarded` Activity Log entry recording who granted it and why.
// Backend validates: blank reason → 422, non-positive points → 422, unknown
// person → 404.
export const awardPoints = (person, points, reason) =>
  request("POST", "/points/award", { person, points, reason });

// Log
export const getLog = (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.person) params.append("person", filters.person);
  if (filters.chore_id) params.append("chore_id", filters.chore_id);
  if (filters.action) params.append("action", filters.action);
  if (filters.actions) {
    filters.actions.forEach((action) => params.append("actions", action));
  }
  if (filters.start_date) params.append("start_date", filters.start_date);
  if (filters.end_date) params.append("end_date", filters.end_date);
  const queryString = params.toString();
  return request("GET", `/log${queryString ? `?${queryString}` : ""}`);
};

export const getLogRetention = () => request("GET", "/log/retention");
export const setLogRetention = (retentionDays) =>
  request("POST", "/log/retention", { retention_days: retentionDays });

// User stats
export const getUserStats = (person) => request("GET", `/points/stats/${person}`);

// Config
export const getConfig = () => request("GET", "/config");
export const updateConfig = (data) => request("PUT", "/config", data);

// Update Check (backend's own admin-configured polling of its own releases —
// authenticated, distinct from the public /version endpoint below)
export const getUpdateCheckStatus = () => request("GET", "/config/updates/status");
export const triggerUpdateCheck = () => request("POST", "/config/updates/check");
export const configureUpdateChecking = (enabled, intervalHours) =>
  request("PUT", "/config/updates/config", { enabled, interval_hours: intervalHours });

// Backend Version (public, unauthenticated; chores-web-backend#27). Unlike
// request(), this hits the unversioned root path — same convention as
// /status/db-status — and is deliberately allowed to throw so callers can
// implement their own graceful-degradation UI (see SettingsAbout.jsx).
export const getBackendVersion = () =>
  fetch("/version").then(async (res) => {
    if (!res.ok) {
      throw new Error(`Backend version check failed: ${res.status}`);
    }
    return res.json();
  });

// Backend status (public, unauthenticated; chores-web-backend#16). Hits the
// UNVERSIONED `/status/` path that nginx proxies to the backend — same
// convention as /status/db-status, deliberately NOT under /api/v1. Returns
// { version, api_version, versions }: the backend app version, its current
// API major (e.g. "v1"), and the list of API majors it still supports. Like
// getBackendVersion() this is allowed to throw so the About page can degrade
// gracefully when the backend predates this endpoint or is unreachable.
export const getStatus = () =>
  fetch("/status/").then(async (res) => {
    if (!res.ok) {
      throw new Error(`Backend status check failed: ${res.status}`);
    }
    return res.json();
  });

// Notifications
// Caller-scoped, newest-first (chores-web-backend#39). Query params (`since`
// ISO datetime, `include_dismissed` bool) are appended only when provided,
// mirroring getLog's URLSearchParams idiom. Side effect: GET marks returned
// notifications delivered — the first time an item is returned here the
// backend sets its delivered_at (the server owns delivery state).
export const getNotifications = (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.since) params.append("since", filters.since);
  if (filters.include_dismissed !== undefined)
    params.append("include_dismissed", filters.include_dismissed);
  const queryString = params.toString();
  return request("GET", `/notifications${queryString ? `?${queryString}` : ""}`);
};

// Returns the updated notification. Backend 404s for a nonexistent id or one
// belonging to another person; idempotent for an already-acked notification.
export const ackNotification = (id) => request("POST", `/notifications/${id}/ack`);

// Per-type preference map, e.g. { chore_due: true }. Every known type is
// present; an absent row means enabled.
export const getNotificationPreferences = () =>
  request("GET", "/notifications/preferences");

// Accepts the same per-type map shape and returns the resulting map.
export const putNotificationPreferences = (prefs) =>
  request("PUT", "/notifications/preferences", prefs);

// Theme
export const getThemes = () => request("GET", "/theme/list");
export const getCurrentTheme = () => request("GET", "/theme/current");
export const getDefaultTheme = () => request("GET", "/theme/default");
export const getDefaultThemeInfo = () => request("GET", "/theme/default-info");
export const setDefaultTheme = (themeId) => request("PUT", `/theme/default/${themeId}`);
export const clearPersonalTheme = () => request("DELETE", "/theme/personal");
export const setTheme = (themeId) => request("POST", `/theme/set/${themeId}`);
export const saveTheme = (data) => request("POST", "/theme/save", data);
export const deleteTheme = (themeId) => request("DELETE", `/theme/delete/${themeId}`);
export const updateTheme = (themeId, data) => request("PATCH", `/theme/update/${themeId}`, data);
export const renameTheme = (themeId, name) => request("PATCH", `/theme/rename/${themeId}`, { name });

// Auth
export const getSetupStatus = () =>
  request("GET", "/auth/setup-status");

export const login = (username, password) =>
  request("POST", "/auth/login", { username, password });

export const getCurrentUser = () =>
  request("GET", "/auth/me");

export const logout = () =>
  request("POST", "/auth/logout");

export const changePassword = (oldPassword, newPassword) =>
  request("PUT", "/auth/password", { old_password: oldPassword, new_password: newPassword });

export const getAuthLog = (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.username) params.append("username", filters.username);
  if (filters.action) params.append("action", filters.action);
  if (filters.start_date) params.append("start_date", filters.start_date);
  if (filters.end_date) params.append("end_date", filters.end_date);
  const queryString = params.toString();
  return request("GET", `/auth/log${queryString ? `?${queryString}` : ""}`);
};

export const resetPassword = (resetToken, newPassword) => {
  // Use raw fetch since request() would strip the 403 response
  return fetch(`${BASE}/auth/password/reset`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${resetToken}`,
    },
    body: JSON.stringify({ new_password: newPassword }),
  }).then(async (res) => {
    if (!res.ok) {
      const detail = await res.json().catch(() => ({}));
      throw new Error(detail.detail ?? `Error: ${res.statusText}`);
    }
    return res.json();
  });
};

/**
 * Login with 403/password-reset detection.
 * Returns the normal LoginResponse on success, or
 * { requiresReset: true, resetToken: string } when the server requests a password reset.
 */
export async function loginWithResetSupport(username, password) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (res.status === 403) {
    const body = await res.json();
    const detail = typeof body.detail === "object" ? body.detail : body;
    return { requiresReset: true, resetToken: detail.reset_token };
  }

  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail.detail ?? "Invalid credentials");
  }

  return res.json();
}

// Redemptions
export const redeemPoints = (personId, amount) =>
  request("POST", `/people/${personId}/redeem`, { amount });

// Admin DB
export const getAdminPointsLog = (params = {}) => {
  const query = new URLSearchParams();
  if (params.limit !== undefined) query.append("limit", params.limit);
  if (params.offset !== undefined) query.append("offset", params.offset);
  const qs = query.toString();
  return request("GET", `/admin/db/points-log${qs ? `?${qs}` : ""}`);
};
export const updateAdminPointsLog = (id, data) =>
  request("PATCH", `/admin/db/points-log/${id}`, data);
export const deleteAdminPointsLog = (id) =>
  request("DELETE", `/admin/db/points-log/${id}`);

// Export/Import
export const exportConfig = () => request("GET", "/export/config");

export const importConfig = (data) => request("POST", "/import/config", data);
