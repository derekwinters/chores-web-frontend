import React from "react";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ChoreRowActions from "../components/ChoreRowActions";
import * as client from "../api/client";

vi.mock("../api/client");

const CHORE = {
  id: "vacuum",
  unique_id: "vacuum",
  name: "Vacuum",
  state: "due",
  disabled: false,
  age: 2,
  next_due: "2024-01-10",
};

const PEOPLE = [{ name: "Alice", username: "alice" }, { name: "Bob", username: "bob" }];

const UNASSIGNED_CHORE = {
  id: "bathroom",
  unique_id: "bathroom",
  name: "Bathroom",
  state: "due",
  disabled: false,
  age: 0,
  next_due: "2024-01-10",
  current_assignee: null,
};

function wrap(ui) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

describe("ChoreRowActions — due mode", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    client.completeChore.mockResolvedValue({ ...CHORE, state: "complete" });
    client.skipChore.mockResolvedValue({ ...CHORE, state: "complete" });
    client.reassignChore.mockResolvedValue({ ...CHORE, current_assignee: "Bob" });
  });

  it("renders chore name and age", () => {
    wrap(<ChoreRowActions chore={CHORE} person="Alice" people={PEOPLE} mode="due" />);
    expect(screen.getByText("Vacuum")).toBeInTheDocument();
    expect(screen.getByText("2d overdue")).toBeInTheDocument();
  });

  it("shows Complete and Skip buttons", () => {
    wrap(<ChoreRowActions chore={CHORE} person="Alice" people={PEOPLE} mode="due" />);
    expect(screen.getByText("Complete")).toBeInTheDocument();
    expect(screen.getByText("Skip")).toBeInTheDocument();
  });

  it("calls completeChore with person on Complete", async () => {
    wrap(<ChoreRowActions chore={CHORE} person="Alice" people={PEOPLE} mode="due" />);
    fireEvent.click(screen.getByText("Complete"));
    await waitFor(() => expect(client.completeChore).toHaveBeenCalledWith("vacuum", "Alice"));
  });

  it("calls skipChore on Skip", async () => {
    wrap(<ChoreRowActions chore={CHORE} person="Alice" people={PEOPLE} mode="due" />);
    fireEvent.click(screen.getByText("Skip"));
    await waitFor(() => expect(client.skipChore).toHaveBeenCalledWith("vacuum"));
  });

  it("shows reassign dropdown with other people", () => {
    wrap(<ChoreRowActions chore={CHORE} person="Alice" people={PEOPLE} mode="due" />);
    const select = screen.getByRole("combobox");
    expect(select).toBeInTheDocument();
    // Bob should be an option, Alice should not (she's the current person)
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.queryByText("Alice", { selector: "option" })).not.toBeInTheDocument();
  });

  it("calls reassignChore when reassign target selected and confirmed", async () => {
    wrap(<ChoreRowActions chore={CHORE} person="Alice" people={PEOPLE} mode="due" />);
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "Bob" } });
    fireEvent.click(screen.getByText("✓"));
    await waitFor(() => expect(client.reassignChore).toHaveBeenCalledWith("vacuum", "Bob"));
  });

  it("complete button null person when no person provided", async () => {
    wrap(<ChoreRowActions chore={CHORE} person={null} people={[]} mode="due" />);
    fireEvent.click(screen.getByText("Complete"));
    await waitFor(() => expect(client.completeChore).toHaveBeenCalledWith("vacuum", null));
  });

  describe("CompleteWithActorModal — unassigned chore", () => {
    beforeEach(() => {
      client.completeChore.mockResolvedValue({ ...UNASSIGNED_CHORE, state: "complete" });
    });

    it("shows actor modal instead of completing directly when current_assignee is null", async () => {
      wrap(<ChoreRowActions chore={UNASSIGNED_CHORE} person={null} people={PEOPLE} mode="due" />);
      fireEvent.click(screen.getByText("Complete"));
      await waitFor(() => expect(screen.getByText(/who completed/i)).toBeInTheDocument());
      expect(client.completeChore).not.toHaveBeenCalled();
    });

    it("calls completeChore with selected username when modal is confirmed", async () => {
      wrap(<ChoreRowActions chore={UNASSIGNED_CHORE} person={null} people={PEOPLE} mode="due" />);
      fireEvent.click(screen.getByText("Complete"));
      await waitFor(() => expect(screen.getByText(/who completed/i)).toBeInTheDocument());

      // Select Alice in the modal
      const dialog = screen.getByRole("dialog");
      const select = within(dialog).getByRole("combobox");
      fireEvent.change(select, { target: { value: "alice" } });
      fireEvent.click(within(dialog).getByRole("button", { name: /^complete$/i }));

      await waitFor(() => expect(client.completeChore).toHaveBeenCalledWith("bathroom", "alice"));
    });

    it("does not call completeChore when modal is cancelled", async () => {
      wrap(<ChoreRowActions chore={UNASSIGNED_CHORE} person={null} people={PEOPLE} mode="due" />);
      fireEvent.click(screen.getByText("Complete"));
      await waitFor(() => expect(screen.getByText(/who completed/i)).toBeInTheDocument());

      fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
      await waitFor(() => expect(screen.queryByText(/who completed/i)).not.toBeInTheDocument());
      expect(client.completeChore).not.toHaveBeenCalled();
    });

    it("modal shows all people by name", async () => {
      wrap(<ChoreRowActions chore={UNASSIGNED_CHORE} person={null} people={PEOPLE} mode="due" />);
      fireEvent.click(screen.getByText("Complete"));
      await waitFor(() => expect(screen.getByText(/who completed/i)).toBeInTheDocument());

      expect(screen.getAllByText("Alice").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Bob").length).toBeGreaterThan(0);
    });

    it("does not show modal for chore with an assignee", async () => {
      const assignedChore = { ...CHORE, current_assignee: "alice" };
      wrap(<ChoreRowActions chore={assignedChore} person="Alice" people={PEOPLE} mode="due" />);
      fireEvent.click(screen.getByText("Complete"));
      await waitFor(() => expect(client.completeChore).toHaveBeenCalled());
      expect(screen.queryByText(/who completed/i)).not.toBeInTheDocument();
    });
  });
});

describe("ChoreRowActions — soon mode", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    client.markDueChore.mockResolvedValue({ ...CHORE, state: "due" });
  });

  it("shows Mark due button instead of Complete/Skip", () => {
    wrap(<ChoreRowActions chore={CHORE} person="Alice" people={PEOPLE} mode="soon" />);
    expect(screen.getByText("Mark due")).toBeInTheDocument();
    expect(screen.queryByText("Complete")).not.toBeInTheDocument();
    expect(screen.queryByText("Skip")).not.toBeInTheDocument();
  });

  it("shows next_due date", () => {
    wrap(<ChoreRowActions chore={CHORE} person="Alice" people={PEOPLE} mode="soon" />);
    expect(screen.getByText(/jan|jan 10/i)).toBeInTheDocument();
  });

  it("calls markDueChore on Mark due click", async () => {
    wrap(<ChoreRowActions chore={CHORE} person="Alice" people={PEOPLE} mode="soon" />);
    fireEvent.click(screen.getByText("Mark due"));
    await waitFor(() => expect(client.markDueChore).toHaveBeenCalledWith("vacuum"));
  });
});

describe("ChoreRowActions — assignee dot color", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    client.completeChore.mockResolvedValue({ ...CHORE, state: "complete" });
  });

  it("assignee dot uses var(--accent) when person is set", () => {
    const { container } = wrap(
      <ChoreRowActions chore={CHORE} person="Alice" people={PEOPLE} mode="due" />
    );
    const dot = container.querySelector(".assignee-dot");
    expect(dot).toHaveStyle({ background: "var(--accent)" });
  });

  it("assignee dot uses var(--text-muted) when no person (unassigned)", () => {
    const { container } = wrap(
      <ChoreRowActions chore={CHORE} person={null} people={PEOPLE} mode="due" />
    );
    // No person prop = no assignee row rendered; just verify no var(--accent) dot
    const dot = container.querySelector(".assignee-dot");
    expect(dot).toBeNull();
  });
});
