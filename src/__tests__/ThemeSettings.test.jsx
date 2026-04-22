import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ThemeSettings from "../components/ThemeSettings";
import * as client from "../api/client";

vi.mock("../api/client");

const THEMES = [
  {
    id: "dark",
    name: "Dark",
    colors: {
      bg: "#080c14",
      surface: "#16202e",
      accent: "#73B1DD",
      success: "#3db87a",
      warning: "#e8a930",
      danger: "#e05c6a",
    },
  },
  {
    id: "light",
    name: "Light",
    colors: {
      bg: "#f5f5f5",
      surface: "#ffffff",
      accent: "#0066cc",
      success: "#00aa00",
      warning: "#ff9900",
      danger: "#cc0000",
    },
  },
  {
    id: "custom_0",
    name: "My Custom Theme",
    colors: {
      bg: "#1a1a2e",
      surface: "#16213e",
      accent: "#e94560",
      success: "#00d4ff",
      warning: "#ffa502",
      danger: "#e05c6a",
    },
  },
];

function wrap(ui) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

describe("ThemeSettings", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    client.getThemes.mockResolvedValue(THEMES);
    client.getCurrentTheme.mockResolvedValue(THEMES[0]);
    client.deleteTheme.mockResolvedValue({ message: "Theme deleted" });
  });

  it("renders theme list", async () => {
    wrap(<ThemeSettings />);
    await waitFor(() => {
      expect(screen.getByText("Dark")).toBeInTheDocument();
      expect(screen.getByText("Light")).toBeInTheDocument();
    });
  });

  it("shows current theme as selected", async () => {
    wrap(<ThemeSettings />);
    await waitFor(() => {
      expect(screen.getByText("Dark").closest("button")).toHaveClass("theme-active");
    });
  });

  it("allows switching themes", async () => {
    client.setTheme.mockResolvedValue(THEMES[1]);
    wrap(<ThemeSettings />);
    await waitFor(() => screen.getByText("Light"));

    fireEvent.click(screen.getByText("Light"));

    await waitFor(() => {
      expect(client.setTheme).toHaveBeenCalledWith("light");
    });
  });

  it("shows color editor for custom theme", async () => {
    wrap(<ThemeSettings />);
    await waitFor(() => screen.getByText("Dark"));

    fireEvent.click(screen.getByRole("button", { name: /customize|edit/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/primary|accent/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/success|green/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/warning|yellow/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/danger|red/i)).toBeInTheDocument();
    });
  });

  it("allows editing individual colors", async () => {
    client.saveTheme.mockResolvedValue({ id: "custom", name: "Dark Custom", colors: { accent: "#ff0000" } });
    wrap(<ThemeSettings />);
    await waitFor(() => screen.getByText("Dark"));

    fireEvent.click(screen.getByRole("button", { name: /customize|edit/i }));
    await waitFor(() => screen.getByLabelText(/primary|accent/i));

    const colorInput = screen.getByLabelText(/primary|accent/i);
    fireEvent.change(colorInput, { target: { value: "#FF0000" } });

    fireEvent.click(screen.getByRole("button", { name: /save.*theme/i }));

    await waitFor(() => {
      expect(client.saveTheme).toHaveBeenCalledWith(
        expect.objectContaining({ colors: expect.objectContaining({ accent: "#ff0000" }) })
      );
    });
  });

  it("allows saving custom theme", async () => {
    const user = userEvent.setup();
    client.saveTheme.mockResolvedValue({ id: "custom", name: "My Theme", colors: {} });
    wrap(<ThemeSettings />);
    await waitFor(() => screen.getByText("Dark"));

    fireEvent.click(screen.getByRole("button", { name: /customize|edit/i }));
    await waitFor(() => screen.getByLabelText(/primary|accent/i));

    const nameInput = screen.getByPlaceholderText(/theme name/i);
    await user.clear(nameInput);
    await user.type(nameInput, "My Theme");

    fireEvent.click(screen.getByRole("button", { name: /save.*theme/i }));

    await waitFor(() => {
      expect(client.saveTheme).toHaveBeenCalledWith(
        expect.objectContaining({ name: "My Theme" })
      );
    });
  });

  it("applies theme colors globally", async () => {
    wrap(<ThemeSettings />);
    await waitFor(() => screen.getByText("Dark"));

    fireEvent.click(screen.getByText("Light"));

    await waitFor(() => {
      const root = document.documentElement;
      expect(root.style.getPropertyValue("--bg")).toBeTruthy();
    });
  });

  it("shows delete button for custom themes only", async () => {
    wrap(<ThemeSettings />);
    await waitFor(() => screen.getByText("Dark"));

    const deleteButtons = screen.queryAllByLabelText(/delete/i);
    expect(deleteButtons.length).toBe(1);
    expect(deleteButtons[0]).toHaveAttribute("aria-label", "Delete My Custom Theme");
  });

  it("shows delete confirmation modal", async () => {
    wrap(<ThemeSettings />);
    await waitFor(() => screen.getByText("Dark"));

    const deleteBtn = screen.getByLabelText("Delete My Custom Theme");
    fireEvent.click(deleteBtn);

    await waitFor(() => expect(screen.getByText("Delete theme?")).toBeInTheDocument());
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("calls deleteTheme on confirm", async () => {
    wrap(<ThemeSettings />);
    await waitFor(() => screen.getByText("Dark"));

    const deleteBtn = screen.getByLabelText("Delete My Custom Theme");
    fireEvent.click(deleteBtn);

    const confirmBtn = screen.getByRole("button", { name: /^Delete$/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(client.deleteTheme).toHaveBeenCalledWith("custom_0");
    });
  });
});
