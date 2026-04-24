import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Routes, Route, useLocation } from "react-router-dom";
import ChoreList from "../components/ChoreList";
import * as client from "../api/client";

vi.mock("../api/client");

const CHORES = [
  {
    id: "vacuum",
    unique_id: "vacuum",
    name: "Vacuum",
    points: 5,
    state: "due",
    disabled: false,
    current_assignee: "Alice",
    schedule_summary: "Weekly on Mon",
    assignment_type: "rotating",
    next_due: "2026-05-01",
  },
  {
    id: "bathroom",
    unique_id: "bathroom",
    name: "Bathroom",
    points: 2,
    state: "due",
    disabled: false,
    current_assignee: null,
    schedule_summary: "Weekly on Tue",
    assignment_type: "open",
    next_due: "2026-05-01",
  },
  {
    id: "dishes",
    unique_id: "dishes",
    name: "Dishes",
    points: 3,
    state: "due",
    disabled: false,
    current_assignee: "Bob",
    schedule_summary: "Every day",
    assignment_type: "rotating",
    next_due: "2026-05-02",
  },
  {
    id: "laundry",
    unique_id: "laundry",
    name: "Laundry",
    points: 1,
    state: "due",
    disabled: false,
    current_assignee: "Alice",
    schedule_summary: "Every week",
    assignment_type: "fixed",
    assignee: "Alice",
    next_due: null,
  },
];

const PEOPLE = [
  { id: 1, name: "Alice", color: "#3B6EA0" },
  { id: 2, name: "Bob", color: "#8B5E8A" },
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
  return <div data-testid="location">{`${location.pathname}${location.search}`}</div>;
}

describe("ChoreList", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    client.getChores.mockResolvedValue(CHORES);
    client.getPeople.mockResolvedValue(PEOPLE);
  });

  it("renders chores as cards not table", async () => {
    wrap(<ChoreList />);
    await waitFor(() => {
      expect(screen.getByText("Vacuum")).toBeInTheDocument();
      expect(screen.queryByRole("table")).not.toBeInTheDocument();
    });
  });

  it("shows chore name, points, and assignee when expanded", async () => {
    wrap(<ChoreList />);
    await waitFor(() => {
      expect(screen.getByText("Vacuum")).toBeInTheDocument();
    });

    // Expand Vacuum card by clicking the article itself
    const vacuumCard = screen.getByText("Vacuum").closest("article");
    fireEvent.click(vacuumCard);

    // Wait for expanded view to appear
    await waitFor(() => {
      expect(vacuumCard).toHaveClass("expanded");
    });

    // Now check for expanded content - Vacuum has 5 points and Alice as assignee
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getAllByText("Alice").length).toBeGreaterThan(0);

    // Expand Bathroom card to check Unassigned
    const bathroomCard = screen.getByText("Bathroom").closest("article");
    fireEvent.click(bathroomCard);
    await waitFor(() => {
      expect(bathroomCard).toHaveClass("expanded");
    });
    expect(screen.getByText("Unassigned")).toBeInTheDocument();
  });

  it("displays schedule info with icon", async () => {
    wrap(<ChoreList />);
    await waitFor(() => {
      expect(screen.getByText("Vacuum")).toBeInTheDocument();
    });

    // Click Vacuum card to expand and see schedule
    const vacuumCard = screen.getByText("Vacuum").closest("article");
    fireEvent.click(vacuumCard);

    await waitFor(() => {
      expect(screen.getByText("Weekly on Mon")).toBeInTheDocument();
    });

    // Click Dishes card to see "Every day" schedule
    const dishesCard = screen.getByText("Dishes").closest("article");
    fireEvent.click(dishesCard);
    await waitFor(() => {
      expect(screen.getByText("Every day")).toBeInTheDocument();
    });
  });

  it("shows assignment info for chores", async () => {
    wrap(<ChoreList />);
    await waitFor(() => {
      expect(screen.getByText("Vacuum")).toBeInTheDocument();
    });

    // Expand cards to see assignment info
    const cards = screen.getAllByRole("article");
    cards.forEach((card) => fireEvent.click(card));

    await waitFor(() => {
      expect(screen.getAllByText("Alice").length).toBeGreaterThan(0);
      expect(screen.getByText("Bob")).toBeInTheDocument();
      expect(screen.getByText("Unassigned")).toBeInTheDocument();
    });
  });

  it("arranges chores in list format, not grid", async () => {
    wrap(<ChoreList />);
    await waitFor(() => screen.getByText("Vacuum"));

    const choreList = screen.getByRole("region");
    expect(choreList).toHaveClass("chore-list");
  });

  it("uses visual hierarchy with icons", async () => {
    wrap(<ChoreList />);
    await waitFor(() => screen.getByText("Vacuum"));

    const cards = screen.getAllByRole("article");
    expect(cards.length).toBeGreaterThan(0);
    cards.forEach((card) => {
      // Cards have accent bar indicator for visual hierarchy
      const accentBar = card.querySelector(".accent-bar");
      expect(accentBar).toBeInTheDocument();
    });
  });

  it("makes cards clickable for actions", async () => {
    wrap(<ChoreList />);
    await waitFor(() => screen.getByText("Vacuum"));

    const choreCard = screen.getByText("Vacuum").closest("article");
    expect(choreCard).toHaveClass("chore-card");

    // Buttons only visible when card is expanded
    fireEvent.click(choreCard);
    expect(choreCard.querySelectorAll("button").length).toBeGreaterThan(0);
  });

  it("navigates to filtered log history for a chore", async () => {
    wrap(
      <Routes>
        <Route
          path="/"
          element={
            <>
              <ChoreList />
              <LocationDisplay />
            </>
          }
        />
        <Route path="/log" element={<LocationDisplay />} />
      </Routes>
    );
    await waitFor(() => screen.getByText("Vacuum"));

    fireEvent.click(screen.getByText("Vacuum"));
    fireEvent.click(screen.getByRole("button", { name: /history for vacuum/i }));

    await waitFor(() => {
      expect(screen.getByTestId("location")).toHaveTextContent("/log?chore_id=vacuum");
    });
  });

  it("sorts chores by next due date with tied dates by name and no-date chores last", async () => {
    wrap(<ChoreList />);

    await waitFor(() => expect(screen.getByText("Vacuum")).toBeInTheDocument());

    const articles = screen.getAllByRole("article");
    const choreNames = articles.map((article) => {
      const nameElement = article.querySelector(".chore-name");
      return nameElement?.textContent || "";
    });

    expect(choreNames).toEqual(["Bathroom", "Vacuum", "Dishes", "Laundry"]);
  });
});
