import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Routes, Route, useLocation } from "react-router-dom";
import Dashboard from "../pages/Dashboard";
import * as client from "../api/client";

vi.mock("../api/client");

const TODAY = new Date().toISOString().split("T")[0];

const PEOPLE = [{ id: 1, name: "Alice" }, { id: 2, name: "Bob" }];

const CHORES = [
  {
    unique_id: "vacuum",
    name: "Vacuum",
    state: "due",
    disabled: false,
    assignment_type: "rotating",
    current_assignee: "Alice",
    age: 1,
    next_due: TODAY,
    schedule_summary: "Weekly on Mon",
    eligible_people: ["Alice", "Bob"],
  },
  {
    unique_id: "trash",
    name: "Take out trash",
    state: "due",
    disabled: false,
    assignment_type: "open",
    current_assignee: null,
    age: 0,
    next_due: TODAY,
    schedule_summary: "Weekly on Wed",
    eligible_people: [],
  },
];

const SUMMARY = [
  { person: "Alice", points_7d: 10, points_30d: 25 },
  { person: "Bob", points_7d: 0, points_30d: 5 },
];

function wrap(ui) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={["/"]}>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
}

function LocationDisplay() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
}

describe("Dashboard", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    client.getChores.mockResolvedValue(CHORES);
    client.getPeople.mockResolvedValue(PEOPLE);
    client.getPointsSummary.mockResolvedValue(SUMMARY);
  });

  it("renders a card for each person", async () => {
    wrap(<Dashboard />);
    await waitFor(() => expect(screen.getByText("Alice", { selector: ".uc-name" })).toBeInTheDocument());
    expect(screen.getByText("Bob", { selector: ".uc-name" })).toBeInTheDocument();
  });

  it("shows points summary on each card", async () => {
    wrap(<Dashboard />);
    await waitFor(() => expect(screen.getByText("10")).toBeInTheDocument());
    expect(screen.getByText("25")).toBeInTheDocument();
  });

  it("shows empty state when no people", async () => {
    client.getPeople.mockResolvedValue([]);
    client.getPointsSummary.mockResolvedValue([]);
    wrap(<Dashboard />);
    await waitFor(() =>
      expect(screen.getByText(/No people added yet/i)).toBeInTheDocument()
    );
  });

  it("navigates to the user detail route when clicking a user card", async () => {
    wrap(
      <Routes>
        <Route
          path="/"
          element={
            <>
              <Dashboard />
              <LocationDisplay />
            </>
          }
        />
        <Route path="/users/:userName" element={<LocationDisplay />} />
      </Routes>
    );
    await waitFor(() => expect(screen.getByText("Alice", { selector: ".uc-name" })).toBeInTheDocument());

    const aliceCard = screen.getByText("Alice", { selector: ".uc-name" }).closest(".user-card");
    fireEvent.click(aliceCard);

    await waitFor(() => {
      expect(screen.getByTestId("location")).toHaveTextContent("/users/Alice");
    });
  });
});
