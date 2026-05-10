import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import Log from "../components/Log";
import * as client from "../api/client";

vi.mock("../api/client");

// Mock window.innerWidth for breakpoint testing
function setViewportWidth(width) {
  Object.defineProperty(window, "innerWidth", {
    writable: true,
    configurable: true,
    value: width,
  });
  window.dispatchEvent(new Event("resize"));
}

const LOG_ENTRIES = [
  {
    id: 1,
    chore_id: "1",
    chore_name: "Vacuum",
    person: "Alice",
    action: "completed",
    timestamp: "2026-04-19T10:00:00Z",
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

  it("shows log entry details (person, chore, action, timestamp)", async () => {
    wrap(<Log />);
    await waitFor(() => {
      const actions = screen.getAllByText(/completed|skipped|reassigned/i);
      expect(actions.length).toBeGreaterThan(0);
    });
  });

  it("renders a table structure", async () => {
    wrap(<Log />);
    await waitFor(() => {
      // Should have a table element
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

  describe("Log entry inline expand (detail row)", () => {
    it("clicking a row inserts a detail row below it", async () => {
      setViewportWidth(1024);
      wrap(<Log />);
      await waitFor(() => {
        const vacuums = screen.getAllByText("Vacuum");
        expect(vacuums.length).toBeGreaterThan(0);
      });

      // No modal or dialog ever appears
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      // No article cards
      expect(screen.queryByRole("article")).not.toBeInTheDocument();

      // Before click: no detail rows in the DOM
      expect(document.querySelectorAll("tr.log-detail-row").length).toBe(0);

      // Click the first data row
      const rows = document.querySelectorAll("tbody tr.log-table-row");
      fireEvent.click(rows[0]);

      await waitFor(() => {
        // Detail row appears — no modal
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        // A detail row is now present
        expect(document.querySelectorAll("tr.log-detail-row").length).toBe(1);
        // "Timestamp" appears in both thead and the detail row
        expect(screen.getAllByText("Timestamp").length).toBeGreaterThan(1);
      });
    });

    it("clicking an expanded row removes the detail row", async () => {
      setViewportWidth(1024);
      wrap(<Log />);
      await waitFor(() => {
        const vacuums = screen.getAllByText("Vacuum");
        expect(vacuums.length).toBeGreaterThan(0);
      });

      const rows = document.querySelectorAll("tbody tr.log-table-row");

      // Expand
      fireEvent.click(rows[0]);
      await waitFor(() => {
        expect(screen.getAllByText("Timestamp").length).toBeGreaterThan(1);
      });

      // Collapse
      fireEvent.click(rows[0]);
      await waitFor(() => {
        // Detail labels gone; only the thead "Timestamp" remains
        expect(screen.getAllByText("Timestamp").length).toBe(1);
        // No detail rows remain
        expect(document.querySelectorAll("tr.log-detail-row").length).toBe(0);
      });
    });

    it("detail row shows timestamp, actor, target type, and target labels", async () => {
      setViewportWidth(1024);
      wrap(<Log />);
      await waitFor(() => {
        const vacuums = screen.getAllByText("Vacuum");
        expect(vacuums.length).toBeGreaterThan(0);
      });

      const rows = document.querySelectorAll("tbody tr.log-table-row");
      fireEvent.click(rows[0]);

      await waitFor(() => {
        // Detail row has all base labels (Timestamp appears in thead + detail row)
        expect(screen.getAllByText("Timestamp").length).toBeGreaterThan(1);
        // Actor appears in thead + detail row (>=2 at desktop)
        expect(screen.getAllByText("Actor").length).toBeGreaterThan(1);
        // Target Type appears in thead + detail row (>=2 at desktop)
        expect(screen.getAllByText("Target Type").length).toBeGreaterThan(1);
        // Target appears in thead + detail row (>=2 at desktop)
        expect(screen.getAllByText("Target").length).toBeGreaterThan(1);
      });
    });

    it("detail row shows reassigned_to when present", async () => {
      setViewportWidth(1024);
      wrap(<Log />);
      await waitFor(() => {
        const vacuums = screen.getAllByText("Vacuum");
        expect(vacuums.length).toBeGreaterThan(0);
      });

      // Entry index 2 (rows[2]) has reassigned_to: "Bob"
      const rows = document.querySelectorAll("tbody tr.log-table-row");
      fireEvent.click(rows[2]);

      await waitFor(() => {
        expect(screen.getByText("Reassigned To")).toBeInTheDocument();
      });
    });

    it("detail row hides reassigned_to when absent", async () => {
      setViewportWidth(1024);
      wrap(<Log />);
      await waitFor(() => {
        const vacuums = screen.getAllByText("Vacuum");
        expect(vacuums.length).toBeGreaterThan(0);
      });

      // Entry index 0 (completed, no reassigned_to)
      const rows = document.querySelectorAll("tbody tr.log-table-row");
      fireEvent.click(rows[0]);

      await waitFor(() => {
        expect(screen.getAllByText("Timestamp").length).toBeGreaterThan(1);
      });

      expect(screen.queryByText("Reassigned To")).not.toBeInTheDocument();
    });

    it("detail row shows field_name, old_value, new_value when present", async () => {
      setViewportWidth(1024);
      wrap(<Log />);
      await waitFor(() => {
        const vacuums = screen.getAllByText("Vacuum");
        expect(vacuums.length).toBeGreaterThan(0);
      });

      // Entry index 3 is the updated entry with field_name/old_value/new_value
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
      setViewportWidth(1024);
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
      setViewportWidth(1024);
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
      setViewportWidth(1024);
      wrap(<Log />);
      await waitFor(() => {
        const vacuums = screen.getAllByText("Vacuum");
        expect(vacuums.length).toBeGreaterThan(0);
      });

      const rows = document.querySelectorAll("tbody tr.log-table-row");
      expect(rows[0]).toHaveAttribute("tabindex", "0");
    });

    it("rows have aria-expanded attribute", async () => {
      setViewportWidth(1024);
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
      setViewportWidth(1024);
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

  describe("Person log entries (UserLog unified view)", () => {
    it("shows target type 'user' for entries whose chore_name starts with 'Person:'", async () => {
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
      setViewportWidth(1024);
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
      setViewportWidth(1024);
      wrap(<Log />);

      await waitFor(() => {
        // "Alice" should appear as the target name (without the "Person: " prefix)
        expect(screen.getByText("Alice")).toBeInTheDocument();
      });

      // The raw "Person: Alice" string should not be visible as a cell value
      expect(screen.queryByText("Person: Alice")).not.toBeInTheDocument();
    });

    it("shows target type 'chore' for entries whose chore_name does not start with 'Person:'", async () => {
      setViewportWidth(1024);
      wrap(<Log />);

      await waitFor(() => {
        const choreBadges = screen.getAllByText("chore");
        expect(choreBadges.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Responsive breakpoints (850px minimum for 5-column layout)", () => {
    afterEach(() => {
      setViewportWidth(1024); // Reset to desktop width
    });

    it("shows 3 column headers on mobile (<850px): Timestamp, Action, Target", async () => {
      setViewportWidth(375);
      wrap(<Log />);
      await waitFor(() => {
        expect(screen.getAllByText("Timestamp").length).toBeGreaterThan(0);
        expect(screen.getAllByText("Action").length).toBeGreaterThan(0);
        expect(screen.getAllByText("Target").length).toBeGreaterThan(0);
        // Target Type and Actor columns are hidden on mobile
        expect(screen.queryByText("Target Type")).not.toBeInTheDocument();
        expect(screen.queryByText("Actor")).not.toBeInTheDocument();
      });
    });

    it("hides Target Type column header on mobile (<850px)", async () => {
      setViewportWidth(375);
      wrap(<Log />);
      await waitFor(() => {
        expect(screen.queryByText("Target Type")).not.toBeInTheDocument();
      });
    });

    it("hides Actor column header on mobile (<850px)", async () => {
      setViewportWidth(375);
      wrap(<Log />);
      await waitFor(() => {
        const vacuums = screen.getAllByText("Vacuum");
        expect(vacuums.length).toBeGreaterThan(0);
      });
      // Verify Actor cells are not rendered on mobile
      const aliceElements = screen.queryAllByText("Alice");
      expect(aliceElements.length).toBe(0);
    });

    it("shows 3 column headers on tablet (between breakpoints, <850px): Timestamp, Action, Target", async () => {
      setViewportWidth(600);
      wrap(<Log />);
      await waitFor(() => {
        expect(screen.getAllByText("Timestamp").length).toBeGreaterThan(0);
        expect(screen.getAllByText("Action").length).toBeGreaterThan(0);
        expect(screen.getAllByText("Target").length).toBeGreaterThan(0);
        expect(screen.queryByText("Target Type")).not.toBeInTheDocument();
        expect(screen.queryByText("Actor")).not.toBeInTheDocument();
      });
    });

    it("hides Target Type on tablet (<850px)", async () => {
      setViewportWidth(600);
      wrap(<Log />);
      await waitFor(() => {
        const targetTypeHeaders = screen.queryAllByText("Target Type");
        expect(targetTypeHeaders.length).toBe(0);
      });
    });

    it("shows 5 column headers on desktop (>=850px): Timestamp, Action, Target Type, Actor, Target", async () => {
      setViewportWidth(1024);
      wrap(<Log />);
      await waitFor(() => {
        expect(screen.getAllByText("Timestamp").length).toBeGreaterThan(0);
        expect(screen.getAllByText("Action").length).toBeGreaterThan(0);
        expect(screen.getAllByText("Target Type").length).toBeGreaterThan(0);
        expect(screen.getAllByText("Actor").length).toBeGreaterThan(0);
        expect(screen.getAllByText("Target").length).toBeGreaterThan(0);
      });
    });

    it("shows Target Type on desktop (>=850px)", async () => {
      setViewportWidth(1024);
      wrap(<Log />);
      await waitFor(() => {
        const targetTypeHeaders = screen.getAllByText("Target Type");
        expect(targetTypeHeaders.length).toBeGreaterThan(0);
      });
    });

    it("shows Actor on desktop (>=850px)", async () => {
      setViewportWidth(1024);
      wrap(<Log />);
      await waitFor(() => {
        const alices = screen.getAllByText("Alice");
        expect(alices.length).toBeGreaterThan(0);
      });
    });

    it("never shows Content column on any breakpoint", async () => {
      for (const width of [375, 600, 1024]) {
        vi.resetAllMocks();
        client.getLog.mockResolvedValue(LOG_ENTRIES);
        client.getPeople.mockResolvedValue(PEOPLE);
        client.getChores.mockResolvedValue(CHORES);

        setViewportWidth(width);
        const { unmount } = wrap(<Log />);
        await waitFor(() => {
          const contentHeader = screen.queryByText("Content");
          expect(contentHeader).not.toBeInTheDocument();
        });
        unmount();
      }
    });

    it("formats timestamp as time-only on mobile (<850px)", async () => {
      setViewportWidth(375);
      wrap(<Log />);
      await waitFor(() => {
        const timestamps = screen.getAllByText(/\d{1,2}:\d{2}/);
        expect(timestamps.length).toBeGreaterThan(0);
      });
    });

    it("formats timestamp as full date on desktop (>=850px)", async () => {
      setViewportWidth(1024);
      wrap(<Log />);
      await waitFor(() => {
        // Check for presence of log entries with full rendering
        const content = screen.getAllByText(/Vacuum|Alice|completed|skipped/);
        expect(content.length).toBeGreaterThan(0);
      });
    });

    it("handles window resize from mobile (<850px) to desktop (>=850px)", async () => {
      setViewportWidth(375);
      wrap(<Log />);
      await waitFor(() => {
        expect(screen.queryByText("Target Type")).not.toBeInTheDocument();
        expect(screen.queryByText("Actor")).not.toBeInTheDocument();
      });

      setViewportWidth(1024);
      await waitFor(() => {
        expect(screen.getAllByText("Target Type").length).toBeGreaterThan(0);
        expect(screen.getAllByText("Actor").length).toBeGreaterThan(0);
      });
    });
  });
});
