import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import ChoreCard from "../components/ChoreCard";

const makeChore = (overrides = {}) => ({
  unique_id: "vacuum",
  name: "Vacuum",
  age: 0,
  state: "due",
  ...overrides,
});

describe("ChoreCard", () => {
  it("renders chore name", () => {
    render(<ChoreCard chore={makeChore()} selected={false} onClick={() => {}} />);
    expect(screen.getByText("Vacuum")).toBeInTheDocument();
  });

  it("shows 'due today' when age is 0", () => {
    render(<ChoreCard chore={makeChore({ age: 0 })} selected={false} onClick={() => {}} />);
    expect(screen.getByText("due today")).toBeInTheDocument();
  });

  it("shows overdue label when age > 0", () => {
    render(<ChoreCard chore={makeChore({ age: 3 })} selected={false} onClick={() => {}} />);
    expect(screen.getByText("3d overdue")).toBeInTheDocument();
  });

  it("shows future label when age < 0", () => {
    render(<ChoreCard chore={makeChore({ age: -5 })} selected={false} onClick={() => {}} />);
    expect(screen.getByText("due in 5d")).toBeInTheDocument();
  });

  it("applies selected class when selected", () => {
    const { container } = render(
      <ChoreCard chore={makeChore()} selected={true} onClick={() => {}} />
    );
    expect(container.firstChild).toHaveClass("selected");
  });

  it("calls onClick when clicked", () => {
    const onClick = vi.fn();
    render(<ChoreCard chore={makeChore()} selected={false} onClick={onClick} />);
    fireEvent.click(screen.getByText("Vacuum"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
