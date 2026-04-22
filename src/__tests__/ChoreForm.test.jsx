import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import ChoreForm from "../components/ChoreForm";

const PEOPLE = [{ name: "Alice" }, { name: "Bob" }, { name: "Carol" }];

describe("ChoreForm — empty (create)", () => {
  it("renders all base fields", () => {
    render(<ChoreForm initial={null} people={PEOPLE} onSubmit={() => {}} onCancel={() => {}} />);
    expect(screen.getByPlaceholderText(/e.g. Vacuum/i)).toBeInTheDocument();
    expect(screen.getByText("Weekly")).toBeInTheDocument();
    expect(screen.getByText("Monthly")).toBeInTheDocument();
    expect(screen.getByText("Interval")).toBeInTheDocument();
  });

  it("shows day picker when weekly is selected", () => {
    render(<ChoreForm initial={null} people={PEOPLE} onSubmit={() => {}} onCancel={() => {}} />);
    expect(screen.getByText("Mon")).toBeInTheDocument();
    expect(screen.getByText("Sun")).toBeInTheDocument();
  });

  it("shows interval input when interval is selected", () => {
    render(<ChoreForm initial={null} people={PEOPLE} onSubmit={() => {}} onCancel={() => {}} />);
    const radios = screen.getAllByRole("radio");
    const intervalRadio = radios.find((r) => r.value === "interval");
    fireEvent.click(intervalRadio);
    expect(screen.getByDisplayValue("7")).toBeInTheDocument();
  });

  it("validates that name is required", async () => {
    const onSubmit = vi.fn();
    render(<ChoreForm initial={null} people={PEOPLE} onSubmit={onSubmit} onCancel={() => {}} />);
    // Select at least one day to pass schedule validation
    fireEvent.click(screen.getByText("Mon"));
    fireEvent.click(screen.getByText("Save"));
    await waitFor(() => expect(screen.getByText(/Name is required/i)).toBeInTheDocument());
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("validates that weekly needs at least one day", async () => {
    const onSubmit = vi.fn();
    render(<ChoreForm initial={null} people={PEOPLE} onSubmit={onSubmit} onCancel={() => {}} />);
    fireEvent.change(screen.getByPlaceholderText(/e.g. Vacuum/i), { target: { value: "Test" } });
    fireEvent.click(screen.getByText("Save"));
    await waitFor(() => expect(screen.getByText(/Select at least one day/i)).toBeInTheDocument());
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("calls onSubmit with correct payload for weekly chore", async () => {
    const onSubmit = vi.fn().mockResolvedValue();
    render(<ChoreForm initial={null} people={PEOPLE} onSubmit={onSubmit} onCancel={() => {}} />);
    fireEvent.change(screen.getByPlaceholderText(/e.g. Vacuum/i), { target: { value: "Vacuum" } });
    fireEvent.click(screen.getByText("Mon"));
    fireEvent.click(screen.getByText("Thu"));
    fireEvent.click(screen.getByText("Save"));
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    const payload = onSubmit.mock.calls[0][0];
    expect(payload.name).toBe("Vacuum");
    expect(payload.schedule_type).toBe("weekly");
    expect(payload.schedule_config.days).toEqual([0, 3]);
  });

  it("calls onSubmit with correct payload for interval chore", async () => {
    const onSubmit = vi.fn().mockResolvedValue();
    render(<ChoreForm initial={null} people={PEOPLE} onSubmit={onSubmit} onCancel={() => {}} />);
    fireEvent.change(screen.getByPlaceholderText(/e.g. Vacuum/i), { target: { value: "Mow" } });
    const radios = screen.getAllByRole("radio");
    fireEvent.click(radios.find((r) => r.value === "interval"));
    fireEvent.change(screen.getByDisplayValue("7"), { target: { value: "14" } });
    fireEvent.click(screen.getByText("Save"));
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    const payload = onSubmit.mock.calls[0][0];
    expect(payload.schedule_config.days).toBe(14);
  });

  it("validates rotating needs at least 2 people", async () => {
    const onSubmit = vi.fn();
    render(<ChoreForm initial={null} people={PEOPLE} onSubmit={onSubmit} onCancel={() => {}} />);
    fireEvent.change(screen.getByPlaceholderText(/e.g. Vacuum/i), { target: { value: "Test" } });
    fireEvent.click(screen.getByText("Mon"));
    const radios = screen.getAllByRole("radio");
    fireEvent.click(radios.find((r) => r.value === "rotating"));
    // select only one person — people are rendered as buttons, not checkboxes
    const aliceBtns = screen.getAllByText("Alice");
    fireEvent.click(aliceBtns[aliceBtns.length - 1]);
    fireEvent.click(screen.getByText("Save"));
    await waitFor(() => expect(screen.getByText(/at least 2 people/i)).toBeInTheDocument());
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("calls onCancel when Cancel is clicked", () => {
    const onCancel = vi.fn();
    render(<ChoreForm initial={null} people={PEOPLE} onSubmit={() => {}} onCancel={onCancel} />);
    fireEvent.click(screen.getByText("Cancel"));
    expect(onCancel).toHaveBeenCalled();
  });
});

describe("ChoreForm — prefilled (edit)", () => {
  const existingChore = {
    name: "Dishes",
    schedule_type: "interval",
    schedule_config: { days: 7 },
    assignment_type: "rotating",
    eligible_people: ["Alice", "Bob"],
    assignee: null,
    points: 3,
  };

  it("pre-fills name from existing chore", () => {
    render(<ChoreForm initial={existingChore} people={PEOPLE} onSubmit={() => {}} onCancel={() => {}} />);
    expect(screen.getByDisplayValue("Dishes")).toBeInTheDocument();
  });

  it("pre-fills interval days", () => {
    render(<ChoreForm initial={existingChore} people={PEOPLE} onSubmit={() => {}} onCancel={() => {}} />);
    expect(screen.getByDisplayValue("7")).toBeInTheDocument();
  });

  it("pre-checks eligible people buttons", () => {
    render(<ChoreForm initial={existingChore} people={PEOPLE} onSubmit={() => {}} onCancel={() => {}} />);
    // People are rendered as buttons (person-btn), not checkboxes
    const aliceBtns = screen.getAllByText("Alice");
    const bobBtns = screen.getAllByText("Bob");
    const carolBtns = screen.getAllByText("Carol");
    // The person buttons in the Rotation section should reflect eligible_people
    const aliceBtn = aliceBtns[aliceBtns.length - 1].closest("button");
    const bobBtn = bobBtns[bobBtns.length - 1].closest("button");
    const carolBtn = carolBtns[carolBtns.length - 1].closest("button");
    expect(aliceBtn).toHaveClass("active");
    expect(bobBtn).toHaveClass("active");
    expect(carolBtn).not.toHaveClass("active");
  });

  it("displays next due date when editing chore with next_due", () => {
    const choreWithNextDue = {
      ...existingChore,
      next_due: "2026-05-15",
    };
    render(<ChoreForm initial={choreWithNextDue} people={PEOPLE} onSubmit={() => {}} onCancel={() => {}} />);
    // Date is displayed as formatted locale string, not raw ISO string
    // "May 15, 2026" or similar locale-dependent format
    expect(screen.getByText(/may.*15.*2026|2026.*may.*15/i)).toBeInTheDocument();
  });

  it("displays next assignee when editing rotating chore with next_assignee", () => {
    const choreWithNextAssignee = {
      ...existingChore,
      next_assignee: "Bob",
    };
    render(<ChoreForm initial={choreWithNextAssignee} people={PEOPLE} onSubmit={() => {}} onCancel={() => {}} />);
    const labels = screen.getAllByText("Bob");
    // One from eligible people checkbox, one from assigned to next display
    expect(labels.length).toBeGreaterThan(1);
    expect(screen.getByText(/Assigned to Next/i)).toBeInTheDocument();
  });

  it("does not display metadata when creating new chore", () => {
    render(<ChoreForm initial={null} people={PEOPLE} onSubmit={() => {}} onCancel={() => {}} />);
    expect(screen.queryByText(/next due/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/assigned to next/i)).not.toBeInTheDocument();
  });
});

describe("ChoreForm — constraints", () => {
  it("constraints section is collapsed by default", () => {
    render(<ChoreForm initial={null} people={[]} onSubmit={() => {}} onCancel={() => {}} />);
    expect(screen.queryByLabelText("Even days only")).not.toBeInTheDocument();
  });

  it("expands constraints section when toggle clicked", () => {
    render(<ChoreForm initial={null} people={[]} onSubmit={() => {}} onCancel={() => {}} />);
    fireEvent.click(screen.getByText("▶ Constraints"));
    expect(screen.getByLabelText("Even days only")).toBeInTheDocument();
    expect(screen.getByLabelText("Odd days only")).toBeInTheDocument();
  });

  it("includes even_days condition in payload", async () => {
    const onSubmit = vi.fn().mockResolvedValue();
    render(<ChoreForm initial={null} people={[]} onSubmit={onSubmit} onCancel={() => {}} />);
    fireEvent.change(screen.getByPlaceholderText(/e.g. Vacuum/i), { target: { value: "Test" } });
    fireEvent.click(screen.getByText("Mon")); // select a schedule day
    fireEvent.click(screen.getByText("▶ Constraints"));
    fireEvent.click(screen.getByLabelText("Even days only"));
    fireEvent.click(screen.getByText("Save"));
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    const { schedule_config } = onSubmit.mock.calls[0][0];
    expect(schedule_config.conditions).toContainEqual({ type: "even_days" });
    expect(schedule_config.condition_failure).toBe("skip");
  });

  it("includes odd_days condition in payload", async () => {
    const onSubmit = vi.fn().mockResolvedValue();
    render(<ChoreForm initial={null} people={[]} onSubmit={onSubmit} onCancel={() => {}} />);
    fireEvent.change(screen.getByPlaceholderText(/e.g. Vacuum/i), { target: { value: "Test" } });
    fireEvent.click(screen.getByText("Mon"));
    fireEvent.click(screen.getByText("▶ Constraints"));
    fireEvent.click(screen.getByLabelText("Odd days only"));
    fireEvent.click(screen.getByText("Save"));
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.calls[0][0].schedule_config.conditions).toContainEqual({ type: "odd_days" });
  });

  it("includes weekdays condition when constraint days selected", async () => {
    const onSubmit = vi.fn().mockResolvedValue();
    // Use interval schedule to avoid confusion with weekly day picker
    render(<ChoreForm initial={null} people={[]} onSubmit={onSubmit} onCancel={() => {}} />);
    fireEvent.change(screen.getByPlaceholderText(/e.g. Vacuum/i), { target: { value: "Test" } });
    const radios = screen.getAllByRole("radio");
    fireEvent.click(radios.find((r) => r.value === "interval"));
    fireEvent.click(screen.getByText("▶ Constraints"));
    // Now the constraint day picker is visible
    const dayBtns = screen.getAllByText("Mon");
    // Click Mon and Thu in the constraint day picker
    fireEvent.click(dayBtns[0]);
    fireEvent.click(screen.getAllByText("Thu")[0]);
    fireEvent.click(screen.getByText("Save"));
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    const conds = onSubmit.mock.calls[0][0].schedule_config.conditions;
    expect(conds).toContainEqual({ type: "weekdays", days: [0, 3] });
  });

  it("shows failure behavior selector only when a constraint is active", () => {
    render(<ChoreForm initial={null} people={[]} onSubmit={() => {}} onCancel={() => {}} />);
    expect(screen.queryByText("Skip to next occurrence")).not.toBeInTheDocument();
    fireEvent.click(screen.getByText("▶ Constraints"));
    fireEvent.click(screen.getByLabelText("Even days only"));
    expect(screen.getByText("Skip to next occurrence")).toBeInTheDocument();
    expect(screen.getByText("Delay day-by-day")).toBeInTheDocument();
  });

  it("sets condition_failure to delay when selected", async () => {
    const onSubmit = vi.fn().mockResolvedValue();
    render(<ChoreForm initial={null} people={[]} onSubmit={onSubmit} onCancel={() => {}} />);
    fireEvent.change(screen.getByPlaceholderText(/e.g. Vacuum/i), { target: { value: "Test" } });
    fireEvent.click(screen.getByText("Mon"));
    fireEvent.click(screen.getByText("▶ Constraints"));
    fireEvent.click(screen.getByLabelText("Even days only"));
    fireEvent.click(screen.getByText("Delay day-by-day"));
    fireEvent.click(screen.getByText("Save"));
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.calls[0][0].schedule_config.condition_failure).toBe("delay");
  });

  it("rejects even + odd both checked", async () => {
    const onSubmit = vi.fn();
    render(<ChoreForm initial={null} people={[]} onSubmit={onSubmit} onCancel={() => {}} />);
    fireEvent.change(screen.getByPlaceholderText(/e.g. Vacuum/i), { target: { value: "Test" } });
    fireEvent.click(screen.getByText("Mon"));
    fireEvent.click(screen.getByText("▶ Constraints"));
    fireEvent.click(screen.getByLabelText("Even days only"));
    fireEvent.click(screen.getByLabelText("Odd days only"));
    fireEvent.click(screen.getByText("Save"));
    await waitFor(() => expect(screen.getByText(/even days and odd days/i)).toBeInTheDocument());
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("omits conditions from payload when none active", async () => {
    const onSubmit = vi.fn().mockResolvedValue();
    render(<ChoreForm initial={null} people={[]} onSubmit={onSubmit} onCancel={() => {}} />);
    fireEvent.change(screen.getByPlaceholderText(/e.g. Vacuum/i), { target: { value: "Test" } });
    fireEvent.click(screen.getByText("Mon"));
    // Constraints section stays collapsed, so no constraints are set
    fireEvent.click(screen.getByText("Save"));
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.calls[0][0].schedule_config.conditions).toBeUndefined();
  });

  it("pre-fills constraints from existing chore and auto-expands", () => {
    const choreWithConstraints = {
      name: "Chore",
      schedule_type: "interval",
      schedule_config: {
        days: 4,
        conditions: [{ type: "weekdays", days: [0, 3, 5] }],
        condition_failure: "delay",
      },
      assignment_type: "open",
      eligible_people: [],
      assignee: null,
      points: 0,
    };
    render(<ChoreForm initial={choreWithConstraints} people={[]} onSubmit={() => {}} onCancel={() => {}} />);
    // Constraints should be auto-expanded
    expect(screen.getByText("▼ Constraints")).toBeInTheDocument();
    // Mon (0), Thu (3), Sat (5) should be active in the constraint day picker
    const dayBtns = screen.getAllByText("Mon");
    expect(dayBtns[0].closest("button")).toHaveClass("active");
    expect(screen.getByText("Delay day-by-day")).toBeInTheDocument();
  });

  it("clears weekday constraints with Clear button", () => {
    const choreWithConstraints = {
      name: "Chore",
      schedule_type: "interval",
      schedule_config: { days: 4, conditions: [{ type: "weekdays", days: [0] }] },
      assignment_type: "open",
      eligible_people: [],
      assignee: null,
      points: 0,
    };
    render(<ChoreForm initial={choreWithConstraints} people={[]} onSubmit={() => {}} onCancel={() => {}} />);
    // Constraints auto-expanded, so Clear button is visible
    expect(screen.getByText("Clear")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Clear"));
    expect(screen.queryByText("Clear")).not.toBeInTheDocument();
  });
});
