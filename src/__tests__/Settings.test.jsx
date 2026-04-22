import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Settings from "../pages/Settings";
import * as client from "../api/client";

vi.mock("../api/client");
vi.mock("../components/Log", () => ({
  default: () => <div>Log Component</div>,
}));

function wrap(ui) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

describe("Settings", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    client.getChores.mockResolvedValue([]);
    client.getPeople.mockResolvedValue([]);
    client.getLog.mockResolvedValue([]);
  });

  it("renders settings page with sidebar", () => {
    wrap(<Settings />);
    expect(screen.getByText("Settings")).toBeInTheDocument();
  });

  it("shows App and Theme sections in sidebar", async () => {
    wrap(<Settings />);
    await waitFor(() => {
      expect(screen.getByText("App")).toBeInTheDocument();
      expect(screen.getByText("Theme")).toBeInTheDocument();
    });
  });

  it("shows App section by default", () => {
    wrap(<Settings />);
    expect(screen.getByRole("heading", { name: /settings/i })).toBeInTheDocument();
  });

  it("navigates to Theme section when clicked", async () => {
    wrap(<Settings />);
    const themeBtn = screen.getByRole("button", { name: "Theme" });
    fireEvent.click(themeBtn);
    await waitFor(() => {
      expect(themeBtn).toHaveClass("settings-nav-active");
    });
  });

  it("highlights active section button", () => {
    wrap(<Settings />);
    const appBtn = screen.getByRole("button", { name: "App" });
    expect(appBtn).toHaveClass("settings-nav-active");

    const themeBtn = screen.getByRole("button", { name: "Theme" });
    fireEvent.click(themeBtn);
    expect(themeBtn).toHaveClass("settings-nav-active");
    expect(appBtn).not.toHaveClass("settings-nav-active");
  });
});
