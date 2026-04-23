import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import UserDetail from "../pages/UserDetail";
import * as client from "../api/client";

vi.mock("../api/client");

const USER_NAME = "Alice";
const USER_HISTORY = [
  {
    id: 1,
    chore_id: "vacuum",
    chore_name: "Vacuum",
    action: "completed",
    timestamp: "2026-04-19T10:00:00Z",
    points: 5,
  },
  {
    id: 2,
    chore_id: "trash",
    chore_name: "Take out trash",
    action: "skipped",
    timestamp: "2026-04-18T15:30:00Z",
    points: 0,
  },
];

const USER_STATS = {
  name: "Alice",
  total_points: 45,
  points_7d: 15,
  points_30d: 45,
  completed_count: 9,
  skipped_count: 1,
};

function wrap(ui) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={["/", `/users/${USER_NAME}`]} initialIndex={1}>
        <Routes>
          <Route path="/" element={<div>Board</div>} />
          <Route path="/users/:userName" element={ui} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("UserDetail", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    client.getLog.mockResolvedValue(USER_HISTORY);
    client.getUserStats.mockResolvedValue(USER_STATS);
  });

  it("renders user name", async () => {
    wrap(<UserDetail />);
    await waitFor(() => {
      expect(screen.getByText("Alice")).toBeInTheDocument();
    });
  });

  it("shows back button", async () => {
    wrap(<UserDetail />);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /back|←/i })).toBeInTheDocument();
    });
  });

  it("navigates back when back button clicked", async () => {
    wrap(<UserDetail />);
    await waitFor(() => {
      fireEvent.click(screen.getByRole("button", { name: /back|←/i }));
    });
    await waitFor(() => {
      expect(screen.getByText("Board")).toBeInTheDocument();
    });
  });

  it("displays user statistics", async () => {
    wrap(<UserDetail />);
    await waitFor(() => {
      expect(screen.getByText(/Total Points/i)).toBeInTheDocument();
      expect(screen.getByText(/Last 7 Days/i)).toBeInTheDocument();
      expect(screen.getByText(/Last 30 Days/i)).toBeInTheDocument();
    });
  });

  it("shows 7-day and 30-day points", async () => {
    wrap(<UserDetail />);
    await waitFor(() => {
      expect(screen.getByText(/7.*day|7d/i)).toBeInTheDocument();
      expect(screen.getByText(/30.*day|30d/i)).toBeInTheDocument();
    });
  });

  it("shows completion and skip counts", async () => {
    wrap(<UserDetail />);
    await waitFor(() => {
      expect(screen.getAllByText(/Completed/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Skipped/i).length).toBeGreaterThan(0);
    });
  });

  it("displays user history log entries", async () => {
    wrap(<UserDetail />);
    await waitFor(() => {
      expect(screen.getByText("Vacuum")).toBeInTheDocument();
      expect(screen.getByText("Take out trash")).toBeInTheDocument();
    });
  });

  it("fetches chore activity history filtered by user", async () => {
    wrap(<UserDetail />);
    await waitFor(() => {
      expect(client.getLog).toHaveBeenCalledWith({
        person: USER_NAME,
        actions: ["completed", "skipped", "reassigned"],
      });
    });
  });

  it("shows loading state", () => {
    client.getLog.mockImplementation(() => new Promise(() => {}));
    wrap(<UserDetail />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });
});
