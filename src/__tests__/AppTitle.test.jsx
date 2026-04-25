import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
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

const DARK_THEME = {
  id: "dark",
  name: "Dark",
  colors: {
    bg: "#080c14",
    surface: "#16202e",
    surface2: "#1e2d40",
    accent: "#73B1DD",
    success: "#3db87a",
    warning: "#e8a930",
    danger: "#e05c6a",
  },
};

const LIGHT_THEME = {
  id: "light",
  name: "Light",
  colors: {
    bg: "#ffffff",
    surface: "#f5f5f5",
    surface2: "#eeeeee",
    accent: "#0066cc",
    success: "#28a745",
    warning: "#ffc107",
    danger: "#dc3545",
  },
};

describe("App Title", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    client.getChores.mockResolvedValue([]);
    client.getPeople.mockResolvedValue([
      { id: 1, name: "Alice", username: "alice", color: "#3B6EA0", is_admin: true },
    ]);
    client.getPointsSummary.mockResolvedValue([]);
    client.getConfig.mockResolvedValue({ title: "Family Chores" });
    client.getSetupStatus.mockResolvedValue({ setup_needed: false });
    client.getCurrentTheme.mockResolvedValue(DARK_THEME);
    client.getThemes.mockResolvedValue([DARK_THEME, LIGHT_THEME]);
    client.setTheme.mockResolvedValue(DARK_THEME);
    client.getLog.mockResolvedValue([]);
    localStorage.clear();
  });

  it("displays default app title", async () => {
    wrap(<App />);
    await waitFor(() => {
      const titles = screen.getAllByText("Family Chores");
      expect(titles.length).toBeGreaterThan(0);
    });
  });

  it("fetches app title from config", async () => {
    client.getConfig.mockResolvedValue({ title: "Custom Title" });
    wrap(<App />);
    await waitFor(() => {
      expect(client.getConfig).toHaveBeenCalled();
    });
  });

  it("shows title edit field in settings", async () => {
    wrap(<App />);
    // Open avatar menu first
    const avatarButtons = await waitFor(() => screen.getAllByRole("button", { name: /user menu/i }));
    fireEvent.click(avatarButtons[0]);
    // Click Settings option
    await waitFor(() => {
      const settingsBtn = screen.getByRole("button", { name: /Settings/i });
      fireEvent.click(settingsBtn);
    });
    // Should navigate to settings page with title input
    await waitFor(() => {
      expect(screen.getByLabelText(/app title/i)).toBeInTheDocument();
    });
  });

  it("allows editing the app title", async () => {
    const user = userEvent.setup();
    client.updateConfig.mockResolvedValue({ title: "My Chores" });
    wrap(<App />);

    // Open avatar menu
    const avatarButtons = await waitFor(() => screen.getAllByRole("button", { name: /user menu/i }));
    fireEvent.click(avatarButtons[0]);
    // Click Settings
    await waitFor(() => {
      const settingsBtn = screen.getByRole("button", { name: /Settings/i });
      fireEvent.click(settingsBtn);
    });
    await waitFor(() => screen.getByLabelText(/app title/i));

    const input = screen.getByLabelText(/app title/i);
    await user.clear(input);
    await user.type(input, "My Chores");

    const buttons = screen.getAllByRole("button", { name: /save/i });
    fireEvent.click(buttons[0]);

    await waitFor(() => {
      expect(client.updateConfig).toHaveBeenCalledWith(expect.objectContaining({ title: "My Chores" }));
    });
  });

  it("updates displayed title after save", async () => {
    const user = userEvent.setup();
    client.updateConfig.mockResolvedValue({ title: "My Chores" });
    wrap(<App />);

    // Open avatar menu
    const avatarButtons = await waitFor(() => screen.getAllByRole("button", { name: /user menu/i }));
    fireEvent.click(avatarButtons[0]);
    // Click Settings
    await waitFor(() => {
      const settingsBtn = screen.getByRole("button", { name: /Settings/i });
      fireEvent.click(settingsBtn);
    });
    await waitFor(() => screen.getByLabelText(/app title/i));

    const input = screen.getByLabelText(/app title/i);
    await user.clear(input);
    await user.type(input, "My Chores");

    const buttons = screen.getAllByRole("button", { name: /save/i });
    fireEvent.click(buttons[0]);

    await waitFor(() => {
      const titles = screen.getAllByText("My Chores");
      expect(titles.length).toBeGreaterThan(0);
    });
  });

  it("persists title across page navigation", async () => {
    client.getConfig.mockResolvedValue({ title: "Persistent Title" });
    wrap(<App />);

    await waitFor(() => {
      const titles = screen.getAllByText("Persistent Title");
      expect(titles.length).toBeGreaterThan(0);
    });

    fireEvent.click(screen.getAllByText("Board")[0].closest("a"));
    expect(screen.getAllByText("Persistent Title").length).toBeGreaterThan(0);

    fireEvent.click(screen.getAllByText("Chores")[0].closest("a"));
    expect(screen.getAllByText("Persistent Title").length).toBeGreaterThan(0);
  });
});
