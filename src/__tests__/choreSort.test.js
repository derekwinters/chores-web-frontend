import { describe, it, expect } from "vitest";
import { compareChoresByNextDue } from "../utils/choreSort";

describe("compareChoresByNextDue", () => {
  it("sorts due before complete regardless of date", () => {
    const complete = { state: "complete", next_due: "2024-01-10", name: "A" };
    const due = { state: "due", next_due: "2024-01-15", name: "B" };
    expect(compareChoresByNextDue(due, complete)).toBeLessThan(0);
    expect(compareChoresByNextDue(complete, due)).toBeGreaterThan(0);
  });

  it("sorts by date ascending within same state", () => {
    const earlier = { state: "due", next_due: "2024-01-10", name: "A" };
    const later = { state: "due", next_due: "2024-01-15", name: "B" };
    expect(compareChoresByNextDue(earlier, later)).toBeLessThan(0);
    expect(compareChoresByNextDue(later, earlier)).toBeGreaterThan(0);
  });

  it("sorts by name when state and date are equal", () => {
    const a = { state: "due", next_due: "2024-01-10", name: "Apple" };
    const b = { state: "due", next_due: "2024-01-10", name: "Banana" };
    expect(compareChoresByNextDue(a, b)).toBeLessThan(0);
    expect(compareChoresByNextDue(b, a)).toBeGreaterThan(0);
  });

  it("places no-date chores last within same state group", () => {
    const noDate = { state: "due", next_due: null, name: "A" };
    const withDate = { state: "due", next_due: "2024-01-10", name: "B" };
    expect(compareChoresByNextDue(noDate, withDate)).toBeGreaterThan(0);
    expect(compareChoresByNextDue(withDate, noDate)).toBeLessThan(0);
  });

  it("places complete no-date after complete with-date, both after all due", () => {
    const dueWithDate = { state: "due", next_due: "2024-01-20", name: "A" };
    const completeWithDate = { state: "complete", next_due: "2024-01-10", name: "B" };
    const completeNoDate = { state: "complete", next_due: null, name: "C" };

    const sorted = [completeNoDate, completeWithDate, dueWithDate].sort(compareChoresByNextDue);
    expect(sorted.map(c => c.name)).toEqual(["A", "B", "C"]);
  });
});
