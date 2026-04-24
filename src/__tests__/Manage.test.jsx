import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, useLocation } from "react-router-dom";
import { AuthProvider } from "../contexts/AuthContext";
import Manage from "../pages/Manage";
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
];

const PEOPLE = [{ id: 1, name: "Alice" }, { id: 2, name: "Bob" }];

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
    client.getChores.mockResolvedValue(CHORES);
    client.getPeople.mockResolvedValue(PEOPLE);
    client.createChore.mockResolvedValue({ ...CHORES[0], unique_id: "new_chore", name: "New Chore" });
    client.updateChore.mockResolvedValue({ ...CHORES[0], points: 10 });
    client.deleteChore.mockResolvedValue(null);
    client.completeChore.mockResolvedValue(null);
    client.skipChore.mockResolvedValue(null);
    client.markDueChore.mockResolvedValue(null);
  });

  it("renders chore table with all chores", async () => {
    wrap(<Manage />);
    await waitFor(() => expect(screen.getByText("Vacuum")).toBeInTheDocument());
    expect(screen.getByText("Dishes")).toBeInTheDocument();
    expect(screen.getByText("Bathroom")).toBeInTheDocument();
    expect(screen.getByText("Countertops")).toBeInTheDocument();
    expect(screen.getByText("Laundry")).toBeInTheDocument();
  });

  it("shows schedule summaries", async () => {
    wrap(<Manage />);
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
    wrap(<Manage />);
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
    wrap(<Manage />);
    // Button has an MdAdd SVG icon + "Add Chore" text (no literal "+")
    await waitFor(() => expect(screen.getByRole("button", { name: /add chore/i })).toBeInTheDocument());
  });

  it("opens create modal on Add Chore click", async () => {
    wrap(<Manage />);
    await waitFor(() => screen.getByRole("button", { name: /add chore/i }));
    fireEvent.click(screen.getByRole("button", { name: /add chore/i }));
    // "Add Chore" now appears in both button text and modal title; use getAllByText
    expect(screen.getAllByText("Add Chore").length).toBeGreaterThan(0);
    expect(screen.getByText("Create")).toBeInTheDocument();
  });

  it("closes modal on Cancel", async () => {
    wrap(<Manage />);
    await waitFor(() => screen.getByRole("button", { name: /add chore/i }));
    fireEvent.click(screen.getByRole("button", { name: /add chore/i }));
    fireEvent.click(screen.getByText("Cancel"));
    await waitFor(() => expect(screen.queryByText("Create")).not.toBeInTheDocument());
  });

  it("closes modal on Escape key", async () => {
    wrap(<Manage />);
    await waitFor(() => screen.getByRole("button", { name: /add chore/i }));
    fireEvent.click(screen.getByRole("button", { name: /add chore/i }));
    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => expect(screen.queryByText("Create")).not.toBeInTheDocument());
  });

  it("opens edit modal with chore data pre-filled", async () => {
    wrap(<Manage />);
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
    wrap(<Manage />);
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
    wrap(<Manage />);
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
    wrap(<Manage />);
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
    wrap(<Manage />);
    await waitFor(() =>
      expect(screen.getByText(/No chores yet/i)).toBeInTheDocument()
    );
  });

  it("hydrates filters from URL params on initial render", async () => {
    wrap(<Manage />, { initialEntries: ["/chores?state=complete"] });

    await waitFor(() => expect(screen.getByText("Dishes")).toBeInTheDocument());
    expect(screen.queryByText("Vacuum")).not.toBeInTheDocument();
    expect(screen.getByText("Showing 1 of 5 chores")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /show filters/i }));
    expect(screen.getByLabelText("State")).toHaveValue("complete");
    expect(screen.getByTestId("location")).toHaveTextContent("/chores?state=complete");
  });

  it("updates URL params when filters change", async () => {
    wrap(<Manage />);

    await waitFor(() => expect(screen.getByText("Vacuum")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: /show filters/i }));
    fireEvent.change(screen.getByLabelText("State"), { target: { value: "complete" } });

    await waitFor(() => expect(screen.getByText("Dishes")).toBeInTheDocument());
    expect(screen.queryByText("Vacuum")).not.toBeInTheDocument();
    expect(screen.getByTestId("location")).toHaveTextContent("/chores?state=complete");
  });

  it("clears URL params when filters are reset", async () => {
    wrap(<Manage />, { initialEntries: ["/chores?assignment_type=open&disabled=false"] });

    await waitFor(() => expect(screen.getByText("Dishes")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: /clear filters/i }));

    await waitFor(() => expect(screen.getByText("Vacuum")).toBeInTheDocument());
    expect(screen.getByText("Dishes")).toBeInTheDocument();
    expect(screen.getByTestId("location")).toHaveTextContent("/chores");
  });

  it("hydrates assignee filter from URL params on initial render", async () => {
    wrap(<Manage />, { initialEntries: ["/chores?assignee=Bob"] });

    await waitFor(() => expect(screen.getByText("Countertops")).toBeInTheDocument());
    expect(screen.queryByText("Vacuum")).not.toBeInTheDocument();
    expect(screen.queryByText("Bathroom")).not.toBeInTheDocument();
    expect(screen.queryByText("Dishes")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /show filters/i }));
    expect(screen.getByLabelText("Assignee")).toHaveValue("Bob");
    expect(screen.getByTestId("location")).toHaveTextContent("/chores?assignee=Bob");
  });

  it("updates URL params when assignee filter changes", async () => {
    wrap(<Manage />);

    await waitFor(() => expect(screen.getByText("Vacuum")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: /show filters/i }));
    fireEvent.change(screen.getByLabelText("Assignee"), { target: { value: "Alice" } });

    await waitFor(() => expect(screen.getByText("Vacuum")).toBeInTheDocument());
    expect(screen.queryByText("Bathroom")).not.toBeInTheDocument();
    expect(screen.queryByText("Countertops")).not.toBeInTheDocument();
    expect(screen.queryByText("Dishes")).not.toBeInTheDocument();
    expect(screen.queryByText("Laundry")).not.toBeInTheDocument();
    expect(screen.getByTestId("location")).toHaveTextContent("/chores?assignee=Alice");
  });

  it("filters chores by unassigned assignee", async () => {
    wrap(<Manage />, { initialEntries: ["/chores?assignee=unassigned"] });

    await waitFor(() => expect(screen.getByText("Bathroom")).toBeInTheDocument());
    expect(screen.getByText("Dishes")).toBeInTheDocument();
    expect(screen.queryByText("Vacuum")).not.toBeInTheDocument();
    expect(screen.queryByText("Countertops")).not.toBeInTheDocument();
    expect(screen.queryByText("Laundry")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /show filters/i }));
    expect(screen.getByLabelText("Assignee")).toHaveValue("unassigned");
  });

  it("sorts chores by next due date with name tiebreakers and no-date chores last", async () => {
    wrap(<Manage />);

    await waitFor(() => expect(screen.getByText("Vacuum")).toBeInTheDocument());

    const articles = screen.getAllByRole("article");
    const choreNames = articles.map((article) => {
      const nameElement = article.querySelector(".chore-name");
      return nameElement?.textContent || "";
    });

    expect(choreNames).toEqual(["Bathroom", "Vacuum", "Countertops", "Dishes", "Laundry"]);
  });

  it("preserves due-date ordering after filters are applied", async () => {
    wrap(<Manage />, { initialEntries: ["/chores?assignment_type=open"] });

    await waitFor(() => expect(screen.getByText("Bathroom")).toBeInTheDocument());

    const articles = screen.getAllByRole("article");
    const choreNames = articles.map((article) => {
      const nameElement = article.querySelector(".chore-name");
      return nameElement?.textContent || "";
    });

    expect(choreNames).toEqual(["Bathroom", "Dishes"]);
  });

  it("shows complete and skip buttons when card is expanded", async () => {
    wrap(<Manage />);
    await waitFor(() => expect(screen.getByText("Vacuum")).toBeInTheDocument());

    const vacuumCard = screen.getByText("Vacuum").closest("article");
    fireEvent.click(vacuumCard);

    await waitFor(() => {
      expect(screen.getByText("Complete")).toBeInTheDocument();
      expect(screen.getByText("Skip")).toBeInTheDocument();
    });
  });

  it("calls completeChore on Complete button click", async () => {
    wrap(<Manage />);
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
    wrap(<Manage />);
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
});
