import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
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

// Mock useBlocker — MemoryRouter doesn't provide a data router context
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useBlocker: (_shouldBlock) => ({ state: "unblocked", proceed: vi.fn(), reset: vi.fn() }),
  };
});

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

  it("calls updateConfig when Save is clicked after a change", async () => {
    client.updateConfig.mockResolvedValue({
      title: "Family Chores",
      auth_enabled: false,
      timezone: "UTC",
      due_soon_days: 3,
    });
    wrap();
    await waitFor(() => {
      expect(screen.getByLabelText(/require authentication/i).checked).toBe(true);
    });
    fireEvent.click(screen.getByLabelText(/require authentication/i));
    screen.getByRole("button", { name: /^save$/i }).click();
    await waitFor(() => {
      expect(client.updateConfig).toHaveBeenCalledWith({ auth_enabled: false });
    });
  });

  it("does not render Due Soon Threshold section", async () => {
    wrap();
    await waitFor(() => {
      expect(screen.getByText("Authentication")).toBeInTheDocument();
    });
    expect(screen.queryByText("Due Soon Threshold")).not.toBeInTheDocument();
  });

  // Behavior 7: SettingsAuth dirty tracking
  it("Save button has btn-save--idle class on initial load", async () => {
    wrap();
    await waitFor(() => {
      expect(screen.getByLabelText(/require authentication/i)).toBeInTheDocument();
    });
    const btn = screen.getByRole("button", { name: /^save$/i });
    expect(btn).toHaveClass("btn-save--idle");
    expect(btn).toBeDisabled();
  });

  it("Save button gains btn-save--dirty class after checkbox change", async () => {
    wrap();
    await waitFor(() => {
      expect(screen.getByLabelText(/require authentication/i).checked).toBe(true);
    });
    fireEvent.click(screen.getByLabelText(/require authentication/i));
    const btn = screen.getByRole("button", { name: /^save$/i });
    expect(btn).toHaveClass("btn-save--dirty");
    expect(btn).not.toBeDisabled();
  });

  it("Save button returns to btn-save--idle after successful save", async () => {
    client.updateConfig.mockResolvedValue({
      title: "Family Chores",
      auth_enabled: false,
      timezone: "UTC",
      due_soon_days: 3,
    });
    wrap();
    await waitFor(() => {
      expect(screen.getByLabelText(/require authentication/i).checked).toBe(true);
    });
    fireEvent.click(screen.getByLabelText(/require authentication/i));
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /^save$/i })).toHaveClass("btn-save--idle");
    });
  });

  it("registers beforeunload handler when dirty", async () => {
    const addSpy = vi.spyOn(window, "addEventListener");
    wrap();
    await waitFor(() => {
      expect(screen.getByLabelText(/require authentication/i)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByLabelText(/require authentication/i));
    await waitFor(() => {
      const calls = addSpy.mock.calls.filter(([event]) => event === "beforeunload");
      expect(calls.length).toBeGreaterThan(0);
    });
  });
});
