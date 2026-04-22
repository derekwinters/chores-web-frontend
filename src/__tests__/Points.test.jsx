import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Points from "../pages/Points";
import * as client from "../api/client";

vi.mock("../api/client");

const BOARD = [
  { person: "Alice", total_points: 25 },
  { person: "Bob", total_points: 10 },
];

const HISTORY = [
  { id: 1, person: "Alice", points: 5, chore_id: "vacuum", completed_at: "2024-01-15T12:00:00Z" },
  { id: 2, person: "Alice", points: 5, chore_id: "dishes", completed_at: "2024-01-14T12:00:00Z" },
];

function wrap(ui) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

describe("Points", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    client.getLeaderboard.mockResolvedValue(BOARD);
    client.getPersonHistory.mockResolvedValue(HISTORY);
  });

  it("renders leaderboard entries", async () => {
    wrap(<Points />);
    await waitFor(() => expect(screen.getByText("Alice")).toBeInTheDocument());
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("25")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
  });

  it("shows empty message when no points", async () => {
    client.getLeaderboard.mockResolvedValue([]);
    wrap(<Points />);
    await waitFor(() =>
      expect(screen.getByText("No points recorded yet.")).toBeInTheDocument()
    );
  });

  it("shows person history when row is clicked", async () => {
    wrap(<Points />);
    await waitFor(() => screen.getByText("Alice"));
    fireEvent.click(screen.getByText("Alice"));
    await waitFor(() => expect(client.getPersonHistory).toHaveBeenCalledWith("Alice"));
    await waitFor(() => expect(screen.getByText("vacuum")).toBeInTheDocument());
  });

  it("hides history when same row clicked twice", async () => {
    wrap(<Points />);
    await waitFor(() => screen.getByText("Alice"));
    fireEvent.click(screen.getByText("Alice"));
    await waitFor(() => screen.getByText("vacuum"));
    fireEvent.click(screen.getByText("Alice"));
    await waitFor(() => expect(screen.queryByText("vacuum")).not.toBeInTheDocument());
  });
});
