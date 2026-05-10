import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import SettingsDataPointsLog from "../pages/SettingsDataPointsLog";
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
        <SettingsDataPointsLog />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("SettingsDataPointsLog", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    client.getAdminPointsLog.mockResolvedValue({ items: [], total: 0, offset: 0, limit: 20 });
  });

  it("renders the Points Log section heading", () => {
    wrap();
    expect(screen.getByText("Points Log")).toBeInTheDocument();
  });

  it("renders the DatabaseSection table headers", async () => {
    wrap();
    await waitFor(() => {
      expect(screen.getByText("ID")).toBeInTheDocument();
      expect(screen.getByText("Person")).toBeInTheDocument();
      expect(screen.getByText("Points")).toBeInTheDocument();
    });
  });

  it("shows 'No entries found' when there are no log entries", async () => {
    wrap();
    await waitFor(() => {
      expect(screen.getByText(/no entries found/i)).toBeInTheDocument();
    });
  });

  it("renders rows when the API returns entries", async () => {
    client.getAdminPointsLog.mockResolvedValue({
      items: [
        { id: 1, person: "Alice", points: 10, chore_id: 2, completed_at: "2024-01-15T10:00:00Z" },
      ],
      total: 1,
      offset: 0,
      limit: 20,
    });
    wrap();
    await waitFor(() => {
      expect(screen.getByText("Alice")).toBeInTheDocument();
    });
  });
});
