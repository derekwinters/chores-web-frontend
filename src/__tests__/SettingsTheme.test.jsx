import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import SettingsTheme from "../pages/SettingsTheme";
import * as client from "../api/client";

vi.mock("../api/client");
vi.mock("../contexts/AuthContext", () => ({
  AuthProvider: ({ children }) => children,
  useAuth: () => ({ user: { username: "admin", is_admin: true }, logout: vi.fn() }),
}));

const MOCK_THEMES = [
  {
    id: "dark",
    name: "Dark",
    colors: {
      bg: "#080c14",
      surface: "#16202e",
      accent: "#73B1DD",
      success: "#3db87a",
      warning: "#e8a930",
      error: "#e05c6a",
    },
  },
];

function wrap() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <SettingsTheme />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("SettingsTheme", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    client.getThemes.mockResolvedValue(MOCK_THEMES);
    client.getCurrentTheme.mockResolvedValue(MOCK_THEMES[0]);
  });

  it("renders the Theme section heading", () => {
    wrap();
    expect(screen.getByText("Theme")).toBeInTheDocument();
  });

  it("renders the ThemeSettings component within the Theme section", async () => {
    wrap();
    await waitFor(() => {
      expect(screen.getByText(/dark/i)).toBeInTheDocument();
    });
  });
});
