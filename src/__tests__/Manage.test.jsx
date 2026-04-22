import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Manage from "../pages/Manage";
import * as client from "../api/client";

vi.mock("../api/client");

const CHORES = [
  {
    unique_id: "vacuum",
    name: "Vacuum",
    state: "due",
    disabled: false,
    assignment_type: "rotating",
    current_assignee: "Alice",
    schedule_type: "weekly",
    schedule_config: { days: [0] },
    schedule_summary: "Weekly on Mon",
    eligible_people: ["Alice", "Bob"],
    assignee: null,
    points: 3,
    next_due: "2024-01-15",
    age: 1,
  },
  {
    unique_id: "dishes",
    name: "Dishes",
    state: "complete",
    disabled: false,
    assignment_type: "open",
    current_assignee: null,
    schedule_type: "interval",
    schedule_config: { days: 1 },
    schedule_summary: "Every 1 day",
    eligible_people: [],
    assignee: null,
    points: 0,
    next_due: "2024-01-20",
    age: -5,
  },
];

const PEOPLE = [{ id: 1, name: "Alice" }, { id: 2, name: "Bob" }];

function wrap(ui) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

describe("Manage page", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    client.getChores.mockResolvedValue(CHORES);
    client.getPeople.mockResolvedValue(PEOPLE);
    client.createChore.mockResolvedValue({ ...CHORES[0], unique_id: "new_chore", name: "New Chore" });
    client.updateChore.mockResolvedValue({ ...CHORES[0], points: 10 });
    client.deleteChore.mockResolvedValue(null);
  });

  it("renders chore table with all chores", async () => {
    wrap(<Manage />);
    await waitFor(() => expect(screen.getByText("Vacuum")).toBeInTheDocument());
    expect(screen.getByText("Dishes")).toBeInTheDocument();
  });

  it("shows schedule summaries", async () => {
    wrap(<Manage />);
    await waitFor(() => expect(screen.getByText("Weekly on Mon")).toBeInTheDocument());
    expect(screen.getByText("Every 1 day")).toBeInTheDocument();
  });

  it("shows state badges", async () => {
    wrap(<Manage />);
    await waitFor(() => expect(screen.getByText("Due")).toBeInTheDocument());
    expect(screen.getByText("Done")).toBeInTheDocument();
  });

  it("shows Add Chore button", async () => {
    wrap(<Manage />);
    await waitFor(() => expect(screen.getByText("+ Add Chore")).toBeInTheDocument());
  });

  it("opens create modal on Add Chore click", async () => {
    wrap(<Manage />);
    await waitFor(() => screen.getByText("+ Add Chore"));
    fireEvent.click(screen.getByText("+ Add Chore"));
    expect(screen.getByText("Add Chore")).toBeInTheDocument();
    expect(screen.getByText("Create")).toBeInTheDocument();
  });

  it("closes modal on Cancel", async () => {
    wrap(<Manage />);
    await waitFor(() => screen.getByText("+ Add Chore"));
    fireEvent.click(screen.getByText("+ Add Chore"));
    fireEvent.click(screen.getByText("Cancel"));
    await waitFor(() => expect(screen.queryByText("Create")).not.toBeInTheDocument());
  });

  it("closes modal on Escape key", async () => {
    wrap(<Manage />);
    await waitFor(() => screen.getByText("+ Add Chore"));
    fireEvent.click(screen.getByText("+ Add Chore"));
    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => expect(screen.queryByText("Create")).not.toBeInTheDocument());
  });

  it("opens edit modal with chore data pre-filled", async () => {
    wrap(<Manage />);
    await waitFor(() => screen.getByText("Vacuum"));
    fireEvent.click(screen.getByLabelText("Edit Vacuum"));
    await waitFor(() => expect(screen.getByDisplayValue("Vacuum")).toBeInTheDocument());
  });

  it("calls updateChore on edit submit", async () => {
    wrap(<Manage />);
    await waitFor(() => screen.getByText("Vacuum"));
    fireEvent.click(screen.getByLabelText("Edit Vacuum"));
    await waitFor(() => screen.getByDisplayValue("Vacuum"));
    fireEvent.click(screen.getByText("Save changes"));
    await waitFor(() => expect(client.updateChore).toHaveBeenCalledWith("vacuum", expect.any(Object)));
  });

  it("shows delete confirmation modal", async () => {
    wrap(<Manage />);
    await waitFor(() => screen.getByText("Vacuum"));
    fireEvent.click(screen.getByLabelText("Delete Vacuum"));
    expect(screen.getByText("Delete chore?")).toBeInTheDocument();
    expect(screen.getByText(/cannot be undone/i)).toBeInTheDocument();
  });

  it("calls deleteChore on confirm delete", async () => {
    wrap(<Manage />);
    await waitFor(() => screen.getByText("Vacuum"));
    fireEvent.click(screen.getByLabelText("Delete Vacuum"));
    const confirmBtn = screen.getAllByText("Delete").find(
      (el) => el.tagName === "BUTTON" && el.closest(".confirm-actions")
    );
    fireEvent.click(confirmBtn);
    await waitFor(() => expect(client.deleteChore).toHaveBeenCalledWith("vacuum"));
  });

  it("shows empty state when no chores", async () => {
    client.getChores.mockResolvedValue([]);
    wrap(<Manage />);
    await waitFor(() =>
      expect(screen.getByText(/No chores yet/i)).toBeInTheDocument()
    );
  });
});
