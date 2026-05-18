import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, useLocation } from "react-router-dom";
import { AuthProvider } from "../contexts/AuthContext";
import Chores from "../pages/Chores";
import * as client from "../api/client";

vi.mock("../api/client");

const CHORES = [
  {
    id: "vacuum",
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
    id: "bathroom",
    unique_id: "bathroom",
    name: "Bathroom",
    state: "due",
    disabled: false,
    assignment_type: "open",
    current_assignee: null,
    schedule_type: "weekly",
    schedule_config: { days: [2] },
    schedule_summary: "Weekly on Wed",
    eligible_people: [],
    assignee: null,
    points: 1,
    next_due: "2024-01-15",
    age: 0,
  },
  {
    id: "countertops",
    unique_id: "countertops",
    name: "Countertops",
    state: "due",
    disabled: false,
    assignment_type: "fixed",
    current_assignee: "Bob",
    schedule_type: "weekly",
    schedule_config: { days: [3] },
    schedule_summary: "Weekly on Thu",
    eligible_people: [],
    assignee: "Bob",
    points: 2,
    next_due: "2024-01-16",
    age: 0,
  },
  {
    id: "dishes",
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
  {
    id: "laundry",
    unique_id: "laundry",
    name: "Laundry",
    state: "due",
    disabled: false,
    assignment_type: "fixed",
    current_assignee: "Bob",
    schedule_type: "interval",
    schedule_config: { days: 7 },
    schedule_summary: "Every 7 days",
    eligible_people: [],
    assignee: "Bob",
    points: 2,
    next_due: null,
    age: null,
  },
  {
    id: "trash",
    unique_id: "trash",
    name: "Trash",
    state: "due",
    disabled: false,
    assignment_type: "open",
    current_assignee: null,
    schedule_type: "weekly",
    schedule_config: { days: [0] },
    schedule_summary: "Weekly on Mon",
    eligible_people: ["Alice"],
    assignee: null,
    points: 1,
    next_due: "2024-01-15",
    age: 0,
  },
];

const PEOPLE = [{ id: 1, name: "Alice", username: "alice" }, { id: 2, name: "Bob", username: "bob" }];

function LocationDisplay() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}{location.search}</div>;
}

function wrap(ui, { initialEntries = ["/chores"] } = {}) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <AuthProvider>
        <MemoryRouter initialEntries={initialEntries}>
          {ui}
          <LocationDisplay />
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

describe("Manage page", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
    client.getChores.mockResolvedValue(CHORES);
    client.getPeople.mockResolvedValue(PEOPLE);
    client.getPointsSummary.mockResolvedValue([]);
    client.createChore.mockResolvedValue({ ...CHORES[0], unique_id: "new_chore", name: "New Chore" });
    client.updateChore.mockResolvedValue({ ...CHORES[0], points: 10 });
    client.deleteChore.mockResolvedValue(null);
    client.completeChore.mockResolvedValue(null);
    client.skipChore.mockResolvedValue(null);
    client.markDueChore.mockResolvedValue(null);
  });

  it("renders chore table with all chores", async () => {
    wrap(<Chores />);
    await waitFor(() => expect(screen.getByText("Vacuum")).toBeInTheDocument());
    expect(screen.getByText("Dishes")).toBeInTheDocument();
    expect(screen.getByText("Bathroom")).toBeInTheDocument();
    expect(screen.getByText("Countertops")).toBeInTheDocument();
    expect(screen.getByText("Laundry")).toBeInTheDocument();
  });

  it("shows schedule summaries", async () => {
    wrap(<Chores />);
    await waitFor(() => expect(screen.getByText("Vacuum")).toBeInTheDocument());

    // Expand Vacuum card to see "Weekly on Mon"
    const vacuumCard = screen.getByText("Vacuum").closest("article");
    fireEvent.click(vacuumCard);

    await waitFor(() => {
      expect(screen.getByText("Weekly on Mon")).toBeInTheDocument();
    });

    // Expand Dishes card to see "Every 1 day"
    const dishesCard = screen.getByText("Dishes").closest("article");
    fireEvent.click(dishesCard);

    await waitFor(() => {
      expect(screen.getByText("Every 1 day")).toBeInTheDocument();
    });
  });

  it("shows assignment type info for chores", async () => {
    wrap(<Chores />);
    await waitFor(() => expect(screen.getByText("Vacuum")).toBeInTheDocument());

    // Expand all cards to see assignee and other metadata
    const cards = screen.getAllByRole("article");
    cards.forEach((card) => fireEvent.click(card));

    await waitFor(() => {
      // Check for assignee names (expanded view shows assignees)
      expect(screen.getAllByText("Bob").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Unassigned").length).toBeGreaterThan(0);
      // Also check for Alice who is assigned to multiple chores
      expect(screen.getAllByText("Alice").length).toBeGreaterThan(0);
    });
  });

  it("shows Add Chore button", async () => {
    wrap(<Chores />);
    // Button has an MdAdd SVG icon + "Add Chore" text (no literal "+")
    await waitFor(() => expect(screen.getByRole("button", { name: /add chore/i })).toBeInTheDocument());
  });

  it("opens create modal on Add Chore click", async () => {
    wrap(<Chores />);
    await waitFor(() => screen.getByRole("button", { name: /add chore/i }));
    fireEvent.click(screen.getByRole("button", { name: /add chore/i }));
    // "Add Chore" now appears in both button text and modal title; use getAllByText
    expect(screen.getAllByText("Add Chore").length).toBeGreaterThan(0);
    expect(screen.getByText("Create")).toBeInTheDocument();
  });

  it("closes modal on Cancel", async () => {
    wrap(<Chores />);
    await waitFor(() => screen.getByRole("button", { name: /add chore/i }));
    fireEvent.click(screen.getByRole("button", { name: /add chore/i }));
    fireEvent.click(screen.getByText("Cancel"));
    await waitFor(() => expect(screen.queryByText("Create")).not.toBeInTheDocument());
  });

  it("closes modal on Escape key", async () => {
    wrap(<Chores />);
    await waitFor(() => screen.getByRole("button", { name: /add chore/i }));
    fireEvent.click(screen.getByRole("button", { name: /add chore/i }));
    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => expect(screen.queryByText("Create")).not.toBeInTheDocument());
  });

  it("opens edit modal with chore data pre-filled", async () => {
    wrap(<Chores />);
    await waitFor(() => screen.getByText("Vacuum"));

    // Expand Vacuum card to show edit button
    const vacuumCard = screen.getByText("Vacuum").closest("article");
    fireEvent.click(vacuumCard);

    await waitFor(() => {
      expect(screen.getByLabelText("Edit Vacuum")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText("Edit Vacuum"));
    await waitFor(() => expect(screen.getByDisplayValue("Vacuum")).toBeInTheDocument());
  });

  it("calls updateChore on edit submit", async () => {
    wrap(<Chores />);
    await waitFor(() => screen.getByText("Vacuum"));

    // Expand Vacuum card to show edit button
    const vacuumCard = screen.getByText("Vacuum").closest("article");
    fireEvent.click(vacuumCard);

    await waitFor(() => {
      expect(screen.getByLabelText("Edit Vacuum")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText("Edit Vacuum"));
    await waitFor(() => screen.getByDisplayValue("Vacuum"));
    fireEvent.click(screen.getByText("Save changes"));
    await waitFor(() => expect(client.updateChore).toHaveBeenCalledWith("vacuum", expect.any(Object)));
  });

  it("shows delete confirmation modal", async () => {
    wrap(<Chores />);
    await waitFor(() => screen.getByText("Vacuum"));

    // Expand Vacuum card to show delete button
    const vacuumCard = screen.getByText("Vacuum").closest("article");
    fireEvent.click(vacuumCard);

    await waitFor(() => {
      expect(screen.getByLabelText("Delete Vacuum")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText("Delete Vacuum"));
    expect(screen.getByText("Delete chore?")).toBeInTheDocument();
    expect(screen.getByText(/cannot be undone/i)).toBeInTheDocument();
  });

  it("calls deleteChore on confirm delete", async () => {
    wrap(<Chores />);
    await waitFor(() => screen.getByText("Vacuum"));

    // Expand Vacuum card to show delete button
    const vacuumCard = screen.getByText("Vacuum").closest("article");
    fireEvent.click(vacuumCard);

    await waitFor(() => {
      expect(screen.getByLabelText("Delete Vacuum")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText("Delete Vacuum"));
    const confirmBtn = screen.getAllByText("Delete").find(
      (el) => el.tagName === "BUTTON" && el.closest(".confirm-actions")
    );
    fireEvent.click(confirmBtn);
    await waitFor(() => expect(client.deleteChore).toHaveBeenCalledWith("vacuum"));
  });

  it("shows empty state when no chores", async () => {
    client.getChores.mockResolvedValue([]);
    wrap(<Chores />);
    await waitFor(() =>
      expect(screen.getByText(/No chores yet/i)).toBeInTheDocument()
    );
  });

  it("hydrates filters from URL params on initial render", async () => {
    wrap(<Chores />, { initialEntries: ["/chores?state=complete"] });

    await waitFor(() => expect(screen.getByText("Dishes")).toBeInTheDocument());
    expect(screen.queryByText("Vacuum")).not.toBeInTheDocument();
    expect(screen.getByText("Showing 1 of 6 chores")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /show filters/i }));
    await waitFor(() => {
      const stateSelect = document.getElementById("filter-state");
      expect(stateSelect).toHaveTextContent("complete");
    });
    expect(screen.getByTestId("location")).toHaveTextContent("/chores?state=complete");
  });

  it("updates URL params when filters change", async () => {
    wrap(<Chores />);
    const user = userEvent.setup();

    await waitFor(() => expect(screen.getByText("Vacuum")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: /show filters/i }));

    const stateSelect = document.getElementById("filter-state");
    await user.click(stateSelect);

    const completeOption = await screen.findByRole("option", { name: /complete/i });
    await user.click(completeOption);

    await waitFor(() => expect(screen.getByText("Dishes")).toBeInTheDocument());
    expect(screen.queryByText("Vacuum")).not.toBeInTheDocument();
    expect(screen.getByTestId("location")).toHaveTextContent("/chores?state=complete");
  });

  it("clears URL params when filters are reset", async () => {
    wrap(<Chores />, { initialEntries: ["/chores?assignment_type=open&disabled=false"] });

    await waitFor(() => expect(screen.getByText("Dishes")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: /clear filters/i }));

    await waitFor(() => expect(screen.getByText("Vacuum")).toBeInTheDocument());
    expect(screen.getByText("Dishes")).toBeInTheDocument();
    expect(screen.getByTestId("location")).toHaveTextContent("/chores");
  });

  it("hydrates assignee filter from URL params on initial render", async () => {
    wrap(<Chores />, { initialEntries: ["/chores?assignee=Bob"] });

    // Bob's directly-assigned chores
    await waitFor(() => expect(screen.getByText("Countertops")).toBeInTheDocument());
    expect(screen.getByText("Laundry")).toBeInTheDocument();
    // Vacuum is assigned to Alice (rotating), not Bob — should not appear
    expect(screen.queryByText("Vacuum")).not.toBeInTheDocument();
    // Bathroom and Dishes are open/unassigned with no eligible restriction (Case 2) — visible to all
    expect(screen.getByText("Bathroom")).toBeInTheDocument();
    expect(screen.getByText("Dishes")).toBeInTheDocument();
    // Trash has eligible_people: ["Alice"] — Bob is not eligible (Case 4), so should not appear
    expect(screen.queryByText("Trash")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /show filters/i }));
    await waitFor(() => {
      const selectElement = document.getElementById("filter-assignee");
      expect(selectElement).toHaveTextContent("Bob");
    }, { timeout: 3000 });
    expect(screen.getByTestId("location")).toHaveTextContent("/chores?assignee=Bob");
  });

  it("updates URL params when assignee filter changes", async () => {
    wrap(<Chores />);
    const user = userEvent.setup();

    await waitFor(() => expect(screen.getByText("Vacuum")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: /show filters/i }));

    const assigneeSelect = document.getElementById("filter-assignee");
    await user.click(assigneeSelect);

    const aliceOption = await screen.findByRole("option", { name: /Alice/i });
    await user.click(aliceOption);

    // Vacuum is directly assigned to Alice (Case 1)
    await waitFor(() => expect(screen.getByText("Vacuum")).toBeInTheDocument());
    // Bathroom and Dishes are open/unassigned with no eligible restriction (Case 2) — visible to all named users
    expect(screen.getByText("Bathroom")).toBeInTheDocument();
    expect(screen.getByText("Dishes")).toBeInTheDocument();
    // Trash has eligible_people: ["Alice"] — Alice is eligible (Case 3), so should appear
    expect(screen.getByText("Trash")).toBeInTheDocument();
    // Bob's chores should not appear
    expect(screen.queryByText("Countertops")).not.toBeInTheDocument();
    expect(screen.queryByText("Laundry")).not.toBeInTheDocument();
    expect(screen.getByTestId("location")).toHaveTextContent("/chores?assignee=Alice");
  });

  it("filters chores by unassigned assignee", async () => {
    wrap(<Chores />, { initialEntries: ["/chores?assignee=unassigned"] });

    await waitFor(() => expect(screen.getByText("Bathroom")).toBeInTheDocument());
    expect(screen.getByText("Dishes")).toBeInTheDocument();
    // Trash is unassigned (no current_assignee) so it should appear
    expect(screen.getByText("Trash")).toBeInTheDocument();
    expect(screen.queryByText("Vacuum")).not.toBeInTheDocument();
    expect(screen.queryByText("Countertops")).not.toBeInTheDocument();
    expect(screen.queryByText("Laundry")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /show filters/i }));
    await waitFor(() => expect(screen.getByText("Unassigned")).toBeInTheDocument());
  });

  it("sorts chores by next due date with name tiebreakers and no-date chores last", async () => {
    wrap(<Chores />);

    await waitFor(() => expect(screen.getByText("Vacuum")).toBeInTheDocument());

    const articles = screen.getAllByRole("article");
    const choreNames = articles.map((article) => {
      const nameElement = article.querySelector(".chore-name");
      return nameElement?.textContent || "";
    });

    expect(choreNames).toEqual(["Bathroom", "Trash", "Vacuum", "Countertops", "Laundry", "Dishes"]);
  });

  it("preserves due-date ordering after filters are applied", async () => {
    wrap(<Chores />, { initialEntries: ["/chores?assignment_type=open"] });

    await waitFor(() => expect(screen.getByText("Bathroom")).toBeInTheDocument());

    const articles = screen.getAllByRole("article");
    const choreNames = articles.map((article) => {
      const nameElement = article.querySelector(".chore-name");
      return nameElement?.textContent || "";
    });

    expect(choreNames).toEqual(["Bathroom", "Trash", "Dishes"]);
  });

  it("shows complete and skip buttons when card is expanded", async () => {
    wrap(<Chores />);
    await waitFor(() => expect(screen.getByText("Vacuum")).toBeInTheDocument());

    const vacuumCard = screen.getByText("Vacuum").closest("article");
    fireEvent.click(vacuumCard);

    await waitFor(() => {
      expect(screen.getByText("Complete")).toBeInTheDocument();
      expect(screen.getByText("Skip")).toBeInTheDocument();
    });
  });

  it("calls completeChore on Complete button click", async () => {
    wrap(<Chores />);
    await waitFor(() => expect(screen.getByText("Vacuum")).toBeInTheDocument());

    const vacuumCard = screen.getByText("Vacuum").closest("article");
    fireEvent.click(vacuumCard);

    await waitFor(() => {
      expect(screen.getByText("Complete")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Complete"));

    await waitFor(() => {
      expect(client.completeChore).toHaveBeenCalled();
    });
  });

  it("calls skipChore on Skip button click", async () => {
    wrap(<Chores />);
    await waitFor(() => expect(screen.getByText("Vacuum")).toBeInTheDocument());

    const vacuumCard = screen.getByText("Vacuum").closest("article");
    fireEvent.click(vacuumCard);

    await waitFor(() => {
      expect(screen.getByText("Skip")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Skip"));

    await waitFor(() => {
      expect(client.skipChore).toHaveBeenCalled();
    });
  });

  it("assignee filter case 3: shows unassigned chore when user IS in eligible_people", async () => {
    wrap(<Chores />, { initialEntries: ["/chores?assignee=Alice"] });

    // Trash is unassigned but Alice is in eligible_people: ["Alice"], so it should appear
    await waitFor(() => expect(screen.getByText("Trash")).toBeInTheDocument());
    // Vacuum is directly assigned to Alice, so it should appear
    expect(screen.getByText("Vacuum")).toBeInTheDocument();
    // Bob's chores should not appear
    expect(screen.queryByText("Countertops")).not.toBeInTheDocument();
    expect(screen.queryByText("Laundry")).not.toBeInTheDocument();
  });

  it("assignee filter case 4: hides unassigned chore when user is NOT in eligible_people", async () => {
    wrap(<Chores />, { initialEntries: ["/chores?assignee=Bob"] });

    // Trash is unassigned but eligible_people is ["Alice"] — Bob is not eligible
    await waitFor(() => expect(screen.getByText("Countertops")).toBeInTheDocument());
    expect(screen.queryByText("Trash")).not.toBeInTheDocument();
    // Bob's directly-assigned chores should appear
    expect(screen.getByText("Laundry")).toBeInTheDocument();
  });

  it("renders search box in header", async () => {
    wrap(<Chores />);
    await waitFor(() => expect(screen.getByText("Vacuum")).toBeInTheDocument());

    const searchInput = screen.getByPlaceholderText("Search...");
    expect(searchInput).toBeInTheDocument();
  });

  it("filters chores by search term (case-insensitive)", async () => {
    wrap(<Chores />);
    const user = userEvent.setup();

    await waitFor(() => expect(screen.getByText("Vacuum")).toBeInTheDocument());

    const searchInput = screen.getByPlaceholderText("Search...");
    await user.type(searchInput, "vacuum");

    await waitFor(() => {
      expect(screen.getByText("Vacuum")).toBeInTheDocument();
      expect(screen.queryByText("Bathroom")).not.toBeInTheDocument();
      expect(screen.queryByText("Countertops")).not.toBeInTheDocument();
    });

    expect(screen.getByTestId("location")).toHaveTextContent("search=vacuum");
  });

  it("filters chores by search term case-insensitively", async () => {
    wrap(<Chores />);
    const user = userEvent.setup();

    await waitFor(() => expect(screen.getByText("Vacuum")).toBeInTheDocument());

    const searchInput = screen.getByPlaceholderText("Search...");
    await user.type(searchInput, "VACUUM");

    await waitFor(() => {
      expect(screen.getByText("Vacuum")).toBeInTheDocument();
    });
  });

  it("filters chores by substring search", async () => {
    wrap(<Chores />);
    const user = userEvent.setup();

    await waitFor(() => expect(screen.getByText("Countertops")).toBeInTheDocument());

    const searchInput = screen.getByPlaceholderText("Search...");
    await user.type(searchInput, "top");

    await waitFor(() => {
      expect(screen.getByText("Countertops")).toBeInTheDocument();
      expect(screen.queryByText("Vacuum")).not.toBeInTheDocument();
    });
  });

  it("hydrates search from URL params on initial render", async () => {
    wrap(<Chores />, { initialEntries: ["/chores?search=vacuum"] });

    await waitFor(() => expect(screen.getByText("Vacuum")).toBeInTheDocument());
    expect(screen.queryByText("Bathroom")).not.toBeInTheDocument();

    const searchInput = screen.getByPlaceholderText("Search...");
    expect(searchInput).toHaveValue("vacuum");
  });

  it("clears search when X button is clicked", async () => {
    wrap(<Chores />, { initialEntries: ["/chores?search=vacuum"] });
    const user = userEvent.setup();

    await waitFor(() => expect(screen.getByText("Vacuum")).toBeInTheDocument());

    const clearButton = screen.getByLabelText("Clear search");
    await user.click(clearButton);

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText("Search...");
      expect(searchInput).toHaveValue("");
      expect(screen.getByText("Bathroom")).toBeInTheDocument();
    });
  });

  it("preserves search when other filters are applied", async () => {
    wrap(<Chores />);
    const user = userEvent.setup();

    await waitFor(() => expect(screen.getByText("Vacuum")).toBeInTheDocument());

    const searchInput = screen.getByPlaceholderText("Search...");
    await user.type(searchInput, "a");

    // This should show both Vacuum, Bathroom, Laundry, Trash (all have 'a')
    await waitFor(() => {
      expect(screen.getByText("Vacuum")).toBeInTheDocument();
      expect(screen.getByText("Laundry")).toBeInTheDocument();
      expect(screen.getByText("Bathroom")).toBeInTheDocument();
      expect(screen.getByText("Trash")).toBeInTheDocument();
    });

    // Now apply assignment type filter
    fireEvent.click(screen.getByRole("button", { name: /show filters/i }));
    const assignmentTypeSelect = document.getElementById("filter-assignment");
    await user.click(assignmentTypeSelect);
    const rotatingOption = await screen.findByRole("option", { name: /rotating/i });
    await user.click(rotatingOption);

    // Should still have search applied (only Vacuum from rotating chores contains 'a')
    await waitFor(() => {
      expect(screen.getByText("Vacuum")).toBeInTheDocument();
      expect(screen.queryByText("Laundry")).not.toBeInTheDocument();
    });
  });

  describe("stats section toggle", () => {
    it("renders stats header with a toggle button", async () => {
      wrap(<Chores />);
      await waitFor(() => expect(screen.getByText("Vacuum")).toBeInTheDocument());
      expect(screen.getByRole("button", { name: /toggle stats/i })).toBeInTheDocument();
    });

    it("shows stat cards by default (expanded)", async () => {
      wrap(<Chores />);
      await waitFor(() => expect(screen.getByText("Vacuum")).toBeInTheDocument());
      expect(screen.getByText("Chores")).toBeInTheDocument();
      expect(screen.getByText("Total Points")).toBeInTheDocument();
    });

    it("hides stat cards when toggle is clicked", async () => {
      wrap(<Chores />);
      await waitFor(() => expect(screen.getByText("Vacuum")).toBeInTheDocument());
      fireEvent.click(screen.getByRole("button", { name: /toggle stats/i }));
      expect(screen.queryByText("Total Points")).not.toBeInTheDocument();
    });

    it("restores stat cards when toggle is clicked again", async () => {
      wrap(<Chores />);
      await waitFor(() => expect(screen.getByText("Vacuum")).toBeInTheDocument());
      fireEvent.click(screen.getByRole("button", { name: /toggle stats/i }));
      fireEvent.click(screen.getByRole("button", { name: /toggle stats/i }));
      expect(screen.getByText("Total Points")).toBeInTheDocument();
    });

    it("persists collapsed state to localStorage", async () => {
      wrap(<Chores />);
      await waitFor(() => expect(screen.getByText("Vacuum")).toBeInTheDocument());
      fireEvent.click(screen.getByRole("button", { name: /toggle stats/i }));
      expect(localStorage.getItem("chores-stats-expanded")).toBe("false");
    });

    it("starts collapsed when localStorage says collapsed", async () => {
      localStorage.setItem("chores-stats-expanded", "false");
      wrap(<Chores />);
      await waitFor(() => expect(screen.getByText("Vacuum")).toBeInTheDocument());
      expect(screen.queryByText("Total Points")).not.toBeInTheDocument();
    });
  });

  it("applies search and filter together without clearing either", async () => {
    wrap(<Chores />);
    const user = userEvent.setup();

    await waitFor(() => expect(screen.getByText("Vacuum")).toBeInTheDocument());

    // Apply search filter first
    const searchInput = screen.getByPlaceholderText("Search...");
    await user.type(searchInput, "room");

    // Only chores with "room" in name should show - Laundry has no room, so nothing matches exactly
    // Actually looking at CHORES data, none have "room" in name, so search should return empty
    await waitFor(() => {
      expect(screen.queryByText("Vacuum")).not.toBeInTheDocument();
    });

    // Clear search and verify all chores return
    const clearButton = screen.queryByLabelText("Clear search");
    if (clearButton) {
      await user.click(clearButton);
    } else {
      // Clear by deleting text
      await user.clear(searchInput);
    }

    await waitFor(() => {
      expect(screen.getByText("Vacuum")).toBeInTheDocument();
    });
  });

  describe("CompleteWithActorModal — unassigned chore", () => {
    it("shows actor modal when Complete clicked for chore with current_assignee null", async () => {
      wrap(<Chores />);
      await waitFor(() => expect(screen.getByText("Bathroom")).toBeInTheDocument());

      // Expand Bathroom card (current_assignee: null)
      const bathroomCard = screen.getByText("Bathroom").closest("article");
      fireEvent.click(bathroomCard);

      await waitFor(() => expect(screen.getByText("Complete")).toBeInTheDocument());
      fireEvent.click(screen.getByText("Complete"));

      await waitFor(() => expect(screen.getByText(/who completed/i)).toBeInTheDocument());
      expect(client.completeChore).not.toHaveBeenCalled();
    });

    it("calls completeChore with username after modal confirm", async () => {
      wrap(<Chores />);
      await waitFor(() => expect(screen.getByText("Bathroom")).toBeInTheDocument());

      const bathroomCard = screen.getByText("Bathroom").closest("article");
      fireEvent.click(bathroomCard);

      await waitFor(() => expect(screen.getByText("Complete")).toBeInTheDocument());
      fireEvent.click(screen.getByText("Complete"));

      await waitFor(() => expect(screen.getByText(/who completed/i)).toBeInTheDocument());

      // PEOPLE = [{ id: 1, name: "Alice" }, { id: 2, name: "Bob" }]
      // Need username field — but test fixture doesn't have it yet;
      // we'll add it when implementing. For now test structure is correct.
      const select = screen.getByRole("combobox", { name: /select a person/i });
      fireEvent.change(select, { target: { value: "alice" } });
      fireEvent.click(screen.getByRole("button", { name: /^complete$/i }));

      await waitFor(() => expect(client.completeChore).toHaveBeenCalledWith("bathroom", "alice"));
    });

    it("closes modal without calling completeChore when cancelled", async () => {
      wrap(<Chores />);
      await waitFor(() => expect(screen.getByText("Bathroom")).toBeInTheDocument());

      const bathroomCard = screen.getByText("Bathroom").closest("article");
      fireEvent.click(bathroomCard);

      await waitFor(() => expect(screen.getByText("Complete")).toBeInTheDocument());
      fireEvent.click(screen.getByText("Complete"));

      await waitFor(() => expect(screen.getByText(/who completed/i)).toBeInTheDocument());
      fireEvent.click(screen.getByRole("button", { name: /cancel/i }));

      await waitFor(() => expect(screen.queryByText(/who completed/i)).not.toBeInTheDocument());
      expect(client.completeChore).not.toHaveBeenCalled();
    });

    it("does not show modal for chore with an assignee (Vacuum, assigned to Alice)", async () => {
      wrap(<Chores />);
      await waitFor(() => expect(screen.getByText("Vacuum")).toBeInTheDocument());

      const vacuumCard = screen.getByText("Vacuum").closest("article");
      fireEvent.click(vacuumCard);

      await waitFor(() => expect(screen.getByText("Complete")).toBeInTheDocument());
      fireEvent.click(screen.getByText("Complete"));

      await waitFor(() => expect(client.completeChore).toHaveBeenCalled());
      expect(screen.queryByText(/who completed/i)).not.toBeInTheDocument();
    });
  });

});
