import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "../App";
import { AuthProvider } from "../contexts/AuthContext";
import * as client from "../api/client";
import * as auth from "../utils/auth";

vi.mock("../api/client");
vi.mock("../utils/auth");

function wrap(ui) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <AuthProvider>
      <QueryClientProvider client={qc}>{ui}</QueryClientProvider>
    </AuthProvider>
  );
}

describe("App", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Mock auth utils
    auth.getToken.mockReturnValue("fake-token");
    auth.setToken.mockImplementation(() => {});
    auth.clearToken.mockImplementation(() => {});
    auth.isAuthenticated.mockReturnValue(true);
    // Mock API calls
    client.getChores.mockResolvedValue([]);
    client.getPeople.mockResolvedValue([
      { id: 1, name: "Alice", color: "#3B6EA0" },
      { id: 2, name: "Bob", color: "#8B5E8A" },
    ]);
    client.getPointsSummary.mockResolvedValue([]);
    client.getLog.mockResolvedValue([]);
    client.getSetupStatus.mockResolvedValue({ setup_needed: false });
    client.getConfig.mockResolvedValue({ title: "Family Chores" });
  });

  it("renders the app title", () => {
    wrap(<App />);
    expect(screen.getByText("Family Chores")).toBeInTheDocument();
  });

  it("renders left sidebar with main navigation sections", () => {
    wrap(<App />);
    expect(screen.getByText("Board")).toBeInTheDocument();
    expect(screen.getByText("Chores")).toBeInTheDocument();
    expect(screen.getByText("Users")).toBeInTheDocument();
    expect(screen.getByText("Log")).toBeInTheDocument();
    expect(screen.getByText("Settings")).toBeInTheDocument();
  });

  it("renders navigation icons", () => {
    wrap(<App />);
    expect(screen.getByText("📊")).toBeInTheDocument();
    expect(screen.getByText("✓")).toBeInTheDocument();
    expect(screen.getByText("👥")).toBeInTheDocument();
    expect(screen.getByText("📝")).toBeInTheDocument();
    expect(screen.getByText("⚙️")).toBeInTheDocument();
  });

  it("shows Dashboard page by default", async () => {
    wrap(<App />);
    await waitFor(() => {
      expect(screen.getAllByText(/Last 7 Days/i).length).toBeGreaterThan(0);
    });
  });

  it("navigates to Chores page when clicked", async () => {
    wrap(<App />);
    const choresBtn = screen.getByText("Chores").closest("button");
    fireEvent.click(choresBtn);
    await waitFor(() => {
      expect(choresBtn).toHaveClass("nav-active");
      expect(screen.getByText("All Chores")).toBeInTheDocument();
    });
  });

  it("navigates to Users page when clicked", async () => {
    wrap(<App />);
    const usersBtn = screen.getByText("Users").closest("button");
    fireEvent.click(usersBtn);
    await waitFor(() => {
      expect(usersBtn).toHaveClass("nav-active");
      expect(screen.getByText("Manage Users")).toBeInTheDocument();
    });
  });

  it("navigates to Log page when clicked", async () => {
    wrap(<App />);
    const logBtn = screen.getByText("Log").closest("button");
    fireEvent.click(logBtn);
    await waitFor(() => {
      expect(logBtn).toHaveClass("nav-active");
    });
  });

  it("navigates to Settings page when clicked", async () => {
    wrap(<App />);
    const settingsBtn = screen.getByText("Settings").closest("button");
    fireEvent.click(settingsBtn);
    await waitFor(() => {
      expect(settingsBtn).toHaveClass("nav-active");
    });
  });

  it("toggles sidebar collapse state", () => {
    wrap(<App />);
    const sidebar = screen.getByText("Family Chores").closest(".app-sidebar");
    expect(sidebar).toHaveClass("open");

    const toggleBtn = screen.getByRole("button", { name: /toggle sidebar/i });
    fireEvent.click(toggleBtn);

    expect(sidebar).toHaveClass("closed");
  });

  it("hides labels and shows only icons when sidebar is closed", () => {
    wrap(<App />);
    const sidebar = screen.getByText("Family Chores").closest(".app-sidebar");
    const toggleBtn = screen.getByRole("button", { name: /toggle sidebar/i });
    fireEvent.click(toggleBtn);

    // Sidebar should have closed class
    expect(sidebar).toHaveClass("closed");
    // Icons should still be visible
    expect(screen.getByText("📊")).toBeInTheDocument();
    expect(screen.getByText("✓")).toBeInTheDocument();
  });

  it("maintains sidebar state while navigating pages", async () => {
    wrap(<App />);
    const toggleBtn = screen.getByRole("button", { name: /toggle sidebar/i });
    fireEvent.click(toggleBtn);

    const sidebar = screen.getByText("Family Chores").closest(".app-sidebar");
    expect(sidebar).toHaveClass("closed");

    fireEvent.click(screen.getByText("Settings"));
    await waitFor(() => {
      expect(sidebar).toHaveClass("closed");
    });
  });

  it("shows logged-in user icon at bottom of sidebar", async () => {
    wrap(<App />);
    await waitFor(() => {
      const userAvatarBtn = screen.getByRole("button", { name: /user menu/i });
      expect(userAvatarBtn).toBeInTheDocument();
      expect(userAvatarBtn).toHaveClass("user-avatar-btn");
    });
  });

  it("allows clicking user icon to open menu", async () => {
    wrap(<App />);
    await waitFor(() => {
      const userAvatarBtn = screen.getByRole("button", { name: /user menu/i });
      fireEvent.click(userAvatarBtn);
    });
    await waitFor(() => {
      // Should show logout button in dropdown
      expect(screen.getByRole("button", { name: /logout/i })).toBeInTheDocument();
    });
  });
});
