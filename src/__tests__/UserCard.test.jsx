import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
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
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

describe("UserCard", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    client.completeChore.mockResolvedValue({ ...DUE_CHORE, state: "complete" });
    client.skipChore.mockResolvedValue({ ...DUE_CHORE, state: "complete" });
    client.reassignChore.mockResolvedValue({ ...DUE_CHORE, current_assignee: "Bob" });
    client.markDueChore.mockResolvedValue({ ...SOON_CHORE, state: "due" });
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

  it("expands due now section (auto-opens when chores present)", () => {
    wrap(<UserCard person={PERSON} chores={[DUE_CHORE]} people={PEOPLE} summary={SUMMARY} />);
    expect(screen.getByText("Vacuum")).toBeInTheDocument();
    expect(screen.getByText("Complete")).toBeInTheDocument();
    expect(screen.getByText("Skip")).toBeInTheDocument();
  });

  it("due soon section is collapsed by default but toggleable", () => {
    wrap(<UserCard person={PERSON} chores={[SOON_CHORE]} people={PEOPLE} summary={SUMMARY} />);
    expect(screen.queryByText("Dishes")).not.toBeInTheDocument();
    fireEvent.click(screen.getByText("due soon"));
    expect(screen.getByText("Dishes")).toBeInTheDocument();
  });

  it("shows Mark due button for soon chores", () => {
    wrap(<UserCard person={PERSON} chores={[SOON_CHORE]} people={PEOPLE} summary={SUMMARY} />);
    fireEvent.click(screen.getByText("due soon"));
    expect(screen.getByText("Mark due")).toBeInTheDocument();
  });

  it("calls completeChore with person name on Complete click", async () => {
    wrap(<UserCard person={PERSON} chores={[DUE_CHORE]} people={PEOPLE} summary={SUMMARY} />);
    fireEvent.click(screen.getByText("Complete"));
    await waitFor(() => expect(client.completeChore).toHaveBeenCalledWith("vacuum", "Alice"));
  });

  it("calls skipChore on Skip click", async () => {
    wrap(<UserCard person={PERSON} chores={[DUE_CHORE]} people={PEOPLE} summary={SUMMARY} />);
    fireEvent.click(screen.getByText("Skip"));
    await waitFor(() => expect(client.skipChore).toHaveBeenCalledWith("vacuum"));
  });

  it("excludes chores assigned to other people", () => {
    const otherChore = { ...DUE_CHORE, current_assignee: "Bob", unique_id: "other" };
    wrap(<UserCard person={PERSON} chores={[otherChore]} people={PEOPLE} summary={SUMMARY} />);
    expect(screen.queryByText("Vacuum")).not.toBeInTheDocument();
  });

  it("does not show chores due more than 7 days away in soon section", () => {
    const farChore = { ...SOON_CHORE, next_due: dateStr(10), unique_id: "far" };
    wrap(<UserCard person={PERSON} chores={[farChore]} people={PEOPLE} summary={SUMMARY} />);
    fireEvent.click(screen.getByText("due soon"));
    // count should be 0, section disabled
    const toggle = screen.getByText("due soon").closest("button");
    expect(toggle).toBeDisabled();
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
