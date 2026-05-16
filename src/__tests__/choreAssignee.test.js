import { describe, it, expect } from "vitest";
import {
  choreMatchesAssigneeFilter,
  UNASSIGNED_FILTER_VALUE,
} from "../utils/choreAssignee";

// Helper to build a minimal chore object
function makeChore({ assignment_type = "open", current_assignee = null, assignee = null, eligible_people = [] } = {}) {
  return { assignment_type, current_assignee, assignee, eligible_people };
}

describe("choreMatchesAssigneeFilter", () => {
  describe("UNASSIGNED_FILTER_VALUE", () => {
    it("matches an unassigned open chore with no eligible restriction", () => {
      const chore = makeChore({ assignment_type: "open", current_assignee: null, eligible_people: [] });
      expect(choreMatchesAssigneeFilter(chore, UNASSIGNED_FILTER_VALUE)).toBe(true);
    });

    it("matches an unassigned open chore with an eligible restriction", () => {
      const chore = makeChore({ assignment_type: "open", current_assignee: null, eligible_people: ["Alice"] });
      expect(choreMatchesAssigneeFilter(chore, UNASSIGNED_FILTER_VALUE)).toBe(true);
    });

    it("does not match a directly-assigned chore", () => {
      const chore = makeChore({ assignment_type: "rotating", current_assignee: "Alice", eligible_people: ["Alice", "Bob"] });
      expect(choreMatchesAssigneeFilter(chore, UNASSIGNED_FILTER_VALUE)).toBe(false);
    });

    it("does not match a fixed chore with an assignee", () => {
      const chore = makeChore({ assignment_type: "fixed", assignee: "Bob", current_assignee: "Bob", eligible_people: [] });
      expect(choreMatchesAssigneeFilter(chore, UNASSIGNED_FILTER_VALUE)).toBe(false);
    });
  });

  describe("Case 1: directly assigned to the filtered user", () => {
    it("matches when current_assignee equals filterValue (rotating)", () => {
      const chore = makeChore({ assignment_type: "rotating", current_assignee: "Alice", eligible_people: ["Alice", "Bob"] });
      expect(choreMatchesAssigneeFilter(chore, "Alice")).toBe(true);
    });

    it("matches when assignee equals filterValue (fixed)", () => {
      const chore = makeChore({ assignment_type: "fixed", assignee: "Bob", current_assignee: "Bob", eligible_people: [] });
      expect(choreMatchesAssigneeFilter(chore, "Bob")).toBe(true);
    });

    it("does not match when a different user is directly assigned", () => {
      const chore = makeChore({ assignment_type: "rotating", current_assignee: "Alice", eligible_people: ["Alice", "Bob"] });
      expect(choreMatchesAssigneeFilter(chore, "Bob")).toBe(false);
    });
  });

  describe("Case 2: unassigned chore with no eligible restriction", () => {
    it("matches any named user when eligible_people is empty array", () => {
      const chore = makeChore({ assignment_type: "open", current_assignee: null, eligible_people: [] });
      expect(choreMatchesAssigneeFilter(chore, "Alice")).toBe(true);
      expect(choreMatchesAssigneeFilter(chore, "Bob")).toBe(true);
    });

    it("matches any named user when eligible_people is null", () => {
      const chore = makeChore({ assignment_type: "open", current_assignee: null, eligible_people: null });
      expect(choreMatchesAssigneeFilter(chore, "Alice")).toBe(true);
    });

    it("matches any named user when eligible_people is undefined", () => {
      const chore = { assignment_type: "open", current_assignee: null };
      expect(choreMatchesAssigneeFilter(chore, "Alice")).toBe(true);
    });
  });

  describe("Case 3: unassigned chore where user IS in eligible_people", () => {
    it("matches when filterValue is in eligible_people", () => {
      const chore = makeChore({ assignment_type: "open", current_assignee: null, eligible_people: ["Alice"] });
      expect(choreMatchesAssigneeFilter(chore, "Alice")).toBe(true);
    });

    it("matches when filterValue is one of multiple eligible people", () => {
      const chore = makeChore({ assignment_type: "open", current_assignee: null, eligible_people: ["Alice", "Bob"] });
      expect(choreMatchesAssigneeFilter(chore, "Alice")).toBe(true);
      expect(choreMatchesAssigneeFilter(chore, "Bob")).toBe(true);
    });
  });

  describe("Case 4: unassigned chore where user is NOT in eligible_people", () => {
    it("does not match when filterValue is not in eligible_people", () => {
      const chore = makeChore({ assignment_type: "open", current_assignee: null, eligible_people: ["Alice"] });
      expect(choreMatchesAssigneeFilter(chore, "Bob")).toBe(false);
    });

    it("does not match when eligible list exists and filterValue is absent", () => {
      const chore = makeChore({ assignment_type: "open", current_assignee: null, eligible_people: ["Alice", "Carol"] });
      expect(choreMatchesAssigneeFilter(chore, "Bob")).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("is case-sensitive when comparing filterValue to eligible_people", () => {
      const chore = makeChore({ assignment_type: "open", current_assignee: null, eligible_people: ["Alice"] });
      expect(choreMatchesAssigneeFilter(chore, "alice")).toBe(false);
      expect(choreMatchesAssigneeFilter(chore, "ALICE")).toBe(false);
    });

    it("does not match a different user when chore is directly assigned (assigned != filtered)", () => {
      const chore = makeChore({ assignment_type: "fixed", assignee: "Alice", current_assignee: "Alice", eligible_people: [] });
      expect(choreMatchesAssigneeFilter(chore, "Bob")).toBe(false);
    });
  });
});
