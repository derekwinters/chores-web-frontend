import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Log from "../components/Log";
import * as client from "../api/client";

vi.mock("../api/client");

const LOG_ENTRIES = [
  {
    id: 1,
    chore_id: "vacuum",
    chore_name: "Vacuum",
    person: "Alice",
    action: "completed",
    timestamp: "2026-04-19T10:00:00Z",
  },
  {
    id: 2,
    chore_id: "trash",
    chore_name: "Take out trash",
    person: "Bob",
    action: "skipped",
    timestamp: "2026-04-18T15:30:00Z",
  },
  {
    id: 3,
    chore_id: "vacuum",
    chore_name: "Vacuum",
    person: "Alice",
    action: "reassigned",
    timestamp: "2026-04-17T08:00:00Z",
    reassigned_to: "Bob",
  },
];

const PEOPLE = [
  { id: 1, name: "Alice" },
  { id: 2, name: "Bob" },
];

const CHORES = [
  { id: "vacuum", unique_id: "vacuum", name: "Vacuum", disabled: false },
  { id: "trash", unique_id: "trash", name: "Take out trash", disabled: false },
];

function wrap(ui) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

describe("Log", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    client.getLog.mockResolvedValue(LOG_ENTRIES);
    client.getPeople.mockResolvedValue(PEOPLE);
    client.getChores.mockResolvedValue(CHORES);
  });

  it("renders log entries", async () => {
    wrap(<Log />);
    await waitFor(() => {
      const vacuums = screen.getAllByText("Vacuum");
      expect(vacuums.length).toBeGreaterThan(0);
      const alices = screen.getAllByText("Alice");
      expect(alices.length).toBeGreaterThan(0);
    });
  });

  it("shows log entry details (person, chore, action, timestamp)", async () => {
    wrap(<Log />);
    await waitFor(() => {
      const actions = screen.getAllByText(/completed|skipped|reassigned/i);
      expect(actions.length).toBeGreaterThan(0);
    });
  });

  it("filters by person", async () => {
    wrap(<Log />);
    await waitFor(() => {
      const alices = screen.queryAllByText("Alice");
      expect(alices.length).toBeGreaterThan(0);
    });

    fireEvent.click(screen.getByRole("button", { name: /show filters/i }));
    const personFilter = screen.getByLabelText(/filter by person/i);
    fireEvent.change(personFilter, { target: { value: "Alice" } });

    await waitFor(() => {
      expect(client.getLog).toHaveBeenCalledWith(expect.objectContaining({ person: "Alice" }));
    });
  });

  it("filters by chore", async () => {
    wrap(<Log />);
    await waitFor(() => {
      const vacuums = screen.queryAllByText("Vacuum");
      expect(vacuums.length).toBeGreaterThan(0);
    });

    fireEvent.click(screen.getByRole("button", { name: /show filters/i }));
    const choreFilter = screen.getByLabelText(/filter by chore/i);
    fireEvent.change(choreFilter, { target: { value: "vacuum" } });

    await waitFor(() => {
      expect(client.getLog).toHaveBeenCalledWith(expect.objectContaining({ chore_id: "vacuum" }));
    });
  });

  it("filters by action type", async () => {
    wrap(<Log />);
    await waitFor(() => {
      const actions = screen.queryAllByText(/completed|skipped/i);
      expect(actions.length).toBeGreaterThan(0);
    });

    fireEvent.click(screen.getByRole("button", { name: /show filters/i }));
    const actionFilter = screen.getByLabelText(/filter by action/i);
    fireEvent.change(actionFilter, { target: { value: "completed" } });

    await waitFor(() => {
      expect(client.getLog).toHaveBeenCalledWith(expect.objectContaining({ action: "completed" }));
    });
  });

  it("filters by date range", async () => {
    wrap(<Log />);
    await waitFor(() => {
      const alices = screen.queryAllByText("Alice");
      expect(alices.length).toBeGreaterThan(0);
    });

    fireEvent.click(screen.getByRole("button", { name: /show filters/i }));
    const startDateFilter = screen.getByLabelText(/start date/i);
    const endDateFilter = screen.getByLabelText(/end date/i);

    fireEvent.change(startDateFilter, { target: { value: "2026-04-18" } });
    fireEvent.change(endDateFilter, { target: { value: "2026-04-19" } });

    await waitFor(() => {
      expect(client.getLog).toHaveBeenCalledWith(
        expect.objectContaining({
          start_date: "2026-04-18",
          end_date: "2026-04-19",
        })
      );
    });
  });

  it("combines multiple filters", async () => {
    wrap(<Log />);
    await waitFor(() => {
      const alices = screen.queryAllByText("Alice");
      expect(alices.length).toBeGreaterThan(0);
    });

    fireEvent.click(screen.getByRole("button", { name: /show filters/i }));
    fireEvent.change(screen.getByLabelText(/filter by person/i), { target: { value: "Alice" } });
    fireEvent.change(screen.getByLabelText(/filter by chore/i), { target: { value: "vacuum" } });

    await waitFor(() => {
      expect(client.getLog).toHaveBeenCalledWith(
        expect.objectContaining({
          person: "Alice",
          chore_id: "vacuum",
        })
      );
    });
  });

  it("clears filters", async () => {
    wrap(<Log />);
    await waitFor(() => {
      const alices = screen.queryAllByText("Alice");
      expect(alices.length).toBeGreaterThan(0);
    });

    fireEvent.click(screen.getByRole("button", { name: /show filters/i }));
    fireEvent.change(screen.getByLabelText(/filter by person/i), { target: { value: "Alice" } });
    fireEvent.click(screen.getByRole("button", { name: /clear filters/i }));

    await waitFor(() => {
      expect(client.getLog).toHaveBeenCalledWith({});
    });
  });

  it("shows empty state when no entries", async () => {
    client.getLog.mockResolvedValue([]);
    wrap(<Log />);
    await waitFor(() => {
      expect(screen.getByText(/no log entries/i)).toBeInTheDocument();
    });
  });
});
