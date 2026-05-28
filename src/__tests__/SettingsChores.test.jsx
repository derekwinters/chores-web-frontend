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
      due_time_hour: 6,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the Chore Settings section heading", async () => {
    wrap();
    await waitFor(() => {
      expect(screen.getByText("Chore Settings")).toBeInTheDocument();
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
      due_time_hour: 6,
    });
    wrap();
    await waitFor(() => {
      const input = screen.getByLabelText(/notify when due in/i);
      expect(input.value).toBe("7");
    });
  });

  it("renders due hour dropdown pre-populated from config", async () => {
    wrap();
    await waitFor(() => {
      const select = screen.getByLabelText(/mark chores due at/i);
      expect(select.value).toBe("6");
    });
  });

  it("renders due hour dropdown with 24 options", async () => {
    wrap();
    await waitFor(() => {
      const select = screen.getByLabelText(/mark chores due at/i);
      expect(select.options.length).toBe(24);
    });
  });

  it("reflects different due_time_hour values from config", async () => {
    client.getConfig.mockResolvedValue({
      title: "Family Chores",
      auth_enabled: true,
      timezone: "UTC",
      due_soon_days: 3,
      due_time_hour: 14,
    });
    wrap();
    await waitFor(() => {
      const select = screen.getByLabelText(/mark chores due at/i);
      expect(select.value).toBe("14");
    });
  });

  it("renders 12 AM for hour 0", async () => {
    wrap();
    await waitFor(() => {
      const select = screen.getByLabelText(/mark chores due at/i);
      expect(select.options[0].text).toBe("12 AM");
    });
  });

  it("renders 12 PM for hour 12", async () => {
    wrap();
    await waitFor(() => {
      const select = screen.getByLabelText(/mark chores due at/i);
      expect(select.options[12].text).toBe("12 PM");
    });
  });

  it("renders 11 PM for hour 23", async () => {
    wrap();
    await waitFor(() => {
      const select = screen.getByLabelText(/mark chores due at/i);
      expect(select.options[23].text).toBe("11 PM");
    });
  });

  it("calls updateConfig with both due_soon_days and due_time_hour when Save is clicked", async () => {
    client.updateConfig.mockResolvedValue({
      title: "Family Chores",
      auth_enabled: true,
      timezone: "UTC",
      due_soon_days: 5,
      due_time_hour: 8,
    });
    wrap();
    await waitFor(() => {
      expect(screen.getByLabelText(/notify when due in/i).value).toBe("3");
    });
    fireEvent.change(screen.getByLabelText(/notify when due in/i), { target: { value: "5" } });
    fireEvent.change(screen.getByLabelText(/mark chores due at/i), { target: { value: "8" } });
    screen.getByRole("button", { name: /^save$/i }).click();
    await waitFor(() => {
      expect(client.updateConfig).toHaveBeenCalledWith({ due_soon_days: 5, due_time_hour: 8 });
    });
  });

  it("does not render Authentication section", async () => {
    wrap();
    await waitFor(() => {
      expect(screen.getByText("Chore Settings")).toBeInTheDocument();
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

  it("Save button gains btn-save--dirty class after due_soon_days input change", async () => {
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

  it("Save button gains btn-save--dirty class after due_time_hour dropdown change", async () => {
    wrap();
    await waitFor(() => {
      expect(screen.getByLabelText(/mark chores due at/i).value).toBe("6");
    });
    const select = screen.getByLabelText(/mark chores due at/i);
    fireEvent.change(select, { target: { value: "9" } });
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
      due_time_hour: 6,
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
      due_time_hour: 6,
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
