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
  {
    id: "charcoal",
    name: "Charcoal",
    colors: {
      bg: "#1a1a1a",
      surface: "#2d2d2d",
      surface2: "#3a3a3a",
      accent: "#999999",
      primary: "#666666",
      secondary: "#555555",
      success: "#999999",
      warning: "#999999",
      error: "#999999",
    },
  },
  {
    id: "custom_0",
    name: "My Custom Theme",
    colors: {
      bg: "#1a1a2e",
      surface: "#16213e",
      surface2: "#2d2d4d",
      accent: "#e94560",
      primary: "#ff6b9d",
      secondary: "#c44b8a",
      success: "#00d4ff",
      warning: "#ffa502",
      error: "#e05c6a",
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
    client.renameTheme.mockResolvedValue({ id: "charcoal", name: "Charcoal Updated", colors: THEMES[2].colors });
    client.updateTheme.mockResolvedValue({ id: "custom_0", name: "My Custom Theme", colors: THEMES[3].colors });
  });

  it("renders theme list", async () => {
    wrap(<ThemeSettings />);
    await waitFor(() => {
      expect(screen.getByText("Dark")).toBeInTheDocument();
      expect(screen.getByText("Light")).toBeInTheDocument();
      expect(screen.getByText("Charcoal")).toBeInTheDocument();
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

  it("shows color editor for current theme", async () => {
    wrap(<ThemeSettings />);
    await waitFor(() => screen.getByText("Dark"));

    fireEvent.click(screen.getByRole("button", { name: /customize.*current/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/^accent$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^primary$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^secondary$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^success$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^warning$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^error$/i)).toBeInTheDocument();
    });
  });

  it("shows color editor for custom theme when clicking edit", async () => {
    wrap(<ThemeSettings />);
    await waitFor(() => screen.getByText("My Custom Theme"));

    // Click edit icon on custom theme
    const editButtons = screen.getAllByLabelText(/edit/i);
    const customThemeEditBtn = editButtons.find(btn => btn.getAttribute("aria-label") === "Edit My Custom Theme");
    fireEvent.click(customThemeEditBtn);

    await waitFor(() => {
      expect(screen.getByLabelText(/^accent$/i)).toBeInTheDocument();
      expect(screen.getByDisplayValue(/My Custom Theme/i)).toBeInTheDocument();
    });
  });

  it("allows editing individual colors", async () => {
    client.saveTheme.mockResolvedValue({ id: "custom", name: "Dark Custom", colors: THEMES[0].colors });
    wrap(<ThemeSettings />);
    await waitFor(() => screen.getByText("Dark"));

    fireEvent.click(screen.getByRole("button", { name: /customize.*current/i }));
    await waitFor(() => screen.getByLabelText(/^accent$/i));

    const colorInput = screen.getByLabelText(/^accent$/i);
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
    client.saveTheme.mockResolvedValue({ id: "custom", name: "My Theme", colors: THEMES[0].colors });
    wrap(<ThemeSettings />);
    await waitFor(() => screen.getByText("Dark"));

    fireEvent.click(screen.getByRole("button", { name: /customize.*current/i }));
    await waitFor(() => screen.getByLabelText(/^accent$/i));

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

  it("shows 4 color swatches per theme card", async () => {
    wrap(<ThemeSettings />);
    await waitFor(() => {
      const container = screen.getByText("Dark").closest(".theme-card");
      const colorSamples = container.querySelectorAll(".color-sample");
      expect(colorSamples.length).toBe(4);
    });
  });

  it("renders copy button for built-in non-protected themes", async () => {
    wrap(<ThemeSettings />);
    await waitFor(() => screen.getByText("Charcoal"));

    // Charcoal is built-in non-protected, should have copy only
    const charcoalCard = screen.getByText("Charcoal").closest(".theme-card-wrapper");
    const actionsContainer = charcoalCard.querySelector(".theme-actions");
    expect(actionsContainer).toBeInTheDocument();

    const copyBtn = charcoalCard.querySelector('[aria-label="Copy Charcoal"]');
    const editBtn = charcoalCard.querySelector('[aria-label="Edit Charcoal"]');
    const renameBtn = charcoalCard.querySelector('[aria-label="Rename Charcoal"]');
    const deleteBtn = charcoalCard.querySelector('[aria-label="Delete Charcoal"]');

    expect(copyBtn).toBeInTheDocument();
    expect(editBtn).not.toBeInTheDocument();
    expect(renameBtn).not.toBeInTheDocument();
    expect(deleteBtn).not.toBeInTheDocument();
  });

  it("renders copy button for protected themes", async () => {
    wrap(<ThemeSettings />);
    await waitFor(() => screen.getByText("Dark"));

    // Dark is protected, should have copy only
    const darkCard = screen.getByText("Dark").closest(".theme-card-wrapper");
    const actionsContainer = darkCard.querySelector(".theme-actions");
    expect(actionsContainer).toBeInTheDocument();

    const copyBtn = darkCard.querySelector('[aria-label="Copy Dark"]');
    const editBtn = darkCard.querySelector('[aria-label="Edit Dark"]');
    const renameBtn = darkCard.querySelector('[aria-label="Rename Dark"]');
    const deleteBtn = darkCard.querySelector('[aria-label="Delete Dark"]');

    expect(copyBtn).toBeInTheDocument();
    expect(editBtn).not.toBeInTheDocument();
    expect(renameBtn).not.toBeInTheDocument();
    expect(deleteBtn).not.toBeInTheDocument();
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

  it("renders action buttons for custom themes", async () => {
    wrap(<ThemeSettings />);
    await waitFor(() => screen.getByText("My Custom Theme"));

    const customCard = screen.getByText("My Custom Theme").closest(".theme-card-wrapper");
    const actionsContainer = customCard.querySelector(".theme-actions");
    expect(actionsContainer).toBeInTheDocument();

    const deleteBtn = customCard.querySelector('[aria-label="Delete My Custom Theme"]');
    expect(deleteBtn).toBeInTheDocument();
  });

  it("shows delete confirmation modal", async () => {
    wrap(<ThemeSettings />);
    await waitFor(() => screen.getByText("My Custom Theme"));

    const deleteBtn = screen.getByLabelText("Delete My Custom Theme");
    fireEvent.click(deleteBtn);

    await waitFor(() => expect(screen.getByText("Delete theme?")).toBeInTheDocument());
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("calls deleteTheme on confirm", async () => {
    wrap(<ThemeSettings />);
    await waitFor(() => screen.getByText("My Custom Theme"));

    const deleteBtn = screen.getByLabelText("Delete My Custom Theme");
    fireEvent.click(deleteBtn);

    const confirmBtn = screen.getByRole("button", { name: /^Delete$/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(client.deleteTheme).toHaveBeenCalledWith("custom_0");
    });
  });

  it("renders copy button for non-protected themes", async () => {
    wrap(<ThemeSettings />);
    await waitFor(() => screen.getByText("Charcoal"));

    // Check that copy buttons are rendered (they exist in DOM, even if hidden by CSS)
    const copyButtons = screen.queryAllByLabelText(/copy/i);
    expect(copyButtons.length).toBeGreaterThan(0);
    expect(copyButtons.some(btn => btn.getAttribute("aria-label") === "Copy Charcoal")).toBe(true);
  });

  it("renders rename button for custom themes", async () => {
    wrap(<ThemeSettings />);
    await waitFor(() => screen.getByText("My Custom Theme"));

    const customCard = screen.getByText("My Custom Theme").closest(".theme-card-wrapper");
    const renameBtn = customCard.querySelector('[aria-label="Rename My Custom Theme"]');
    expect(renameBtn).toBeInTheDocument();
  });

  it("renders edit button for custom themes", async () => {
    wrap(<ThemeSettings />);
    await waitFor(() => screen.getByText("My Custom Theme"));

    const customCard = screen.getByText("My Custom Theme").closest(".theme-card-wrapper");
    const editBtn = customCard.querySelector('[aria-label="Edit My Custom Theme"]');
    expect(editBtn).toBeInTheDocument();
  });
});
