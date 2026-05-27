import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Routes, Route, Outlet } from "react-router-dom";
import SettingsGeneral from "../pages/SettingsGeneral";
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

// Minimal layout wrapper that provides outlet context
function LayoutWithContext({ onTitleUpdate }) {
  return <Outlet context={{ onTitleUpdate }} />;
}

function wrap(props = {}) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={["/settings/general"]}>
        <Routes>
          <Route path="/settings" element={<LayoutWithContext onTitleUpdate={props.onTitleUpdate} />}>
            <Route path="general" element={<SettingsGeneral />} />
          </Route>
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("SettingsGeneral", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    client.getConfig.mockResolvedValue({
      title: "Family Chores",
      auth_enabled: true,
      timezone: "UTC",
      due_soon_days: 3,
    });
  });

  it("renders App Title input pre-populated from config", async () => {
    wrap();
    await waitFor(() => {
      const input = screen.getByLabelText(/app title/i);
      expect(input.value).toBe("Family Chores");
    });
  });

  it("renders Timezone select pre-populated from config", async () => {
    wrap();
    await waitFor(() => {
      const select = screen.getByLabelText(/timezone/i);
      expect(select.value).toBe("UTC");
    });
  });

  it("shows App Title and Date & Time section headings", async () => {
    wrap();
    await waitFor(() => {
      // Use getAllByText for "App Title" since it appears as both <h3> and <label>
      expect(screen.getAllByText("App Title").length).toBeGreaterThan(0);
      expect(screen.getByText("Date & Time")).toBeInTheDocument();
    });
  });

  it("shows General as h2 page title", async () => {
    wrap();
    await waitFor(() => {
      expect(screen.getAllByText("App Title").length).toBeGreaterThan(0);
    });
    const h2 = document.querySelector("h2");
    expect(h2).toBeInTheDocument();
    expect(h2.textContent).toBe("General");
  });

  it("does not render Authentication or Due Soon Threshold sections", async () => {
    wrap();
    await waitFor(() => {
      expect(screen.getAllByText("App Title").length).toBeGreaterThan(0);
    });
    expect(screen.queryByText("Authentication")).not.toBeInTheDocument();
    expect(screen.queryByText("Due Soon Threshold")).not.toBeInTheDocument();
  });

  it("Save button has btn-save--idle class on initial load", async () => {
    wrap();
    await waitFor(() => {
      expect(screen.getByLabelText(/app title/i).value).toBe("Family Chores");
    });
    const btn = screen.getByRole("button", { name: /^save$/i });
    expect(btn).toHaveClass("btn-save--idle");
    expect(btn).toBeDisabled();
  });

  it("Save button gains btn-save--dirty class after title change", async () => {
    wrap();
    await waitFor(() => {
      expect(screen.getByLabelText(/app title/i).value).toBe("Family Chores");
    });
    fireEvent.change(screen.getByLabelText(/app title/i), { target: { value: "New Title" } });
    const btn = screen.getByRole("button", { name: /^save$/i });
    expect(btn).toHaveClass("btn-save--dirty");
    expect(btn).not.toBeDisabled();
  });

  it("Save button gains btn-save--dirty class after timezone change", async () => {
    wrap();
    await waitFor(() => {
      expect(screen.getByLabelText(/timezone/i).value).toBe("UTC");
    });
    fireEvent.change(screen.getByLabelText(/timezone/i), { target: { value: "America/New_York" } });
    const btn = screen.getByRole("button", { name: /^save$/i });
    expect(btn).toHaveClass("btn-save--dirty");
    expect(btn).not.toBeDisabled();
  });

  it("Save button returns to btn-save--idle after successful save", async () => {
    client.updateConfig.mockResolvedValue({
      title: "New Title",
      auth_enabled: true,
      timezone: "UTC",
      due_soon_days: 3,
    });
    wrap();
    await waitFor(() => {
      expect(screen.getByLabelText(/app title/i).value).toBe("Family Chores");
    });
    fireEvent.change(screen.getByLabelText(/app title/i), { target: { value: "New Title" } });
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /^save$/i })).toHaveClass("btn-save--idle");
    });
  });

  it("calls updateConfig with title and timezone when Save is clicked after a change", async () => {
    client.updateConfig.mockResolvedValue({
      title: "Family Chores",
      auth_enabled: true,
      timezone: "UTC",
      due_soon_days: 3,
    });
    wrap();
    await waitFor(() => {
      expect(screen.getByLabelText(/app title/i).value).toBe("Family Chores");
    });
    fireEvent.change(screen.getByLabelText(/app title/i), { target: { value: "New Title" } });
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));
    await waitFor(() => {
      expect(client.updateConfig).toHaveBeenCalledWith({ title: "New Title", timezone: "UTC" });
    });
  });

  it("registers beforeunload handler when dirty", async () => {
    const addSpy = vi.spyOn(window, "addEventListener");
    wrap();
    await waitFor(() => {
      expect(screen.getByLabelText(/app title/i).value).toBe("Family Chores");
    });
    fireEvent.change(screen.getByLabelText(/app title/i), { target: { value: "Changed" } });
    await waitFor(() => {
      const calls = addSpy.mock.calls.filter(([event]) => event === "beforeunload");
      expect(calls.length).toBeGreaterThan(0);
    });
  });
});
