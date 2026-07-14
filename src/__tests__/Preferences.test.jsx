import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import Preferences from "../pages/Preferences";
import * as client from "../api/client";

vi.mock("../api/client");
vi.mock("../utils/theme", () => ({
  applyTheme: vi.fn(),
  DEFAULT_THEME_COLORS: {},
}));

const MOCK_THEMES = [
  {
    id: "dark",
    name: "Dark",
    colors: {
      bg: "#080c14",
      surface: "#16202e",
      surface2: "#1e2d40",
      accent: "#73B1DD",
      primary: "#3574B3",
      secondary: "#4a5568",
      success: "#3db87a",
      warning: "#e8a930",
      error: "#e05c6a",
    },
  },
  {
    id: "light",
    name: "Light",
    colors: {
      bg: "#f5f5f5",
      surface: "#ffffff",
      surface2: "#eeeeee",
      accent: "#0066cc",
      primary: "#0066cc",
      secondary: "#6c757d",
      success: "#00aa00",
      warning: "#ff9900",
      error: "#cc0000",
    },
  },
];

const MOCK_CURRENT_THEME_PERSONAL = { ...MOCK_THEMES[0], is_personal: true };
const MOCK_CURRENT_THEME_DEFAULT = { ...MOCK_THEMES[0], is_personal: false };
const MOCK_DEFAULT_INFO = { id: "dark", name: "Dark" };

function wrap() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <Preferences />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("Preferences", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    client.getThemes.mockResolvedValue(MOCK_THEMES);
    client.getCurrentTheme.mockResolvedValue(MOCK_CURRENT_THEME_PERSONAL);
    client.getDefaultThemeInfo.mockResolvedValue(MOCK_DEFAULT_INFO);
    client.getNotificationPreferences.mockResolvedValue({ chore_due: true });
  });

  it("renders the Preferences page heading", async () => {
    wrap();
    await waitFor(() => {
      expect(screen.getByText("Preferences")).toBeInTheDocument();
    });
  });

  it("renders the Theme section heading", async () => {
    wrap();
    await waitFor(() => {
      expect(screen.getByText("Theme")).toBeInTheDocument();
    });
  });

  it("renders all available themes", async () => {
    wrap();
    await waitFor(() => {
      expect(screen.getByText("Dark")).toBeInTheDocument();
      expect(screen.getByText("Light")).toBeInTheDocument();
    });
  });

  it("renders a Default card as the first option", async () => {
    wrap();
    await waitFor(() => {
      expect(screen.getByText("Default (Dark)")).toBeInTheDocument();
    });
  });

  it("Default card is first in the list", async () => {
    wrap();
    await waitFor(() => {
      const buttons = screen.getAllByRole("button");
      expect(buttons[0]).toHaveTextContent("Default (Dark)");
    });
  });

  it("marks the Default card as active when user has no personal theme", async () => {
    client.getCurrentTheme.mockResolvedValue(MOCK_CURRENT_THEME_DEFAULT);
    wrap();
    await waitFor(() => {
      const defaultCard = screen.getByText("Default (Dark)").closest("button");
      expect(defaultCard).toHaveClass("preferences-theme-active");
    });
  });

  it("Default card is not active when user has a personal theme set", async () => {
    client.getCurrentTheme.mockResolvedValue(MOCK_CURRENT_THEME_PERSONAL);
    wrap();
    await waitFor(() => {
      const defaultCard = screen.getByText("Default (Dark)").closest("button");
      expect(defaultCard).not.toHaveClass("preferences-theme-active");
    });
  });

  it("marks the current personal theme card as active", async () => {
    client.getCurrentTheme.mockResolvedValue(MOCK_CURRENT_THEME_PERSONAL);
    wrap();
    await waitFor(() => {
      const darkCard = screen.getByText("Dark").closest("button");
      expect(darkCard).toHaveClass("preferences-theme-active");
    });
  });

  it("calls clearPersonalTheme when Default card is clicked", async () => {
    client.clearPersonalTheme.mockResolvedValue(null);
    wrap();
    await waitFor(() => screen.getByText("Default (Dark)"));

    fireEvent.click(screen.getByText("Default (Dark)").closest("button"));

    await waitFor(() => {
      expect(client.clearPersonalTheme).toHaveBeenCalled();
    });
  });

  it("calls setTheme when a theme card is clicked", async () => {
    client.setTheme.mockResolvedValue({ ...MOCK_THEMES[1], is_personal: true });
    wrap();
    await waitFor(() => screen.getByText("Light"));

    fireEvent.click(screen.getByText("Light").closest("button"));

    await waitFor(() => {
      expect(client.setTheme).toHaveBeenCalledWith("light");
    });
  });

  it("renders color swatches for each theme card", async () => {
    wrap();
    await waitFor(() => {
      const darkCard = screen.getByText("Dark").closest("button");
      const swatches = darkCard.querySelectorAll(".preferences-color-sample");
      expect(swatches.length).toBe(4);
    });
  });

  it("renders a personal theme description", async () => {
    wrap();
    await waitFor(() => {
      expect(screen.getByText(/applies only to your account/i)).toBeInTheDocument();
    });
  });

  it("renders the Notifications section from the fetched preferences map", async () => {
    wrap();
    await waitFor(() => {
      expect(screen.getByText("Notifications")).toBeInTheDocument();
      expect(screen.getByRole("switch", { name: /chore due/i })).toBeInTheDocument();
    });
  });

  it("toggling a type persists via putNotificationPreferences with the updated map", async () => {
    client.putNotificationPreferences.mockResolvedValue({ chore_due: false });
    wrap();
    await waitFor(() => screen.getByRole("switch", { name: /chore due/i }));

    fireEvent.click(screen.getByRole("switch", { name: /chore due/i }));

    await waitFor(() => {
      expect(client.putNotificationPreferences).toHaveBeenCalledWith({ chore_due: false });
    });
  });

  it("global toggle writes every type in the map", async () => {
    client.getNotificationPreferences.mockResolvedValue({ chore_due: true, weekly_summary: true });
    client.putNotificationPreferences.mockResolvedValue({ chore_due: false, weekly_summary: false });
    wrap();
    await waitFor(() => screen.getByRole("switch", { name: /enable notifications/i }));

    fireEvent.click(screen.getByRole("switch", { name: /enable notifications/i }));

    await waitFor(() => {
      expect(client.putNotificationPreferences).toHaveBeenCalledWith({
        chore_due: false,
        weekly_summary: false,
      });
    });
  });

  it("disables the notification toggles while the mutation is pending", async () => {
    let resolveMutation;
    client.putNotificationPreferences.mockReturnValue(
      new Promise((resolve) => {
        resolveMutation = resolve;
      })
    );
    wrap();
    await waitFor(() => screen.getByRole("switch", { name: /chore due/i }));

    fireEvent.click(screen.getByRole("switch", { name: /chore due/i }));

    await waitFor(() => {
      expect(screen.getByRole("switch", { name: /chore due/i })).toBeDisabled();
    });

    resolveMutation({ chore_due: false });
  });
});
