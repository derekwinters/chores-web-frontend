import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import ChoreCard from "../components/ChoreCard";

const makeChore = (overrides = {}) => ({
  id: "vacuum",
  name: "Vacuum",
  age: 0,
  state: "due",
  points: 1,
  next_due: "2026-04-25",
  ...overrides,
});

describe("ChoreCard", () => {
  it("renders chore name in collapsed state", () => {
    render(<ChoreCard chore={makeChore()} selected={false} onClick={() => {}} />);
    expect(screen.getByText("Vacuum")).toBeInTheDocument();
  });

  it("shows due date in collapsed state", () => {
    render(<ChoreCard chore={makeChore({ next_due: "2026-04-25" })} selected={false} onClick={() => {}} />);
    expect(screen.getByText("Apr 25")).toBeInTheDocument();
  });

  it("starts in collapsed view", () => {
    const { container } = render(
      <ChoreCard chore={makeChore()} selected={false} onClick={() => {}} assignee="Me" />
    );
    expect(container.querySelector(".collapsed-view")).toBeInTheDocument();
    expect(container.querySelector(".expanded-view")).not.toBeInTheDocument();
  });

  it("shows assignee in collapsed view when assigned", () => {
    const { container } = render(
      <ChoreCard chore={makeChore()} selected={false} onClick={() => {}} assignee="Alice" />
    );
    expect(screen.getByText("Alice")).toBeInTheDocument();
  });

  it("hides assignee in collapsed view when unassigned", () => {
    const { container } = render(
      <ChoreCard chore={makeChore()} selected={false} onClick={() => {}} assignee="Unassigned" />
    );
    expect(screen.queryByText("Unassigned")).not.toBeInTheDocument();
  });

  it("expands to show full details on click", () => {
    const { container } = render(
      <ChoreCard chore={makeChore()} selected={false} onClick={() => {}} status="Open" frequency="Every 7d" assignee="Me" />
    );
    const card = container.querySelector(".chore-card");
    fireEvent.click(card);
    expect(container.querySelector(".expanded-view")).toBeInTheDocument();
    expect(container.querySelector(".collapsed-view")).not.toBeInTheDocument();
  });

  it("shows metadata when expanded", () => {
    const { container } = render(
      <ChoreCard chore={makeChore()} selected={false} onClick={() => {}} status="Open" frequency="Every 7d" assignee="Me" />
    );
    fireEvent.click(container.querySelector(".chore-card"));
    expect(screen.getByText("Open")).toBeInTheDocument();
    expect(screen.getByText("Every 7d")).toBeInTheDocument();
    expect(screen.getByText("Me")).toBeInTheDocument();
  });

  it("shows action buttons when expanded with handlers", () => {
    const onEdit = vi.fn();
    const onHistory = vi.fn();
    const onDelete = vi.fn();
    const { container } = render(
      <ChoreCard chore={makeChore()} selected={false} onClick={() => {}} onEdit={onEdit} onHistory={onHistory} onDelete={onDelete} />
    );
    fireEvent.click(container.querySelector(".chore-card"));
    expect(screen.getByText("Edit")).toBeInTheDocument();
    expect(screen.getByText("History")).toBeInTheDocument();
    expect(screen.getByText("Delete")).toBeInTheDocument();
  });

  it("calls onEdit when Edit button clicked", () => {
    const onEdit = vi.fn();
    const { container } = render(
      <ChoreCard chore={makeChore()} selected={false} onClick={() => {}} onEdit={onEdit} />
    );
    fireEvent.click(container.querySelector(".chore-card"));
    fireEvent.click(screen.getByText("Edit"));
    expect(onEdit).toHaveBeenCalledWith(makeChore());
  });

  it("calls onDelete when Delete button clicked", () => {
    const onDelete = vi.fn();
    const { container } = render(
      <ChoreCard chore={makeChore()} selected={false} onClick={() => {}} onDelete={onDelete} />
    );
    fireEvent.click(container.querySelector(".chore-card"));
    fireEvent.click(screen.getByText("Delete"));
    expect(onDelete).toHaveBeenCalledWith(makeChore());
  });

  it("calls onClick when card is clicked", () => {
    const onClick = vi.fn();
    const { container } = render(
      <ChoreCard chore={makeChore()} selected={false} onClick={onClick} />
    );
    fireEvent.click(container.querySelector(".chore-card"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("applies selected class when selected", () => {
    const { container } = render(
      <ChoreCard chore={makeChore()} selected={true} onClick={() => {}} />
    );
    expect(container.firstChild).toHaveClass("selected");
  });

  it("toggles expanded state on multiple clicks", () => {
    const { container } = render(
      <ChoreCard chore={makeChore()} selected={false} onClick={() => {}} />
    );
    const card = container.querySelector(".chore-card");
    expect(container.querySelector(".collapsed-view")).toBeInTheDocument();
    fireEvent.click(card);
    expect(container.querySelector(".expanded-view")).toBeInTheDocument();
    fireEvent.click(card);
    expect(container.querySelector(".collapsed-view")).toBeInTheDocument();
  });

  it("applies severity class based on state", () => {
    const { container } = render(
      <ChoreCard chore={makeChore({ age: 3 })} choreState="due" selected={false} onClick={() => {}} />
    );
    expect(container.querySelector(".chore-card")).toHaveClass("due");
  });

  it("applies due class when state is due", () => {
    const { container } = render(
      <ChoreCard chore={makeChore({ age: 0 })} choreState="due" selected={false} onClick={() => {}} />
    );
    expect(container.querySelector(".chore-card")).toHaveClass("due");
  });

  it("applies due class for all due states regardless of age", () => {
    const { container } = render(
      <ChoreCard chore={makeChore({ age: -5 })} choreState="due" selected={false} onClick={() => {}} />
    );
    expect(container.querySelector(".chore-card")).toHaveClass("due");
  });

  it("applies done class when state is complete", () => {
    const { container } = render(
      <ChoreCard chore={makeChore({ age: 0 })} choreState="complete" selected={false} onClick={() => {}} />
    );
    expect(container.querySelector(".chore-card")).toHaveClass("done");
  });
});
