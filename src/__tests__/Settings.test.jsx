import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import Settings from "../pages/Settings";
import * as client from "../api/client";

vi.mock("../api/client");
vi.mock("../components/Log", () => ({
  default: () => <div>Log Component</div>,
}));

function wrap(ui) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <MemoryRouter>
      <QueryClientProvider client={qc}>{ui}</QueryClientProvider>
    </MemoryRouter>
  );
}

describe("Settings", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    client.getChores.mockResolvedValue([]);
    client.getPeople.mockResolvedValue([]);
    client.getLog.mockResolvedValue([]);
    client.getConfig.mockResolvedValue({ title: "Family Chores", auth_enabled: true });
  });

  it("renders settings page with General section", async () => {
    wrap(<Settings />);
    await waitFor(() => {
      expect(screen.getByText("General")).toBeInTheDocument();
    });
  });

  it("shows General and Theme sections", async () => {
    wrap(<Settings />);
    await waitFor(() => {
      expect(screen.getByText("General")).toBeInTheDocument();
      expect(screen.getByText("Theme")).toBeInTheDocument();
    });
  });

  it("shows App Title field by default", async () => {
    wrap(<Settings />);
    await waitFor(() => {
      expect(screen.getByLabelText(/app title/i)).toBeInTheDocument();
    });
  });

  it("shows Auth section", async () => {
    wrap(<Settings />);
    await waitFor(() => {
      expect(screen.getByText("Auth")).toBeInTheDocument();
    });
  });

  it("allows saving settings", async () => {
    client.updateConfig.mockResolvedValue({ title: "My App", auth_enabled: true });
    wrap(<Settings />);
    // Wait for the config to load and the input to have a non-empty value
    await waitFor(() => {
      const input = screen.getByLabelText(/app title/i);
      expect(input.value).not.toBe("");
    });
    fireEvent.click(screen.getByRole("button", { name: /save/i }));
    await waitFor(() => {
      expect(client.updateConfig).toHaveBeenCalled();
    });
  });
});
