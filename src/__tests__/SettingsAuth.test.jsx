import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Routes, Route, Outlet } from "react-router-dom";
import SettingsAuth from "../pages/SettingsAuth";
import * as client from "../api/client";

vi.mock("../api/client");
vi.mock("../contexts/AuthContext", () => ({
  AuthProvider: ({ children }) => children,
  useAuth: () => ({ user: { username: "admin", is_admin: true }, logout: vi.fn() }),
}));

// Minimal layout wrapper that provides outlet context
function LayoutWithContext({ onTitleUpdate }) {
  return <Outlet context={{ onTitleUpdate }} />;
}

function wrap(props = {}) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={["/settings/auth"]}>
        <Routes>
          <Route path="/settings" element={<LayoutWithContext onTitleUpdate={props.onTitleUpdate} />}>
            <Route path="auth" element={<SettingsAuth />} />
          </Route>
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("SettingsAuth", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    client.getConfig.mockResolvedValue({
      title: "Family Chores",
      auth_enabled: true,
      timezone: "UTC",
      due_soon_days: 3,
    });
  });

  it("renders the Authentication section heading", async () => {
    wrap();
    await waitFor(() => {
      expect(screen.getByText("Authentication")).toBeInTheDocument();
    });
  });

  it("renders Require Authentication checkbox pre-populated from config", async () => {
    wrap();
    await waitFor(() => {
      const checkbox = screen.getByLabelText(/require authentication/i);
      expect(checkbox.checked).toBe(true);
    });
  });

  it("renders checkbox unchecked when auth_enabled is false", async () => {
    client.getConfig.mockResolvedValue({
      title: "Family Chores",
      auth_enabled: false,
      timezone: "UTC",
      due_soon_days: 3,
    });
    wrap();
    await waitFor(() => {
      const checkbox = screen.getByLabelText(/require authentication/i);
      expect(checkbox.checked).toBe(false);
    });
  });

  it("shows description text when auth is enabled", async () => {
    wrap();
    await waitFor(() => {
      expect(screen.getByText("Users must log in to access the app")).toBeInTheDocument();
    });
  });

  it("shows description text when auth is disabled", async () => {
    client.getConfig.mockResolvedValue({
      title: "Family Chores",
      auth_enabled: false,
      timezone: "UTC",
      due_soon_days: 3,
    });
    wrap();
    await waitFor(() => {
      expect(screen.getByText("App is accessible without authentication")).toBeInTheDocument();
    });
  });

  it("calls updateConfig when Save is clicked", async () => {
    client.updateConfig.mockResolvedValue({
      title: "Family Chores",
      auth_enabled: true,
      timezone: "UTC",
      due_soon_days: 3,
    });
    wrap();
    await waitFor(() => {
      expect(screen.getByLabelText(/require authentication/i)).toBeInTheDocument();
    });
    screen.getByRole("button", { name: /^save$/i }).click();
    await waitFor(() => {
      expect(client.updateConfig).toHaveBeenCalledWith({ auth_enabled: true });
    });
  });

  it("does not render Due Soon Threshold section", async () => {
    wrap();
    await waitFor(() => {
      expect(screen.getByText("Authentication")).toBeInTheDocument();
    });
    expect(screen.queryByText("Due Soon Threshold")).not.toBeInTheDocument();
  });
});
