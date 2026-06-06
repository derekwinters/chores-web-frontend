import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Routes, Route, Outlet } from "react-router-dom";
import SettingsAuthLog from "../pages/SettingsAuthLog";
import * as client from "../api/client";

vi.mock("../api/client");
vi.mock("../contexts/AuthContext", () => ({
  AuthProvider: ({ children }) => children,
  useAuth: () => ({ user: { username: "admin", is_admin: true }, logout: vi.fn() }),
}));

const AUTH_ENTRIES = Array.from({ length: 25 }, (_, i) => ({
  id: i + 1,
  username: i % 2 === 0 ? "alice" : "bob",
  action: i % 3 === 0 ? "login_succeeded" : i % 3 === 1 ? "login_failed" : "password_changed",
  changed_by: i % 2 === 0 ? null : "admin",
  timestamp: new Date(2026, 0, i + 1).toISOString(),
}));

function wrap({ initialEntries = ["/settings/auth/log"] } = {}) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route path="/settings/auth/log" element={<SettingsAuthLog />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("SettingsAuthLog", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    client.getAuthLog.mockResolvedValue(AUTH_ENTRIES);
  });

  // Behavior 3: root wrapper uses log class, imports Log.css
  it("renders root div with class 'log'", async () => {
    const { container } = wrap();
    await waitFor(() => expect(screen.queryByText(/loading/i)).not.toBeInTheDocument());
    expect(container.firstChild).toHaveClass("log");
  });

  // Behavior 4: page-header with h2 and filter toggle button
  it("renders page-header with h2 'Auth Event Log'", async () => {
    wrap();
    await waitFor(() =>
      expect(screen.getByRole("heading", { level: 2, name: /auth event log/i })).toBeInTheDocument()
    );
  });

  it("renders filter toggle button in page-header", async () => {
    wrap();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /show filters|hide filters/i })).toBeInTheDocument()
    );
  });

  // Behavior 5: collapsible log-filters panel
  it("filter panel is hidden by default", async () => {
    const { container } = wrap();
    await waitFor(() =>
      expect(screen.getByRole("heading", { level: 2, name: /auth event log/i })).toBeInTheDocument()
    );
    expect(container.querySelector(".log-filters")).not.toBeInTheDocument();
  });

  it("clicking filter toggle shows filter panel with filter-group elements", async () => {
    const { container } = wrap();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /show filters/i })).toBeInTheDocument()
    );
    fireEvent.click(screen.getByRole("button", { name: /show filters/i }));
    await waitFor(() =>
      expect(container.querySelector(".log-filters")).toBeInTheDocument()
    );
    expect(container.querySelectorAll(".filter-group").length).toBeGreaterThan(0);
  });

  it("clicking filter toggle again hides filter panel", async () => {
    const { container } = wrap();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /show filters/i })).toBeInTheDocument()
    );
    fireEvent.click(screen.getByRole("button", { name: /show filters/i }));
    await waitFor(() =>
      expect(container.querySelector(".log-filters")).toBeInTheDocument()
    );
    fireEvent.click(screen.getByRole("button", { name: /hide filters/i }));
    await waitFor(() =>
      expect(container.querySelector(".log-filters")).not.toBeInTheDocument()
    );
  });

  // Behavior 6: log-table CSS class
  it("renders table with log-table class", async () => {
    const { container } = wrap();
    await waitFor(() =>
      expect(container.querySelector("table.log-table")).toBeInTheDocument()
    );
  });

  // Behavior 7: URL search params for filter state
  it("filter state survives navigation (URL search params)", async () => {
    const { container } = wrap({ initialEntries: ["/settings/auth/log?action=login_failed"] });
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /show filters/i })).toBeInTheDocument()
    );
    fireEvent.click(screen.getByRole("button", { name: /show filters/i }));
    await waitFor(() => expect(container.querySelector(".log-filters")).toBeInTheDocument());
    // action filter should be pre-selected from URL
    const actionSelect = screen.getByLabelText(/filter by action/i);
    expect(actionSelect.value).toBe("login_failed");
  });

  it("getAuthLog is called with filters from URL params", async () => {
    wrap({ initialEntries: ["/settings/auth/log?username=alice&action=login_succeeded"] });
    await waitFor(() => {
      expect(client.getAuthLog).toHaveBeenCalledWith(
        expect.objectContaining({ username: "alice", action: "login_succeeded" })
      );
    });
  });

  // Behavior 8: client-side pagination at 20 rows per page
  it("shows only 20 rows on first page when more than 20 entries exist", async () => {
    wrap();
    await waitFor(() =>
      expect(screen.getAllByText("alice").length).toBeGreaterThan(0)
    );
    // 25 entries, page 1 shows 20
    const rows = screen.getAllByRole("row");
    // thead row + 20 data rows = 21
    expect(rows.length).toBe(21);
  });

  it("renders log-pagination controls", async () => {
    const { container } = wrap();
    await waitFor(() =>
      expect(container.querySelector(".log-pagination")).toBeInTheDocument()
    );
  });

  it("Previous button is disabled on first page", async () => {
    wrap();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /previous/i })).toBeDisabled()
    );
  });

  it("Next button navigates to page 2", async () => {
    wrap();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /next/i })).not.toBeDisabled()
    );
    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    await waitFor(() => {
      const rows = screen.getAllByRole("row");
      // 25 entries, page 2 shows 5 rows + 1 header
      expect(rows.length).toBe(6);
    });
  });

  it("Next button is disabled on last page", async () => {
    wrap();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /next/i })).not.toBeDisabled()
    );
    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /next/i })).toBeDisabled();
    });
  });
});
