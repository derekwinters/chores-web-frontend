import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import SettingsAbout from "../pages/SettingsAbout";
import * as client from "../api/client";
import packageJson from "../../package.json";

const GITHUB_RELEASES_URL =
  "https://api.github.com/repos/derekwinters/chores-web-frontend/releases/latest";

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
    localStorage.clear();
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
    client.getBackendVersion.mockResolvedValue({
      version: "9.9.9",
      latest_version: "9.9.9",
      update_available: false,
      checked_at: null,
    });
    // /status/ endpoint (chores-web-backend#16): matching API major by default
    client.getStatus.mockResolvedValue({
      version: "8.8.8",
      api_version: "v1",
      versions: ["v1"],
    });
    // App Version section checks GitHub directly (client-side, chores-web-frontend#31)
    global.fetch = vi.fn((url) => {
      if (typeof url === "string" && url.includes("api.github.com")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ tag_name: `v${packageJson.version}` }),
        });
      }
      return Promise.reject(new Error(`Fetch not mocked for: ${url}`));
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

  it("displays the current version from the injected build version (not the backend), via the GitHub check", async () => {
    wrap();
    await waitFor(() => {
      // The build-injected version appears in both Current Version and Latest Version rows
      const matches = screen.getAllByText(packageJson.version);
      expect(matches.length).toBeGreaterThan(0);
    });
    expect(global.fetch).toHaveBeenCalledWith(
      GITHUB_RELEASES_URL,
      expect.any(Object)
    );
    // Confirms the old backend-sourced value ("1.2.3") is NOT used for the app version anymore
    expect(screen.queryByText("1.2.3")).not.toBeInTheDocument();
  });

  it("shows Update Available banner when a newer GitHub release exists", async () => {
    global.fetch = vi.fn((url) => {
      if (typeof url === "string" && url.includes("api.github.com")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ tag_name: "v999.0.0" }),
        });
      }
      return Promise.reject(new Error(`Fetch not mocked for: ${url}`));
    });
    wrap();
    await waitFor(() => {
      expect(screen.getByText(/update available/i)).toBeInTheDocument();
    });
  });

  it("does not show Update Available banner when up to date", async () => {
    wrap();
    await waitFor(() => {
      expect(screen.getAllByText(packageJson.version).length).toBeGreaterThan(0);
    });
    expect(screen.queryByText(/update available/i)).not.toBeInTheDocument();
  });

  it("renders the Backend Version section with data from GET /version", async () => {
    wrap();
    await waitFor(() => {
      expect(screen.getByText("Backend Version")).toBeInTheDocument();
      expect(screen.getAllByText("9.9.9").length).toBeGreaterThan(0);
    });
    expect(screen.getByText("up to date")).toBeInTheDocument();
  });

  it("falls back to 'unknown'/'unsupported check' when the backend version fetch fails", async () => {
    client.getBackendVersion.mockRejectedValue(new Error("Not Found"));
    wrap();
    await waitFor(() => {
      expect(screen.getByText("unknown")).toBeInTheDocument();
      expect(screen.getByText("unsupported check")).toBeInTheDocument();
    });
    // Must not crash the rest of the page
    expect(screen.getByText("App Version")).toBeInTheDocument();
    expect(screen.getByText("Update Checker")).toBeInTheDocument();
  });

  it("falls back to 'unknown'/'unsupported check' when the backend returns 404", async () => {
    client.getBackendVersion.mockRejectedValue(new Error("Backend version check failed: 404"));
    wrap();
    await waitFor(() => {
      expect(screen.getByText("unknown")).toBeInTheDocument();
      expect(screen.getByText("unsupported check")).toBeInTheDocument();
    });
  });

  it("renders the Version section with the build-time frontend version", async () => {
    wrap();
    await waitFor(() => {
      expect(screen.getByText("Version")).toBeInTheDocument();
      expect(screen.getByText("Frontend version:")).toBeInTheDocument();
    });
    // FRONTEND_VERSION comes from the build-time-injected VITE_APP_VERSION,
    // which is baked from package.json (see vite.config.js define block).
    expect(screen.getByText(packageJson.version)).toBeInTheDocument();
  });

  it("displays the backend version and API version from GET /status/", async () => {
    wrap();
    await waitFor(() => {
      expect(screen.getByText("8.8.8")).toBeInTheDocument();
    });
    expect(screen.getByText("v1")).toBeInTheDocument();
  });

  it("warns when the backend's API major differs from the frontend's expected major", async () => {
    client.getStatus.mockResolvedValue({
      version: "8.8.8",
      api_version: "v2",
      versions: ["v2"],
    });
    wrap();
    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
    expect(screen.getByText(/api version mismatch/i)).toBeInTheDocument();
  });

  it("does not warn when the backend's API major matches", async () => {
    wrap();
    await waitFor(() => {
      expect(screen.getByText("Backend version:")).toBeInTheDocument();
    });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.queryByText(/api version mismatch/i)).not.toBeInTheDocument();
  });

  it("does not warn (and shows 'unknown') when /status/ is unreachable", async () => {
    client.getStatus.mockRejectedValue(new Error("Backend status check failed: 404"));
    wrap();
    await waitFor(() => {
      expect(screen.getByText("Backend version:")).toBeInTheDocument();
    });
    // No confident API major → no false mismatch warning
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getAllByText("unknown").length).toBeGreaterThan(0);
  });

  it("renders links to chores-web-docs, frontend releases, and backend releases", () => {
    wrap();
    const docsLink = screen.getByRole("link", { name: /chores-web-docs/i });
    expect(docsLink).toHaveAttribute("href", "https://github.com/derekwinters/chores-web-docs");
    expect(docsLink).toHaveAttribute("target", "_blank");
    expect(docsLink).toHaveAttribute("rel", "noopener noreferrer");

    const frontendLink = screen.getByRole("link", { name: /frontend releases/i });
    expect(frontendLink).toHaveAttribute(
      "href",
      "https://github.com/derekwinters/chores-web-frontend/releases"
    );
    expect(frontendLink).toHaveAttribute("rel", "noopener noreferrer");

    const backendLink = screen.getByRole("link", { name: /backend releases/i });
    expect(backendLink).toHaveAttribute(
      "href",
      "https://github.com/derekwinters/chores-web-backend/releases"
    );
    expect(backendLink).toHaveAttribute("rel", "noopener noreferrer");
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
