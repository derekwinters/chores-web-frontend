import React from "react";
import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import SettingsChores from "../pages/SettingsChores";
import * as client from "../api/client";

vi.mock("../api/client");
vi.mock("../contexts/AuthContext", () => ({
  AuthProvider: ({ children }) => children,
  useAuth: () => ({ user: { username: "admin", is_admin: true }, logout: vi.fn() }),
}));

// Mock useBlocker — MemoryRouter doesn't provide a data router context
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useBlocker: (_shouldBlock) => ({ state: "unblocked", proceed: vi.fn(), reset: vi.fn() }),
  };
});

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

  afterEach(() => {
    vi.restoreAllMocks();
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

  it("calls updateConfig when Save is clicked after a change", async () => {
    client.updateConfig.mockResolvedValue({
      title: "Family Chores",
      auth_enabled: true,
      timezone: "UTC",
      due_soon_days: 5,
    });
    wrap();
    await waitFor(() => {
      expect(screen.getByLabelText(/notify when due in/i).value).toBe("3");
    });
    fireEvent.change(screen.getByLabelText(/notify when due in/i), { target: { value: "5" } });
    screen.getByRole("button", { name: /^save$/i }).click();
    await waitFor(() => {
      expect(client.updateConfig).toHaveBeenCalledWith({ due_soon_days: 5 });
    });
  });

  it("does not render Authentication section", async () => {
    wrap();
    await waitFor(() => {
      expect(screen.getByText("Due Soon Threshold")).toBeInTheDocument();
    });
    expect(screen.queryByText("Authentication")).not.toBeInTheDocument();
  });

  // Behavior 1 & 2: Save button idle/dirty states
  it("Save button has btn-save--idle class on initial load", async () => {
    wrap();
    await waitFor(() => {
      const btn = screen.getByRole("button", { name: /^save$/i });
      expect(btn).toHaveClass("btn-save--idle");
    });
  });

  it("Save button is disabled on initial load (no unsaved changes)", async () => {
    wrap();
    await waitFor(() => {
      const btn = screen.getByRole("button", { name: /^save$/i });
      expect(btn).toBeDisabled();
    });
  });

  it("Save button gains btn-save--dirty class after input change", async () => {
    wrap();
    await waitFor(() => {
      expect(screen.getByLabelText(/notify when due in/i).value).toBe("3");
    });
    const input = screen.getByLabelText(/notify when due in/i);
    fireEvent.change(input, { target: { value: "5" } });
    const btn = screen.getByRole("button", { name: /^save$/i });
    expect(btn).toHaveClass("btn-save--dirty");
    expect(btn).not.toBeDisabled();
  });

  it("Save button returns to btn-save--idle after successful save", async () => {
    client.updateConfig.mockResolvedValue({
      title: "Family Chores",
      auth_enabled: true,
      timezone: "UTC",
      due_soon_days: 5,
    });
    wrap();
    await waitFor(() => {
      expect(screen.getByLabelText(/notify when due in/i).value).toBe("3");
    });
    const input = screen.getByLabelText(/notify when due in/i);
    fireEvent.change(input, { target: { value: "5" } });
    const btn = screen.getByRole("button", { name: /^save$/i });
    fireEvent.click(btn);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /^save$/i })).toHaveClass("btn-save--idle");
    });
  });

  // Behavior 3: beforeunload handler
  it("registers beforeunload handler when dirty", async () => {
    const addSpy = vi.spyOn(window, "addEventListener");
    wrap();
    await waitFor(() => {
      expect(screen.getByLabelText(/notify when due in/i).value).toBe("3");
    });
    fireEvent.change(screen.getByLabelText(/notify when due in/i), { target: { value: "5" } });
    await waitFor(() => {
      const calls = addSpy.mock.calls.filter(([event]) => event === "beforeunload");
      expect(calls.length).toBeGreaterThan(0);
    });
  });

  it("unregisters beforeunload handler after successful save", async () => {
    client.updateConfig.mockResolvedValue({
      title: "Family Chores",
      auth_enabled: true,
      timezone: "UTC",
      due_soon_days: 5,
    });
    const removeSpy = vi.spyOn(window, "removeEventListener");
    wrap();
    await waitFor(() => {
      expect(screen.getByLabelText(/notify when due in/i).value).toBe("3");
    });
    fireEvent.change(screen.getByLabelText(/notify when due in/i), { target: { value: "5" } });
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));
    await waitFor(() => {
      const calls = removeSpy.mock.calls.filter(([event]) => event === "beforeunload");
      expect(calls.length).toBeGreaterThan(0);
    });
  });
});
