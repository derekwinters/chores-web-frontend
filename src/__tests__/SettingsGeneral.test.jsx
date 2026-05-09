import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
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

  it("does not render Authentication or Due Soon Threshold sections", async () => {
    wrap();
    await waitFor(() => {
      expect(screen.getAllByText("App Title").length).toBeGreaterThan(0);
    });
    expect(screen.queryByText("Authentication")).not.toBeInTheDocument();
    expect(screen.queryByText("Due Soon Threshold")).not.toBeInTheDocument();
  });

  it("calls updateConfig when Save is clicked for general settings", async () => {
    client.updateConfig.mockResolvedValue({
      title: "Family Chores",
      auth_enabled: true,
      timezone: "UTC",
      due_soon_days: 3,
    });
    wrap();
    await waitFor(() => {
      expect(screen.getByLabelText(/app title/i).value).not.toBe("");
    });
    const saveButtons = screen.getAllByRole("button", { name: /^save$/i });
    saveButtons[0].click();
    await waitFor(() => {
      expect(client.updateConfig).toHaveBeenCalled();
    });
  });
});
