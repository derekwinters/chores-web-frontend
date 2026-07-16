import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import UserDetail from "../pages/UserDetail";
import * as client from "../api/client";

vi.mock("../api/client");

// Controllable auth mock: default to an admin; individual tests reassign
// mockUser to exercise the non-admin path.
let mockUser = { username: "admin", is_admin: true };
vi.mock("../contexts/AuthContext", () => ({
  useAuth: () => ({ user: mockUser }),
}));

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
  points_redeemed: 10,
  display_points: 35,
  points_7d: 15,
  points_30d: 45,
  completed_count: 9,
  skipped_count: 1,
};

const PEOPLE = [
  { id: 1, name: "Alice", username: "alice" },
];

const REDEMPTIONS = [
  {
    id: 1,
    person_id: 1,
    amount: 10,
    redeemed_by: "admin",
    timestamp: "2026-04-20T10:00:00Z",
  },
];

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
    mockUser = { username: "admin", is_admin: true };
    client.getLog.mockResolvedValue(USER_HISTORY);
    client.getUserStats.mockResolvedValue(USER_STATS);
    client.getPeople.mockResolvedValue(PEOPLE);
    client.getRedemptionHistory.mockResolvedValue(REDEMPTIONS);
    client.awardPoints.mockResolvedValue({ id: 1, person: "Alice", points: 10 });
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
      expect(screen.getAllByText(/Available/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/Redeemed/i)).toBeInTheDocument();
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

  it("shows completion count", async () => {
    wrap(<UserDetail />);
    await waitFor(() => {
      expect(screen.getAllByText(/Completed/i).length).toBeGreaterThan(0);
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

  describe("one-time point awards", () => {
    it("shows the Award Points action for admins", async () => {
      wrap(<UserDetail />);
      await waitFor(() => {
        expect(screen.getByRole("button", { name: /award points/i })).toBeInTheDocument();
      });
    });

    it("hides the Award Points action for non-admins", async () => {
      mockUser = { username: "bob", is_admin: false };
      wrap(<UserDetail />);
      await waitFor(() => {
        expect(screen.getByText(USER_NAME)).toBeInTheDocument();
      });
      expect(screen.queryByRole("button", { name: /award points/i })).not.toBeInTheDocument();
    });

    it("opens the award modal when the action is clicked", async () => {
      wrap(<UserDetail />);
      await waitFor(() => {
        fireEvent.click(screen.getByRole("button", { name: /award points/i }));
      });
      expect(screen.getByRole("dialog", { name: /award points/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/points to award/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/reason/i)).toBeInTheDocument();
    });

    it("submits a valid award and calls the endpoint with username, points, reason", async () => {
      wrap(<UserDetail />);
      await waitFor(() => {
        fireEvent.click(screen.getByRole("button", { name: /award points/i }));
      });

      fireEvent.change(screen.getByLabelText(/points to award/i), { target: { value: "10" } });
      fireEvent.change(screen.getByLabelText(/reason/i), { target: { value: "Helping with gardening" } });
      fireEvent.click(screen.getByRole("dialog").querySelector(".btn-primary"));

      await waitFor(() => {
        expect(client.awardPoints).toHaveBeenCalledWith(USER_NAME, 10, "Helping with gardening");
      });
    });

    it("blocks submit and shows an error when the reason is blank", async () => {
      wrap(<UserDetail />);
      await waitFor(() => {
        fireEvent.click(screen.getByRole("button", { name: /award points/i }));
      });

      fireEvent.change(screen.getByLabelText(/points to award/i), { target: { value: "5" } });
      // Leave reason blank, force a submit attempt.
      fireEvent.click(screen.getByRole("dialog").querySelector(".btn-primary"));

      await waitFor(() => {
        expect(screen.getByText(/reason is required/i)).toBeInTheDocument();
      });
      expect(client.awardPoints).not.toHaveBeenCalled();
    });

    it("rejects non-positive amounts", async () => {
      wrap(<UserDetail />);
      await waitFor(() => {
        fireEvent.click(screen.getByRole("button", { name: /award points/i }));
      });

      fireEvent.change(screen.getByLabelText(/points to award/i), { target: { value: "-3" } });
      fireEvent.change(screen.getByLabelText(/reason/i), { target: { value: "Nope" } });
      fireEvent.click(screen.getByRole("dialog").querySelector(".btn-primary"));

      await waitFor(() => {
        expect(screen.getByText(/positive number/i)).toBeInTheDocument();
      });
      expect(client.awardPoints).not.toHaveBeenCalled();
    });

    it("surfaces backend errors returned by the award endpoint", async () => {
      client.awardPoints.mockRejectedValue(new Error("Person not found"));
      wrap(<UserDetail />);
      await waitFor(() => {
        fireEvent.click(screen.getByRole("button", { name: /award points/i }));
      });

      fireEvent.change(screen.getByLabelText(/points to award/i), { target: { value: "10" } });
      fireEvent.change(screen.getByLabelText(/reason/i), { target: { value: "Helping with gardening" } });
      fireEvent.click(screen.getByRole("dialog").querySelector(".btn-primary"));

      await waitFor(() => {
        expect(screen.getByText("Person not found")).toBeInTheDocument();
      });
    });
  });
});
