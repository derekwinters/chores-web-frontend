import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ChoreList from "../components/ChoreList";
import * as client from "../api/client";

vi.mock("../api/client");

const CHORES = [
  {
    unique_id: "vacuum",
    name: "Vacuum",
    points: 5,
    state: "due",
    disabled: false,
    current_assignee: "Alice",
    schedule_summary: "Weekly on Mon",
    assignment_type: "rotating",
  },
  {
    unique_id: "dishes",
    name: "Dishes",
    points: 3,
    state: "due",
    disabled: false,
    current_assignee: "Bob",
    schedule_summary: "Every day",
    assignment_type: "rotating",
  },
];

const PEOPLE = [
  { id: 1, name: "Alice", color: "#3B6EA0" },
  { id: 2, name: "Bob", color: "#8B5E8A" },
];

function wrap(ui) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
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

  it("shows chore name, points, and assignee", async () => {
    wrap(<ChoreList />);
    await waitFor(() => {
      expect(screen.getByText("Vacuum")).toBeInTheDocument();
      expect(screen.getByText("5")).toBeInTheDocument();
      expect(screen.getByText("Alice")).toBeInTheDocument();
    });
  });

  it("displays schedule info with icon", async () => {
    wrap(<ChoreList />);
    await waitFor(() => {
      const schedules = screen.getAllByText(/weekly|every day/i);
      expect(schedules.length).toBeGreaterThanOrEqual(2);
    });
  });

  it("shows status indicator", async () => {
    wrap(<ChoreList />);
    await waitFor(() => {
      const dueIndicators = screen.getAllByText(/due|pending/i);
      expect(dueIndicators.length).toBeGreaterThan(0);
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
      const icons = card.querySelectorAll("svg, [class*='icon']");
      expect(icons.length).toBeGreaterThan(0);
    });
  });

  it("makes cards clickable for actions", async () => {
    wrap(<ChoreList />);
    await waitFor(() => screen.getByText("Vacuum"));

    const choreCard = screen.getByText("Vacuum").closest("article");
    expect(choreCard).toHaveClass("chore-card");
    expect(choreCard.querySelectorAll("button").length).toBeGreaterThan(0);
  });
});
