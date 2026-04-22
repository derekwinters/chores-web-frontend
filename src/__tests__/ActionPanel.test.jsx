import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ActionPanel from "../components/ActionPanel";
import * as client from "../api/client";

vi.mock("../api/client");

const makeChore = (overrides = {}) => ({
  id: "dishes",
  unique_id: "dishes",
  name: "Dishes",
  state: "due",
  assignment_type: "open",
  current_assignee: null,
  schedule_summary: "Every 1 day",
  ...overrides,
});

function wrap(ui) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

describe("ActionPanel", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    client.completeChore.mockResolvedValue({ ...makeChore(), state: "complete" });
    client.skipChore.mockResolvedValue({ ...makeChore(), state: "complete" });
    client.reassignChore.mockResolvedValue({ ...makeChore(), current_assignee: "Bob" });
    client.markDueChore.mockResolvedValue({ ...makeChore(), state: "due" });
  });

  it("renders chore name and schedule", () => {
    wrap(<ActionPanel chore={makeChore()} people={[]} onDismiss={() => {}} />);
    expect(screen.getByText("Dishes")).toBeInTheDocument();
    expect(screen.getByText("Every 1 day")).toBeInTheDocument();
  });

  it("shows Complete and Skip for due chore", () => {
    wrap(<ActionPanel chore={makeChore()} people={[]} onDismiss={() => {}} />);
    expect(screen.getByText("Complete")).toBeInTheDocument();
    expect(screen.getByText("Skip")).toBeInTheDocument();
  });

  it("shows Mark due for complete chore instead", () => {
    wrap(<ActionPanel chore={makeChore({ state: "complete" })} people={[]} onDismiss={() => {}} />);
    expect(screen.getByText("Mark due")).toBeInTheDocument();
    expect(screen.queryByText("Complete")).not.toBeInTheDocument();
  });

  it("calls completeChore on Complete click", async () => {
    const onDismiss = vi.fn();
    wrap(<ActionPanel chore={makeChore()} people={[]} onDismiss={onDismiss} />);
    fireEvent.click(screen.getByText("Complete"));
    await waitFor(() => expect(client.completeChore).toHaveBeenCalledWith("dishes", null));
  });

  it("calls skipChore on Skip click", async () => {
    wrap(<ActionPanel chore={makeChore()} people={[]} onDismiss={() => {}} />);
    fireEvent.click(screen.getByText("Skip"));
    await waitFor(() => expect(client.skipChore).toHaveBeenCalledWith("dishes"));
  });

  it("shows reassign controls when people are provided", () => {
    wrap(
      <ActionPanel
        chore={makeChore()}
        people={[{ name: "Alice" }, { name: "Bob" }]}
        onDismiss={() => {}}
      />
    );
    expect(screen.getByText("Reassign")).toBeInTheDocument();
  });

  it("calls reassignChore with selected person", async () => {
    wrap(
      <ActionPanel
        chore={makeChore()}
        people={[{ name: "Alice" }, { name: "Bob" }]}
        onDismiss={() => {}}
      />
    );
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "Bob" } });
    fireEvent.click(screen.getByText("Reassign"));
    await waitFor(() => expect(client.reassignChore).toHaveBeenCalledWith("dishes", "Bob"));
  });
});
