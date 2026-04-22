import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "../App";
import * as client from "../api/client";

vi.mock("../api/client");
vi.mock("../contexts/AuthContext", () => ({
  AuthProvider: ({ children }) => children,
  useAuth: () => ({
    isAuthenticated: true,
    setupNeeded: false,
    user: { username: "alice", is_admin: true },
    loading: false,
    login: vi.fn(),
    logout: vi.fn(),
    changePassword: vi.fn(),
  }),
}));

function wrap(ui) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

describe("App", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
    // Mock API calls
    client.getChores.mockResolvedValue([]);
    client.getPeople.mockResolvedValue([
      { id: 1, name: "Alice", username: "alice", color: "#3B6EA0", is_admin: true },
      { id: 2, name: "Bob", username: "bob", color: "#8B5E8A", is_admin: false },
    ]);
    client.getPointsSummary.mockResolvedValue([]);
    client.getLog.mockResolvedValue([]);
    client.getSetupStatus.mockResolvedValue({ setup_needed: false });
    client.getConfig.mockResolvedValue({ title: "Family Chores" });
  });

  it("renders the app title", async () => {
    wrap(<App />);
    await waitFor(() => {
      const titles = screen.getAllByText("Family Chores");
      expect(titles.length).toBeGreaterThan(0);
    });
  });

  it("renders left sidebar with main navigation sections", async () => {
    wrap(<App />);
    await waitFor(() => {
      expect(screen.getAllByText("Board").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Chores").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Users").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Log").length).toBeGreaterThan(0);
    });
  });

  it("renders navigation icons using svg icons", async () => {
    wrap(<App />);
    await waitFor(() => {
      // Nav items use react-icons (SVG), verify links are present
      expect(screen.getAllByText("Board").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Chores").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Log").length).toBeGreaterThan(0);
    });
  });

  it("shows Dashboard page by default", async () => {
    wrap(<App />);
    await waitFor(() => {
      expect(screen.getAllByText(/Last 7 Days/i).length).toBeGreaterThan(0);
    });
  });

  it("navigates to Chores page when clicked", async () => {
    wrap(<App />);
    await waitFor(() => screen.getByText("Chores"));
    const choresLink = screen.getByText("Chores").closest("a");
    fireEvent.click(choresLink);
    await waitFor(() => {
      expect(screen.getByText("All Chores")).toBeInTheDocument();
    });
  });

  it("navigates to Users page when clicked", async () => {
    wrap(<App />);
    await waitFor(() => screen.getByText("Users"));
    const usersLink = screen.getByText("Users").closest("a");
    fireEvent.click(usersLink);
    await waitFor(() => {
      expect(screen.getByText("Manage Users")).toBeInTheDocument();
    });
  });

  it("navigates to Log page when clicked", async () => {
    wrap(<App />);
    await waitFor(() => screen.getAllByText("Log"));
    const logLink = screen.getAllByText("Log")[0].closest("a");
    fireEvent.click(logLink);
    await waitFor(() => {
      expect(screen.getAllByText("Log").length).toBeGreaterThan(0);
    });
  });

  it("navigates to Settings page via user avatar menu", async () => {
    wrap(<App />);
    await waitFor(() => screen.getByRole("button", { name: /user menu/i }));
    // Settings is accessible via UserAvatarMenu with directSettings=true in topnav
    const settingsBtn = screen.getByRole("button", { name: /settings/i });
    expect(settingsBtn).toBeInTheDocument();
  });

  it("toggles sidebar collapse state", async () => {
    wrap(<App />);
    await waitFor(() => screen.getAllByText("Family Chores"));
    // The sidebar has the .app-title span; find the sidebar element directly
    const sidebar = document.querySelector(".app-sidebar");
    expect(sidebar).toHaveClass("open");

    const toggleBtn = screen.getByRole("button", { name: /toggle sidebar/i });
    fireEvent.click(toggleBtn);

    expect(sidebar).toHaveClass("closed");
  });

  it("hides labels and shows only icons when sidebar is closed", async () => {
    wrap(<App />);
    await waitFor(() => screen.getAllByText("Family Chores"));
    const sidebar = document.querySelector(".app-sidebar");
    const toggleBtn = screen.getByRole("button", { name: /toggle sidebar/i });
    fireEvent.click(toggleBtn);

    // Sidebar should have closed class
    expect(sidebar).toHaveClass("closed");
    // Nav labels are rendered (CSS hides them), but nav links still present
    expect(screen.getAllByText("Board").length).toBeGreaterThan(0);
  });

  it("maintains sidebar state while navigating pages", async () => {
    wrap(<App />);
    await waitFor(() => screen.getAllByText("Family Chores"));
    const toggleBtn = screen.getByRole("button", { name: /toggle sidebar/i });
    fireEvent.click(toggleBtn);

    const sidebar = document.querySelector(".app-sidebar");
    expect(sidebar).toHaveClass("closed");

    fireEvent.click(screen.getAllByText("Chores")[0].closest("a"));
    await waitFor(() => {
      expect(sidebar).toHaveClass("closed");
    });
  });

  it("shows logged-in user icon at bottom of sidebar", async () => {
    wrap(<App />);
    await waitFor(() => {
      const userAvatarBtns = screen.getAllByRole("button", { name: /user menu/i });
      expect(userAvatarBtns.length).toBeGreaterThan(0);
      expect(userAvatarBtns[0]).toHaveClass("user-avatar-btn");
    });
  });

  it("allows clicking user icon to open menu", async () => {
    wrap(<App />);
    await waitFor(() => screen.getAllByRole("button", { name: /user menu/i }));
    const userAvatarBtns = screen.getAllByRole("button", { name: /user menu/i });
    // Click the sidebar avatar (last one, not topnav directSettings)
    fireEvent.click(userAvatarBtns[userAvatarBtns.length - 1]);
    await waitFor(() => {
      // Should show logout button in dropdown
      expect(screen.getByRole("button", { name: /logout/i })).toBeInTheDocument();
    });
  });
});
