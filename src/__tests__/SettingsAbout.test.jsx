import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import SettingsAbout from "../pages/SettingsAbout";
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

function wrap() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <SettingsAbout />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("SettingsAbout", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    client.getConfig.mockResolvedValue({
      title: "Family Chores",
      auth_enabled: true,
      timezone: "UTC",
      due_soon_days: 3,
      update_check_enabled: true,
      update_check_interval: 24,
    });
    client.getUpdateCheckStatus.mockResolvedValue({
      current_version: "1.2.3",
      latest_version: "1.2.3",
      update_available: false,
      last_checked_at: null,
    });
  });

  it("renders the App Version section heading", () => {
    wrap();
    expect(screen.getByText("App Version")).toBeInTheDocument();
  });

  it("renders the Update Checker section heading", () => {
    wrap();
    expect(screen.getByText("Update Checker")).toBeInTheDocument();
  });

  it("displays the current version from the status endpoint", async () => {
    wrap();
    await waitFor(() => {
      // The version appears in both Current Version and Latest Version rows
      const matches = screen.getAllByText("1.2.3");
      expect(matches.length).toBeGreaterThan(0);
    });
  });

  it("shows Update Available banner when an update is available", async () => {
    client.getUpdateCheckStatus.mockResolvedValue({
      current_version: "1.0.0",
      latest_version: "2.0.0",
      update_available: true,
      last_checked_at: null,
    });
    wrap();
    await waitFor(() => {
      expect(screen.getByText(/update available/i)).toBeInTheDocument();
    });
  });

  it("does not show Update Available banner when up to date", async () => {
    wrap();
    await waitFor(() => {
      expect(screen.getAllByText("1.2.3").length).toBeGreaterThan(0);
    });
    expect(screen.queryByText(/update available/i)).not.toBeInTheDocument();
  });

  it("renders the Enable Update Checking checkbox pre-populated from config", async () => {
    wrap();
    await waitFor(() => {
      const checkbox = screen.getByLabelText(/enable update checking/i);
      expect(checkbox.checked).toBe(true);
    });
  });

  it("renders the Check Interval input pre-populated from config", async () => {
    wrap();
    await waitFor(() => {
      const input = screen.getByLabelText(/check interval/i);
      expect(input.value).toBe("24");
    });
  });

  it("reflects different config values when update_check_enabled is false", async () => {
    client.getConfig.mockResolvedValue({
      title: "Family Chores",
      auth_enabled: true,
      timezone: "UTC",
      due_soon_days: 3,
      update_check_enabled: false,
      update_check_interval: 12,
    });
    wrap();
    await waitFor(() => {
      const checkbox = screen.getByLabelText(/enable update checking/i);
      expect(checkbox.checked).toBe(false);
    });
    await waitFor(() => {
      const input = screen.getByLabelText(/check interval/i);
      expect(input.value).toBe("12");
    });
  });

  it("renders the Check Now button", async () => {
    wrap();
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /check now/i })
      ).toBeInTheDocument();
    });
  });

  it("renders the Save Settings button", async () => {
    wrap();
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /save settings/i })
      ).toBeInTheDocument();
    });
  });

  it("calls configureUpdateChecking when Save Settings is clicked after a change", async () => {
    client.configureUpdateChecking.mockResolvedValue({
      check_enabled: false,
      check_interval_hours: 24,
    });
    wrap();
    await waitFor(() => {
      expect(screen.getByLabelText(/enable update checking/i).checked).toBe(true);
    });
    fireEvent.click(screen.getByLabelText(/enable update checking/i));
    await waitFor(() => {
      const btn = screen.getByRole("button", { name: /save settings/i });
      expect(btn).not.toBeDisabled();
    });
    screen.getByRole("button", { name: /save settings/i }).click();
    await waitFor(() => {
      expect(client.configureUpdateChecking).toHaveBeenCalled();
    });
  });

  it("calls triggerUpdateCheck when Check Now is clicked", async () => {
    client.triggerUpdateCheck.mockResolvedValue({
      current_version: "1.2.3",
      latest_version: "1.2.3",
      update_available: false,
      last_checked_at: "2026-05-09T12:00:00Z",
    });
    wrap();
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /check now/i })).toBeInTheDocument();
    });
    screen.getByRole("button", { name: /check now/i }).click();
    await waitFor(() => {
      expect(client.triggerUpdateCheck).toHaveBeenCalled();
    });
  });

  it("shows an error when Save Settings is clicked with invalid interval", async () => {
    wrap();
    await waitFor(() => {
      expect(screen.getByLabelText(/check interval/i)).toBeInTheDocument();
    });
    const intervalInput = screen.getByLabelText(/check interval/i);
    fireEvent.change(intervalInput, { target: { value: "0" } });
    screen.getByRole("button", { name: /save settings/i }).click();
    await waitFor(() => {
      expect(
        screen.getByText(/update check interval must be at least 1 hour/i)
      ).toBeInTheDocument();
    });
  });

  // Behavior 10: SettingsAbout dirty tracking
  it("Save Settings button has btn-save--idle class on initial load", async () => {
    wrap();
    await waitFor(() => {
      expect(screen.getByLabelText(/enable update checking/i)).toBeInTheDocument();
    });
    const btn = screen.getByRole("button", { name: /save settings/i });
    expect(btn).toHaveClass("btn-save--idle");
    expect(btn).toBeDisabled();
  });

  it("Save Settings button gains btn-save--dirty class after checkbox change", async () => {
    wrap();
    await waitFor(() => {
      expect(screen.getByLabelText(/enable update checking/i).checked).toBe(true);
    });
    fireEvent.click(screen.getByLabelText(/enable update checking/i));
    const btn = screen.getByRole("button", { name: /save settings/i });
    expect(btn).toHaveClass("btn-save--dirty");
    expect(btn).not.toBeDisabled();
  });

  it("Save Settings button gains btn-save--dirty class after interval change", async () => {
    wrap();
    await waitFor(() => {
      expect(screen.getByLabelText(/check interval/i).value).toBe("24");
    });
    fireEvent.change(screen.getByLabelText(/check interval/i), { target: { value: "12" } });
    const btn = screen.getByRole("button", { name: /save settings/i });
    expect(btn).toHaveClass("btn-save--dirty");
    expect(btn).not.toBeDisabled();
  });

  it("Save Settings button returns to btn-save--idle after successful save", async () => {
    client.configureUpdateChecking.mockResolvedValue({
      check_enabled: false,
      check_interval_hours: 24,
    });
    wrap();
    await waitFor(() => {
      expect(screen.getByLabelText(/enable update checking/i).checked).toBe(true);
    });
    fireEvent.click(screen.getByLabelText(/enable update checking/i));
    fireEvent.click(screen.getByRole("button", { name: /save settings/i }));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /save settings/i })).toHaveClass("btn-save--idle");
    });
  });

  it("registers beforeunload handler when dirty", async () => {
    const addSpy = vi.spyOn(window, "addEventListener");
    wrap();
    await waitFor(() => {
      expect(screen.getByLabelText(/enable update checking/i)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByLabelText(/enable update checking/i));
    await waitFor(() => {
      const calls = addSpy.mock.calls.filter(([event]) => event === "beforeunload");
      expect(calls.length).toBeGreaterThan(0);
    });
  });
});
