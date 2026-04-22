import { getToken, clearToken } from "../utils/auth";

const BASE = import.meta.env.VITE_API_URL ?? "/api";

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

  if (res.status === 401) {
    clearToken();
    window.location.href = "/";
  }

  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail.detail ?? `HTTP ${res.status}`);
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
  request("POST", `/chores/${id}/complete`, { completed_by: completedBy ?? null });
export const skipChore = (id) => request("POST", `/chores/${id}/skip`);
export const skipReassignChore = (id, assignee) =>
  request("POST", `/chores/${id}/skip-reassign`, { assignee: assignee ?? null });
export const reassignChore = (id, assignee) =>
  request("POST", `/chores/${id}/reassign`, { assignee });
export const markDueChore = (id) => request("POST", `/chores/${id}/mark-due`);

// People
export const getPeople = () => request("GET", "/people");
export const createPerson = (name, password, color) => {
  const username = name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  return request("POST", "/people", { name, username, password, color });
};
export const updatePerson = (id, data) => request("PUT", `/people/${id}`, data);
export const deletePerson = (id) => request("DELETE", `/people/${id}`);

// Points
export const getLeaderboard = () => request("GET", "/points");
export const getPointsSummary = () => request("GET", "/points/summary");
export const getPersonHistory = (person) => request("GET", `/points/${person}`);

// Log
export const getLog = (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.person) params.append("person", filters.person);
  if (filters.chore_id) params.append("chore_id", filters.chore_id);
  if (filters.action) params.append("action", filters.action);
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

// Theme
export const getThemes = () => request("GET", "/theme/list");
export const getCurrentTheme = () => request("GET", "/theme/current");
export const setTheme = (themeId) => request("POST", `/theme/set/${themeId}`);
export const saveTheme = (data) => request("POST", "/theme/save", data);
export const deleteTheme = (themeId) => request("DELETE", `/theme/delete/${themeId}`);

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
