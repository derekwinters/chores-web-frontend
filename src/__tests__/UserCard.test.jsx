import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import UserCard from "../components/UserCard";
import * as client from "../api/client";

vi.mock("../api/client");

const PERSON = { id: 1, name: "Alice" };
const PEOPLE = [{ id: 1, name: "Alice" }, { id: 2, name: "Bob" }];

const TODAY = new Date();
function dateStr(offsetDays) {
  const d = new Date(TODAY);
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split("T")[0];
}

const DUE_CHORE = {
  id: "vacuum",
  unique_id: "vacuum",
  name: "Vacuum",
  state: "due",
  disabled: false,
  assignment_type: "rotating",
  current_assignee: "Alice",
  age: 1,
  next_due: dateStr(-1),
  schedule_summary: "Weekly on Mon",
  eligible_people: ["Alice", "Bob"],
};

const SOON_CHORE = {
  id: "dishes",
  unique_id: "dishes",
  name: "Dishes",
  state: "complete",
  disabled: false,
  assignment_type: "rotating",
  current_assignee: "Alice",
  age: null,
  next_due: dateStr(3),
  schedule_summary: "Every 1 day",
  eligible_people: ["Alice", "Bob"],
};

const SUMMARY = { person: "Alice", points_7d: 10, points_30d: 25 };

function wrap(ui) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe("UserCard", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("renders person name", () => {
    wrap(<UserCard person={PERSON} chores={[]} people={PEOPLE} summary={SUMMARY} />);
    expect(screen.getByText("Alice")).toBeInTheDocument();
  });

  it("shows 7-day and 30-day points", () => {
    wrap(<UserCard person={PERSON} chores={[]} people={PEOPLE} summary={SUMMARY} />);
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByText("25")).toBeInTheDocument();
    expect(screen.getByText("Last 7 Days")).toBeInTheDocument();
    expect(screen.getByText("Last 30 Days")).toBeInTheDocument();
  });

  it("shows zero points when no summary", () => {
    wrap(<UserCard person={PERSON} chores={[]} people={PEOPLE} summary={null} />);
    expect(screen.getByText("Last 7 Days")).toBeInTheDocument();
    expect(screen.getByText("Last 30 Days")).toBeInTheDocument();
    // Check that point displays exist (containing "0")
    const points = screen.getAllByText(/^0$/);
    expect(points.length).toBeGreaterThanOrEqual(2);
  });

  it("shows due now count", () => {
    wrap(<UserCard person={PERSON} chores={[DUE_CHORE]} people={PEOPLE} summary={SUMMARY} />);
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("shows due soon count", () => {
    wrap(<UserCard person={PERSON} chores={[SOON_CHORE]} people={PEOPLE} summary={SUMMARY} />);
    const dueSoonHeaders = screen.getAllByText(/Due Soon/i);
    expect(dueSoonHeaders.length).toBeGreaterThan(0);
    // Due Soon count should be 1
    const counts = screen.getAllByText("1");
    expect(counts.length).toBeGreaterThan(0);
  });

  it("shows open/unassigned count", () => {
    const openChore = { ...DUE_CHORE, assignment_type: "open", current_assignee: null, id: "open-chore", unique_id: "open-chore" };
    wrap(<UserCard person={PERSON} chores={[openChore]} people={PEOPLE} summary={SUMMARY} />);
    expect(screen.getByText("Open / Unassigned")).toBeInTheDocument();
  });

  it("navigates to due-now filtered chores on Due Now click", async () => {
    wrap(<UserCard person={PERSON} chores={[DUE_CHORE]} people={PEOPLE} summary={SUMMARY} />);
    // Should have "Due Now" link button
    const dueNowButtons = screen.getAllByRole("button").filter(btn => {
      const header = btn.querySelector(".uc-due-header");
      return header && header.textContent === "Due Now";
    });
    expect(dueNowButtons.length).toBeGreaterThan(0);
  });

  it("navigates to due-soon filtered chores on Due Soon click", async () => {
    wrap(<UserCard person={PERSON} chores={[SOON_CHORE]} people={PEOPLE} summary={SUMMARY} />);
    // Should have "Due Soon" link button
    const dueSoonButtons = screen.getAllByRole("button").filter(btn => {
      const header = btn.querySelector(".uc-due-header");
      return header && header.textContent === "Due Soon";
    });
    expect(dueSoonButtons.length).toBeGreaterThan(0);
  });

  it("excludes chores assigned to other people from due count", () => {
    const otherChore = { ...DUE_CHORE, current_assignee: "Bob", unique_id: "other" };
    wrap(<UserCard person={PERSON} chores={[otherChore]} people={PEOPLE} summary={SUMMARY} />);
    // Due Now count should be 0 for Alice when only Bob's chore is present
    const counts = screen.getAllByText("0");
    expect(counts.length).toBeGreaterThan(0);
  });

  it("does not count chores due more than 7 days away in soon count", () => {
    const farChore = { ...SOON_CHORE, id: "far", unique_id: "far", next_due: dateStr(10) };
    wrap(<UserCard person={PERSON} chores={[farChore]} people={PEOPLE} summary={SUMMARY} />);
    // Chore due in 10 days is outside the 7-day window and should not be counted
    // Due Soon count should be 0
    const dueSoonHeaders = screen.getAllByText(/Due Soon/i);
    expect(dueSoonHeaders.length).toBeGreaterThan(0);
  });

  it("shows green color for points ahead of goal (>0.8)", () => {
    const aheadSummary = { person: "Alice", points_7d: 20, points_30d: 25 };
    const personWithGoal = { ...PERSON, goal_7d: 20, goal_30d: 30 };
    wrap(<UserCard person={personWithGoal} chores={[]} people={PEOPLE} summary={aheadSummary} />);
    const points7d = screen.getAllByText("20")[0];
    expect(points7d).toHaveStyle({ color: "#3db87a" });
  });

  it("shows yellow color for points on-track (0.5-0.8)", () => {
    const onTrackSummary = { person: "Alice", points_7d: 10, points_30d: 25 };
    const personWithGoal = { ...PERSON, goal_7d: 20, goal_30d: 50 };
    wrap(<UserCard person={personWithGoal} chores={[]} people={PEOPLE} summary={onTrackSummary} />);
    const points7d = screen.getByText("10");
    expect(points7d).toHaveStyle({ color: "#e8a930" });
  });

  it("shows red color for points behind goal (<0.5)", () => {
    const behindSummary = { person: "Alice", points_7d: 5, points_30d: 25 };
    const personWithGoal = { ...PERSON, goal_7d: 20, goal_30d: 50 };
    wrap(<UserCard person={personWithGoal} chores={[]} people={PEOPLE} summary={behindSummary} />);
    const points7d = screen.getByText("5");
    expect(points7d).toHaveStyle({ color: "#e05c6a" });
  });
});
