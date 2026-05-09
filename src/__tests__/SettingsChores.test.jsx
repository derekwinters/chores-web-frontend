import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import SettingsChores from "../pages/SettingsChores";
import * as client from "../api/client";

vi.mock("../api/client");
vi.mock("../contexts/AuthContext", () => ({
  AuthProvider: ({ children }) => children,
  useAuth: () => ({ user: { username: "admin", is_admin: true }, logout: vi.fn() }),
}));

function wrap() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <SettingsChores />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("SettingsChores", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    client.getConfig.mockResolvedValue({
      title: "Family Chores",
      auth_enabled: true,
      timezone: "UTC",
      due_soon_days: 3,
    });
  });

  it("renders the Due Soon Threshold section heading", async () => {
    wrap();
    await waitFor(() => {
      expect(screen.getByText("Due Soon Threshold")).toBeInTheDocument();
    });
  });

  it("renders Due Soon Threshold input pre-populated from config", async () => {
    wrap();
    await waitFor(() => {
      const input = screen.getByLabelText(/notify when due in/i);
      expect(input.value).toBe("3");
    });
  });

  it("reflects different API values when due_soon_days changes", async () => {
    client.getConfig.mockResolvedValue({
      title: "Family Chores",
      auth_enabled: true,
      timezone: "UTC",
      due_soon_days: 7,
    });
    wrap();
    await waitFor(() => {
      const input = screen.getByLabelText(/notify when due in/i);
      expect(input.value).toBe("7");
    });
  });

  it("calls updateConfig when Save is clicked", async () => {
    client.updateConfig.mockResolvedValue({
      title: "Family Chores",
      auth_enabled: true,
      timezone: "UTC",
      due_soon_days: 3,
    });
    wrap();
    await waitFor(() => {
      expect(screen.getByLabelText(/notify when due in/i).value).not.toBe("");
    });
    screen.getByRole("button", { name: /^save$/i }).click();
    await waitFor(() => {
      expect(client.updateConfig).toHaveBeenCalledWith({ due_soon_days: 3 });
    });
  });

  it("does not render Authentication section", async () => {
    wrap();
    await waitFor(() => {
      expect(screen.getByText("Due Soon Threshold")).toBeInTheDocument();
    });
    expect(screen.queryByText("Authentication")).not.toBeInTheDocument();
  });
});
