import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import Log from "../components/Log";
import * as client from "../api/client";

vi.mock("../api/client");

const LOG_ENTRIES = [
  {
    id: 1,
    chore_id: "1",
    chore_name: "Vacuum",
    person: "Alice",
    action: "completed",
    timestamp: "2026-04-19T10:00:00Z",
    assignee: "Alice",
  },
  {
    id: 2,
    chore_id: "2",
    chore_name: "Take out trash",
    person: "Bob",
    action: "skipped",
    timestamp: "2026-04-18T15:30:00Z",
  },
  {
    id: 3,
    chore_id: "1",
    chore_name: "Vacuum",
    person: "Alice",
    action: "reassigned",
    timestamp: "2026-04-17T08:00:00Z",
    reassigned_to: "Bob",
  },
  {
    id: 4,
    chore_id: "1",
    chore_name: "Vacuum",
    person: "Alice",
    action: "updated",
    timestamp: "2026-04-16T09:00:00Z",
    field_name: "points",
    old_value: "5",
    new_value: "10",
  },
];

const PEOPLE = [
  { id: 1, name: "Alice" },
  { id: 2, name: "Bob" },
];

const CHORES = [
  { id: 1, unique_id: "vacuum", name: "Vacuum", disabled: false },
  { id: 2, unique_id: "trash", name: "Take out trash", disabled: false },
];

function wrap(ui, { initialEntries = ["/log"] } = {}) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <QueryClientProvider client={qc}>{ui}</QueryClientProvider>
    </MemoryRouter>
  );
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

  it("shows log entry details (action badges visible)", async () => {
    wrap(<Log />);
    await waitFor(() => {
      const actions = screen.getAllByText(/completed|skipped|reassigned/i);
      expect(actions.length).toBeGreaterThan(0);
    });
  });

  it("renders a table structure", async () => {
    wrap(<Log />);
    await waitFor(() => {
      expect(document.querySelector("table.log-table")).toBeInTheDocument();
      expect(document.querySelector("thead")).toBeInTheDocument();
      expect(document.querySelector("tbody")).toBeInTheDocument();
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
    fireEvent.change(choreFilter, { target: { value: "1" } });

    await waitFor(() => {
      expect(client.getLog).toHaveBeenCalledWith(expect.objectContaining({ chore_id: "1" }));
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
    fireEvent.change(screen.getByLabelText(/filter by chore/i), { target: { value: "1" } });

    await waitFor(() => {
      expect(client.getLog).toHaveBeenCalledWith(
        expect.objectContaining({
          person: "Alice",
          chore_id: "1",
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

  it("initializes filters from URL params", async () => {
    wrap(<Log />, { initialEntries: ["/log?person=Alice&action=completed"] });
    await waitFor(() => {
      expect(client.getLog).toHaveBeenCalledWith(
        expect.objectContaining({
          person: "Alice",
          action: "completed",
        })
      );
    });
  });

  it("ignores invalid chore_id (non-numeric)", async () => {
    wrap(<Log />, { initialEntries: ["/log?chore_id=invalid&person=Alice"] });
    await waitFor(() => {
      expect(client.getLog).toHaveBeenCalledWith({
        person: "Alice",
      });
    });
  });

  it("ignores invalid date format", async () => {
    wrap(<Log />, { initialEntries: ["/log?start_date=invalid-date&action=completed"] });
    await waitFor(() => {
      expect(client.getLog).toHaveBeenCalledWith({
        action: "completed",
      });
    });
  });

  it("updates URL when filter changes", async () => {
    wrap(<Log />);
    await waitFor(() => {
      const alices = screen.queryAllByText("Alice");
      expect(alices.length).toBeGreaterThan(0);
    });

    fireEvent.click(screen.getByRole("button", { name: /show filters/i }));
    const personFilter = screen.getByLabelText(/filter by person/i);
    fireEvent.change(personFilter, { target: { value: "Alice" } });

    await waitFor(() => {
      const personSelect = screen.getByLabelText(/filter by person/i);
      expect(personSelect.value).toBe("Alice");
      expect(client.getLog).toHaveBeenCalledWith(
        expect.objectContaining({ person: "Alice" })
      );
    });
  });

  it("clears URL params when clear filters is clicked", async () => {
    wrap(<Log />, { initialEntries: ["/log?person=Alice&action=completed"] });
    await waitFor(() => {
      const alices = screen.queryAllByText("Alice");
      expect(alices.length).toBeGreaterThan(0);
    });

    fireEvent.click(screen.getByRole("button", { name: /show filters/i }));
    fireEvent.click(screen.getByRole("button", { name: /clear filters/i }));

    await waitFor(() => {
      const personSelect = screen.getByLabelText(/filter by person/i);
      expect(personSelect.value).toBe("");
      expect(client.getLog).toHaveBeenCalledWith({});
    });
  });

  describe("Column layout", () => {
    it("shows 5 column headers: Timestamp, Target Type, Action, Actor, Target", async () => {
      wrap(<Log />);
      await waitFor(() => {
        expect(screen.getAllByText("Timestamp").length).toBeGreaterThan(0);
        expect(screen.getAllByText("Target Type").length).toBeGreaterThan(0);
        expect(screen.getAllByText("Action").length).toBeGreaterThan(0);
        expect(screen.getAllByText("Actor").length).toBeGreaterThan(0);
        expect(screen.getAllByText("Target").length).toBeGreaterThan(0);
      });
    });

    it("does not show Assignee as a column header", async () => {
      wrap(<Log />);
      await waitFor(() => {
        const vacuums = screen.queryAllByText("Vacuum");
        expect(vacuums.length).toBeGreaterThan(0);
      });
      expect(screen.queryByRole("columnheader", { name: "Assignee" })).not.toBeInTheDocument();
    });

    it("never shows Content column", async () => {
      wrap(<Log />);
      await waitFor(() => {
        expect(screen.queryByText("Content")).not.toBeInTheDocument();
      });
    });
  });

  describe("Relative timestamps", () => {
    it("formats timestamps as relative time (e.g. Xd ago for old entries)", async () => {
      wrap(<Log />);
      await waitFor(() => {
        // All test entries are from April 2026 (>24h old from May 2026 test run)
        const relTimestamps = screen.getAllByText(/\d+[mhd] ago|just now/);
        expect(relTimestamps.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Log entry inline expand (detail row)", () => {
    it("clicking a row inserts a detail row below it", async () => {
      wrap(<Log />);
      await waitFor(() => {
        const vacuums = screen.getAllByText("Vacuum");
        expect(vacuums.length).toBeGreaterThan(0);
      });

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(screen.queryByRole("article")).not.toBeInTheDocument();
      expect(document.querySelectorAll("tr.log-detail-row").length).toBe(0);

      const rows = document.querySelectorAll("tbody tr.log-table-row");
      fireEvent.click(rows[0]);

      await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        expect(document.querySelectorAll("tr.log-detail-row").length).toBe(1);
        // Timestamp appears in thead + detail row
        expect(screen.getAllByText("Timestamp").length).toBeGreaterThan(1);
      });
    });

    it("clicking an expanded row removes the detail row", async () => {
      wrap(<Log />);
      await waitFor(() => {
        const vacuums = screen.getAllByText("Vacuum");
        expect(vacuums.length).toBeGreaterThan(0);
      });

      const rows = document.querySelectorAll("tbody tr.log-table-row");

      fireEvent.click(rows[0]);
      await waitFor(() => {
        expect(screen.getAllByText("Timestamp").length).toBeGreaterThan(1);
      });

      fireEvent.click(rows[0]);
      await waitFor(() => {
        expect(screen.getAllByText("Timestamp").length).toBe(1);
        expect(document.querySelectorAll("tr.log-detail-row").length).toBe(0);
      });
    });

    it("detail row shows timestamp, actor, target type, and target labels", async () => {
      wrap(<Log />);
      await waitFor(() => {
        const vacuums = screen.getAllByText("Vacuum");
        expect(vacuums.length).toBeGreaterThan(0);
      });

      const rows = document.querySelectorAll("tbody tr.log-table-row");
      fireEvent.click(rows[0]);

      await waitFor(() => {
        // These all appear in both thead and detail row (>1 each)
        expect(screen.getAllByText("Timestamp").length).toBeGreaterThan(1);
        expect(screen.getAllByText("Actor").length).toBeGreaterThan(1);
        expect(screen.getAllByText("Target Type").length).toBeGreaterThan(1);
        expect(screen.getAllByText("Target").length).toBeGreaterThan(1);
      });
    });

    it("detail row shows reassigned_to when present", async () => {
      wrap(<Log />);
      await waitFor(() => {
        const vacuums = screen.getAllByText("Vacuum");
        expect(vacuums.length).toBeGreaterThan(0);
      });

      const rows = document.querySelectorAll("tbody tr.log-table-row");
      fireEvent.click(rows[2]);

      await waitFor(() => {
        expect(screen.getByText("Reassigned To")).toBeInTheDocument();
      });
    });

    it("detail row hides reassigned_to when absent", async () => {
      wrap(<Log />);
      await waitFor(() => {
        const vacuums = screen.getAllByText("Vacuum");
        expect(vacuums.length).toBeGreaterThan(0);
      });

      const rows = document.querySelectorAll("tbody tr.log-table-row");
      fireEvent.click(rows[0]);

      await waitFor(() => {
        expect(screen.getAllByText("Timestamp").length).toBeGreaterThan(1);
      });

      expect(screen.queryByText("Reassigned To")).not.toBeInTheDocument();
    });

    it("detail row shows assignee when present", async () => {
      wrap(<Log />);
      await waitFor(() => {
        const vacuums = screen.getAllByText("Vacuum");
        expect(vacuums.length).toBeGreaterThan(0);
      });

      const rows = document.querySelectorAll("tbody tr.log-table-row");
      fireEvent.click(rows[0]);

      await waitFor(() => {
        // Assignee is detail-only (not a column header), so exactly 1 occurrence
        const assigneeEls = screen.getAllByText("Assignee");
        expect(assigneeEls.length).toBeGreaterThan(0);
      });
    });

    it("detail row hides assignee when absent", async () => {
      wrap(<Log />);
      await waitFor(() => {
        const vacuums = screen.getAllByText("Vacuum");
        expect(vacuums.length).toBeGreaterThan(0);
      });

      const rows = document.querySelectorAll("tbody tr.log-table-row");
      fireEvent.click(rows[1]);

      await waitFor(() => {
        expect(screen.getAllByText("Timestamp").length).toBeGreaterThan(1);
      });

      // No Assignee text: not in header, not in detail when absent
      expect(screen.queryByText("Assignee")).not.toBeInTheDocument();
    });

    it("detail row shows field_name, old_value, new_value when present", async () => {
      wrap(<Log />);
      await waitFor(() => {
        const vacuums = screen.getAllByText("Vacuum");
        expect(vacuums.length).toBeGreaterThan(0);
      });

      const rows = document.querySelectorAll("tbody tr.log-table-row");
      fireEvent.click(rows[3]);

      await waitFor(() => {
        expect(screen.getByText("Field")).toBeInTheDocument();
        expect(screen.getByText("Old Value")).toBeInTheDocument();
        expect(screen.getByText("New Value")).toBeInTheDocument();
        expect(screen.getByText("points")).toBeInTheDocument();
        expect(screen.getByText("5")).toBeInTheDocument();
        expect(screen.getByText("10")).toBeInTheDocument();
      });
    });

    it("pressing Enter on a row expands the detail row", async () => {
      wrap(<Log />);
      await waitFor(() => {
        const vacuums = screen.getAllByText("Vacuum");
        expect(vacuums.length).toBeGreaterThan(0);
      });

      const rows = document.querySelectorAll("tbody tr.log-table-row");
      fireEvent.keyDown(rows[0], { key: "Enter" });

      await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        expect(screen.getAllByText("Timestamp").length).toBeGreaterThan(1);
        expect(document.querySelectorAll("tr.log-detail-row").length).toBe(1);
      });
    });

    it("pressing Space on a row expands the detail row", async () => {
      wrap(<Log />);
      await waitFor(() => {
        const vacuums = screen.getAllByText("Vacuum");
        expect(vacuums.length).toBeGreaterThan(0);
      });

      const rows = document.querySelectorAll("tbody tr.log-table-row");
      fireEvent.keyDown(rows[0], { key: " " });

      await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        expect(screen.getAllByText("Timestamp").length).toBeGreaterThan(1);
        expect(document.querySelectorAll("tr.log-detail-row").length).toBe(1);
      });
    });

    it("rows have tabIndex for keyboard navigation", async () => {
      wrap(<Log />);
      await waitFor(() => {
        const vacuums = screen.getAllByText("Vacuum");
        expect(vacuums.length).toBeGreaterThan(0);
      });

      const rows = document.querySelectorAll("tbody tr.log-table-row");
      expect(rows[0]).toHaveAttribute("tabindex", "0");
    });

    it("rows have aria-expanded attribute", async () => {
      wrap(<Log />);
      await waitFor(() => {
        const vacuums = screen.getAllByText("Vacuum");
        expect(vacuums.length).toBeGreaterThan(0);
      });

      const rows = document.querySelectorAll("tbody tr.log-table-row");
      expect(rows[0]).toHaveAttribute("aria-expanded", "false");

      fireEvent.click(rows[0]);

      await waitFor(() => {
        expect(rows[0]).toHaveAttribute("aria-expanded", "true");
      });
    });

    it("only one detail row is inserted per expanded row", async () => {
      wrap(<Log />);
      await waitFor(() => {
        const vacuums = screen.getAllByText("Vacuum");
        expect(vacuums.length).toBeGreaterThan(0);
      });

      const rows = document.querySelectorAll("tbody tr.log-table-row");
      fireEvent.click(rows[0]);

      await waitFor(() => {
        const detailRows = document.querySelectorAll("tr.log-detail-row");
        expect(detailRows.length).toBe(1);
      });
    });
  });

  describe("Error state", () => {
    it("shows error message when log fetch fails", async () => {
      client.getLog.mockRejectedValue(new Error("Failed to load log"));
      wrap(<Log />);
      await waitFor(() => {
        expect(screen.getByText("Failed to load log")).toBeInTheDocument();
      });
    });

    it("does not hide filters when error state shows", async () => {
      client.getLog.mockRejectedValue(new Error("Failed to load log"));
      wrap(<Log />);
      await waitFor(() => {
        expect(screen.getByText("Failed to load log")).toBeInTheDocument();
      });
      fireEvent.click(screen.getByRole("button", { name: /show filters/i }));
      expect(screen.getByLabelText(/filter by person/i)).toBeInTheDocument();
    });

    it("does not show empty state message when error occurs", async () => {
      client.getLog.mockRejectedValue(new Error("Failed to load log"));
      wrap(<Log />);
      await waitFor(() => {
        expect(screen.getByText("Failed to load log")).toBeInTheDocument();
      });
      expect(screen.queryByText(/no log entries match your filters/i)).not.toBeInTheDocument();
    });
  });

  describe("Person log entries (UserLog unified view)", () => {
    it("shows target type 'user' badge in main row for entries whose chore_name starts with 'Person:'", async () => {
      const personEntry = {
        id: 99,
        chore_id: 0,
        chore_name: "Person: Alice",
        person: "testuser",
        action: "updated",
        timestamp: "2026-04-20T12:00:00Z",
        field_name: "goal_7d",
        old_value: "20",
        new_value: "30",
      };
      client.getLog.mockResolvedValue([personEntry]);
      wrap(<Log />);

      await waitFor(() => {
        const userBadges = screen.getAllByText("user");
        expect(userBadges.length).toBeGreaterThan(0);
      });
    });

    it("strips 'Person: ' prefix from chore_name for the Target cell", async () => {
      const personEntry = {
        id: 99,
        chore_id: 0,
        chore_name: "Person: Alice",
        person: "testuser",
        action: "updated",
        timestamp: "2026-04-20T12:00:00Z",
      };
      client.getLog.mockResolvedValue([personEntry]);
      wrap(<Log />);

      await waitFor(() => {
        expect(screen.getByText("Alice")).toBeInTheDocument();
      });

      expect(screen.queryByText("Person: Alice")).not.toBeInTheDocument();
    });

    it("shows target type 'chore' badge in main row for entries whose chore_name does not start with 'Person:'", async () => {
      wrap(<Log />);

      await waitFor(() => {
        const choreBadges = screen.getAllByText("chore");
        expect(choreBadges.length).toBeGreaterThan(0);
      });
    });
  });

  describe("One-time point awards (points_awarded)", () => {
    const awardEntry = {
      id: 200,
      chore_id: 0,
      chore_name: "Person: Bob",
      person: "admin",
      action: "points_awarded",
      timestamp: "2026-04-20T12:00:00Z",
      field_name: "points",
      old_value: "Helping with gardening",
      new_value: "10",
    };

    it("renders the 'Points Awarded' action label and 'user' target for an award entry", async () => {
      client.getLog.mockResolvedValue([awardEntry]);
      wrap(<Log />);

      await waitFor(() => {
        expect(screen.getByText("Points Awarded")).toBeInTheDocument();
        // recipient shown as the target (Person: prefix stripped)
        expect(screen.getByText("Bob")).toBeInTheDocument();
        // granter shown as the actor
        expect(screen.getByText("admin")).toBeInTheDocument();
      });
    });

    it("expands to show the reason, points, and who granted them", async () => {
      client.getLog.mockResolvedValue([awardEntry]);
      wrap(<Log />);

      await waitFor(() => {
        expect(screen.getByText("Points Awarded")).toBeInTheDocument();
      });

      const rows = document.querySelectorAll("tbody tr.log-table-row");
      fireEvent.click(rows[0]);

      await waitFor(() => {
        expect(screen.getByText("Reason")).toBeInTheDocument();
        expect(screen.getByText("Helping with gardening")).toBeInTheDocument();
        expect(screen.getByText("Points")).toBeInTheDocument();
        expect(screen.getByText("+10")).toBeInTheDocument();
        expect(screen.getByText("Awarded By")).toBeInTheDocument();
      });

      // Award entries use award-specific labels, not the generic field diff.
      expect(screen.queryByText("Old Value")).not.toBeInTheDocument();
      expect(screen.queryByText("New Value")).not.toBeInTheDocument();
    });

    it("offers 'Points Awarded' as an action filter option", async () => {
      wrap(<Log />);
      await waitFor(() => {
        const vacuums = screen.getAllByText("Vacuum");
        expect(vacuums.length).toBeGreaterThan(0);
      });

      fireEvent.click(screen.getByRole("button", { name: /show filters/i }));
      const actionFilter = screen.getByLabelText(/filter by action/i);
      fireEvent.change(actionFilter, { target: { value: "points_awarded" } });

      await waitFor(() => {
        expect(client.getLog).toHaveBeenCalledWith(
          expect.objectContaining({ action: "points_awarded" })
        );
      });
    });
  });
});
